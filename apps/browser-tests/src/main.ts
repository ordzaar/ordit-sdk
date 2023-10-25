import { unisat } from "@ordzaar/ordit-sdk/browser-wallets";

async function connectToUnisat() {
  if (!unisat.isInstalled()) {
    console.error("Can't connect to Unisat because it is not installed.");
    return;
  }
  console.log("Unisat is installed");
}

const unisatConnectButton = document.getElementById("unisat-connect");
if (unisatConnectButton) {
  unisatConnectButton.addEventListener("click", connectToUnisat);
}
