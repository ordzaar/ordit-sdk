import { Psbt } from "bitcoinjs-lib";

import { getAddressFormat } from "../../addresses";
import type { BrowserWalletNetwork, Chain } from "../../config/types";
import {
  BrowserWalletExtractTxFromNonFinalizedPsbtError,
  BrowserWalletNotInstalledError,
  BrowserWalletRequestCancelledByUserError,
  BrowserWalletSigningError,
  OrditSDKError,
} from "../../errors";
import type { BrowserWalletSignResponse, WalletAddress } from "../types";
import { CHAIN_TO_UNISAT_CHAIN, NETWORK_TO_UNISAT_NETWORK } from "./constants";
import type { UnisatGetAddressesOptions, UnisatSignPSBTOptions } from "./types";

type UnisatError = { code?: number; message: string };

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
 * @param chain Chain
 * @param options.readOnly Read only (when set to true, the wallet modal appears)
 * @returns An array of WalletAddress objects.
 * @throws {BrowserWalletNotInstalledError} Wallet is not installed
 * @throws {BrowserWalletRequestCancelledByUserError} Request was cancelled by user
 * @throws {OrditSDKError} Internal error
 */
async function getAddresses(
  network: BrowserWalletNetwork = "mainnet",
  chain: Chain = "bitcoin",
  options: UnisatGetAddressesOptions = {},
): Promise<WalletAddress[]> {
  const { readOnly = false } = options;

  if (network === "signet") {
    throw new OrditSDKError("signet network is not supported");
  }
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError("Unisat not installed");
  }
  try {
    if (typeof window.unisat.getChain === "undefined") {
      if (chain === "fractal-bitcoin") {
        throw new OrditSDKError(
          "Fractal bitcoin is only supported on Unisat extension >= 1.4.0",
        );
      }
      const connectedNetwork = await window.unisat.getNetwork();
      const targetNetwork = NETWORK_TO_UNISAT_NETWORK[network];
      if (connectedNetwork !== targetNetwork) {
        await window.unisat.switchNetwork(targetNetwork);
      }
    } else {
      const connectedChain = await window.unisat.getChain();

      const targetChain = CHAIN_TO_UNISAT_CHAIN[chain][network];
      if (connectedChain !== targetChain) {
        await window.unisat.switchChain(targetChain);
      }
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
  } catch (err) {
    if (err instanceof OrditSDKError) {
      // internal error caused by getAddressFormat
      throw err;
    }

    // Unisat does not use Error object prototype
    const unisatError = err as UnisatError;
    if (unisatError.code === 4001) {
      throw new BrowserWalletRequestCancelledByUserError();
    }
    throw new OrditSDKError(unisatError.message);
  }
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
  { finalize = true, extractTx = true }: UnisatSignPSBTOptions = {},
): Promise<BrowserWalletSignResponse> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError("Unisat not installed");
  }

  if (extractTx && !finalize) {
    throw new BrowserWalletExtractTxFromNonFinalizedPsbtError();
  }

  const psbtHex = psbt.toHex();

  let signedPsbtHex: string = "";
  try {
    signedPsbtHex = await window.unisat.signPsbt(psbtHex, {
      autoFinalized: finalize,
    });
  } catch (err) {
    // Unisat does not use Error object prototype
    const unisatError = err as UnisatError;
    if (unisatError.code === 4001) {
      throw new BrowserWalletRequestCancelledByUserError();
    }
  }

  if (!signedPsbtHex) {
    throw new BrowserWalletSigningError("Failed to sign psbt hex using Unisat");
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
  type: MessageSignatureTypes = "ecdsa",
): Promise<BrowserWalletSignResponse> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError("Unisat not installed");
  }

  let signature: string = "";
  try {
    signature = await window.unisat.signMessage(message, type);
  } catch (err) {
    // Unisat does not use Error object prototype
    const unisatError = err as UnisatError;
    if (unisatError.code === 4001) {
      throw new BrowserWalletRequestCancelledByUserError();
    }
  }

  if (!signature) {
    throw new BrowserWalletSigningError("Failed to sign message using Unisat");
  }

  return {
    base64: signature,
    hex: Buffer.from(signature, "base64").toString("hex"),
  };
}

export { getAddresses, isInstalled, signMessage, signPsbt };

export * from "../types";
export * from "./types";
