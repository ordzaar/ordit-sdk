import {
  getAddressInfo,
  Network as NetworkEnum,
  validate,
} from "bitcoin-address-validation";

import type { Network } from "../config/types";
import { BIP32, CHAIN_CODE } from "../constants";
import { OrditSDKError } from "../errors";
import { createPayment, getNetwork } from "../utils";
import { ADDRESS_TYPE_TO_FORMAT } from "./constants";
import type { Address, AddressFormat, AddressType } from "./types";

function getAddressFormatForRegTest(address: string): AddressFormat {
  try {
    const { type, network: validatedNetwork, bech32 } = getAddressInfo(address);
    if (
      (!bech32 && validatedNetwork !== "testnet") ||
      (bech32 && validatedNetwork !== "regtest")
    ) {
      // This type Error is intentional, we'll forward the top-level one anyway
      throw new Error("Invalid address");
    }
    return ADDRESS_TYPE_TO_FORMAT[type];
  } catch (_) {
    throw new OrditSDKError("Invalid address");
  }
}

export function getAddressFormat(
  address: string,
  network: Network,
): AddressFormat {
  // Separate regtest handling because bitcoin-address-validation treats non-bech32 addresses as testnet addresses,
  // which fail in the validate function.
  if (network === "regtest") {
    return getAddressFormatForRegTest(address);
  }

  if (!validate(address, network as NetworkEnum)) {
    throw new OrditSDKError("Invalid address");
  }

  const { type } = getAddressInfo(address);
  return ADDRESS_TYPE_TO_FORMAT[type];
}

function getTaprootAddressFromBip32PublicKey(
  bip32PublicKey: Buffer,
  network: Network,
): Address {
  const childNodeXOnlyPubkey = bip32PublicKey.subarray(1, 33);
  const { address } = createPayment(childNodeXOnlyPubkey, "p2tr", network);
  return {
    address: address!, // address will never be undefined
    format: ADDRESS_TYPE_TO_FORMAT.p2tr,
    publicKey: bip32PublicKey.toString("hex"),
    xKey: childNodeXOnlyPubkey.toString("hex"),
  };
}

function getAddressFromBip32PublicKey(
  bip32PublicKey: Buffer,
  network: Network,
  type: AddressType,
): Address {
  if (type === "p2tr") {
    return getTaprootAddressFromBip32PublicKey(bip32PublicKey, network);
  }

  const { address } = createPayment(bip32PublicKey, type, network);
  return {
    address: address!, // address will never be undefined
    format: ADDRESS_TYPE_TO_FORMAT[type],
    publicKey: bip32PublicKey.toString("hex"),
  };
}

export function getAddressesFromPublicKey(
  publicKey: string | Buffer,
  network: Network = "mainnet",
  type: Exclude<AddressType, "p2wsh"> | "all" = "all",
): Address[] {
  const publicKeyBuffer = Buffer.isBuffer(publicKey)
    ? publicKey
    : Buffer.from(publicKey, "hex");
  const { publicKey: bip32PublicKey } = BIP32.fromPublicKey(
    publicKeyBuffer,
    CHAIN_CODE,
    getNetwork(network),
  );

  if (type === "all") {
    // p2wsh is not supported by browser wallets
    const addressTypes = (
      Object.keys(ADDRESS_TYPE_TO_FORMAT) as AddressType[]
    ).filter((addressType) => addressType !== "p2wsh");
    return addressTypes.map((addressType) =>
      getAddressFromBip32PublicKey(bip32PublicKey, network, addressType),
    );
  }

  return [getAddressFromBip32PublicKey(bip32PublicKey, network, type)];
}

export function getNetworkByAddress(address: string): Network {
  const testnetAddressPrefix = ["m", "n", "2", "tb1q", "tb1p"];
  // for legacy address testnet and regtest has same prefix, prioritize testnet over regtest
  const regtestAddressPrefix = ["m", "n", "2", "bcrt1q", "bcrt1p"];
  const mainnetAddressPrefix = ["1", "3", "bc1q", "bc1p"];

  for (let i = 0; i < testnetAddressPrefix.length; i += 1) {
    if (address.startsWith(testnetAddressPrefix[i])) return "testnet";
  }
  for (let i = 0; i < regtestAddressPrefix.length; i += 1) {
    if (address.startsWith(regtestAddressPrefix[i])) return "regtest";
  }
  for (let i = 0; i < mainnetAddressPrefix.length; i += 1) {
    if (address.startsWith(mainnetAddressPrefix[i])) return "mainnet";
  }

  throw new OrditSDKError("Invalid or unsupported address");
}

export * from "./constants";
export * from "./types";
