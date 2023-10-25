import { unisat } from "@ordzaar/ordit-sdk/browser-wallets";

const isUnisatInstalled = unisat.isInstalled();
console.log("Is Unisat Installed:", isUnisatInstalled);
