// @vitest-environment happy-dom
import { networks, Psbt } from "bitcoinjs-lib";

import {
  BrowserWalletExtractTxFromNonFinalizedPsbtError,
  BrowserWalletNetworkMismatchError,
  OrditSDKError,
} from "../../..";
import { getAddresses, isInstalled, signMessage, signPsbt } from "..";

describe("Oyl Wallet", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const NO_TAPROOT_ERROR = new OrditSDKError("No taproot address found");

  const OYL_BITCOIN_PROVIDER_ERROR = new BrowserWalletNetworkMismatchError(
    "Oyl Wallet only supports mainnet",
  );
  const MOCK_EMPTY_VALUE_RESULT = vi.fn().mockResolvedValue("");

  describe("isInstalled", () => {
    test("should return true if installed", () => {
      vi.stubGlobal("oyl", {});
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
      const mockData = {
        segwit: {
          publicKey:
            "03db55561c8d7494a3c34cd9bd38f5093d3c8fa483fa3b2f29546df578b3552505",
          address: "bc1qmv97nyamrj4e842ah28nw3p5xtv5ylc0rxtpx2",
          format: "segwit",
        },
        taproot: {
          publicKey:
            "03fbbf631024ac7a64772c0050141c0a77e004dc1c42fe42fd74bb085bf54e3ae9",
          address:
            "bc1psgyrv2ug85f9kez3755vn6ysks4c48nlddaahad82dlnlkhskwgq2ky09v",
          format: "taproot",
        },
      };
      const network = "mainnet";

      vi.stubGlobal("oyl", {
        getAddresses: vi.fn().mockResolvedValue(mockData),
      });
      expect(getAddresses(network)).resolves.toEqual([
        mockData.segwit,
        mockData.taproot,
      ]);
    });

    test("should throw error if no taproot address", () => {
      const mockData = {
        segwit: {
          publicKey:
            "03db55561c8d7494a3c34cd9bd38f5093d3c8fa483fa3b2f29546df578b3552505",
          address: "bc1qmv97nyamrj4e842ah28nw3p5xtv5ylc0rxtpx2",
          format: "segwit",
        },
      };
      const network = "mainnet";

      vi.stubGlobal("oyl", {
        getAddresses: vi.fn().mockResolvedValue(mockData),
      });
      expect(getAddresses(network)).rejects.toThrowError(NO_TAPROOT_ERROR);
    });

    test("should throw error if oyl wallet exists but bitcoin provider does not exist", () => {
      const network = "testnet";

      vi.stubGlobal("oyl", {});
      expect(getAddresses(network)).rejects.toThrowError(
        OYL_BITCOIN_PROVIDER_ERROR,
      );
    });
  });

  describe("signPsbt", () => {
    const MOCK_SIGN_PSBT_RESPONSE_IN_HEX =
      "70736274ff01000a01000000000000000000000000";
    const MOCK_SIGN_PSBT = vi.fn().mockResolvedValue({
      psbt: MOCK_SIGN_PSBT_RESPONSE_IN_HEX,
    });

    beforeEach(() => {
      vi.stubGlobal("oyl", {
        signPsbt: MOCK_SIGN_PSBT,
      });
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    test("should sign a psbt with finalize and extractTx set to true when options is not defined", async () => {
      const psbt = new Psbt({ network: networks.bitcoin });
      const signedPsbtResponse = await signPsbt(psbt);

      expect(MOCK_SIGN_PSBT).toHaveBeenCalledWith({
        psbt: psbt.toHex(),
        finalize: true,
        broadcast: false,
      });
      expect(signedPsbtResponse).toEqual({
        base64: null,
        hex: "02000000000000000000",
      });
    });

    test("should sign a psbt when extractTx is true", async () => {
      const psbt = new Psbt({ network: networks.bitcoin });
      const signedPsbtResponse = await signPsbt(psbt, {
        extractTx: true,
        network: "mainnet",
      });

      expect(signedPsbtResponse).toEqual({
        base64: null,
        hex: "02000000000000000000",
      });
    });

    test("should sign a psbt when extractTx is false", async () => {
      const psbt = new Psbt({ network: networks.bitcoin });
      const signedPsbtResponse = await signPsbt(psbt, {
        extractTx: false,
        network: "mainnet",
      });
      expect(signedPsbtResponse).toEqual({
        base64: "cHNidP8BAAoCAAAAAAAAAAAAAAAA",
        hex: "70736274ff01000a02000000000000000000000000",
      });
    });

    test("should sign a psbt when finalize is true", async () => {
      const psbt = new Psbt({ network: networks.bitcoin });
      const signedPsbtResponse = await signPsbt(psbt, {
        finalize: true,
        network: "mainnet",
      });
      expect(signedPsbtResponse).toEqual({
        base64: null,
        hex: "02000000000000000000",
      });
    });

    test("should sign a psbt when finalize is false and extractTx is false", async () => {
      const psbt = new Psbt({ network: networks.bitcoin });
      const signedPsbtResponse = await signPsbt(psbt, {
        finalize: false,
        extractTx: false,
        network: "mainnet",
      });
      expect(signedPsbtResponse).toEqual({
        base64: "cHNidP8BAAoCAAAAAAAAAAAAAAAA",
        hex: "70736274ff01000a02000000000000000000000000",
      });
    });

    test("should throw an error when extractTx is true but finalize is false", async () => {
      const EXTRACTION_TRANSACTION_NON_FINALIZED_PSBT_ERROR =
        new BrowserWalletExtractTxFromNonFinalizedPsbtError();
      const psbt = new Psbt({ network: networks.bitcoin });
      await expect(() =>
        signPsbt(psbt, {
          finalize: false,
          network: "mainnet",
        }),
      ).rejects.toThrowError(EXTRACTION_TRANSACTION_NON_FINALIZED_PSBT_ERROR);
    });

    test("should throw an error when extractTx is true but not all inputs are finalized", async () => {
      const MOCK_UNFINALIZED_PSBT = vi.fn().mockResolvedValue({
        psbt: "70736274ff0100a00200000002ab0949a08c5af7c49b8212f417e2f15ab3f5c33dcf153821a8139f877a5b7be40000000000feffffffab0949a08c5af7c49b8212f417e2f15ab3f5c33dcf153821a8139f877a5b7be40100000000feffffff02603bea0b000000001976a914768a40bbd740cbe81d988e71de2a4d5c71396b1d88ac8e240000000000001976a9146f4620b553fa095e721b9ee0efe9fa039cca459788ac000000000001076a47304402204759661797c01b036b25928948686218347d89864b719e1f7fcf57d1e511658702205309eabf56aa4d8891ffd111fdf1336f3a29da866d7f8486d75546ceedaf93190121035cdc61fc7ba971c0b501a646a2a83b102cb43881217ca682dc86e2d73fa882920001012000e1f5050000000017a9143545e6e33b832c47050f24d3eeb93c9c03948bc787010416001485d13537f2e265405a34dbafa9e3dda01fb82308000000",
      });
      vi.stubGlobal("oyl", {
        signPsbt: MOCK_UNFINALIZED_PSBT,
      });
      const EXTRACTION_TRANSACTION_NON_FINALIZED_PSBT_ERROR =
        new BrowserWalletExtractTxFromNonFinalizedPsbtError();
      const psbt = new Psbt({ network: networks.bitcoin });
      await expect(() =>
        signPsbt(psbt, {
          finalize: true,
          network: "mainnet",
        }),
      ).rejects.toThrowError(EXTRACTION_TRANSACTION_NON_FINALIZED_PSBT_ERROR);
    });

    test("should fail to sign a psbt when Wallet returns an empty psbt hex string", async () => {
      const SIGN_PSBT_ERROR = new OrditSDKError(
        "Failed to sign psbt with Oyl Wallet",
      );
      vi.stubGlobal("oyl", {
        signPsbt: MOCK_EMPTY_VALUE_RESULT,
      });
      const psbt = new Psbt({ network: networks.bitcoin });
      await expect(() => signPsbt(psbt)).rejects.toThrowError(SIGN_PSBT_ERROR);
    });
  });

  describe("signMessage", () => {
    test("should sign a message", async () => {
      const MOCK_SIGN_MESSAGE_RESPONSE_IN_BASE64 =
        "G+LrYa7T5dUMDgQduAErw+i6ebK4GqTXYVWIDM+snYk7Yc6LdPitmaqM6j+iJOeID1CsMXOJFpVopvPiHBdulkE=";
      vi.stubGlobal("oyl", {
        signMessage: vi.fn().mockResolvedValue({
          signature: MOCK_SIGN_MESSAGE_RESPONSE_IN_BASE64,
        }),
      });
      const signedMessageResponse = await signMessage(
        "abcdefghijk123456789",
        "bc1qp8tswfgr8gd0wvvxhm96h3xe6ac46sscmhl220",
      );

      expect(signedMessageResponse).toEqual({
        base64: MOCK_SIGN_MESSAGE_RESPONSE_IN_BASE64,
        hex: "1be2eb61aed3e5d50c0e041db8012bc3e8ba79b2b81aa4d76155880ccfac9d893b61ce8b74f8ad99aa8cea3fa224e7880f50ac317389169568a6f3e21c176e9641",
      });
    });

    test("should fail to sign a message when unisat returns an empty signature", async () => {
      const SIGN_MESSAGE_ERROR = new OrditSDKError(
        "Failed to sign message with Oyl Wallet",
      );
      vi.stubGlobal("oyl", {
        signMessage: MOCK_EMPTY_VALUE_RESULT,
      });
      await expect(() =>
        signMessage(
          "abcdefghijk123456789",
          "bc1qp8tswfgr8gd0wvvxhm96h3xe6ac46sscmhl220",
        ),
      ).rejects.toThrowError(SIGN_MESSAGE_ERROR);
    });
  });
});
