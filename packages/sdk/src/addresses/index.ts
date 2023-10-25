import { ADDRESS_TYPE_TO_FORMAT } from "./constants";
import {
  validate,
  getAddressInfo,
  Network as NetworkEnum,
} from "bitcoin-address-validation";
import type { AddressFormat } from "./types";
import type { Network } from "../networks/types";

function getAddressFormatForRegTest(address: string): AddressFormat {
  try {
    const { type, network: validatedNetwork, bech32 } = getAddressInfo(address);
    if (
      (!bech32 && validatedNetwork !== "testnet") ||
      (bech32 && validatedNetwork !== "regtest")
    ) {
      throw new Error("Invalid address");
    }

    if (type === "p2wsh") {
      // p2wsh is not supported by wallets
      return "unknown";
    }
    return ADDRESS_TYPE_TO_FORMAT[type];
  } catch (err) {
    return "unknown";
  }
}

export function getAddressFormat(
  address: string,
  network: Network,
): AddressFormat {
  if (network === "regtest") {
    // Separate regtest handling as the library treats non-bech32 addresses as testnet addresses.
    return getAddressFormatForRegTest(address);
  }

  if (!validate(address, network as NetworkEnum)) {
    return "unknown";
  }

  const { type } = getAddressInfo(address);
  if (type === "p2wsh") {
    // p2wsh is not supported by wallets
    return "unknown";
  }
  return ADDRESS_TYPE_TO_FORMAT[type];
}
