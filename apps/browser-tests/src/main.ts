import { createPsbt } from "@ordzaar/ordit-sdk";
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

async function handleCreatePsbtButtonClick() {
  const psbt = await createPsbt({
    address: "tb1p98dv6f5jp5qr4z2dtaljvwrhq34xrr8zuaqgv4ajf36vg2mmsruqt5m3lv",
    satsPerByte: 1,
    publicKey:
      "039ce27aa7666731648421004ba943b90b8273e23a175d9c58e3ec2e643a9b01d1",
    outputs: [
      {
        address: "tb1qatkgzm0hsk83ysqja5nq8ecdmtwl73zwurawww",
        value: 600,
      },
    ],
    network: "testnet",
  });
  console.log("Created Psbt: ", psbt);
}

const createPsbtButton = document.getElementById("create-psbt");
if (createPsbtButton) {
  createPsbtButton.addEventListener("click", handleCreatePsbtButtonClick);
}
