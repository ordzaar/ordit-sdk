import { Psbt } from "bitcoinjs-lib";
import { OrditSDKError } from "../../errors";
import type {
  BrowserWallet,
  BrowserWalletSignPSBTOptions,
  BrowserWalletSignResponse,
} from "../types";

function isInstalled() {
  return false;
}

async function getAddresses() {
  return [];
}

async function signPsbt(
  _psbt: Psbt,
  _options: BrowserWalletSignPSBTOptions = {},
): Promise<BrowserWalletSignResponse> {
  throw new OrditSDKError("Method not implemented");
}

async function signMessage(
  _message: string,
): Promise<BrowserWalletSignResponse> {
  throw new OrditSDKError("Method not implemented");
}

const xverse: BrowserWallet = {
  isInstalled,
  getAddresses,
  signPsbt,
  signMessage,
};

export { xverse };
