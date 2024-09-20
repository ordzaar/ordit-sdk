import {
  getAddressInfo,
  Network as NetworkEnum,
  validate,
} from "bitcoin-address-validation";

import type { Chain, Network } from "../config/types";
import { BIP32, CHAIN_CODE } from "../constants";
import { OrditSDKError } from "../errors";
import { createPayment, getNetwork } from "../utils";
import { ADDRESS_TYPE_TO_FORMAT } from "./constants";
import type { Address, AddressFormat, AddressType } from "./types";

function getAddressTypeForRegTest(address: string): AddressType {
  try {
    const { type, network: validatedNetwork, bech32 } = getAddressInfo(address);
    if (
      (!bech32 && validatedNetwork !== "testnet") ||
      (bech32 && validatedNetwork !== "regtest")
    ) {
      // This type Error is intentional, we'll forward the top-level one anyway
      throw new Error("Invalid address");
    }
    return type;
  } catch (_) {
    throw new OrditSDKError("Invalid address");
  }
}

export function getAddressType(
  address: string,
  network: Network,
  chain: Chain = "bitcoin",
): AddressType {
  if (chain === "fractal-bitcoin") {
    if (network === "regtest" || network === "signet") {
      throw new OrditSDKError("Unsupported operation");
    }

    if (!validate(address, NetworkEnum.mainnet)) {
      throw new OrditSDKError("Invalid address");
    }

    const { type } = getAddressInfo(address);
    return type;
  }

  // Separate regtest handling because bitcoin-address-validation treats non-bech32 addresses as testnet addresses,
  // which fail in the validate function.
  if (network === "regtest") {
    return getAddressTypeForRegTest(address);
  }

  if (
    !validate(
      address,
      (network === "signet" ? "testnet" : network) as NetworkEnum,
    )
  ) {
    throw new OrditSDKError("Invalid address");
  }

  const { type } = getAddressInfo(address);
  return type;
}

export function getAddressFormat(
  address: string,
  network: Network,
  chain: Chain = "bitcoin",
): AddressFormat {
  const type = getAddressType(address, network, chain);
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
  try {
    const { network: validatedNetwork } = getAddressInfo(address);
    return validatedNetwork;
  } catch {
    throw new OrditSDKError("Invalid address");
  }
}

export * from "./constants";
export * from "./types";
