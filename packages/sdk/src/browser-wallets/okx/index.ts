import { Psbt } from "bitcoinjs-lib";

import { getAddressFormat } from "../../addresses";
import { BrowserWalletNetwork } from "../../config/types";
import {
  BrowserWalletExtractTxFromNonFinalizedPsbtError,
  BrowserWalletNotInstalledError,
  BrowserWalletRequestCancelledByUserError,
  BrowserWalletSigningError,
  OrditSDKError,
} from "../../errors";
import { BrowserWalletSignResponse, WalletAddress } from "../types";
import { OKXSignPSBTOptions } from "./types";

type OKXError = { code?: number; message: string };

function isInstalled(): boolean {
  if (typeof window === "undefined") {
    throw new OrditSDKError("Cannot call this function outside a browser");
  }
  return typeof window.okxwallet !== "undefined";
}

function getOKXWalletProvider(
  network: BrowserWalletNetwork = "mainnet",
): OKXWalletProvider {
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

  const provider = getOKXWalletProvider(network);

  try {
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
  } catch (err) {
    if (err instanceof OrditSDKError) {
      // internal error caused by getAddressFormat
      throw err;
    }
    const okxError = err as OKXError;
    if (okxError.code === 4001) {
      throw new BrowserWalletRequestCancelledByUserError();
    }
    throw new OrditSDKError(okxError.message);
  }
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

  const provider = getOKXWalletProvider(network);

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
    const okxError = err as OKXError;
    if (okxError.code === 4001) {
      throw new BrowserWalletRequestCancelledByUserError();
    }
    throw new OrditSDKError(okxError.message);
  }

  if (!signedPsbtHex) {
    throw new BrowserWalletSigningError(
      "Failed to sign psbt hex using OKX Wallet",
    );
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

  const provider = getOKXWalletProvider(network);

  let signature: string = "";

  try {
    signature = await provider.signMessage(message, type);
  } catch (err) {
    const okxError = err as OKXError;
    if (okxError.code === 4001) {
      throw new BrowserWalletRequestCancelledByUserError();
    }
    throw new OrditSDKError(okxError.message);
  }

  if (!signature) {
    throw new BrowserWalletSigningError(
      "Failed to sign message using OKX Wallet",
    );
  }

  return {
    base64: signature,
    hex: Buffer.from(signature, "base64").toString("hex"),
  };
}

export { getAddresses, isInstalled, signMessage, signPsbt };

export * from "../types";
export * from "./types";
