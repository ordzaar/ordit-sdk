import { Psbt } from "bitcoinjs-lib";

import type { BrowserWalletNetwork } from "../../config/types";
import { OrditSDKError } from "../../errors";
import type {
  BrowserWalletSignPSBTOptions,
  BrowserWalletSignResponse,
  WalletAddress,
} from "../types";

/**
 * Checks if the browser wallet extension is installed.
 *
 * @returns `true` if installed, `false` otherwise.
 */
function isInstalled() {
  return false;
}

/**
 * Gets addresses from the browser wallet.
 *
 * @param network Network
 * @param readOnly Read only (when set to true, the wallet modal appears)
 * @returns An array of WalletAddress objects.
 */
async function getAddresses(
  _network: BrowserWalletNetwork = "mainnet",
  _readOnly?: boolean,
): Promise<WalletAddress[]> {
  await Promise.resolve();
  return [];
}

/**
 * Signs a Partially Signed Bitcoin Transaction (PSBT).
 * To learn more, visit https://github.com/bitcoin/bitcoin/blob/master/doc/psbt.md
 *
 * @param psbt Partially Signed Bitcoin Transaction
 * @param options Options for signing
 * @returns An object containing `base64` and `hex` if the transaction is not extracted, or `hex` if the transaction is extracted.
 */
async function signPsbt(
  _psbt: Psbt,
  _options: BrowserWalletSignPSBTOptions = {},
): Promise<BrowserWalletSignResponse> {
  await Promise.resolve();
  throw new OrditSDKError("Method not implemented");
}

/**
 * Signs a message.
 *
 * @param message Message to be signed
 * @returns An object containing `base64` and `hex`.
 */
async function signMessage(
  _message: string,
): Promise<BrowserWalletSignResponse> {
  await Promise.resolve();
  throw new OrditSDKError("Method not implemented");
}

export { getAddresses, isInstalled, signMessage, signPsbt };
