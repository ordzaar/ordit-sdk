import {
  getAddresses as getUnisatAddresses,
  isInstalled as isUnisatInstalled,
} from "@ordzaar/ordit-sdk/browser-wallets/unisat";

import {
  isInstalled as isXverseInstalled,
  getAddresses as getXverseAddresses,
} from "@ordzaar/ordit-sdk/browser-wallets/xverse";

async function connectToUnisat() {
  if (!isUnisatInstalled()) {
    throw new Error("Can't connect to Unisat because it is not installed");
  }
  console.log("Unisat is installed");
  const addresses = await getUnisatAddresses("testnet");
  console.log("Addresses:", addresses);
}

async function connectToXverse() {
  if (!isXverseInstalled()) {
    throw new Error("Can't connect to Xverse because it is not installed");
  }
  console.log("Xverse is installed");
  const addresses = await getXverseAddresses("testnet");
  console.log("Addresses:", addresses);
}

const unisatConnectButton = document.getElementById("unisat-connect");
if (unisatConnectButton) {
  unisatConnectButton.addEventListener("click", connectToUnisat);
}

const xverseConnectButton = document.getElementById("xverse-connect");
if (xverseConnectButton) {
  xverseConnectButton.addEventListener("click", connectToXverse);
}
