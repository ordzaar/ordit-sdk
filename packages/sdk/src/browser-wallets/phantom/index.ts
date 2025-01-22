import { Psbt } from "bitcoinjs-lib";

import { getAddressFormat } from "../../addresses";
import { BrowserWalletNetwork } from "../../config/types";
import {
  BrowserWalletExtractTxFromNonFinalizedPsbtError,
  BrowserWalletNetworkMismatchError,
  BrowserWalletNotInstalledError,
  OrditSDKError,
} from "../../errors";
import { BrowserWalletSignResponse, WalletAddress } from "../types";
import { PhantomSignPSBTOptions } from "./types";

function validateExtension(network: BrowserWalletNetwork = "mainnet"): void {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError("Phantom Wallet not installed");
  }

  if (network !== "mainnet") {
    throw new BrowserWalletNetworkMismatchError(
      "Phantom Wallet only supports mainnet",
    );
  }
}

function isInstalled(): boolean {
  if (typeof window === "undefined") {
    throw new OrditSDKError("Cannot call this function outside a browser");
  }
  return typeof window.phantom !== "undefined";
}

async function getAddresses(
  network: BrowserWalletNetwork = "mainnet",
): Promise<WalletAddress[]> {
  validateExtension(network);
  const bitcoinAccounts = await window.phantom.bitcoin.requestAccounts();
  return bitcoinAccounts.map((account) => ({
    publicKey: account.publicKey,
    address: account.address,
    format: getAddressFormat(account.address, network),
  }));
}

async function signMessage(
  message: string,
  address: string,
  network: BrowserWalletNetwork = "mainnet",
): Promise<BrowserWalletSignResponse> {
  validateExtension(network);

  try {
    const { signature } = await window.phantom.bitcoin.signMessage(
      address,
      new TextEncoder().encode(message),
    );

    return {
      hex: Buffer.from(signature).toString("hex"),
      base64: Buffer.from(signature).toString("base64"),
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Sign message error", err);
    throw new OrditSDKError("Failed to sign message with Phantom Wallet");
  }
}

async function signPsbt(
  psbt: Psbt,
  {
    finalize = true,
    extractTx = true,
    network,
    inputsToSign,
  }: PhantomSignPSBTOptions = { network: "mainnet", inputsToSign: [] },
): Promise<BrowserWalletSignResponse> {
  validateExtension(network);

  if (extractTx && !finalize) {
    throw new BrowserWalletExtractTxFromNonFinalizedPsbtError();
  }

  const toSignInputs: PhantomSignInput[] = [];
  inputsToSign.forEach((input) => {
    const { signingIndexes } = input;
    signingIndexes.forEach(() => {
      toSignInputs.push(input);
    });
  });

  let signedPsbtBuffer: Uint8Array;
  let signedPsbt: Psbt;
  try {
    signedPsbtBuffer = await window.phantom.bitcoin.signPSBT(
      Buffer.from(psbt.toHex(), "hex"),
      {
        inputsToSign: toSignInputs,
      },
    );
    signedPsbt = Psbt.fromBuffer(Buffer.from(signedPsbtBuffer));
  } catch (err) {
    throw new OrditSDKError("Failed to sign psbt with Phantom Wallet");
  }

  if (finalize) {
    toSignInputs.forEach((_input, index) => {
      try {
        signedPsbt.finalizeInput(index);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Sign psbt error", error);
        throw new OrditSDKError("Failed to finalize input");
      }
    });
  }

  if (extractTx) {
    try {
      return {
        base64: null,
        hex: signedPsbt.extractTransaction().toHex(),
      };
    } catch (error) {
      // It is possible that not all inputs are finalized.
      // extractTransaction will fail if there are any.
      if (error instanceof Error && error.message === "Not finalized") {
        throw new BrowserWalletExtractTxFromNonFinalizedPsbtError();
      } else {
        throw new OrditSDKError("Failed to extract transaction from PSBT");
      }
    }
  }

  return {
    hex: signedPsbt.toHex(),
    base64: signedPsbt.toBase64(),
  };
}

export { getAddresses, isInstalled, signMessage, signPsbt };
