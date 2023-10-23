import { getAddressFormat } from "../../addresses";
import { OrditSDKError } from "../../errors";
import type { Network } from "../../networks/types";
import type { BrowserWallet } from "../types";

function isInstalled() {
  if (typeof window === "undefined") {
    throw new OrditSDKError("Cannot call this function outside a browser.");
  }
  return typeof window.unisat !== "undefined";
}

async function getAddresses(network: Network) {
  if (!isInstalled()) {
    throw new OrditSDKError("Unisat not installed.");
  }

  if (!network) {
    throw new OrditSDKError("Invalid options provided.");
  }

  let targetNetwork: UnisatNetwork = "livenet";
  const connectedNetwork = await window.unisat.getNetwork();

  if (network === "testnet") {
    targetNetwork = network;
  }

  if (connectedNetwork !== targetNetwork) {
    await window.unisat.switchNetwork(targetNetwork);
  }

  const accounts = await window.unisat.requestAccounts();
  const publicKey = await window.unisat.getPublicKey();

  if (!accounts[0]) {
    return [];
  }

  const formatObj = getAddressFormat(accounts[0], network);

  return [
    {
      pub: publicKey,
      address: formatObj.address,
      format: formatObj.format,
    },
  ];
}

async function signPsbt() {
  // TODO
}

async function signMessage() {
  // TODO
}

const unisat: BrowserWallet = {
  isInstalled,
  getAddresses,
  signPsbt,
  signMessage,
};

export { unisat };
