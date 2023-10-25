import { OrditSDKError } from "../../errors";
import type { BrowserWallet } from "../types";

function isInstalled() {
  if (typeof window === "undefined") {
    throw new OrditSDKError("Cannot call this function outside a browser.");
  }

  return typeof window.unisat !== "undefined";
}

async function getAddresses() {}

async function signPsbt() {}

async function signMessage() {}

const unisat: BrowserWallet = {
  isInstalled,
  getAddresses,
  signPsbt,
  signMessage,
};

export { unisat };
