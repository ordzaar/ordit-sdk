import { Network } from "../../config/types";
import { OrditSDKError } from "../../errors";
import { getAddressesFromPublicKey, getAddressFormat } from "..";
import { AddressFormat } from "../types";

describe("addresses", () => {
  describe("getAddressFormat", () => {
    const MAINNET = "mainnet";
    const TESTNET = "testnet";
    const REGTEST = "regtest";
    const SIGNET = "signet";

    const INVALID_ADDRESS_ERROR = new OrditSDKError("Invalid address");

    const ADDRESSES: Record<Network, Record<AddressFormat, string>> = {
      [MAINNET]: {
        legacy: "17VZNX1SN5NtKa8UQFxwQbFeFc3iqRYhem",
        "p2sh-p2wpkh": "3EktnHQD7RiAE6uzMj2ZifT9YgRrkSgzQX",
        segwit: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
        taproot:
          "bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297",
        p2wsh: "bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3",
      },
      [TESTNET]: {
        legacy: "mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn",
        "p2sh-p2wpkh": "2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc",
        segwit: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
        taproot:
          "tb1p3gqcaq2xs0qzm5wvkht64xppcz9h5k0q2q97kf6n80gu7v037dksatsuhz",
        p2wsh: "tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7",
      },
      [SIGNET]: {
        legacy: "mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn",
        "p2sh-p2wpkh": "2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc",
        segwit: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
        taproot:
          "tb1p3gqcaq2xs0qzm5wvkht64xppcz9h5k0q2q97kf6n80gu7v037dksatsuhz",
        p2wsh: "tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7",
      },
      [REGTEST]: {
        legacy: "mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn",
        "p2sh-p2wpkh": "2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc",
        segwit: "bcrt1q3v3tujtu443ukyhvzsqmnjgxfv4yevvhcqyqak",
        taproot:
          "bcrt1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqc8gma6",
        p2wsh:
          "bcrt1qpj7ehqa8q585n3srsl7a5njfjemd2nagdak5qflswkxd9c7fakxqgg545v",
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
      expect(getAddressFormat(ADDRESSES[network].p2wsh, network)).toBe("p2wsh");
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
      expect(getAddressFormat(ADDRESSES[network].p2wsh, network)).toBe("p2wsh");

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
      expect(getAddressFormat(ADDRESSES[network].p2wsh, network)).toBe("p2wsh");

      // non-bech32 addresses from testnet will work on regtest
      expect(() =>
        getAddressFormat(ADDRESSES[TESTNET].legacy, network),
      ).not.toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[TESTNET]["p2sh-p2wpkh"], network),
      ).not.toThrowError(INVALID_ADDRESS_ERROR);
    });

    test("should return correct address format for signet", () => {
      const network = SIGNET;
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
      expect(getAddressFormat(ADDRESSES[network].p2wsh, network)).toBe("p2wsh");

      // non-bech32 addresses from regtest will work on testnet/signet
      expect(() =>
        getAddressFormat(ADDRESSES[REGTEST].legacy, network),
      ).not.toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[REGTEST]["p2sh-p2wpkh"], network),
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
        getAddressFormat(ADDRESSES[TESTNET].p2wsh, MAINNET),
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
      expect(() =>
        getAddressFormat(ADDRESSES[REGTEST].p2wsh, MAINNET),
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
        getAddressFormat(ADDRESSES[MAINNET].p2wsh, TESTNET),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[REGTEST].segwit, TESTNET),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[REGTEST].taproot, TESTNET),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[REGTEST].p2wsh, TESTNET),
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
        getAddressFormat(ADDRESSES[MAINNET].p2wsh, REGTEST),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[TESTNET].segwit, REGTEST),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[TESTNET].taproot, REGTEST),
      ).toThrowError(INVALID_ADDRESS_ERROR);
      expect(() =>
        getAddressFormat(ADDRESSES[TESTNET].p2wsh, REGTEST),
      ).toThrowError(INVALID_ADDRESS_ERROR);
    });
  });

  describe("getAddressesFromPublicKey", () => {
    const PUBLIC_KEY =
      "039ce27aa7666731648421004ba943b90b8273e23a175d9c58e3ec2e643a9b01d1";
    const NETWORK = "testnet";
    const LEGACY_ADDRESSES = [
      {
        address: "n2w7jdyt3Dydowf9TxncCE8cF9Unki1Us2",
        format: "legacy",
        publicKey:
          "039ce27aa7666731648421004ba943b90b8273e23a175d9c58e3ec2e643a9b01d1",
      },
    ];
    const P2SH_ADDRESSES = [
      {
        address: "2NDMzJQiCD1o38NubeJbVNx49iT6Pr33Nfw",
        format: "p2sh-p2wpkh",
        publicKey:
          "039ce27aa7666731648421004ba943b90b8273e23a175d9c58e3ec2e643a9b01d1",
      },
    ];
    const SEGWIT_ADDRESSES = [
      {
        address: "tb1qatkgzm0hsk83ysqja5nq8ecdmtwl73zwurawww",
        format: "segwit",
        publicKey:
          "039ce27aa7666731648421004ba943b90b8273e23a175d9c58e3ec2e643a9b01d1",
      },
    ];
    const TAPROOT_ADDRESSES = [
      {
        address:
          "tb1p98dv6f5jp5qr4z2dtaljvwrhq34xrr8zuaqgv4ajf36vg2mmsruqt5m3lv",
        format: "taproot",
        publicKey:
          "039ce27aa7666731648421004ba943b90b8273e23a175d9c58e3ec2e643a9b01d1",
        xKey: "9ce27aa7666731648421004ba943b90b8273e23a175d9c58e3ec2e643a9b01d1",
      },
    ];
    const ALL_ADDRESSES = [
      ...LEGACY_ADDRESSES,
      ...P2SH_ADDRESSES,
      ...SEGWIT_ADDRESSES,
      ...TAPROOT_ADDRESSES,
    ];

    test("should return addresses from string public key", () => {
      expect(
        getAddressesFromPublicKey(PUBLIC_KEY, NETWORK, "all"),
      ).toStrictEqual(ALL_ADDRESSES);
    });
    test("should return addresses from buffer public key", () => {
      expect(
        getAddressesFromPublicKey(
          Buffer.from(PUBLIC_KEY, "hex"),
          NETWORK,
          "all",
        ),
      ).toStrictEqual(ALL_ADDRESSES);
    });
    test("should return address from public key when type is p2pkh", () => {
      expect(
        getAddressesFromPublicKey(
          Buffer.from(PUBLIC_KEY, "hex"),
          NETWORK,
          "p2pkh",
        ),
      ).toContainEqual(LEGACY_ADDRESSES[0]);
    });
    test("should return address from public key when type is p2sh", () => {
      expect(
        getAddressesFromPublicKey(
          Buffer.from(PUBLIC_KEY, "hex"),
          NETWORK,
          "p2sh",
        ),
      ).toContainEqual(P2SH_ADDRESSES[0]);
    });
    test("should return address from public key when type is segwit", () => {
      expect(
        getAddressesFromPublicKey(
          Buffer.from(PUBLIC_KEY, "hex"),
          NETWORK,
          "p2wpkh",
        ),
      ).toContainEqual(SEGWIT_ADDRESSES[0]);
    });
    test("should return xKey from public key when type is p2tr", () => {
      expect(
        getAddressesFromPublicKey(
          Buffer.from(PUBLIC_KEY, "hex"),
          NETWORK,
          "p2tr",
        ),
      ).toContainEqual(TAPROOT_ADDRESSES[0]);
    });
    test("should not return xKey from public key when type is not p2tr", () => {
      const result = getAddressesFromPublicKey(
        Buffer.from(PUBLIC_KEY, "hex"),
        NETWORK,
        "p2pkh",
      );
      expect(result).toContainEqual(LEGACY_ADDRESSES[0]);
      expect(result[0].xKey).toBeUndefined();
    });
  });
});
