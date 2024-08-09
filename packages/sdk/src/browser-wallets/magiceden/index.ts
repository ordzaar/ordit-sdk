import { getWallets, Wallet } from "@wallet-standard/core";
import { Psbt } from "bitcoinjs-lib";
import { BitcoinProvider } from "sats-connect";

import { BrowserWalletNetwork } from "../../config/types";
import {
  BrowserWalletNetworkMismatchError,
  BrowserWalletNotInstalledError,
  OrditSDKError,
} from "../../errors";
import {
  satsConnectWalletGetAddresses,
  satsConnectWalletSignMessage,
  satsConnectWalletSignPsbt,
} from "../internal/sats-connect";
import type { SatsConnectSignPSBTOptions } from "../internal/sats-connect/types";
import { BrowserWalletSignResponse, WalletAddress } from "../types";

export interface MagicEdenBitcoinProvider extends BitcoinProvider {
  isMagicEden: boolean | undefined;
}

export interface MagicEdenWallet extends Wallet {
  name: "Magic Eden";
  features: {
    "sats-connect:": {
      provider: MagicEdenBitcoinProvider;
    };
  };
}

async function getMagicEdenWalletProvider(): Promise<MagicEdenBitcoinProvider> {
  const { get } = getWallets();

  const wallets = get();

  const meWallet = wallets.find(
    (wallet) =>
      wallet.name === "Magic Eden" &&
      (wallet as MagicEdenWallet).features["sats-connect:"]?.provider
        ?.isMagicEden === true,
  ) as MagicEdenWallet | undefined;

  if (!meWallet) {
    throw new BrowserWalletNotInstalledError(
      "Magic Eden Wallet not installed.",
    );
  }

  return meWallet.features["sats-connect:"].provider;
}

/**
 * Checks if the Magic Eden Wallet extension is installed.
 *
 * @returns `true` if installed, `false` otherwise
 * @throws {OrditSDKError} Function is called outside a browser without `window` object
 */
async function isInstalled(): Promise<boolean> {
  if (typeof window === "undefined") {
    throw new OrditSDKError("Cannot call this function outside a browser");
  }

  try {
    const meProvider = await getMagicEdenWalletProvider();
    return (
      meProvider.isMagicEden !== undefined && meProvider.isMagicEden === true
    );
  } catch (e) {
    if (e instanceof BrowserWalletNotInstalledError) {
      return false;
    }
    throw e;
  }
}

/**
 * Gets addresses from Magic Eden Wallet.
 *
 * @param network Network: Magic Eden Wallet only supports mainnet
 * @returns An array of WalletAddress objects
 * @throws {BrowserWalletNotInstalledError} Magic Eden Wallet is not installed
 * @throws {BrowserWalletNetworkMismatchError} Magic Eden Wallet is used outside of mainnet
 * @throws {BrowserWalletSigningError} Failed to sign with Magic Eden Wallet
 * @throws {BrowserWalletRequestCancelledByUserError} Request was cancelled by user
 */
async function getAddresses(
  network: BrowserWalletNetwork = "mainnet",
): Promise<WalletAddress[]> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError(
      "Magic Eden Wallet not installed.",
    );
  }

  if (network !== "mainnet") {
    throw new BrowserWalletNetworkMismatchError(
      "Magic Eden Wallet only supports mainnet",
    );
  }

  return satsConnectWalletGetAddresses(getMagicEdenWalletProvider, network);
}

/**
 * Signs a Partially Signed Bitcoin Transaction (PSBT).
 * To learn more, visit https://github.com/bitcoin/bitcoin/blob/master/doc/psbt.md
 *
 * @param psbt Partially Signed Bitcoin Transaction
 * @param options Options for signing
 * @returns An object containing `base64` and `hex` if the transaction is not extracted, or `hex` if the transaction is extracted
 * @throws {BrowserWalletNotInstalledError} Magic Eden Wallet is not installed
 * @throws {BrowserWalletNetworkMismatchError} Magic Eden Wallet is used outside of mainnet
 * @throws {BrowserWalletExtractTxFromNonFinalizedPsbtError} Failed to extract transaction as not all inputs are finalized
 * @throws {BrowserWalletSigningError} Failed to sign with Magic Eden Wallet
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
  }: SatsConnectSignPSBTOptions = { network: "mainnet", inputsToSign: [] },
): Promise<BrowserWalletSignResponse> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError(
      "Magic Eden Wallet not installed.",
    );
  }

  if (network !== "mainnet") {
    throw new BrowserWalletNetworkMismatchError(
      "Magic Eden Wallet only supports mainnet",
    );
  }

  return satsConnectWalletSignPsbt(getMagicEdenWalletProvider, psbt, {
    finalize,
    extractTx,
    network,
    inputsToSign,
  });
}

/**
 * Signs a message.
 *
 * @param message Message to be signed
 * @param address Address to sign with
 * @param network Network: Magic Eden Wallet only supports mainnet
 * @returns An object containing `base64` and `hex`
 * @throws {BrowserWalletNotInstalledError} Magic Eden Wallet is not installed
 * @throws {BrowserWalletNetworkMismatchError} Magic Eden Wallet is used outside of mainnet
 * @throws {BrowserWalletSigningError} Failed to sign with Magic Eden Wallet
 * @throws {OrditSDKError} Invalid options provided
 * @throws {BrowserWalletRequestCancelledByUserError} Request was cancelled by user
 */
async function signMessage(
  message: string,
  address: string,
  network: BrowserWalletNetwork = "mainnet",
): Promise<BrowserWalletSignResponse> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError(
      "Magic Eden Wallet not installed.",
    );
  }

  if (network !== "mainnet") {
    throw new BrowserWalletNetworkMismatchError(
      "Magic Eden Wallet only supports mainnet",
    );
  }

  return satsConnectWalletSignMessage(
    getMagicEdenWalletProvider,
    message,
    address,
    network,
  );
}

export {
  getAddresses,
  getMagicEdenWalletProvider,
  isInstalled,
  signMessage,
  signPsbt,
};
