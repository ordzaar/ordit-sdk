// @vitest-environment happy-dom
import type { GetAddressOptions, GetAddressResponse } from "sats-connect";
import * as satsConnect from "sats-connect";

import { WalletAddress } from "../../types";
import { getAddresses, isInstalled } from "..";

vi.mock("sats-connect", async (originalImport) => {
  const mod = (await originalImport()) as typeof satsConnect;
  return {
    __esModule: true,
    ...mod,
  };
});

describe("Xverse Wallet", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("isInstalled", () => {
    test("should return true if installed", () => {
      vi.stubGlobal("BitcoinProvider", {});
      expect(typeof window).not.toBeUndefined();
      expect(isInstalled()).toBeTruthy();
    });

    test("should return false if not installed", () => {
      expect(typeof window).not.toBeUndefined();
      expect(isInstalled()).toBeFalsy();
    });
  });

  describe("getAddresses", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.resetAllMocks();
    });

    test("should return address from mainnet", () => {
      const mockData: WalletAddress[] = [
        {
          // https://bitcoin.design/guide/glossary/address/
          address:
            "bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297",
          publicKey:
            "03b9907521ddb85e0e6a37622b7c685efbdc8ae53a334928adbd12cf204ad4e717",
          format: "taproot",
        },
        {
          // https://bitcoin.design/guide/glossary/address/
          address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
          publicKey:
            "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
          format: "segwit",
        },
      ];
      const mockResponse: GetAddressResponse = {
        addresses: [
          {
            address:
              "bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297",
            publicKey:
              "b9907521ddb85e0e6a37622b7c685efbdc8ae53a334928adbd12cf204ad4e717",
            purpose: satsConnect.AddressPurpose.Ordinals,
          },
          {
            address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
            publicKey:
              "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
            purpose: satsConnect.AddressPurpose.Payment,
          },
        ],
      };

      vi.stubGlobal("BitcoinProvider", {});

      const getAddressSpy = vi.spyOn(satsConnect, "getAddress");

      getAddressSpy.mockImplementation((options: GetAddressOptions) => {
        options.onFinish(mockResponse);
        return Promise.resolve();
      });
      expect(typeof window).not.toBeUndefined();
      expect(getAddresses("mainnet")).resolves.toEqual(mockData);
    });

    test("should return address from testnet", () => {
      const mockData: WalletAddress[] = [
        {
          // Random address from testnet faucet
          address:
            "tb1pd692twjx8xwq5v7c0u2ltuwx60ef6r5hmrjfef3j5zkekdpq0dpq7cc0wy",
          publicKey:
            "03b9907521ddb85e0e6a37622b7c685efbdc8ae53a334928adbd12cf204ad4e717",
          format: "taproot",
        },
        {
          // https://allprivatekeys.com/bitcoin-address-format
          address: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
          publicKey:
            "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
          format: "segwit",
        },
      ];
      const mockResponse: GetAddressResponse = {
        addresses: [
          {
            address:
              "tb1pd692twjx8xwq5v7c0u2ltuwx60ef6r5hmrjfef3j5zkekdpq0dpq7cc0wy",
            publicKey:
              "b9907521ddb85e0e6a37622b7c685efbdc8ae53a334928adbd12cf204ad4e717",
            purpose: satsConnect.AddressPurpose.Ordinals,
          },
          {
            address: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
            publicKey:
              "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
            purpose: satsConnect.AddressPurpose.Payment,
          },
        ],
      };

      vi.stubGlobal("BitcoinProvider", {});

      const getAddressSpy = vi.spyOn(satsConnect, "getAddress");

      getAddressSpy.mockImplementation((options: GetAddressOptions) => {
        options.onFinish(mockResponse);
        return Promise.resolve();
      });
      expect(typeof window).not.toBeUndefined();
      expect(getAddresses("testnet")).resolves.toEqual(mockData);
    });

    test("should throw error on user cancel", () => {
      vi.stubGlobal("BitcoinProvider", {});

      const getAddressSpy = vi.spyOn(satsConnect, "getAddress");

      getAddressSpy.mockImplementation((options: GetAddressOptions) => {
        options.onCancel();
        return Promise.resolve();
      });
      expect(typeof window).not.toBeUndefined();
      expect(getAddresses("mainnet")).rejects.toThrowError();
      expect(getAddresses("testnet")).rejects.toThrowError();
    });
  });
});
