import { Psbt } from "bitcoinjs-lib";

import {
  BrowserWalletNetworkMismatchError,
  BrowserWalletNotInstalledError,
  getAddressFormat,
} from "../..";
import { BrowserWalletNetwork } from "../../config/types";
import {
  BrowserWalletExtractTxFromNonFinalizedPsbtError,
  OrditSDKError,
} from "../../errors";
import { BrowserWalletSignResponse, WalletAddress } from "../types";
import { OylSignPSBTOptions } from "./types";

function validateExtension(network: BrowserWalletNetwork = "mainnet"): void {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError("Oyl Wallet not installed");
  }

  if (network !== "mainnet") {
    throw new BrowserWalletNetworkMismatchError(
      "Oyl Wallet only supports mainnet",
    );
  }
}

function isInstalled(): boolean {
  if (typeof window === "undefined") {
    throw new OrditSDKError("Cannot call this function outside a browser");
  }
  return typeof window.oyl !== "undefined";
}

async function getAddresses(
  network: BrowserWalletNetwork = "mainnet",
): Promise<WalletAddress[]> {
  validateExtension(network);
  const bitcoinAddresses: OylGetAddressResponse =
    await window.oyl.getAddresses();

  const result: WalletAddress[] = [];

  Object.keys(bitcoinAddresses).forEach((key) => {
    const addressType = key as keyof OylGetAddressResponse;
    result.push({
      publicKey: bitcoinAddresses[addressType].publicKey,
      address: bitcoinAddresses[addressType].address,
      format: getAddressFormat(bitcoinAddresses[addressType].address, network),
    });
  });

  return result;
}

async function signMessage(
  message: string,
  address: string,
  network: BrowserWalletNetwork = "mainnet",
): Promise<BrowserWalletSignResponse> {
  validateExtension(network);

  try {
    const { signature } = await window.oyl.signMessage({
      address,
      message,
    });

    return {
      hex: Buffer.from(signature, "base64").toString("hex"),
      base64: signature,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Sign message error", err);
    throw new OrditSDKError("Failed to sign message with Oyl Wallet");
  }
}

async function signPsbt(
  psbt: Psbt,
  {
    finalize = true,
    extractTx = true,
    network,
    inputsToSign,
  }: OylSignPSBTOptions = { network: "mainnet", inputsToSign: [] },
): Promise<BrowserWalletSignResponse> {
  validateExtension(network);

  if (extractTx && !finalize) {
    throw new BrowserWalletExtractTxFromNonFinalizedPsbtError();
  }

  const toSignInputs: OylSignInput[] = [];
  inputsToSign.forEach((input) => {
    const { signingIndexes } = input;
    signingIndexes.forEach(() => {
      toSignInputs.push(input);
    });
  });

  let signedPsbt: Psbt;
  try {
    const { psbt: signedPsbtInHex } = await window.oyl.signPsbt({
      psbt: psbt.toHex(),
      finalize: false, // ordit-sdk will finalize it manually if there is any inputs to sign
      broadcast: false, // ordit-sdk will not support broadcasting to keep implementation consistent across all wallets
    });
    signedPsbt = Psbt.fromHex(signedPsbtInHex);
  } catch (err) {
    throw new OrditSDKError("Failed to sign psbt with Oyl Wallet");
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
