import { AddressPurpose, getAddress } from "sats-connect";
import { Psbt } from "bitcoinjs-lib";
import { getAddressFormat } from "../../addresses";
import { OrditSDKError } from "../../errors";
import {
  fromXOnlyToFullPubkey,
  fromBrowserWalletNetworkToBitcoinNetworkType,
} from "./utils";
import type {
  BrowserWalletSignPSBTOptions,
  BrowserWalletSignResponse,
  WalletAddress,
} from "../types";
import type { BrowserWalletNetwork } from "../../config/types";
import type { XverseOnFinishResponse } from "./types";
import { AddressFormat } from "../../addresses/types";

/**
 * Checks if the browser wallet extension is installed.
 *
 * @returns `true` if installed, `false` otherwise.
 */
function isInstalled() {
  if (typeof window === "undefined") {
    throw new OrditSDKError("Cannot call this function outside a browser");
  }

  return typeof window.BitcoinProvider !== "undefined";
}

/**
 * Gets addresses from the browser wallet.
 *
 * @param network Network
 * @param readOnly Read only (when set to true, the wallet modal appears)
 * @returns An array of WalletAddress objects.
 */
async function getAddresses(
  network: BrowserWalletNetwork = "mainnet",
): Promise<WalletAddress[]> {
  if (!isInstalled()) {
    throw new OrditSDKError("Xverse not installed");
  }

  if (!network) {
    throw new OrditSDKError("Invalid options provided");
  }

  const result: Array<{
    publicKey: string;
    address: string;
    format: AddressFormat;
  }> = [];

  const handleOnFinish = (
    response: XverseOnFinishResponse,
    network: BrowserWalletNetwork,
  ) => {
    if (!response || !response.addresses || response.addresses.length !== 2) {
      throw new Error("Invalid address format");
    }

    response.addresses.forEach((addressObj) => {
      const format = getAddressFormat(addressObj.address, network);

      // let xKey;
      if (format === "taproot") {
        // xKey = addressObj.publicKey // tr publicKey returned by XVerse is already xOnlyPubKey
        addressObj.publicKey = fromXOnlyToFullPubkey(addressObj.publicKey);
      }

      result.push({
        publicKey: addressObj.publicKey,
        address: addressObj.address,
        format,
      });
    });
  };

  const handleOnCancel = () => {
    throw new Error("Request canceled by user.");
  };

  const xVerseOptions = {
    payload: {
      purposes: ["ordinals", "payment"] as AddressPurpose[],
      message: "Provide access to 2 address formats", // Message is hardcodd for now
      network: {
        type: fromBrowserWalletNetworkToBitcoinNetworkType(network),
      },
    },
    onFinish: (response: XverseOnFinishResponse) =>
      handleOnFinish(response, network),
    onCancel: handleOnCancel,
  };

  await getAddress(xVerseOptions);

  return result;
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
  throw new OrditSDKError("Method not implemented");
}

export { isInstalled, getAddresses, signPsbt, signMessage };
