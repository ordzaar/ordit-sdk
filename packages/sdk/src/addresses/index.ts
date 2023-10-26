import { ADDRESS_TYPE_TO_FORMAT } from "./constants";
import {
  validate,
  getAddressInfo,
  Network as NetworkEnum,
  AddressType as AddressTypeEnum,
} from "bitcoin-address-validation";
import type { AddressFormat } from "./types";
import type { Network } from "../networks/types";

function getAddressFormatFromType(type: AddressTypeEnum): AddressFormat {
  if (type === AddressTypeEnum.p2wsh) {
    // p2wsh is not supported by browser wallets
    return "unknown";
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
      throw new Error("Invalid address");
    }
    return getAddressFormatFromType(type);
  } catch (err) {
    return "unknown";
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
    return "unknown";
  }

  const { type } = getAddressInfo(address);
  return getAddressFormatFromType(type);
}
