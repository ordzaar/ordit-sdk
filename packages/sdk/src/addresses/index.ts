import {
  ADDRESS_TYPE_TO_FORMAT,
  NETWORK_TO_ADDRESS_TYPE_TO_REGEX,
} from "./constants";
import type { AddressFormat, AddressType } from "./types";
import type { Network } from "../networks/types";

export function getAddressFormat(
  address: string,
  network: Network,
): AddressFormat {
  const addressTypeToRegex = NETWORK_TO_ADDRESS_TYPE_TO_REGEX[network];
  const addressTypes = Object.keys(addressTypeToRegex) as AddressType[];

  // findLast because taproot addresses are being marked as segwit.
  const targetAddressType = addressTypes.findLast((addressType) =>
    addressTypeToRegex[addressType].test(address),
  );

  return targetAddressType
    ? ADDRESS_TYPE_TO_FORMAT[targetAddressType]
    : "unknown";
}
