import { Psbt } from "bitcoinjs-lib";
import { OrditSDKError } from "../../errors";
import type {
  BrowserWallet,
  BrowserWalletSignPSBTOptions,
  BrowserWalletSignPSBTResponse,
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
): Promise<BrowserWalletSignPSBTResponse> {
  throw new OrditSDKError("Method not implemented");
}

async function signMessage(
  _message: string,
): Promise<BrowserWalletSignPSBTResponse> {
  throw new OrditSDKError("Method not implemented");
}

const xverse: BrowserWallet = {
  isInstalled,
  getAddresses,
  signPsbt,
  signMessage,
};

export { xverse };
