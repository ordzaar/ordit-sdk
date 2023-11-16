// @vitest-environment happy-dom
import { networks, Psbt } from "bitcoinjs-lib";

import {
  BrowserWalletExtractTxFromNonFinalizedPsbtError,
  BrowserWalletRequestCancelledByUserError,
  OrditSDKError,
} from "../../../errors";
import { WalletAddress } from "../../types";
import { getAddresses, isInstalled, signMessage, signPsbt } from "..";
import { NETWORK_TO_UNISAT_NETWORK } from "../constants";

describe("Unisat Wallet", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const MOCK_EMPTY_VALUE_RESULT = vi.fn().mockResolvedValue("");
  // unisat uses eth-rpc-providers which does not throw Error object
  const UNISAT_REJECT_ERROR = {
    code: 4001,
    message: "User rejected the request.",
  };
  const CANCELLED_BY_USER_ERROR =
    new BrowserWalletRequestCancelledByUserError();

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

    test("should throw error when user rejects or cancels request", () => {
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
        requestAccounts: vi.fn().mockImplementation(() => {
          // eslint-disable-next-line @typescript-eslint/no-throw-literal
          throw UNISAT_REJECT_ERROR;
        }),
        getPublicKey: vi.fn().mockResolvedValue(mockData.publicKey),
      });

      expect(getAddresses(network)).rejects.toThrowError(
        CANCELLED_BY_USER_ERROR,
      );
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
      const signedPsbtResponse = await signPsbt(psbt, { extractTx: true });
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
    test("should sign a psbt when finalize is false and extractTx is false", async () => {
      vi.stubGlobal("unisat", {
        signPsbt: MOCK_SIGN_PSBT,
      });
      const EXTRACTION_TRANSACTION_NON_FINALIZED_PSBT_ERROR =
        new BrowserWalletExtractTxFromNonFinalizedPsbtError();
      const psbt = new Psbt({ network: networks.bitcoin });
      const signedPsbtResponse = await signPsbt(psbt, {
        finalize: false,
        extractTx: false,
      });
      expect(signedPsbtResponse).toEqual({
        base64: "cHNidP8BAAoCAAAAAAAAAAAAAAAA",
        hex: "70736274ff01000a02000000000000000000000000",
      });
    });
    test("should throw an error when extractTx is true but finalize is false", async () => {
      vi.stubGlobal("unisat", {
        signPsbt: MOCK_SIGN_PSBT,
      });
      const EXTRACTION_TRANSACTION_NON_FINALIZED_PSBT_ERROR =
        new BrowserWalletExtractTxFromNonFinalizedPsbtError();
      const psbt = new Psbt({ network: networks.bitcoin });
      await expect(() =>
        signPsbt(psbt, { finalize: false }),
      ).rejects.toThrowError(EXTRACTION_TRANSACTION_NON_FINALIZED_PSBT_ERROR);
    });
    test("should throw an error when extractTx is true but not all inputs are finalized", async () => {
      const MOCK_UNFINALIZED_PSBT = vi
        .fn()
        .mockResolvedValue(
          "70736274ff0100a00200000002ab0949a08c5af7c49b8212f417e2f15ab3f5c33dcf153821a8139f877a5b7be40000000000feffffffab0949a08c5af7c49b8212f417e2f15ab3f5c33dcf153821a8139f877a5b7be40100000000feffffff02603bea0b000000001976a914768a40bbd740cbe81d988e71de2a4d5c71396b1d88ac8e240000000000001976a9146f4620b553fa095e721b9ee0efe9fa039cca459788ac000000000001076a47304402204759661797c01b036b25928948686218347d89864b719e1f7fcf57d1e511658702205309eabf56aa4d8891ffd111fdf1336f3a29da866d7f8486d75546ceedaf93190121035cdc61fc7ba971c0b501a646a2a83b102cb43881217ca682dc86e2d73fa882920001012000e1f5050000000017a9143545e6e33b832c47050f24d3eeb93c9c03948bc787010416001485d13537f2e265405a34dbafa9e3dda01fb82308000000",
        );
      vi.stubGlobal("unisat", {
        signPsbt: MOCK_UNFINALIZED_PSBT,
      });
      const EXTRACTION_TRANSACTION_NON_FINALIZED_PSBT_ERROR =
        new BrowserWalletExtractTxFromNonFinalizedPsbtError();
      const psbt = new Psbt({ network: networks.bitcoin });
      await expect(() =>
        signPsbt(psbt, { finalize: true }),
      ).rejects.toThrowError(EXTRACTION_TRANSACTION_NON_FINALIZED_PSBT_ERROR);
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
    test("should throw an error when user rejects or cancels request", async () => {
      vi.stubGlobal("unisat", {
        signPsbt: vi.fn().mockImplementation(() => {
          // eslint-disable-next-line @typescript-eslint/no-throw-literal
          throw UNISAT_REJECT_ERROR;
        }),
      });
      const psbt = new Psbt({ network: networks.bitcoin });
      await expect(() => signPsbt(psbt)).rejects.toThrowError(
        CANCELLED_BY_USER_ERROR,
      );
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
    test("should throw an error when user rejects or cancels request", async () => {
      vi.stubGlobal("unisat", {
        signMessage: vi.fn().mockImplementation(() => {
          // eslint-disable-next-line @typescript-eslint/no-throw-literal
          throw UNISAT_REJECT_ERROR;
        }),
      });
      await expect(() =>
        signMessage("abcdefghijk123456789"),
      ).rejects.toThrowError(CANCELLED_BY_USER_ERROR);
    });
  });
});
