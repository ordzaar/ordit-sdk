// @vitest-environment happy-dom
import { networks, Psbt } from "bitcoinjs-lib";

import {
  BrowserWalletExtractTxFromNonFinalizedPsbtError,
  BrowserWalletRequestCancelledByUserError,
  OrditSDKError,
} from "../../../errors";
import { WalletAddress } from "../../types";
import { getAddresses, isInstalled, signMessage, signPsbt } from "..";

describe("OKX Wallet", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const MOCK_EMPTY_VALUE_RESULT = vi.fn().mockResolvedValue("");
  // okx uses eth-rpc-providers which does not throw Error object
  const OKX_REJECT_ERROR = {
    code: 4001,
    message: "User rejected the request.",
  };
  const CANCELLED_BY_USER_ERROR =
    new BrowserWalletRequestCancelledByUserError();
  const OKX_BITCOIN_PROVIDER_ERROR = new OrditSDKError(
    "Failed to get OKX Wallet provider",
  );

  describe("isInstalled", () => {
    test("should return true if installed", () => {
      vi.stubGlobal("okxwallet", { bitcoin: {} });
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
      const mockXOnlyPubKey =
        "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798";
      const network = "mainnet";

      vi.stubGlobal("okxwallet", {
        bitcoin: {
          connect: vi.fn().mockResolvedValue({
            address: mockData.address,
            publicKey: mockXOnlyPubKey,
          }),
        },
      });
      expect(getAddresses(network)).resolves.toEqual([mockData]);
    });

    test("should return address from testnet", () => {
      const mockData: WalletAddress = {
        publicKey:
          "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
        address: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
        format: "segwit",
      };
      const mockXOnlyPubKey =
        "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798";
      const network = "testnet";

      vi.stubGlobal("okxwallet", {
        bitcoinTestnet: {
          connect: vi.fn().mockResolvedValue({
            address: mockData.address,
            publicKey: mockXOnlyPubKey,
          }),
        },
      });
      expect(getAddresses(network)).resolves.toEqual([mockData]);
    });

    test("should return address from signet", () => {
      const mockData: WalletAddress = {
        publicKey:
          "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
        address: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
        format: "segwit",
      };
      const mockXOnlyPubKey =
        "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798";
      const network = "signet";

      vi.stubGlobal("okxwallet", {
        bitcoinSignet: {
          connect: vi.fn().mockResolvedValue({
            address: mockData.address,
            publicKey: mockXOnlyPubKey,
          }),
        },
      });
      expect(getAddresses(network)).resolves.toEqual([mockData]);
    });

    test("should throw error if okxwallet exists but bitcoin provider does not exist", () => {
      const network = "testnet";

      vi.stubGlobal("okxwallet", {});
      expect(getAddresses(network)).rejects.toThrowError(
        OKX_BITCOIN_PROVIDER_ERROR,
      );
    });

    test("should throw error when user rejects or cancels request", () => {
      const network = "testnet";

      vi.stubGlobal("okxwallet", {
        bitcoinTestnet: {
          connect: vi.fn().mockImplementation(() => {
            // eslint-disable-next-line @typescript-eslint/no-throw-literal
            throw OKX_REJECT_ERROR;
          }),
        },
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
      vi.stubGlobal("okxwallet", {
        bitcoin: {
          signPsbt: MOCK_SIGN_PSBT,
        },
      });
      const psbt = new Psbt({ network: networks.bitcoin });
      const signedPsbtResponse = await signPsbt(psbt);
      expect(MOCK_SIGN_PSBT).toHaveBeenCalledWith(psbt.toHex(), {
        autoFinalized: true,
        toSignInputs: [],
      });
      expect(signedPsbtResponse).toEqual({
        base64: null,
        hex: "02000000000000000000",
      });
    });

    test("should sign a psbt when extractTx is true", async () => {
      vi.stubGlobal("okxwallet", {
        bitcoin: {
          signPsbt: MOCK_SIGN_PSBT,
        },
      });
      const psbt = new Psbt({ network: networks.bitcoin });
      const signedPsbtResponse = await signPsbt(psbt, {
        extractTx: true,
        network: "mainnet",
        inputsToSign: [],
      });
      expect(signedPsbtResponse).toEqual({
        base64: null,
        hex: "02000000000000000000",
      });
    });

    test("should sign a psbt when extractTx is false", async () => {
      vi.stubGlobal("okxwallet", {
        bitcoin: {
          signPsbt: MOCK_SIGN_PSBT,
        },
      });
      const psbt = new Psbt({ network: networks.bitcoin });
      const signedPsbtResponse = await signPsbt(psbt, {
        extractTx: false,
        network: "mainnet",
        inputsToSign: [],
      });
      expect(signedPsbtResponse).toEqual({
        base64: "cHNidP8BAAoCAAAAAAAAAAAAAAAA",
        hex: "70736274ff01000a02000000000000000000000000",
      });
    });

    test("should sign a psbt when finalize is true", async () => {
      vi.stubGlobal("okxwallet", {
        bitcoin: {
          signPsbt: MOCK_SIGN_PSBT,
        },
      });
      const psbt = new Psbt({ network: networks.bitcoin });
      const signedPsbtResponse = await signPsbt(psbt, {
        finalize: true,
        network: "mainnet",
        inputsToSign: [],
      });
      expect(signedPsbtResponse).toEqual({
        base64: null,
        hex: "02000000000000000000",
      });
    });

    test("should sign a psbt when finalize is false and extractTx is false", async () => {
      vi.stubGlobal("okxwallet", {
        bitcoin: {
          signPsbt: MOCK_SIGN_PSBT,
        },
      });
      const psbt = new Psbt({ network: networks.bitcoin });
      const signedPsbtResponse = await signPsbt(psbt, {
        finalize: false,
        extractTx: false,
        network: "mainnet",
        inputsToSign: [],
      });
      expect(signedPsbtResponse).toEqual({
        base64: "cHNidP8BAAoCAAAAAAAAAAAAAAAA",
        hex: "70736274ff01000a02000000000000000000000000",
      });
    });

    test("should throw an error when extractTx is true but finalize is false", async () => {
      vi.stubGlobal("okxwallet", {
        bitcoin: {
          signPsbt: MOCK_SIGN_PSBT,
        },
      });
      const EXTRACTION_TRANSACTION_NON_FINALIZED_PSBT_ERROR =
        new BrowserWalletExtractTxFromNonFinalizedPsbtError();
      const psbt = new Psbt({ network: networks.bitcoin });
      await expect(() =>
        signPsbt(psbt, {
          finalize: false,
          network: "mainnet",
          inputsToSign: [],
        }),
      ).rejects.toThrowError(EXTRACTION_TRANSACTION_NON_FINALIZED_PSBT_ERROR);
    });

    test("should throw an error when extractTx is true but not all inputs are finalized", async () => {
      const MOCK_UNFINALIZED_PSBT = vi
        .fn()
        .mockResolvedValue(
          "70736274ff0100a00200000002ab0949a08c5af7c49b8212f417e2f15ab3f5c33dcf153821a8139f877a5b7be40000000000feffffffab0949a08c5af7c49b8212f417e2f15ab3f5c33dcf153821a8139f877a5b7be40100000000feffffff02603bea0b000000001976a914768a40bbd740cbe81d988e71de2a4d5c71396b1d88ac8e240000000000001976a9146f4620b553fa095e721b9ee0efe9fa039cca459788ac000000000001076a47304402204759661797c01b036b25928948686218347d89864b719e1f7fcf57d1e511658702205309eabf56aa4d8891ffd111fdf1336f3a29da866d7f8486d75546ceedaf93190121035cdc61fc7ba971c0b501a646a2a83b102cb43881217ca682dc86e2d73fa882920001012000e1f5050000000017a9143545e6e33b832c47050f24d3eeb93c9c03948bc787010416001485d13537f2e265405a34dbafa9e3dda01fb82308000000",
        );
      vi.stubGlobal("okxwallet", {
        bitcoin: {
          signPsbt: MOCK_UNFINALIZED_PSBT,
        },
      });
      const EXTRACTION_TRANSACTION_NON_FINALIZED_PSBT_ERROR =
        new BrowserWalletExtractTxFromNonFinalizedPsbtError();
      const psbt = new Psbt({ network: networks.bitcoin });
      await expect(() =>
        signPsbt(psbt, {
          finalize: true,
          network: "mainnet",
          inputsToSign: [],
        }),
      ).rejects.toThrowError(EXTRACTION_TRANSACTION_NON_FINALIZED_PSBT_ERROR);
    });

    test("should fail to sign a psbt when OKX Wallet returns an empty psbt hex string", async () => {
      const SIGN_PSBT_ERROR = new OrditSDKError(
        "Failed to sign psbt hex using OKX Wallet",
      );
      vi.stubGlobal("okxwallet", {
        bitcoin: {
          signPsbt: MOCK_EMPTY_VALUE_RESULT,
        },
      });
      const psbt = new Psbt({ network: networks.bitcoin });
      await expect(() => signPsbt(psbt)).rejects.toThrowError(SIGN_PSBT_ERROR);
    });

    test("should throw error if okxwallet exists but bitcoin provider does not exist", async () => {
      vi.stubGlobal("okxwallet", {});
      const psbt = new Psbt({ network: networks.bitcoin });
      await expect(() => signPsbt(psbt)).rejects.toThrowError(
        OKX_BITCOIN_PROVIDER_ERROR,
      );
    });

    test("should throw an error when user rejects or cancels request", async () => {
      vi.stubGlobal("okxwallet", {
        bitcoin: {
          signPsbt: vi.fn().mockImplementation(() => {
            // eslint-disable-next-line @typescript-eslint/no-throw-literal
            throw OKX_REJECT_ERROR;
          }),
        },
      });
      const psbt = new Psbt({ network: networks.bitcoin });
      await expect(() => signPsbt(psbt)).rejects.toThrowError(
        CANCELLED_BY_USER_ERROR,
      );
    });
  });

  describe("signMessage", () => {
    test("should sign a message", async () => {
      vi.stubGlobal("okxwallet", {
        bitcoin: {
          signMessage: vi
            .fn()
            .mockResolvedValue(
              "G+LrYa7T5dUMDgQduAErw+i6ebK4GqTXYVWIDM+snYk7Yc6LdPitmaqM6j+iJOeID1CsMXOJFpVopvPiHBdulkE=",
            ),
        },
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
        "Failed to sign message using OKX Wallet",
      );
      vi.stubGlobal("okxwallet", {
        bitcoin: {
          signMessage: MOCK_EMPTY_VALUE_RESULT,
        },
      });
      await expect(() =>
        signMessage("abcdefghijk123456789"),
      ).rejects.toThrowError(SIGN_MESSAGE_ERROR);
    });

    test("should throw error if okxwallet exists but bitcoin provider does not exist", async () => {
      vi.stubGlobal("okxwallet", {});
      await expect(() =>
        signMessage("abcdefghijk123456789"),
      ).rejects.toThrowError(OKX_BITCOIN_PROVIDER_ERROR);
    });

    test("should throw an error when user rejects or cancels request", async () => {
      vi.stubGlobal("okxwallet", {
        bitcoin: {
          signMessage: vi.fn().mockImplementation(() => {
            // eslint-disable-next-line @typescript-eslint/no-throw-literal
            throw OKX_REJECT_ERROR;
          }),
        },
      });
      await expect(() =>
        signMessage("abcdefghijk123456789"),
      ).rejects.toThrowError(CANCELLED_BY_USER_ERROR);
    });
  });
});
