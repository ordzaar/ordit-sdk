import {
  ADDRESS_FORMATS,
  AddressTypes,
  ADDRESS_TYPE_TO_NAME,
  AddressFormats,
} from "./formats";
import type { Network } from "../networks/types";

export function getAddressFormat(
  address: string,
  network: Network,
): AddressFormats {
  const addressTypes = ADDRESS_FORMATS[network];
  const addressTypesList = Object.keys(addressTypes);

  for (let i = 0; i < addressTypesList.length; i += 1) {
    const addressType = addressTypesList[i] as AddressTypes;
    const addressTypeRegex = addressTypes[addressType];
    const addressName = ADDRESS_TYPE_TO_NAME[addressType];

    if (addressTypeRegex.test(address)) {
      return addressName;
    }
  }

  return "unknown";
}
