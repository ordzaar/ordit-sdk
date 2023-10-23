import type { BrowserWallet } from "../types";

async function isInstalled() {
  return false;
}

async function getAddresses() {}

async function signPsbt() {}

async function signMessage() {}

const xverse: BrowserWallet = {
  isInstalled,
  getAddresses,
  signPsbt,
  signMessage,
};

export { xverse };
