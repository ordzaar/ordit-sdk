import {
  getAddresses as getUnisatAddresses,
  isInstalled as isUnisatInstalled,
} from "@ordzaar/ordit-sdk/browser-wallets/unisat";

async function connectToUnisat() {
  if (!isUnisatInstalled()) {
    throw new Error("Can't connect to Unisat because it is not installed");
  }
  console.log("Unisat is installed");
  const addresses = await getUnisatAddresses("testnet");
  console.log("Addresses:", addresses);
}

const unisatConnectButton = document.getElementById("unisat-connect");
if (unisatConnectButton) {
  unisatConnectButton.addEventListener("click", connectToUnisat);
}
