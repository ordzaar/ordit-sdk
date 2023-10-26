// @vitest-environment happy-dom
import { getAddresses, isInstalled } from "..";
import { WalletAddress } from "../../types";
import { NETWORK_TO_UNISAT_NETWORK } from "../constants";

describe("Unisat Wallet", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("isInstalled", () => {
    test("should return true if installed", () => {
      vi.stubGlobal("unisat", {});
      expect(typeof window).not.toBeUndefined();
      expect(isInstalled()).toBeTruthy();
    });

    test("should return false if not installed", () => {
      expect(typeof window).not.toBeUndefined();
      expect(isInstalled()).toBeFalsy();
    });
  });

  describe("getAddresses", () => {
    test("should return address from mainnet", () => {
      const mockData: WalletAddress = {
        publicKey:
          "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
        address: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
        format: "segwit",
      };
      const network = "mainnet";

      vi.stubGlobal("unisat", {
        getNetwork: vi.fn(() => NETWORK_TO_UNISAT_NETWORK[network]),
        requestAccounts: vi.fn(() => [mockData.address]),
        getPublicKey: vi.fn(() => mockData.publicKey),
      });
      expect(getAddresses("mainnet")).resolves.toEqual([mockData]);
    });

    test("should return address from testnet", () => {
      const mockData: WalletAddress = {
        publicKey:
          "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
        address: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
        format: "segwit",
      };
      const network = "testnet";

      vi.stubGlobal("unisat", {
        getNetwork: vi.fn(() => NETWORK_TO_UNISAT_NETWORK[network]),
        requestAccounts: vi.fn(() => [mockData.address]),
        getPublicKey: vi.fn(() => mockData.publicKey),
      });
      expect(getAddresses("testnet")).resolves.toEqual([mockData]);
    });
  });
});
