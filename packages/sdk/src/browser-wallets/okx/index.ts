import { Psbt } from "bitcoinjs-lib";

import { getAddressFormat } from "../../addresses";
import { BrowserWalletNetwork } from "../../config/types";
import {
  BrowserWalletExtractTxFromNonFinalizedPsbtError,
  BrowserWalletNotInstalledError,
  OrditSDKError,
} from "../../errors";
import { BrowserWalletSignResponse, WalletAddress } from "../types";
import { OKXSignPSBTOptions } from "./types";

function isInstalled(): boolean {
  if (typeof window === "undefined") {
    throw new OrditSDKError("Cannot call this function outside a browser");
  }
  return typeof window.okxwallet !== "undefined";
}

async function getOKXWalletProvider(
  network: BrowserWalletNetwork = "mainnet",
): Promise<OKXWalletProvider> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError("OKX Wallet not installed.");
  }

  const provider =
    network === "mainnet"
      ? window.okxwallet.bitcoin
      : window.okxwallet.bitcoinTestnet;

  if (!provider) {
    throw new OrditSDKError("Failed to get OKX Wallet provider.");
  }

  return provider;
}

async function getAddresses(
  network: BrowserWalletNetwork = "mainnet",
): Promise<WalletAddress[]> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError("OKX Wallet not installed.");
  }

  const provider = await getOKXWalletProvider(network);

  const { address, publicKey } = await provider.connect();
  const format = getAddressFormat(address, network);

  if (!address || !publicKey || !format) {
    throw new OrditSDKError("Failed to get addresses from OKX Wallet.");
  }

  return [
    {
      publicKey,
      address,
      format,
    },
  ];
}

async function signPsbt(
  psbt: Psbt,
  {
    finalize = true,
    extractTx = true,
    network,
    inputsToSign,
  }: OKXSignPSBTOptions = { network: "mainnet", inputsToSign: [] },
): Promise<BrowserWalletSignResponse> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError("OKX Wallet not installed.");
  }

  if (extractTx && !finalize) {
    throw new BrowserWalletExtractTxFromNonFinalizedPsbtError();
  }

  const provider = await getOKXWalletProvider(network);

  const psbtHex = psbt.toHex();

  let signedPsbtHex: string = "";

  const toSignInputs: OKXSignInput[] = [];

  inputsToSign.forEach((input) => {
    const { address, signingIndexes } = input;
    signingIndexes.forEach((index) => {
      toSignInputs.push({
        index,
        address,
      });
    });
  });

  try {
    signedPsbtHex = await provider.signPsbt(psbtHex, {
      autoFinalized: finalize,
      toSignInputs,
    });
  } catch (err) {
    throw new OrditSDKError("Failed to sign PSBT using OKX Wallet");
  }

  const signedPsbt = Psbt.fromHex(signedPsbtHex);

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
  } else {
    return {
      base64: signedPsbt.toBase64(),
      hex: signedPsbt.toHex(),
    };
  }
}

async function signMessage(
  message: string,
  type: MessageSignatureTypes = "ecdsa",
  network: BrowserWalletNetwork = "mainnet",
): Promise<BrowserWalletSignResponse> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError("OKX Wallet not installed.");
  }

  const provider = await getOKXWalletProvider(network);

  const signature = await provider.signMessage(message, type);

  return {
    base64: signature,
    hex: Buffer.from(signature, "base64").toString("hex"),
  };
}

export { getAddresses, isInstalled, signMessage, signPsbt };
