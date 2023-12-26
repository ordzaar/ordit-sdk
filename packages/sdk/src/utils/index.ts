import * as ecc from "@bitcoinerlab/secp256k1";
import { BIP32Interface } from "bip32";
import {
  crypto,
  initEccLib,
  Network as BitcoinNetwork,
  networks,
  Payment,
  PaymentCreator,
  payments,
  Psbt,
  Signer,
  Transaction,
} from "bitcoinjs-lib";
import { Buffer } from "buffer";
import ECPairFactory, { ECPairInterface } from "ecpair";

import { ADDRESS_TYPE_TO_FORMAT } from "../addresses/constants";
import type { AddressFormat, AddressType } from "../addresses/types";
import type { Network } from "../config/types";
import { OrditSDKError } from "../errors";
import type { UTXO } from "../transactions/types";
import type {
  BufferOrHex,
  EncodeDecodeObjectOptions,
  GetScriptTypeResponse,
  IsBitcoinPaymentResponse,
  NestedObject,
  OneOfAllDataFormats,
} from "./types";

export function getNetwork(value: Network) {
  if (value === "mainnet") {
    return networks.bitcoin;
  }

  return networks[value];
}

export function createPayment(
  key: Buffer,
  type: AddressType,
  network: Network | BitcoinNetwork,
  paymentOptions?: Payment,
) {
  initEccLib(ecc);
  const networkObj =
    typeof network === "string" ? getNetwork(network) : network;

  if (type === "p2tr") {
    return payments.p2tr({
      internalPubkey: key,
      network: networkObj,
      ...paymentOptions,
    });
  }

  if (type === "p2sh") {
    return payments.p2sh({
      redeem: payments.p2wpkh({ pubkey: key, network: networkObj }),
      network: networkObj,
    });
  }

  return payments[type]({ pubkey: key, network: networkObj });
}

export function getDerivationPath(
  formatType: AddressFormat,
  account = 0,
  addressIndex = 0,
) {
  if (formatType === "p2wsh") {
    // No supported derivation path
    return "";
  }

  const pathFormat: Record<Exclude<AddressFormat, "p2wsh">, string> = {
    legacy: `m/44'/0'/${account}'/0/${addressIndex}`,
    "p2sh-p2wpkh": `m/49'/0'/${account}'/0/${addressIndex}`,
    segwit: `m/84'/0'/${account}'/0/${addressIndex}`,
    taproot: `m/86'/0'/${account}'/0/${addressIndex}`,
  };
  return pathFormat[formatType];
}

export function hdNodeToChild(
  node: BIP32Interface,
  formatType: AddressFormat = "legacy",
  addressIndex = 0,
  account = 0,
) {
  const fullDerivationPath = getDerivationPath(
    formatType,
    account,
    addressIndex,
  );

  return node.derivePath(fullDerivationPath);
}

/**
 * This function was copied from bitcoinjs-lib as it is not exported.
 *
 * Reference: [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/payments/bip341.ts)
 *
 * @param pubkey Public Key
 * @returns x-coordinate of public key
 */
export function toXOnly(pubkey: Buffer): Buffer {
  return pubkey.subarray(1, 33);
}

/**
 * This function was copied from bitcoinjs-lib as it is not exported.
 *
 * Reference: [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/payments/bip341.ts)
 *
 * @param pubKey Public Key
 * @param h Hash
 * @returns Concatenated TapTweak Hash
 */
export function tapTweakHash(pubKey: Buffer, h: Buffer | undefined): Buffer {
  return crypto.taggedHash(
    "TapTweak",
    Buffer.concat(h ? [pubKey, h] : [pubKey]),
  );
}

export function tweakSigner(
  signer: BIP32Interface | ECPairInterface,
  opts: { tweakHash?: Buffer; network?: BitcoinNetwork } = {},
): Signer {
  const ECPair = ECPairFactory(ecc);

  let privateKey: Uint8Array | undefined = signer.privateKey!;
  if (!privateKey) {
    throw new OrditSDKError("Private key is required for tweaking signer!");
  }
  if (signer.publicKey[0] === 3) {
    privateKey = ecc.privateNegate(privateKey);
  }

  const tweakedPrivateKey = ecc.privateAdd(
    privateKey,
    tapTweakHash(toXOnly(signer.publicKey), opts.tweakHash),
  );
  if (!tweakedPrivateKey) {
    throw new OrditSDKError("Invalid tweaked private key!");
  }

  return ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
    network: opts.network,
  });
}

export const isObject = (o: unknown) => o?.constructor === Object;
export const isString = (s: unknown) =>
  s instanceof String || typeof s === "string";

function encodeDecodeObject(
  obj: NestedObject,
  { encode, depth = 0 }: EncodeDecodeObjectOptions,
) {
  const maxDepth = 5;

  if (depth > maxDepth) {
    throw new OrditSDKError("Object too deep");
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const key in obj) {
    // eslint-disable-next-line no-prototype-builtins, no-continue
    if (!obj.hasOwnProperty(key)) continue;

    const value = obj[key];
    if (isObject(value)) {
      // eslint-disable-next-line no-param-reassign
      obj[key] = encodeDecodeObject(value as NestedObject, {
        encode,
        depth: depth + 1,
      });
    } else if (isString(value)) {
      // eslint-disable-next-line no-param-reassign
      obj[key] = encode
        ? encodeURIComponent(value as string)
        : decodeURIComponent(value as string);
    }
  }

  return obj;
}

