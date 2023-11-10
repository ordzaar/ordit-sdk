import { Network, PSBTBuilder } from "@ordzaar/ordit-sdk";
import {
  getAddresses as getUnisatAddresses,
  isInstalled as isUnisatInstalled,
  signMessage as signUnisatMessage,
  signPsbt as signUnisatPsbt,
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

async function createAndPreparePsbt() {
  const psbtParams = {
    address: "tb1p98dv6f5jp5qr4z2dtaljvwrhq34xrr8zuaqgv4ajf36vg2mmsruqt5m3lv",
    feeRate: 1,
    publicKey:
      "039ce27aa7666731648421004ba943b90b8273e23a175d9c58e3ec2e643a9b01d1",
    outputs: [
      {
        address: "tb1qatkgzm0hsk83ysqja5nq8ecdmtwl73zwurawww",
        value: 600,
      },
    ],
    network: "testnet" as Network,
  };
  const psbt = new PSBTBuilder(psbtParams);
  console.log("Initial Psbt: ", psbt);

  // Duplicate the PSBT so that console log shows a different instance.
  const clonedPSBT = new PSBTBuilder(psbtParams);
  await clonedPSBT.prepare();
  console.log("Prepared Psbt: ", clonedPSBT);
  return clonedPSBT;
}

async function handleCreateAndPreparePsbtButtonClick() {
  await createAndPreparePsbt();
}

const createPsbtButton = document.getElementById("create-psbt");
if (createPsbtButton) {
  createPsbtButton.addEventListener(
    "click",
    handleCreateAndPreparePsbtButtonClick
  );
}

async function handleSignPsbt() {
  console.log("Sign PSBT");
  const psbt = await createAndPreparePsbt();
  const signPsbtResponse = await signUnisatPsbt(psbt.toPSBT());
  console.log("Sign PSBT Response", signPsbtResponse);
}

const signPsbtButton = document.getElementById("sign-psbt");
if (signPsbtButton) {
  signPsbtButton.addEventListener("click", handleSignPsbt);
}

async function handleSignMessage() {
  const signPsbtResponse = await signUnisatMessage(
    "This is a test message for signing.\n\nThis will not be used."
  );
  console.log("Sign PSBT Response", signPsbtResponse);
}

const signMessageButton = document.getElementById("sign-message");
if (signMessageButton) {
  signMessageButton.addEventListener("click", handleSignMessage);
}
