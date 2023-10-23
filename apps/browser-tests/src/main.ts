import { unisat } from "@ordzaar/ordit-sdk/browser-wallets";

async function main() {
  const appRoot = document.getElementById("app");

  if (!appRoot) {
    return;
  }

  appRoot.innerHTML = "Browser Test";

  const isUnisatInstalled = await unisat.isInstalled();
  console.log("Is Unisat Installed:", isUnisatInstalled);
}

main();
