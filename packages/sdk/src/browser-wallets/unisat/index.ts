import { Psbt } from "bitcoinjs-lib";
import { getAddressFormat } from "../../addresses";
import { OrditSDKError } from "../../errors";
import { NETWORK_TO_UNISAT_NETWORK } from "./constants";
import type { Network } from "../../networks/types";
import type {
  BrowserWallet,
  BrowserWalletSignPSBTResponse,
  WalletAddress,
} from "../types";
import type { UnisatSignPSBTOptions } from "./types";

function isInstalled() {
  if (typeof window === "undefined") {
    throw new OrditSDKError("Cannot call this function outside a browser.");
  }
  return typeof window.unisat !== "undefined";
}

async function getAddresses(network: Network): Promise<WalletAddress[]> {
  if (!isInstalled()) {
    throw new OrditSDKError("Unisat not installed.");
  }

  if (!network) {
    throw new OrditSDKError("Invalid options provided.");
  }

  const targetNetwork = NETWORK_TO_UNISAT_NETWORK[network];
  if (!targetNetwork) {
    throw new OrditSDKError("Unsupported network.");
  }

  const connectedNetwork = await window.unisat.getNetwork();
  if (connectedNetwork !== targetNetwork) {
    await window.unisat.switchNetwork(targetNetwork);
  }

  const accounts = await window.unisat.requestAccounts();
  const publicKey = await window.unisat.getPublicKey();

  const address = accounts[0];
  if (!address) {
    return [];
  }
  const format = getAddressFormat(address, network);
  return [
    {
      pub: publicKey,
      address,
      format,
    },
  ];
}

async function signPsbt(
  psbt: Psbt,
  { finalize = true, extractTx = true }: UnisatSignPSBTOptions = {},
): Promise<BrowserWalletSignPSBTResponse> {
  if (!isInstalled()) {
    throw new OrditSDKError("Unisat not installed.");
  }

  const psbtHex = psbt.toHex();
  const signedPsbtHex = await window.unisat.signPsbt(psbtHex, {
    autoFinalized: finalize,
  });
  if (!signedPsbtHex) {
    throw new OrditSDKError("Failed to sign psbt hex using Unisat.");
  }

  if (psbtHex === signedPsbtHex) {
    throw new OrditSDKError("Psbt has already been signed.");
  }

  const signedPsbt = Psbt.fromHex(signedPsbtHex);
  return extractTx
    ? {
        base64: null,
        hex: signedPsbt.extractTransaction().toHex(),
      }
    : {
        base64: signedPsbt.toBase64(),
        hex: signedPsbt.toHex(),
      };
}

async function signMessage(
  message: string,
): Promise<BrowserWalletSignPSBTResponse> {
  if (!isInstalled()) {
    throw new OrditSDKError("Unisat not installed.");
  }

  const signature = await window.unisat.signMessage(message);

  if (!signature) {
    throw new OrditSDKError("Failed to sign message using Unisat.");
  }

  return {
    base64: signature,
    hex: Buffer.from(signature, "base64").toString("hex"),
  };
}

const unisat: BrowserWallet = {
  isInstalled,
  getAddresses,
  signPsbt,
  signMessage,
};

export { unisat };
