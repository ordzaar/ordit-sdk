import {
  AddressType as AddressTypeEnum,
  getAddressInfo,
  Network as NetworkEnum,
  validate,
} from "bitcoin-address-validation";

import type { Network } from "../config/types";
import { BIP32 } from "../constants";
import { OrditSDKError } from "../errors";
import { createPayment, getNetwork } from "../utils";
import { ADDRESS_TYPE_TO_FORMAT } from "./constants";
import type { Address, AddressFormat, AddressType } from "./types";

function getAddressFormatFromType(type: AddressTypeEnum): AddressFormat {
  if (type === AddressTypeEnum.p2wsh) {
    // p2wsh is not supported by browser wallets
    throw new OrditSDKError("Invalid address");
  }
  return ADDRESS_TYPE_TO_FORMAT[type];
}

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
    return getAddressFormatFromType(type);
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
  return getAddressFormatFromType(type);
}

export function getAddressesFromPublicKey(
  publicKey: string | Buffer,
  network: Network = "testnet",
  format: AddressType | "all" = "all",
) {
  const publicKeyBuffer = Buffer.isBuffer(publicKey)
    ? publicKey
    : Buffer.from(publicKey, "hex");
  const networkObj = getNetwork(network);
  const chainCode = Buffer.alloc(32).fill(1);

  const addresses: Address[] = [];
  const keys = BIP32.fromPublicKey(publicKeyBuffer, chainCode, networkObj);
  const childNodeXOnlyPubkey = keys.publicKey.subarray(1, 33);

  if (format === "all") {
    const addressTypes = Object.keys(ADDRESS_TYPE_TO_FORMAT) as AddressType[];

    addressTypes.forEach((addrType) => {
      if (addrType === "p2tr") {
        const paymentObj = createPayment(
          childNodeXOnlyPubkey,
          addrType,
          network,
        );

        addresses.push({
          address: paymentObj.address,
          xkey: childNodeXOnlyPubkey.toString("hex"),
          format: ADDRESS_TYPE_TO_FORMAT[addrType],
          publicKey: keys.publicKey.toString("hex"),
        });
      } else {
        const paymentObj = createPayment(keys.publicKey, addrType, network);

        addresses.push({
          address: paymentObj.address,
          format: ADDRESS_TYPE_TO_FORMAT[addrType],
          publicKey: keys.publicKey.toString("hex"),
        });
      }
    });
  } else {
    const key = format === "p2tr" ? childNodeXOnlyPubkey : keys.publicKey;
    const paymentObj = createPayment(key, format, network);

    addresses.push({
      address: paymentObj.address,
      format: ADDRESS_TYPE_TO_FORMAT[format],
      publicKey: keys.publicKey.toString("hex"),
      xkey:
        format === "p2tr" ? childNodeXOnlyPubkey.toString("hex") : undefined,
    });
  }

  return addresses;
}
