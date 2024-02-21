// @vitest-environment happy-dom
import { Psbt } from "bitcoinjs-lib";
import { BitcoinProvider } from "sats-connect";

import { BrowserWalletNetwork } from "../../config/types";
import { BrowserWalletNotInstalledError, OrditSDKError } from "../../errors";
import {
  satsConnectWalletGetAddresses,
  satsConnectWalletSignMessage,
  satsConnectWalletSignPsbt,
} from "../sats-connect";
import type { SatsConnectSignPSBTOptions } from "../sats-connect/types";
import { BrowserWalletSignResponse, WalletAddress } from "../types";

export interface MagicEdenBitcoinProvider extends BitcoinProvider {
  isMagicEden: boolean | undefined;
}

export interface MagicEdenWindow extends Window {
  BitcoinProvider?: MagicEdenBitcoinProvider;
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

async function getMagicEdenWalletProvider(): Promise<
  BitcoinProvider | undefined
> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError(
      "Magic Eden not installed or set as prioritised wallet.",
    );
  }

  return window.BitcoinProvider;
}

async function getAddresses(
  network: BrowserWalletNetwork = "mainnet",
): Promise<WalletAddress[]> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError(
      "Magic Eden not installed or set as prioritised wallet.",
    );
  }

  return satsConnectWalletGetAddresses(getMagicEdenWalletProvider, network);
}

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
      "Magic Eden not installed or set as prioritised wallet.",
    );
  }

  return satsConnectWalletSignPsbt(getMagicEdenWalletProvider, psbt, {
    finalize,
    extractTx,
    network,
    inputsToSign,
  });
}

async function signMessage(
  message: string,
  address: string,
  network: BrowserWalletNetwork = "mainnet",
): Promise<BrowserWalletSignResponse> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError(
      "Magic Eden not installed or set as prioritised wallet.",
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
