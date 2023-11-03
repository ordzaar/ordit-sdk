import type { AddressFormat } from "../addresses/types";
import { OrditSDKError } from "../errors";

export function getBaseSizeByType(type: AddressFormat) {
  // Refer to BIP-0141 - https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki
  // Calculator - https://bitcoinops.org/en/tools/calc-size/
  switch (type) {
    case "taproot":
      return { input: 42, output: 43, txHeader: 10.5, witness: 66 }; // witness size is different for non-default sigHash

    case "segwit":
      return { input: 41, output: 31, txHeader: 10.5, witness: 105 };

    case "p2sh-p2wpkh":
      return { input: 64, output: 32, txHeader: 10, witness: 105 };

    case "legacy":
      return { input: 148, output: 34, txHeader: 10, witness: 0 };

    default:
      throw new OrditSDKError("Invalid type");
  }
}
