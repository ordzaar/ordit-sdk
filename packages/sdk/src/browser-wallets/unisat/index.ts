import { getAddressFormat } from "../../addresses";
import { OrditSDKError } from "../../errors";
import { NETWORK_TO_UNISAT_NETWORK } from "./constants";
import type { Psbt as PsbtType } from "bitcoinjs-lib";
import type { Network } from "../../networks/types";
import type { BrowserWalletSignResponse, WalletAddress } from "../types";
import type { UnisatSignPSBTOptions } from "./types";

/**
 * Checks if the browser wallet extension is installed.
 *
 * @returns `true` if installed, `false` otherwise.
 */
function isInstalled() {
  if (typeof window === "undefined") {
    throw new OrditSDKError("Cannot call this function outside a browser");
  }
  return typeof window.unisat !== "undefined";
}

/**
 * Gets addresses from the browser wallet.
 *
 * @param network Network
 * @returns An array of WalletAddress objects.
 */
async function getAddresses(
  network: Network = "mainnet",
): Promise<WalletAddress[]> {
  if (!isInstalled()) {
    throw new OrditSDKError("Unisat not installed");
  }

  if (!network) {
    throw new OrditSDKError("Invalid options provided");
  }

  const targetNetwork = NETWORK_TO_UNISAT_NETWORK[network];
  if (!targetNetwork) {
    throw new OrditSDKError("Unsupported network");
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

/**
 * Signs a Partially Signed Bitcoin Transaction (PSBT).
 * To learn more, visit https://github.com/bitcoin/bitcoin/blob/master/doc/psbt.md
 *
 * @param psbt Partially Signed Bitcoin Transaction
 * @param options Options for signing
 * @returns An object containing `base64` and `hex` if the transaction is not extracted, or `hex` if the transaction is extracted.
 */
async function signPsbt(
  psbt: PsbtType,
  options: UnisatSignPSBTOptions = {},
): Promise<BrowserWalletSignResponse> {
  if (!isInstalled()) {
    throw new OrditSDKError("Unisat not installed");
  }

  const { finalize = true, extractTx = true } = options;

  const psbtHex = psbt.toHex();
  const signedPsbtHex = await window.unisat.signPsbt(psbtHex, {
    autoFinalized: finalize,
  });
  if (!signedPsbtHex) {
    throw new OrditSDKError("Failed to sign psbt hex using Unisat");
  }

  const Psbt = (await import("bitcoinjs-lib")).Psbt;
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

/**
 * Signs a message.
 *
 * @param message Message to be signed
 * @returns An object containing `base64` and `hex`.
 */
async function signMessage(
  message: string,
): Promise<BrowserWalletSignResponse> {
  if (!isInstalled()) {
    throw new OrditSDKError("Unisat not installed");
  }

  const signature = await window.unisat.signMessage(message);

  if (!signature) {
    throw new OrditSDKError("Failed to sign message using Unisat");
  }

  return {
    base64: signature,
    hex: Buffer.from(signature, "base64").toString("hex"),
  };
}

export { isInstalled, getAddresses, signPsbt, signMessage };
