import { Wallet } from "@wallet-standard/base";
import { Psbt } from "bitcoinjs-lib";
import { BitcoinProvider } from "sats-connect";

import { BrowserWalletNetwork } from "../../config/types";
import { BrowserWalletNotInstalledError, OrditSDKError } from "../../errors";
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

export interface MagicEdenWindow extends Window {
  BitcoinProvider?: MagicEdenBitcoinProvider;
}

export interface MagicEdenWallet extends Wallet {
  features: {
    "sats-connect:": {
      provider: Promise<BitcoinProvider>;
    };
  };
}

/**
 * Checks if the MagicEden Wallet extension is installed.
 *
 * @returns `true` if installed, `false` otherwise.
 * @throws {OrditSDKError} Function is called outside a browser without `window` object
 */
function isInstalled(): boolean {
  if (typeof window === "undefined") {
    throw new OrditSDKError("Cannot call this function outside a browser");
  }

  return (
    typeof (window as MagicEdenWindow).BitcoinProvider?.isMagicEden !==
    "undefined"
  );
}

async function getAddresses(
  getMeProvider: () => Promise<BitcoinProvider>,
  network: BrowserWalletNetwork = "mainnet",
): Promise<WalletAddress[]> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError(
      "Magic Eden not installed or set as prioritised wallet.",
    );
  }

  return satsConnectWalletGetAddresses(getMeProvider, network);
}

async function signPsbt(
  getMeProvider: () => Promise<BitcoinProvider>,
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
      "Magic Eden not installed or set as prioritised wallet.",
    );
  }

  return satsConnectWalletSignPsbt(getMeProvider, psbt, {
    finalize,
    extractTx,
    network,
    inputsToSign,
  });
}

async function signMessage(
  getMeProvider: () => Promise<BitcoinProvider>,
  message: string,
  address: string,
  network: BrowserWalletNetwork = "mainnet",
): Promise<BrowserWalletSignResponse> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError(
      "Magic Eden not installed or set as prioritised wallet.",
    );
  }

  return satsConnectWalletSignMessage(getMeProvider, message, address, network);
}

export { getAddresses, isInstalled, signMessage, signPsbt };
