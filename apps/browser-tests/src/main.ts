import {
  isInstalled as isUnisatInstalled,
  getAddresses as getUnisatAddresses,
} from "@ordzaar/ordit-sdk/browser-wallets/unisat";

async function connectToUnisat() {
  if (!isUnisatInstalled()) {
    console.error("Can't connect to Unisat because it is not installed.");
    return;
  }
  console.log("Unisat is installed");
  const addresses = await getUnisatAddresses("testnet");
  console.log("Addresses:", addresses);
}

const unisatConnectButton = document.getElementById("unisat-connect");
if (unisatConnectButton) {
  unisatConnectButton.addEventListener("click", connectToUnisat);
}
