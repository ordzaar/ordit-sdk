import {
  AddressType as AddressTypeEnum,
  getAddressInfo,
  Network as NetworkEnum,
  validate,
} from "bitcoin-address-validation";

import type { Network } from "../config/types";
import { OrditSDKError } from "../errors";
import { ADDRESS_TYPE_TO_FORMAT } from "./constants";
import type { AddressFormat } from "./types";

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
