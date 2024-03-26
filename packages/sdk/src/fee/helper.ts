import type { AddressFormat } from "../addresses/types";
import { OrditSDKError } from "../errors";

/**
 * Transaction header size for all script types. We overestimate the header size (previously 10 for p2sh-p2wpkh and legacy) during calculation as the final result will have almost no difference.
 */
export const TRANSACTION_HEADER_SIZE = 10.5;

const OP_RETURN_VALUE = 8; // even if op_return has value 0, it still has 8 size
const OP_RETURN_SCRIPT_PUBKEY_SIZE = 1; // compact size

/**
 * Gets the base size of a script type.
 *
 * @param type Script type (based on address format)
 * @returns Input, output and witness size of the script
 */
export function getBaseSizeByType(type: AddressFormat) {
  // Refer to BIP-0141 - https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki
  // Calculator - https://bitcoinops.org/en/tools/calc-size/
  switch (type) {
    case "taproot":
      return { input: 42, output: 43, witness: 66 }; // witness size is different for non-default sigHash

    case "segwit":
      return { input: 41, output: 31, witness: 105 };

    case "p2sh-p2wpkh":
      return { input: 64, output: 32, witness: 105 };

    case "legacy":
      return { input: 148, output: 34, witness: 0 };

    // still needs to calculate the op_return script manually based on the script length
    case "op_return":
      return {
        input: 0,
        output: OP_RETURN_VALUE + OP_RETURN_SCRIPT_PUBKEY_SIZE,
        witness: 0,
      };

    default:
      throw new OrditSDKError("Invalid type");
  }
}
