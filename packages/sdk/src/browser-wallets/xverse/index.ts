import { Psbt } from "bitcoinjs-lib";
import {
  AddressPurpose,
  getAddress,
  GetAddressOptions,
  GetAddressResponse,
  signMessage as xverseSignMessage,
  SignMessageOptions as XverseSignMessageOptions,
  SignMessageResponse as XverseSignMessageResponse,
  signTransaction,
  SignTransactionOptions,
  SignTransactionResponse,
} from "sats-connect";

import { getAddressFormat } from "../../addresses";
import type { BrowserWalletNetwork } from "../../config/types";
import {
  BrowserWalletExtractTxFromNonFinalizedPsbtError,
  BrowserWalletNotInstalledError,
  BrowserWalletRequestCancelledByUserError,
  BrowserWalletSigningError,
  OrditSDKError,
} from "../../errors";
import type { BrowserWalletSignResponse, WalletAddress } from "../types";
import { NETWORK_TO_BITCOIN_NETWORK_TYPE } from "./constants";
import type { XverseSignPSBTOptions } from "./types";
import { fromXOnlyToFullPubkey } from "./utils";

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

  return typeof window.BitcoinProvider !== "undefined";
}

/**
 * Gets addresses from the browser wallet.
 *
 * @param network Network
 * @returns An array of WalletAddress objects.
 * @throws {BrowserWalletNotInstalledError} Wallet is not installed
 * @throws {BrowserWalletSigningError} Failed to sign with Xverse
 * @throws {BrowserWalletRequestCancelledByUserError} Request was cancelled by user
 */
async function getAddresses(
  network: BrowserWalletNetwork = "mainnet",
): Promise<WalletAddress[]> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError("Xverse not installed");
  }

  const result: WalletAddress[] = [];

  const handleOnFinish = (response: GetAddressResponse) => {
    if (!response || !response.addresses || response.addresses.length !== 2) {
      throw new BrowserWalletSigningError(
        "Failed to retrieve addresses using Xverse",
      );
    }

    response.addresses.forEach((addressObj) => {
      const format = getAddressFormat(addressObj.address, network);

      let fullPubKey = addressObj.publicKey;
      if (format === "taproot") {
        // For taproot addresses, Xverse returns the x-only public key.
        fullPubKey = fromXOnlyToFullPubkey(addressObj.publicKey);
      }

      result.push({
        publicKey: fullPubKey,
        address: addressObj.address,
        format,
      });
    });
  };

  const handleOnCancel = () => {
    throw new BrowserWalletRequestCancelledByUserError();
  };

  const xVerseOptions: GetAddressOptions = {
    payload: {
      purposes: ["ordinals", "payment"] as AddressPurpose[],
      message: "Provide access to Payment address and Ordinals address",
      network: {
        type: NETWORK_TO_BITCOIN_NETWORK_TYPE[network],
      },
    },
    onFinish: (response: GetAddressResponse) => handleOnFinish(response),
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
 * @throws {BrowserWalletNotInstalledError} Wallet is not installed
 * @throws {BrowserWalletExtractTxFromNonFinalizedPsbtError} Failed to extract transaction as not all inputs are finalized
 * @throws {BrowserWalletSigningError} Failed to sign with Xverse
 * @throws {OrditSDKError} Invalid options provided
 * @throws {BrowserWalletRequestCancelledByUserError} Request was cancelled by user
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
    throw new BrowserWalletNotInstalledError("Xverse not installed");
  }
  if (!finalize && extractTx) {
    throw new BrowserWalletExtractTxFromNonFinalizedPsbtError();
  }
  if (!psbt || !network || !inputsToSign.length) {
    throw new OrditSDKError("Invalid options provided");
  }

  let hex: string;
  let base64: string | null = null;

  const handleOnFinish = (response: SignTransactionResponse) => {
    const { psbtBase64 } = response;
    if (!psbtBase64) {
      throw new BrowserWalletSigningError("Failed to sign psbt using Xverse");
    }

    const signedPsbt = Psbt.fromBase64(psbtBase64);
    if (finalize) {
      inputsToSign.forEach((input) => {
        input.signingIndexes.forEach((index) => {
          try {
            signedPsbt.finalizeInput(index);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Sign psbt error", error);
            throw new OrditSDKError("Failed to finalize input");
          }
        });
      });
    }

    if (extractTx) {
      try {
        hex = signedPsbt.extractTransaction().toHex();
      } catch (error) {
        // It is possible that not all inputs are finalized.
        // extractTransaction will fail if there are any.
        if (error instanceof Error && error.message === "Not finalized") {
          throw new BrowserWalletExtractTxFromNonFinalizedPsbtError();
        } else {
          throw new OrditSDKError("Failed to extract transaction from PSBT");
        }
      }
      base64 = null;
    } else {
      hex = signedPsbt.toHex();
      base64 = signedPsbt.toBase64();
    }
  };

  const handleOnCancel = () => {
    throw new BrowserWalletRequestCancelledByUserError();
  };

  const xverseOptions: SignTransactionOptions = {
    payload: {
      network: {
        type: NETWORK_TO_BITCOIN_NETWORK_TYPE[network],
      },
      message: "Sign PSBT",
      psbtBase64: psbt.toBase64(),
      broadcast: false,
      inputsToSign,
    },
    onFinish: handleOnFinish,
    onCancel: handleOnCancel,
  };

  await signTransaction(xverseOptions);

  // The Return is supplied by the await statement above, which extracts the hex and optional base64 from the response.
  // Hex is always returned, hence the not null assertion.
  // In cases where there is no hex, an error would be thrown by the handleOnFinish function.
  return { hex: hex!, base64 };
}

/**
 * Signs a message.
 *
 * @param message Message to be signed
 * @param address Address to sign with
 * @param network Network (mainnet or testnet)
 * @returns An object containing `base64` and `hex`.
 * @throws {BrowserWalletNotInstalledError} Wallet is not installed
 * @throws {BrowserWalletSigningError} Failed to sign with Xverse
 * @throws {OrditSDKError} Invalid options provided
 * @throws {BrowserWalletRequestCancelledByUserError} Request was cancelled by user
 */
async function signMessage(
  message: string,
  address: string,
  network: BrowserWalletNetwork = "mainnet",
): Promise<BrowserWalletSignResponse> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError("Xverse not installed");
  }
  if (!message || !network || !address) {
    throw new OrditSDKError("Invalid options provided");
  }

  let hex: string;
  let base64: string | null = null;

  const handleOnFinish = (response: XverseSignMessageResponse) => {
    if (!response) {
      throw new BrowserWalletSigningError(
        "Failed to sign message using Xverse",
      );
    }

    hex = Buffer.from(response, "base64").toString("hex");
    base64 = response;
  };

  const handleOnCancel = () => {
    throw new BrowserWalletRequestCancelledByUserError();
  };

  const xverseOptions: XverseSignMessageOptions = {
    payload: {
      network: {
        type: NETWORK_TO_BITCOIN_NETWORK_TYPE[network],
      },
      message,
      address,
    },
    onFinish: handleOnFinish,
    onCancel: handleOnCancel,
  };

  await xverseSignMessage(xverseOptions);

  // The Return is supplied by the await statement above, which extracts the hex and optional base64 from the response.
  // Hex is always returned, hence the not null assertion.
  // In cases where there is no hex, an error would be thrown by the handleOnFinish function.
  return { hex: hex!, base64 };
}

export { getAddresses, isInstalled, signMessage, signPsbt };

export * from "../types";
export * from "./types";
