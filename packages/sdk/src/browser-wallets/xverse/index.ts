import {
  AddressPurpose,
  getAddress,
  signTransaction,
  signMessage as xverseSignMessage,
} from "sats-connect";
import { Psbt } from "bitcoinjs-lib";
import { getAddressFormat } from "../../addresses";
import { OrditSDKError } from "../../errors";
import {
  fromXOnlyToFullPubkey,
  fromBrowserWalletNetworkToBitcoinNetworkType,
} from "./utils";
import type { BrowserWalletSignResponse, WalletAddress } from "../types";
import type { BrowserWalletNetwork } from "../../config/types";
import type {
  XverseOnFinishResponse,
  XverseSignPSBTOptions,
  XverseSignPSBTResponse,
} from "./types";
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

      if (format === "taproot") {
        // For taproot addresses, Xverse returns the x-only public key.
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
      message: "Provide access to payment Address and Ordinals address", // Message is hardcoded for now
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
  psbt: Psbt,
  {
    finalize = true,
    extractTx = true,
    network,
    inputsToSign,
  }: XverseSignPSBTOptions = { network: "mainnet", inputsToSign: [] },
): Promise<BrowserWalletSignResponse> {
  if (!isInstalled()) {
    throw new OrditSDKError("Xverse not installed");
  }
  if (!psbt || !network || !inputsToSign.length) {
    throw new OrditSDKError("Invalid options provided");
  }

  let hex: string;
  let base64: string | null = null;

  const handleOnFinish = (response: XverseSignPSBTResponse) => {
    const psbtBase64 = response.psbtBase64;
    if (!psbtBase64) {
      throw new Error("Failed to sign transaction using Xverse");
    }

    const signedPsbt = Psbt.fromBase64(psbtBase64);
    if (finalize) {
      if (!inputsToSign.length) {
        signedPsbt.finalizeAllInputs();
      } else {
        inputsToSign.forEach((input) => {
          input.signingIndexes.forEach((index) => {
            signedPsbt.finalizeInput(index);
          });
        });
      }
    }

    hex = extractTx
      ? signedPsbt.extractTransaction().toHex()
      : signedPsbt.toHex();
    base64 = !extractTx ? signedPsbt.toBase64() : null;
  };

  const handleOnCancel = () => {
    throw new Error(`Failed to sign transaction using xVerse`);
  };

  const xverseOptions = {
    payload: {
      network: {
        type: fromBrowserWalletNetworkToBitcoinNetworkType(network),
      },
      message: "Sign transaction",
      psbtBase64: psbt.toBase64(),
      broadcast: false,
      inputsToSign,
    },
    onFinish: handleOnFinish,
    onCancel: handleOnCancel,
  };

  await signTransaction(xverseOptions);

  return { hex: hex!, base64 };
}

/**
 * Signs a message.
 *
 * @param message Message to be signed
 * @returns An object containing `base64` and `hex`.
 */
async function signMessage(
  message: string,
  network: BrowserWalletNetwork = "mainnet",
  address: string,
): Promise<BrowserWalletSignResponse> {
  if (!isInstalled()) {
    throw new OrditSDKError("Xverse not installed");
  }
  if (!message || !network || !address) {
    throw new OrditSDKError("Invalid options provided");
  }

  let hex: string;
  let base64: string | null = null;

  const handleOnFinish = (response: string) => {
    if (!response) {
      throw new Error("Failed to sign message using Xverse");
    }

    hex = Buffer.from(response, "base64").toString("hex");
    base64 = response;
  };

  const handleOnCancel = () => {
    throw new Error(`Failed to sign message using xVerse`);
  };

  const xverseOptions = {
    payload: {
      network: {
        type: fromBrowserWalletNetworkToBitcoinNetworkType(network),
      },
      message,
      address,
    },
    onFinish: handleOnFinish,
    onCancel: handleOnCancel,
  };

  await xverseSignMessage(xverseOptions);

  return { hex: hex!, base64 };
}

export { isInstalled, getAddresses, signPsbt, signMessage };
