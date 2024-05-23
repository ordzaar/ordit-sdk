import * as ecc from "@bitcoinerlab/secp256k1";
import { initEccLib, Psbt } from "bitcoinjs-lib";
import {
  AddressPurpose,
  BitcoinProvider,
  getAddress,
  GetAddressOptions,
  GetAddressResponse,
  signMessage as satsConnectSignMessage,
  SignMessageOptions as SatsConnectSignMessageOptions,
  SignMessageResponse as SatsConnectSignMessageResponse,
  signTransaction,
  SignTransactionOptions,
  SignTransactionResponse,
} from "sats-connect";

import { getAddressFormat } from "../../../addresses";
import type { BrowserWalletNetwork } from "../../../config/types";
import {
  BrowserWalletExtractTxFromNonFinalizedPsbtError,
  BrowserWalletRequestCancelledByUserError,
  BrowserWalletSigningError,
  OrditSDKError,
} from "../../../errors";
import type { BrowserWalletSignResponse, WalletAddress } from "../../types";
import { NETWORK_TO_BITCOIN_NETWORK_TYPE } from "./constants";
import type { SatsConnectSignPSBTOptions } from "./types";
import { fromXOnlyToFullPubkey } from "./utils";

// Included here as browser-wallets is an individual entry-point.
// Required for all signing operations to function within sats-connect since inputs need to be finalized.
// This function will manage its own instance.
initEccLib(ecc);

/**
 * Gets addresses from the browser wallet.
 *
 * @param network Network
 * @returns An array of WalletAddress objects.
 * @throws {BrowserWalletNotInstalledError} Wallet is not installed
 * @throws {BrowserWalletSigningError} Failed to sign with Selected Wallet
 * @throws {BrowserWalletRequestCancelledByUserError} Request was cancelled by user
 */
async function satsConnectWalletGetAddresses(
  getProvider: () => Promise<BitcoinProvider>,
  network: BrowserWalletNetwork = "mainnet",
): Promise<WalletAddress[]> {
  if (network === "signet") {
    throw new OrditSDKError("signet network is not supported");
  }

  const result: WalletAddress[] = [];

  const handleOnFinish = (response: GetAddressResponse) => {
    if (!response || !response.addresses || response.addresses.length !== 2) {
      throw new BrowserWalletSigningError(
        "Failed to retrieve addresses using selected wallet",
      );
    }

    response.addresses.forEach((addressObj) => {
      const format = getAddressFormat(addressObj.address, network);

      let fullPubKey = addressObj.publicKey;
      if (format === "taproot") {
        // For taproot addresses, sats-connect returns the x-only public key.
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

  const options: GetAddressOptions = {
    payload: {
      purposes: ["ordinals", "payment"] as AddressPurpose[],
      message: "Provide access to Payment address and Ordinals address",
      network: {
        type: NETWORK_TO_BITCOIN_NETWORK_TYPE[network],
      },
    },
    getProvider,
    onFinish: (response: GetAddressResponse) => handleOnFinish(response),
    onCancel: handleOnCancel,
  };

  await getAddress(options);

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
 * @throws {BrowserWalletSigningError} Failed to sign with sellected wallet
 * @throws {OrditSDKError} Invalid options provided
 * @throws {BrowserWalletRequestCancelledByUserError} Request was cancelled by user
 */
async function satsConnectWalletSignPsbt(
  getProvider: () => Promise<BitcoinProvider>,
  psbt: Psbt,
  {
    finalize = true,
    extractTx = true,
    network,
    inputsToSign,
  }: SatsConnectSignPSBTOptions = { network: "mainnet", inputsToSign: [] },
): Promise<BrowserWalletSignResponse> {
  if (network === "signet") {
    throw new OrditSDKError("signet network is not supported");
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
      throw new BrowserWalletSigningError(
        "Failed to sign psbt using selected wallet",
      );
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

  const options: SignTransactionOptions = {
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
    getProvider,
  };

  await signTransaction(options);

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
 * @throws {BrowserWalletSigningError} Failed to sign with selected wallet
 * @throws {OrditSDKError} Invalid options provided
 * @throws {BrowserWalletRequestCancelledByUserError} Request was cancelled by user
 */
async function satsConnectWalletSignMessage(
  getProvider: () => Promise<BitcoinProvider>,
  message: string,
  address: string,
  network: BrowserWalletNetwork = "mainnet",
): Promise<BrowserWalletSignResponse> {
  if (network === "signet") {
    throw new OrditSDKError("signet network is not supported");
  }
  if (!message || !network || !address) {
    throw new OrditSDKError("Invalid options provided");
  }

  let hex: string;
  let base64: string | null = null;

  const handleOnFinish = (response: SatsConnectSignMessageResponse) => {
    if (!response) {
      throw new BrowserWalletSigningError(
        "Failed to sign message using selected wallet",
      );
    }

    hex = Buffer.from(response, "base64").toString("hex");
    base64 = response;
  };

  const handleOnCancel = () => {
    throw new BrowserWalletRequestCancelledByUserError();
  };

  const options: SatsConnectSignMessageOptions = {
    payload: {
      network: {
        type: NETWORK_TO_BITCOIN_NETWORK_TYPE[network],
      },
      message,
      address,
    },
    getProvider,
    onFinish: handleOnFinish,
    onCancel: handleOnCancel,
  };

  await satsConnectSignMessage(options);

  // The Return is supplied by the await statement above, which extracts the hex and optional base64 from the response.
  // Hex is always returned, hence the not null assertion.
  // In cases where there is no hex, an error would be thrown by the handleOnFinish function.
  return { hex: hex!, base64 };
}

export {
  satsConnectWalletGetAddresses,
  satsConnectWalletSignMessage,
  satsConnectWalletSignPsbt,
};

export * from "../../types";
export * from "./types";
