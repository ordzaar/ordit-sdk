import type { BrowserWallet } from "../types";

function isInstalled() {
  return false;
}

async function getAddresses() {
  return [];
}

async function signPsbt() {
  // TODO
}

async function signMessage() {
  // TODO
}

const xverse: BrowserWallet = {
  isInstalled,
  getAddresses,
  signPsbt,
  signMessage,
};

export { xverse };
