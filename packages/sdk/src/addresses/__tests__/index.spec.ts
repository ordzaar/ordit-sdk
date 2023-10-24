import { getAddressFormat } from "..";

describe("addresses", () => {
  describe("getAddressFormat", () => {
    const MAINNET = "mainnet";
    const TESTNET = "testnet";
    const REGTEST = "regtest";

    const ADDRESSES = {
      [MAINNET]: {
        legacy: "17VZNX1SN5NtKa8UQFxwQbFeFc3iqRYhem",
        "nested-segwit": "3EktnHQD7RiAE6uzMj2ZifT9YgRrkSgzQX",
        segwit: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
        taproot:
          "bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297",
      },
      [TESTNET]: {
        legacy: "mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn",
        "nested-segwit": "2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc",
        segwit: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
        taproot:
          "tb1p3gqcaq2xs0qzm5wvkht64xppcz9h5k0q2q97kf6n80gu7v037dksatsuhz",
      },
      [REGTEST]: {
        legacy: "mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn",
        "nested-segwit": "2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc",
        segwit: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
        taproot:
          "tb1p3gqcaq2xs0qzm5wvkht64xppcz9h5k0q2q97kf6n80gu7v037dksatsuhz",
      },
    };

    test("should return correct address format for mainnet", () => {
      const network = MAINNET;
      expect(getAddressFormat(ADDRESSES[network].legacy, network)).toBe(
        "legacy",
      );
      expect(
        getAddressFormat(ADDRESSES[network]["nested-segwit"], network),
      ).toBe("nested-segwit");
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
      expect(
        getAddressFormat(ADDRESSES[network]["nested-segwit"], network),
      ).toBe("nested-segwit");
      expect(getAddressFormat(ADDRESSES[network].segwit, network)).toBe(
        "segwit",
      );
      expect(getAddressFormat(ADDRESSES[network].taproot, network)).toBe(
        "taproot",
      );
    });

    test("should return correct address format for regtest", () => {
      const network = REGTEST;
      expect(getAddressFormat(ADDRESSES[network].legacy, network)).toBe(
        "legacy",
      );
      expect(
        getAddressFormat(ADDRESSES[network]["nested-segwit"], network),
      ).toBe("nested-segwit");
      expect(getAddressFormat(ADDRESSES[network].segwit, network)).toBe(
        "segwit",
      );
      expect(getAddressFormat(ADDRESSES[network].taproot, network)).toBe(
        "taproot",
      );
    });

    test("should return unknown if address format is not recognised", () => {
      expect(getAddressFormat("", MAINNET)).toBe("unknown");
      expect(getAddressFormat("abc", MAINNET)).toBe("unknown");

      expect(getAddressFormat("", TESTNET)).toBe("unknown");
      expect(getAddressFormat("abc", TESTNET)).toBe("unknown");

      expect(getAddressFormat("", REGTEST)).toBe("unknown");
      expect(getAddressFormat("abc", REGTEST)).toBe("unknown");
    });
  });
});
