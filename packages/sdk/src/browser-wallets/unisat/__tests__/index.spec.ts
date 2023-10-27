// @vitest-environment happy-dom
import { Psbt, networks } from "bitcoinjs-lib";
import { getAddresses, isInstalled, signMessage, signPsbt } from "..";
import { NETWORK_TO_UNISAT_NETWORK } from "../constants";
import { OrditSDKError } from "../../../errors";
import { WalletAddress } from "../../types";

describe("Unisat Wallet", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const MOCK_EMPTY_VALUE_RESULT = vi.fn().mockResolvedValue("");

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
        getNetwork: vi
          .fn()
          .mockResolvedValue(NETWORK_TO_UNISAT_NETWORK[network]),
        requestAccounts: vi.fn().mockResolvedValue([mockData.address]),
        getPublicKey: vi.fn().mockResolvedValue(mockData.publicKey),
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
        getNetwork: vi
          .fn()
          .mockResolvedValue(NETWORK_TO_UNISAT_NETWORK[network]),
        requestAccounts: vi.fn().mockResolvedValue([mockData.address]),
        getPublicKey: vi.fn().mockResolvedValue(mockData.publicKey),
      });
      expect(getAddresses("testnet")).resolves.toEqual([mockData]);
    });
  });

  describe("signPsbt", () => {
    const MOCK_SIGN_PSBT = vi
      .fn()
      .mockResolvedValue("70736274ff01000a01000000000000000000000000");

    afterEach(() => {
      vi.clearAllMocks();
    });

    test("should sign a psbt with finalize and extractTx set to true when options is not defined", async () => {
      vi.stubGlobal("unisat", {
        signPsbt: MOCK_SIGN_PSBT,
      });
      const psbt = new Psbt({ network: networks.bitcoin });
      const signedPsbtResponse = await signPsbt(psbt);
      expect(MOCK_SIGN_PSBT).toHaveBeenCalledWith(psbt.toHex(), {
        autoFinalized: true,
      });
      expect(signedPsbtResponse).toEqual({
        base64: null,
        hex: "02000000000000000000",
      });
    });
    test("should sign a psbt when extractTx is true", async () => {
      vi.stubGlobal("unisat", {
        signPsbt: MOCK_SIGN_PSBT,
      });
      const psbt = new Psbt({ network: networks.bitcoin });
      const signedPsbtResponse = await signPsbt(psbt);
      expect(signedPsbtResponse).toEqual({
        base64: null,
        hex: "02000000000000000000",
      });
    });
    test("should sign a psbt when extractTx is false", async () => {
      vi.stubGlobal("unisat", {
        signPsbt: MOCK_SIGN_PSBT,
      });
      const psbt = new Psbt({ network: networks.bitcoin });
      const signedPsbtResponse = await signPsbt(psbt, { extractTx: false });
      expect(signedPsbtResponse).toEqual({
        base64: "cHNidP8BAAoCAAAAAAAAAAAAAAAA",
        hex: "70736274ff01000a02000000000000000000000000",
      });
    });
    test("should sign a psbt when finalize is true", async () => {
      vi.stubGlobal("unisat", {
        signPsbt: MOCK_SIGN_PSBT,
      });
      const psbt = new Psbt({ network: networks.bitcoin });
      const signedPsbtResponse = await signPsbt(psbt, { finalize: true });
      expect(signedPsbtResponse).toEqual({
        base64: null,
        hex: "02000000000000000000",
      });
    });
    test("should sign a psbt when finalize is false", async () => {
      vi.stubGlobal("unisat", {
        signPsbt: MOCK_SIGN_PSBT,
      });
      const psbt = new Psbt({ network: networks.bitcoin });
      const signedPsbtResponse = await signPsbt(psbt, { finalize: false });
      expect(signedPsbtResponse).toEqual({
        base64: null,
        hex: "02000000000000000000",
      });
    });
    test("should fail to sign a psbt when unisat returns an empty psbt hex string", async () => {
      const SIGN_PSBT_ERROR = new OrditSDKError(
        "Failed to sign psbt hex using Unisat",
      );
      vi.stubGlobal("unisat", {
        signPsbt: MOCK_EMPTY_VALUE_RESULT,
      });
      const psbt = new Psbt({ network: networks.bitcoin });
      await expect(() => signPsbt(psbt)).rejects.toThrowError(SIGN_PSBT_ERROR);
    });
  });

  describe("signMessage", () => {
    test("should sign a message", async () => {
      vi.stubGlobal("unisat", {
        signMessage: vi
          .fn()
          .mockResolvedValue(
            "G+LrYa7T5dUMDgQduAErw+i6ebK4GqTXYVWIDM+snYk7Yc6LdPitmaqM6j+iJOeID1CsMXOJFpVopvPiHBdulkE=",
          ),
      });
      const signedMessageResponse = await signMessage("abcdefghijk123456789");
      expect(signedMessageResponse).toEqual({
        base64:
          "G+LrYa7T5dUMDgQduAErw+i6ebK4GqTXYVWIDM+snYk7Yc6LdPitmaqM6j+iJOeID1CsMXOJFpVopvPiHBdulkE=",
        hex: "1be2eb61aed3e5d50c0e041db8012bc3e8ba79b2b81aa4d76155880ccfac9d893b61ce8b74f8ad99aa8cea3fa224e7880f50ac317389169568a6f3e21c176e9641",
      });
    });
    test("should fail to sign a message when unisat returns an empty signature", async () => {
      const SIGN_MESSAGE_ERROR = new OrditSDKError(
        "Failed to sign message using Unisat",
      );
      vi.stubGlobal("unisat", {
        signMessage: MOCK_EMPTY_VALUE_RESULT,
      });
      await expect(() =>
        signMessage("abcdefghijk123456789"),
      ).rejects.toThrowError(SIGN_MESSAGE_ERROR);
    });
  });
});
