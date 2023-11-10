import { Network, PSBTBuilder, PSBTBuilderOptions } from "@ordzaar/ordit-sdk";
import {
  getAddresses as getUnisatAddresses,
  isInstalled as isUnisatInstalled,
  signMessage as signUnisatMessage,
  signPsbt as signUnisatPsbt,
} from "@ordzaar/ordit-sdk/browser-wallets/unisat";
import {
  getAddresses as getXverseAddresses,
  isInstalled as isXverseInstalled,
  signMessage as signXverseMessage,
  signPsbt as signXversePsbt,
} from "@ordzaar/ordit-sdk/browser-wallets/xverse";

// Helpers

async function createAndPreparePsbt(psbtParams: PSBTBuilderOptions) {
  const psbt = new PSBTBuilder(psbtParams);
  console.log("Initial Psbt: ", psbt);

  // Duplicate the PSBT so that console log shows a different instance.
  const clonedPSBT = new PSBTBuilder(psbtParams);
  await clonedPSBT.prepare();
  console.log("Prepared Psbt: ", clonedPSBT);
  return clonedPSBT;
}

// Unisat Tests

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

const unisatPsbtParams = {
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

async function unisatHandleCreateAndPreparePsbtButtonClick() {
  await createAndPreparePsbt(unisatPsbtParams);
}

const unisatCreatePsbtButton = document.getElementById("unisat-create-psbt");
if (unisatCreatePsbtButton) {
  unisatCreatePsbtButton.addEventListener(
    "click",
    unisatHandleCreateAndPreparePsbtButtonClick,
  );
}

async function unisatHandleSignPsbt() {
  console.log("Sign PSBT");
  const psbt = await createAndPreparePsbt(unisatPsbtParams);
  const signPsbtResponse = await signUnisatPsbt(psbt.toPSBT());
  console.log("Sign PSBT Response", signPsbtResponse);
}

const unisatSignPsbtButton = document.getElementById("unisat-sign-psbt");
if (unisatSignPsbtButton) {
  unisatSignPsbtButton.addEventListener("click", unisatHandleSignPsbt);
}

async function unisatHandleSignMessage() {
  const signPsbtResponse = await signUnisatMessage(
    "This is a test message for signing.\n\nThis will not be used.",
  );
  console.log("Sign PSBT Response", signPsbtResponse);
}

const unisatSignMessageButton = document.getElementById("unisat-sign-message");
if (unisatSignMessageButton) {
  unisatSignMessageButton.addEventListener("click", unisatHandleSignMessage);
}

// Xverse Tests

async function connectToXverse() {
  if (!isXverseInstalled()) {
    throw new Error("Can't connect to Xverse because it is not installed");
  }
  console.log("Xverse is installed");
  const addresses = await getXverseAddresses("testnet");
  console.log("Addresses:", addresses);
}

const xverseConnectButton = document.getElementById("xverse-connect");
if (xverseConnectButton) {
  xverseConnectButton.addEventListener("click", connectToXverse);
}

const xversePsbtParams = {
  address: "2Mw3SutDSQ68hMqaHayeAbXMaoC4njthDry",
  feeRate: 1,
  publicKey:
    "033b7ea8ef43c1648c99dec487338a828d065d0e04de91cc02c4794a306e9f2077",
  outputs: [
    {
      address: "2Mw3SutDSQ68hMqaHayeAbXMaoC4njthDry",
      value: 600,
    },
  ],
  network: "testnet" as Network,
};

async function xverseHandleCreateAndPreparePsbtButtonClick() {
  await createAndPreparePsbt(xversePsbtParams);
}

const xverseCreatePsbtButton = document.getElementById("xverse-create-psbt");
if (xverseCreatePsbtButton) {
  xverseCreatePsbtButton.addEventListener(
    "click",
    xverseHandleCreateAndPreparePsbtButtonClick,
  );
}

async function xverseHandleSignPsbt() {
  console.log("Sign PSBT");
  const psbt = await createAndPreparePsbt(xversePsbtParams);
  const signPsbtResponse = await signXversePsbt(psbt.toPSBT(), {
    network: "testnet",
    inputsToSign: [
      {
        address: "2Mw3SutDSQ68hMqaHayeAbXMaoC4njthDry",
        signingIndexes: [0],
      },
    ],
  });
  console.log("Sign PSBT Response", signPsbtResponse);
}

const xverseSignPsbtButton = document.getElementById("xverse-sign-psbt");
if (xverseSignPsbtButton) {
  xverseSignPsbtButton.addEventListener("click", xverseHandleSignPsbt);
}

async function xverseHandleSignMessage() {
  const signPsbtResponse = await signXverseMessage(
    "This is a test message for signing.\n\nThis will not be used.",
    "tb1pa90aqxtep3jg8re4kkqlrqnrhcp3nt3t4srf7lraschmtzl934kq3u04f2",
    "testnet",
  );
  console.log("Sign PSBT Response", signPsbtResponse);
}

const xverseSignMessageButton = document.getElementById("xverse-sign-message");
if (xverseSignMessageButton) {
  xverseSignMessageButton.addEventListener("click", xverseHandleSignMessage);
}