// TODO: Make this function immutable
/**
 * Encodes an object into [valid URI components](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent),
 * modifying the object in the process.
 *
 * @param obj Object
 * @returns The object is mutated.
 * @deprecated
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function UNSTABLE_encodeObject(obj: NestedObject) {
  return encodeDecodeObject(obj, { encode: true });
}

// TODO: Make this function immutable
/**
 * Decodes an object into [valid URI components](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent),
 * modifying the object in the process.
 *
 * @param obj Object
 * @returns The object is mutated.
 * @deprecated
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function UNSTABLE_decodeObject(obj: NestedObject) {
  return encodeDecodeObject(obj, { encode: false });
}

// Temporary convertors until bignumber.js is integrated
export function convertSatoshisToBTC(satoshis: number) {
  return satoshis / 10 ** 8;
}

export function convertBTCToSatoshis(btc: number) {
  return parseInt((btc * 10 ** 8).toString(), 10); // remove floating point overflow by parseInt
}

export function generateTxUniqueIdentifier(txId: string, index: number) {
  return `${txId}:${index}`;
}

/**
 * Converts an outpoint to id format.
 *
 * An outpoint refers to a specific output.
 *
 * Reference: https://developer.bitcoin.org/reference/transactions.html#outpoint-the-specific-part-of-a-specific-output
 *
 * @param outpoint Outpoint in string format `{txid}:{vout}`
 * @returns id formatted string, `{txid}i{vout}`
 */
export function outpointToIdFormat(outpoint: string) {
  if (outpoint.includes(":")) {
    return outpoint.replace(":", "i");
  }

  return outpoint.includes("i") ? outpoint : `${outpoint}i0`;
}

export function decodePSBT({ hex, base64, buffer }: OneOfAllDataFormats): Psbt {
  if (hex) return Psbt.fromHex(hex);
  if (base64) return Psbt.fromBase64(base64);
  if (buffer) return Psbt.fromBuffer(buffer);

  throw new OrditSDKError("Invalid options");
}

export function decodeTx({ hex, buffer }: BufferOrHex): Transaction {
  if (hex) return Transaction.fromHex(hex);
  if (buffer) return Transaction.fromBuffer(buffer);

  throw new OrditSDKError("Invalid options");
}

function isPaymentFactory(payment: PaymentCreator, network: Network) {
  return (script: Buffer) => {
    try {
      return payment({ output: script, network: getNetwork(network) });
    } catch (error) {
      return false;
    }
  };
}

export const isP2PKH = (
  script: Buffer,
  network: Network,
): IsBitcoinPaymentResponse => {
  const p2pkh = isPaymentFactory(payments.p2pkh, network)(script);
  return {
    type: "p2pkh",
    payload: p2pkh,
  };
};

export const isP2WPKH = (
  script: Buffer,
  network: Network,
): IsBitcoinPaymentResponse => {
  const p2wpkh = isPaymentFactory(payments.p2wpkh, network)(script);
  return {
    type: "p2wpkh",
    payload: p2wpkh,
  };
};

export const isP2SHScript = (
  script: Buffer,
  network: Network,
): IsBitcoinPaymentResponse => {
  const p2sh = isPaymentFactory(payments.p2sh, network)(script);
  return {
    type: "p2sh",
    payload: p2sh,
  };
};

export const isP2TR = (
  script: Buffer,
  network: Network,
): IsBitcoinPaymentResponse => {
  const p2tr = isPaymentFactory(payments.p2tr, network)(script);
  return {
    type: "p2tr",
    payload: p2tr,
  };
};

export function getScriptType(
  script: Buffer,
  network: Network,
): GetScriptTypeResponse {
  const p2pkh = isP2PKH(script, network);
  if (p2pkh.payload) {
    return {
      format: ADDRESS_TYPE_TO_FORMAT.p2pkh,
      ...p2pkh,
    };
  }

  const p2wpkh = isP2WPKH(script, network);
  if (p2wpkh.payload) {
    return {
      format: ADDRESS_TYPE_TO_FORMAT.p2wpkh,
      ...p2wpkh,
    };
  }

  const p2sh = isP2SHScript(script, network);
  if (p2sh.payload) {
    return {
      format: ADDRESS_TYPE_TO_FORMAT.p2sh,
      ...p2sh,
    };
  }

  const p2tr = isP2TR(script, network);
  if (p2tr.payload) {
    return {
      format: ADDRESS_TYPE_TO_FORMAT.p2tr,
      ...p2tr,
    };
  }

  throw new OrditSDKError("Unsupported input");
}

export function getDummyP2TRInput(): UTXO {
  return {
    n: 1,
    sats: 2885,
    scriptPubKey: {
      asm: "1 29dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f8",
      desc: "rawtr(29dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f8)#68kgcmxp",
      hex: "512029dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f8",
      address: "tb1p98dv6f5jp5qr4z2dtaljvwrhq34xrr8zuaqgv4ajf36vg2mmsruqt5m3lv",
      type: "witness_v1_taproot",
    },
    txid: "3045867081e53f33a4dbd930bf0c121fe30155c767e98895470a572eefc4b7dd",
    safeToSpend: true,
    confirmation: 10,
  };
}
