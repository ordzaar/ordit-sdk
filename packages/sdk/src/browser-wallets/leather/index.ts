import { Psbt } from "bitcoinjs-lib";

import {
  BrowserWalletExtractTxFromNonFinalizedPsbtError,
  BrowserWalletNetworkMismatchError,
  BrowserWalletNotInstalledError,
  getAddressFormat,
  getNetworkByAddress,
  OrditSDKError,
} from "../..";
import { BrowserWalletNetwork } from "../../config/types";
import type { BrowserWalletSignResponse, WalletAddress } from "../types";
import {
  LeatherGetAddresses,
  LeatherSignMessage,
  LeatherSignMessageOptions,
  LeatherSignPsbt,
  LeatherSignPSBTOptions,
} from "./types";
import { leatherRequest } from "./utils";

function isInstalled() {
  if (typeof window === "undefined") {
    throw new OrditSDKError("Cannot call this function outside a browser");
  }

  return typeof window.LeatherProvider !== "undefined";
}

async function getAddresses(
  network: BrowserWalletNetwork = "mainnet",
): Promise<WalletAddress[]> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError("Leather not installed");
  }

  const res = await leatherRequest<LeatherGetAddresses>("getAddresses", {
    network,
  });

  const addresses = res.addresses.filter(
    (address) => address.type === "p2tr" || address.type === "p2wpkh",
  );

  // Hacky validation: there's no parameter to specify the network value when getting the address.
  // TODO: Remove this if the wallet already supports that parameter.
  if (getNetworkByAddress(addresses[0].address) !== network) {
    throw new BrowserWalletNetworkMismatchError(
      "Leather network mismatch, please switch it manually",
    );
  }

  return addresses.map((v) => ({
    publicKey: v.publicKey!,
    address: v.address,
    format: getAddressFormat(v.address, network),
  }));
}

// Leather supports BIP-322 message signing.
async function signMessage(
  message: string,
  { network = "mainnet", paymentType }: LeatherSignMessageOptions,
): Promise<BrowserWalletSignResponse> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError("Leather not installed");
  }

  const res = await leatherRequest<LeatherSignMessage>("signMessage", {
    message,
    paymentType,
    network,
  });
  const { signature } = res;

  return {
    base64: signature,
    hex: Buffer.from(signature, "base64").toString("hex"),
  };
}

async function signPsbt(
  psbt: Psbt,
  {
    finalize = true,
    extractTx = true,
    allowedSighash,
    accountNumber,
    network = "mainnet",
    signAtIndexes = [],
  }: LeatherSignPSBTOptions = {},
): Promise<BrowserWalletSignResponse> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError("Leather not installed");
  }

  if (extractTx && !finalize) {
    throw new BrowserWalletExtractTxFromNonFinalizedPsbtError();
  }

  const psbtHex = psbt.toHex();

  const res = await leatherRequest<LeatherSignPsbt>("signPsbt", {
    hex: psbtHex,
    allowedSighash,
    account: accountNumber,
    network,
    signAtIndex: signAtIndexes,
    broadcast: false,
  });

  const signedPsbt = Psbt.fromHex(res.hex);

  if (finalize) {
    signAtIndexes.forEach((index) => {
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
    base64: signedPsbt.toBase64(),
    hex: signedPsbt.toHex(),
  };
}

export { getAddresses, isInstalled, signMessage, signPsbt };
