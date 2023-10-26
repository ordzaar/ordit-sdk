import { getAddressFormat } from "..";
import { Network } from "../../config/types";
import { OrditSDKError } from "../../errors";
import { AddressFormat } from "../types";

describe("addresses", () => {
  describe("getAddressFormat", () => {
    const MAINNET = "mainnet";
    const TESTNET = "testnet";
    const REGTEST = "regtest";

    const INVALID_ADDRESS_ERROR = new OrditSDKError("Invalid address");

    const ADDRESSES: Record<Network, Record<AddressFormat, string>> = {
      [MAINNET]: {
        legacy: "17VZNX1SN5NtKa8UQFxwQbFeFc3iqRYhem",
        "p2sh-p2wpkh": "3EktnHQD7RiAE6uzMj2ZifT9YgRrkSgzQX",
        segwit: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
        taproot:
          "bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297",
      },
      [TESTNET]: {
        legacy: "mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn",
        "p2sh-p2wpkh": "2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc",
        segwit: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
        taproot:
          "tb1p3gqcaq2xs0qzm5wvkht64xppcz9h5k0q2q97kf6n80gu7v037dksatsuhz",
      },
      [REGTEST]: {
        legacy: "mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn",
        "p2sh-p2wpkh": "2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc",
        segwit: "bcrt1q3v3tujtu443ukyhvzsqmnjgxfv4yevvhcqyqak",
        taproot:
          "bcrt1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqc8gma6",
      },
    };

    test("should return correct address format for mainnet", () => {
      const network = MAINNET;
      expect(getAddressFormat(ADDRESSES[network].legacy, network)).toBe(
        "legacy",
      );
      expect(getAddressFormat(ADDRESSES[network]["p2sh-p2wpkh"], network)).toBe(
        "p2sh-p2wpkh",
      );
      expect(getAddressFormat(ADDRESSES[network].segwit, network)).toBe(
        "segwit",
      );
      expect(getAddressFormat(ADDRESSES[network].taproot, network)).toBe(
        "taproot",
      );
    });

    test("should return correct address format for testnet", () => {
      const network = TESTNET;
      expect(getAddressFormat(ADDRESSES[network].legacy, network)).toBe(
        "legacy",
      );
      expect(getAddressFormat(ADDRESSES[network]["p2sh-p2wpkh"], network)).toBe(
        "p2sh-p2wpkh",
      );
      expect(getAddressFormat(ADDRESSES[network].segwit, network)).toBe(
        "segwit",
      );
      expect(getAddressFormat(ADDRESSES[network].taproot, network)).toBe(
        "taproot",
      );

      // non-bech32 addresses from regtest will work on testnet
      expect(() =>
        getAddressFormat(ADDRESSES[REGTEST].legacy, network),
      ).not.toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[REGTEST]["p2sh-p2wpkh"], network),
      ).not.toThrowError(INVALID_ADDRESS_ERROR);
    });

    test("should return correct address format for regtest", () => {
      const network = REGTEST;
      expect(getAddressFormat(ADDRESSES[network].legacy, network)).toBe(
        "legacy",
      );
      expect(getAddressFormat(ADDRESSES[network]["p2sh-p2wpkh"], network)).toBe(
        "p2sh-p2wpkh",
      );
      expect(getAddressFormat(ADDRESSES[network].segwit, network)).toBe(
        "segwit",
      );
      expect(getAddressFormat(ADDRESSES[network].taproot, network)).toBe(
        "taproot",
      );

      // non-bech32 addresses from testnet will work on regtest
      expect(() =>
        getAddressFormat(ADDRESSES[TESTNET].legacy, network),
      ).not.toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[TESTNET]["p2sh-p2wpkh"], network),
      ).not.toThrowError(INVALID_ADDRESS_ERROR);
    });

    test("should throw an error if address format is not recognised for mainnet", () => {
      expect(() => getAddressFormat("", MAINNET)).toThrowError(
        INVALID_ADDRESS_ERROR,
      );
      expect(() => getAddressFormat("abc", MAINNET)).toThrowError(
        INVALID_ADDRESS_ERROR,
      );
      expect(() =>
        getAddressFormat(ADDRESSES[TESTNET].legacy, MAINNET),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[TESTNET]["p2sh-p2wpkh"], MAINNET),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[TESTNET].segwit, MAINNET),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[TESTNET].taproot, MAINNET),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[REGTEST].legacy, MAINNET),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[REGTEST]["p2sh-p2wpkh"], MAINNET),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[REGTEST].segwit, MAINNET),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[REGTEST].taproot, MAINNET),
      ).toThrowError(INVALID_ADDRESS_ERROR);
    });

    test("should throw an error if address format is not recognised for testnet", () => {
      expect(() => getAddressFormat("", TESTNET)).toThrowError(
        INVALID_ADDRESS_ERROR,
      );
      expect(() => getAddressFormat("abc", TESTNET)).toThrowError(
        INVALID_ADDRESS_ERROR,
      );
      expect(() =>
        getAddressFormat(ADDRESSES[MAINNET].legacy, TESTNET),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[MAINNET]["p2sh-p2wpkh"], TESTNET),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[MAINNET].segwit, TESTNET),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[MAINNET].taproot, TESTNET),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[REGTEST].segwit, TESTNET),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[REGTEST].taproot, TESTNET),
      ).toThrowError(INVALID_ADDRESS_ERROR);
    });

    test("should throw an error if address format is not recognised for regtest", () => {
      expect(() => getAddressFormat("", REGTEST)).toThrowError(
        INVALID_ADDRESS_ERROR,
      );
      expect(() => getAddressFormat("abc", REGTEST)).toThrowError(
        INVALID_ADDRESS_ERROR,
      );
      expect(() =>
        getAddressFormat(ADDRESSES[MAINNET].legacy, REGTEST),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[MAINNET]["p2sh-p2wpkh"], REGTEST),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[MAINNET].segwit, REGTEST),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[MAINNET].taproot, REGTEST),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[TESTNET].segwit, REGTEST),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[TESTNET].taproot, REGTEST),
      ).toThrowError(INVALID_ADDRESS_ERROR);
    });
  });
});
