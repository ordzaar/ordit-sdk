import type { BrowserWallet } from "../types";

async function isInstalled() {
  return false;
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
