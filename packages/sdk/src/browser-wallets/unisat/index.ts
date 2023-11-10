import { Psbt } from "bitcoinjs-lib";

import { getAddressFormat } from "../../addresses";
import type { BrowserWalletNetwork } from "../../config/types";
import {
  BrowserWalletNotInstalledError,
  BrowserWalletSigningError,
  OrditSDKError,
} from "../../errors";
import type { BrowserWalletSignResponse, WalletAddress } from "../types";
import { NETWORK_TO_UNISAT_NETWORK } from "./constants";
import type { UnisatSignPSBTOptions } from "./types";

/**
 * Checks if the browser wallet extension is installed.
 *
 * @returns `true` if installed, `false` otherwise.
 * @throws {OrditSDKError} Function is called outside a browser without `window` object
 */
function isInstalled() {
  if (typeof window === "undefined") {
    throw new OrditSDKError("Cannot call this function outside a browser");
  }
  return typeof window.unisat !== "undefined";
}

/**
 * Gets addresses from the browser wallet.
 *
 * @param network Network
 * @param readOnly Read only (when set to true, the wallet modal appears)
 * @returns An array of WalletAddress objects.
 * @throws {BrowserWalletNotInstalledError} Wallet is not installed
 */
async function getAddresses(
  network: BrowserWalletNetwork = "mainnet",
  readOnly?: boolean
): Promise<WalletAddress[]> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError("Unisat not installed");
  }

  const connectedNetwork = await window.unisat.getNetwork();
  const targetNetwork = NETWORK_TO_UNISAT_NETWORK[network];
  if (connectedNetwork !== targetNetwork) {
    await window.unisat.switchNetwork(targetNetwork);
  }

  const accounts = readOnly
    ? await window.unisat.getAccounts()
    : await window.unisat.requestAccounts();
  const publicKey = await window.unisat.getPublicKey();

  const address = accounts[0];
  if (!address) {
    return [];
  }
  const format = getAddressFormat(address, network);
  return [
    {
      publicKey,
      address,
      format,
    },
  ];
}

/**
 * Signs a Partially Signed Bitcoin Transaction (PSBT).
 * To learn more, visit https://github.com/bitcoin/bitcoin/blob/master/doc/psbt.md
 *
 * @param psbt Partially Signed Bitcoin Transaction
 * @param options Options for signing
 * @returns An object containing `base64` and `hex` if the transaction is not extracted, or `hex` if the transaction is extracted.
 * @throws {BrowserWalletNotInstalledError} Wallet is not installed
 * @throws {BrowserWalletSigningError} Signing failed
 */
async function signPsbt(
  psbt: Psbt,
  { finalize = true, extractTx = true }: UnisatSignPSBTOptions = {}
): Promise<BrowserWalletSignResponse> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError("Unisat not installed");
  }

  const psbtHex = psbt.toHex();
  const signedPsbtHex = await window.unisat.signPsbt(psbtHex, {
    autoFinalized: finalize,
  });
  if (!signedPsbtHex) {
    throw new BrowserWalletSigningError("Failed to sign psbt hex using Unisat");
  }

  const signedPsbt = Psbt.fromHex(signedPsbtHex);
  return extractTx
    ? {
        base64: null,
        hex: signedPsbt.extractTransaction().toHex(),
      }
    : {
        base64: signedPsbt.toBase64(),
        hex: signedPsbt.toHex(),
      };
}

/**
 * Signs a message.
 *
 * @param message Message to be signed
 * @param type Signature type
 * @returns An object containing `base64` and `hex`.
 * @throws {BrowserWalletNotInstalledError} Wallet is not installed
 * @throws {BrowserWalletSigningError} Signing failed
 */
async function signMessage(
  message: string,
  type: MessageSignatureTypes = "ecdsa"
): Promise<BrowserWalletSignResponse> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError("Unisat not installed");
  }

  const signature = await window.unisat.signMessage(message, type);

  if (!signature) {
    throw new BrowserWalletSigningError("Failed to sign message using Unisat");
  }

  return {
    base64: signature,
    hex: Buffer.from(signature, "base64").toString("hex"),
  };
}

export { getAddresses, isInstalled, signMessage, signPsbt };
