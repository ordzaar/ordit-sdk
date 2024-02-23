// @vitest-environment happy-dom

import { Psbt } from "bitcoinjs-lib";

import {
  BrowserWalletExtractTxFromNonFinalizedPsbtError,
  BrowserWalletNetworkMismatchError,
  BrowserWalletRequestCancelledByUserError,
} from "../../..";
import { getAddresses, isInstalled, signMessage, signPsbt } from "..";
import { LeatherAddressType } from "../types";
import { LeatherErrorResponse } from "../utils";

describe("Leather Wallet", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const NETWORK_MISMATCH_ERROR = new BrowserWalletNetworkMismatchError(
    "Leather network mismatch, please switch it manually",
  );

  describe("isInstalled", () => {
    test("should return true if installed", () => {
      vi.stubGlobal("LeatherProvider", {});
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
        jsonrpc: "2.0",
        id: "43531a58-736f-4cc3-a736-cdec578fc60c",
        result: {
          addresses: [
            {
              symbol: "BTC",
              type: "p2wpkh",
              address: "bc1q6uvrluam6htqdcg5yz6d8e79pjgytln9pkvut7",
              publicKey:
                "036c93333cd080c3faaf29b4a758b00b31fb5f6b19b685827f9b51fc6d346f759b",
              derivationPath: "m/84'/0'/0'/0/0",
            },
            {
              symbol: "BTC",
              type: "p2tr",
              address:
                "bc1pl5snnt0zwyet5sxufw8qjglf68luqzjqg5wx44dx978hvsn9kc2svsqfx9",
              publicKey:
                "03a521e65e9e7698caf3ec7005b7f72b2b5d1a14217432e6944a856a87f287c1e7",
              tweakedPublicKey:
                "a521e65e9e7698caf3ec7005b7f72b2b5d1a14217432e6944a856a87f287c1e7",
              derivationPath: "m/86'/0'/0'/0/0",
            },
            {
              symbol: "STX",
              address: "SP3TJ35J2T3NCAD471DCN2MB0502Z2TVNPXCV1CW2",
            },
          ],
        },
      };
      const network = "mainnet";

      const resolvedValue = [
        {
          publicKey:
            "036c93333cd080c3faaf29b4a758b00b31fb5f6b19b685827f9b51fc6d346f759b",
          address: "bc1q6uvrluam6htqdcg5yz6d8e79pjgytln9pkvut7",
          format: "segwit",
        },
        {
          publicKey:
            "03a521e65e9e7698caf3ec7005b7f72b2b5d1a14217432e6944a856a87f287c1e7",
          address:
            "bc1pl5snnt0zwyet5sxufw8qjglf68luqzjqg5wx44dx978hvsn9kc2svsqfx9",
          format: "taproot",
        },
      ];

      vi.stubGlobal("LeatherProvider", {
        request: vi.fn().mockResolvedValue(mockData),
      });
      expect(getAddresses(network)).resolves.toEqual(resolvedValue);
    });

    test("should return address from testnet", () => {
      const mockData = {
        jsonrpc: "2.0",
        id: "20b0fcf3-ad9a-4f32-8d7f-b6db6fb96207",
        result: {
          addresses: [
            {
              symbol: "BTC",
              type: "p2wpkh",
              address: "tb1qy89jvaya2dzfuagxl7h59pytjs74kxudslux25",
              publicKey:
                "0238427342c868536e9c181caf674d242ab8a3e381ee36692ba375e0b315234180",
              derivationPath: "m/84'/1'/0'/0/0",
            },
            {
              symbol: "BTC",
              type: "p2tr",
              address:
                "tb1pgftv8z8re72kttnyt85k2ae6andngar4c59hasv2kp04kgmmgnnqmxg8uy",
              publicKey:
                "023ded01d3e800b07278c5bbc5deee1f3493ebd599ae843936d81a42625a5cfb84",
              tweakedPublicKey:
                "3ded01d3e800b07278c5bbc5deee1f3493ebd599ae843936d81a42625a5cfb84",
              derivationPath: "m/86'/1'/0'/0/0",
            },
            {
              symbol: "STX",
              address: "ST3TJ35J2T3NCAD471DCN2MB0502Z2TVNPZHN1NEG",
            },
          ],
        },
      };
      const network = "testnet";

      const resolvedValue = [
        {
          publicKey:
            "0238427342c868536e9c181caf674d242ab8a3e381ee36692ba375e0b315234180",
          address: "tb1qy89jvaya2dzfuagxl7h59pytjs74kxudslux25",
          format: "segwit",
        },
        {
          publicKey:
            "023ded01d3e800b07278c5bbc5deee1f3493ebd599ae843936d81a42625a5cfb84",
          address:
            "tb1pgftv8z8re72kttnyt85k2ae6andngar4c59hasv2kp04kgmmgnnqmxg8uy",
          format: "taproot",
        },
      ];

      vi.stubGlobal("LeatherProvider", {
        request: vi.fn().mockResolvedValue(mockData),
      });
      expect(getAddresses(network)).resolves.toEqual(resolvedValue);
    });

    test("should return error when the network mismatch", () => {
      const mockData = {
        jsonrpc: "2.0",
        id: "20b0fcf3-ad9a-4f32-8d7f-b6db6fb96207",
        result: {
          addresses: [
            {
              symbol: "BTC",
              type: "p2wpkh",
              address: "tb1qy89jvaya2dzfuagxl7h59pytjs74kxudslux25",
              publicKey:
                "0238427342c868536e9c181caf674d242ab8a3e381ee36692ba375e0b315234180",
              derivationPath: "m/84'/1'/0'/0/0",
            },
            {
              symbol: "BTC",
              type: "p2tr",
              address:
                "tb1pgftv8z8re72kttnyt85k2ae6andngar4c59hasv2kp04kgmmgnnqmxg8uy",
              publicKey:
                "023ded01d3e800b07278c5bbc5deee1f3493ebd599ae843936d81a42625a5cfb84",
              tweakedPublicKey:
                "3ded01d3e800b07278c5bbc5deee1f3493ebd599ae843936d81a42625a5cfb84",
              derivationPath: "m/86'/1'/0'/0/0",
            },
            {
              symbol: "STX",
              address: "ST3TJ35J2T3NCAD471DCN2MB0502Z2TVNPZHN1NEG",
            },
          ],
        },
      };
      const network = "mainnet";

      vi.stubGlobal("LeatherProvider", {
        request: vi.fn().mockResolvedValue(mockData),
      });
      expect(getAddresses(network)).rejects.toThrowError(
        NETWORK_MISMATCH_ERROR,
      );
    });
  });

  describe("signMessage", () => {
    test("should sign a message", async () => {
      const mockData = {
        jsonrpc: "2.0",
        id: "7930d67d-ecee-44dd-89dc-5159e9f38641",
        result: {
          signature:
            "AUAh7i4gHHEhiKRutcRPX+l3tzpuATA/tVymWh/2x8++pD/w0wm9BD/ORiudYYYsXAuyPVh5FnM4ESnUrDLgdA9D",
          address:
            "bc1pl5snnt0zwyet5sxufw8qjglf68luqzjqg5wx44dx978hvsn9kc2svsqfx9",
          message: "abcdefghijk123456789",
        },
      };
      vi.stubGlobal("LeatherProvider", {
        request: vi.fn().mockResolvedValue(mockData),
      });
      const signedMessageResponse = await signMessage("abcdefghijk123456789", {
        network: "mainnet",
        paymentType: LeatherAddressType.P2TR,
      });

      expect(signedMessageResponse).toEqual({
        base64:
          "AUAh7i4gHHEhiKRutcRPX+l3tzpuATA/tVymWh/2x8++pD/w0wm9BD/ORiudYYYsXAuyPVh5FnM4ESnUrDLgdA9D",
        hex: "014021ee2e201c712188a46eb5c44f5fe977b73a6e01303fb55ca65a1ff6c7cfbea43ff0d309bd043fce462b9d61862c5c0bb23d58791673381129d4ac32e0740f43",
      });
    });

    test("should throw error on user cancel", async () => {
      const errMessage = "User rejected message signing request";
      vi.stubGlobal("LeatherProvider", {
        request: vi.fn().mockImplementation(() => {
          const error: LeatherErrorResponse = {
            jsonrpc: "2.0",
            id: "15327f1a-88a1-4251-a38c-1d4c098ff03f",
            error: {
              code: 4001,
              message: errMessage,
            },
          };
          // eslint-disable-next-line @typescript-eslint/no-throw-literal
          throw error;
        }),
      });
      const signedMessageResponse = signMessage("abcdefghijk123456789", {
        network: "mainnet",
        paymentType: LeatherAddressType.P2TR,
      });

      expect(signedMessageResponse).rejects.toThrowError(
        new BrowserWalletRequestCancelledByUserError(errMessage),
      );
    });
  });

  describe("signPsbt", () => {
    const mockResponse = {
      jsonrpc: "2.0",
      id: "2e210343-386f-45fa-a22f-07566cf08165",
      result: {
        hex: "70736274ff010071020000000177c3aed1dc6d4670c63f6043e1dce6ba0fa8e4c6106824bf7cc268622447bcd10100000000fdffffff025802000000000000160014eaec816df7858f124012ed2603e70ddaddff444e569b07000000000016001421cb26749d53449e7506ffaf42848b943d5b1b8d000000000001011f3b9e07000000000016001421cb26749d53449e7506ffaf42848b943d5b1b8d22020238427342c868536e9c181caf674d242ab8a3e381ee36692ba375e0b315234180473044022078186780619d6246b0a2b7b34268ca55f721a396b99a92f59407839c8f313ef10220612e055b6b18313810b5a66da18becacadec0cad94cca2f015bd4e90d096db0401000000",
      },
    };
    const psbtHex =
      "70736274ff010071020000000177c3aed1dc6d4670c63f6043e1dce6ba0fa8e4c6106824bf7cc268622447bcd10100000000fdffffff025802000000000000160014eaec816df7858f124012ed2603e70ddaddff444e569b07000000000016001421cb26749d53449e7506ffaf42848b943d5b1b8d000000000001011f3b9e07000000000016001421cb26749d53449e7506ffaf42848b943d5b1b8d000000";

    afterEach(() => {
      vi.resetAllMocks();
    });

    test("should sign a psbt with finalize and extractTx set to true and finalize true", async () => {
      vi.stubGlobal("LeatherProvider", {
        request: vi.fn().mockResolvedValue(mockResponse),
      });

      const psbt = Psbt.fromHex(psbtHex);

      expect(
        signPsbt(psbt, {
          finalize: true,
          extractTx: true,
          network: "testnet",
          signAtIndexes: [0],
        }),
      ).resolves.toEqual({
        base64: null,
        hex: "0200000000010177c3aed1dc6d4670c63f6043e1dce6ba0fa8e4c6106824bf7cc268622447bcd10100000000fdffffff025802000000000000160014eaec816df7858f124012ed2603e70ddaddff444e569b07000000000016001421cb26749d53449e7506ffaf42848b943d5b1b8d02473044022078186780619d6246b0a2b7b34268ca55f721a396b99a92f59407839c8f313ef10220612e055b6b18313810b5a66da18becacadec0cad94cca2f015bd4e90d096db0401210238427342c868536e9c181caf674d242ab8a3e381ee36692ba375e0b31523418000000000",
      });
    });

    test("should sign a psbt with finalize and extractTx set to false and finalize true", async () => {
      vi.stubGlobal("LeatherProvider", {
        request: vi.fn().mockResolvedValue(mockResponse),
      });

      const psbt = Psbt.fromHex(psbtHex);

      expect(
        signPsbt(psbt, {
          finalize: true,
          extractTx: false,
          network: "testnet",
          signAtIndexes: [0],
        }),
      ).resolves.toEqual({
        base64:
          "cHNidP8BAHECAAAAAXfDrtHcbUZwxj9gQ+Hc5roPqOTGEGgkv3zCaGIkR7zRAQAAAAD9////AlgCAAAAAAAAFgAU6uyBbfeFjxJAEu0mA+cN2t3/RE5WmwcAAAAAABYAFCHLJnSdU0SedQb/r0KEi5Q9WxuNAAAAAAABAR87ngcAAAAAABYAFCHLJnSdU0SedQb/r0KEi5Q9WxuNAQhrAkcwRAIgeBhngGGdYkaworezQmjKVfcho5a5mpL1lAeDnI8xPvECIGEuBVtrGDE4ELWmbaGL7Kyt7AytlMyi8BW9TpDQltsEASECOEJzQshoU26cGByvZ00kKrij44HuNmkro3XgsxUjQYAAAAA=",
        hex: "70736274ff010071020000000177c3aed1dc6d4670c63f6043e1dce6ba0fa8e4c6106824bf7cc268622447bcd10100000000fdffffff025802000000000000160014eaec816df7858f124012ed2603e70ddaddff444e569b07000000000016001421cb26749d53449e7506ffaf42848b943d5b1b8d000000000001011f3b9e07000000000016001421cb26749d53449e7506ffaf42848b943d5b1b8d01086b02473044022078186780619d6246b0a2b7b34268ca55f721a396b99a92f59407839c8f313ef10220612e055b6b18313810b5a66da18becacadec0cad94cca2f015bd4e90d096db0401210238427342c868536e9c181caf674d242ab8a3e381ee36692ba375e0b315234180000000",
      });
    });

    test("should sign a psbt with finalize and extractTx set to false and finalize false", async () => {
      vi.stubGlobal("LeatherProvider", {
        request: vi.fn().mockResolvedValue(mockResponse),
      });

      const psbt = Psbt.fromHex(psbtHex);

      expect(
        signPsbt(psbt, {
          finalize: false,
          extractTx: false,
          network: "testnet",
          signAtIndexes: [0],
        }),
      ).resolves.toEqual({
        base64:
          "cHNidP8BAHECAAAAAXfDrtHcbUZwxj9gQ+Hc5roPqOTGEGgkv3zCaGIkR7zRAQAAAAD9////AlgCAAAAAAAAFgAU6uyBbfeFjxJAEu0mA+cN2t3/RE5WmwcAAAAAABYAFCHLJnSdU0SedQb/r0KEi5Q9WxuNAAAAAAABAR87ngcAAAAAABYAFCHLJnSdU0SedQb/r0KEi5Q9WxuNIgICOEJzQshoU26cGByvZ00kKrij44HuNmkro3XgsxUjQYBHMEQCIHgYZ4BhnWJGsKK3s0JoylX3IaOWuZqS9ZQHg5yPMT7xAiBhLgVbaxgxOBC1pm2hi+ysrewMrZTMovAVvU6Q0JbbBAEAAAA=",
        hex: "70736274ff010071020000000177c3aed1dc6d4670c63f6043e1dce6ba0fa8e4c6106824bf7cc268622447bcd10100000000fdffffff025802000000000000160014eaec816df7858f124012ed2603e70ddaddff444e569b07000000000016001421cb26749d53449e7506ffaf42848b943d5b1b8d000000000001011f3b9e07000000000016001421cb26749d53449e7506ffaf42848b943d5b1b8d22020238427342c868536e9c181caf674d242ab8a3e381ee36692ba375e0b315234180473044022078186780619d6246b0a2b7b34268ca55f721a396b99a92f59407839c8f313ef10220612e055b6b18313810b5a66da18becacadec0cad94cca2f015bd4e90d096db0401000000",
      });
    });

    test("should throw error when extractTx is true but finalize is false", async () => {
      vi.stubGlobal("LeatherProvider", {
        request: vi.fn().mockResolvedValue(mockResponse),
      });

      const psbt = Psbt.fromHex(psbtHex);

      expect(
        signPsbt(psbt, {
          finalize: false,
          extractTx: true,
          network: "testnet",
          signAtIndexes: [0],
        }),
      ).rejects.toThrowError(
        new BrowserWalletExtractTxFromNonFinalizedPsbtError(),
      );
    });

    test("should throw error on user cancel", async () => {
      const errMessage = "User rejected signing PSBT request";
      vi.stubGlobal("LeatherProvider", {
        request: vi.fn().mockImplementation(() => {
          const error: LeatherErrorResponse = {
            jsonrpc: "2.0",
            id: "15327f1a-88a1-4251-a38c-1d4c098ff03f",
            error: {
              code: 4001,
              message: errMessage,
            },
          };
          // eslint-disable-next-line @typescript-eslint/no-throw-literal
          throw error;
        }),
      });

      const psbt = Psbt.fromHex(psbtHex);

      expect(
        signPsbt(psbt, {
          finalize: false,
          extractTx: false,
          network: "testnet",
        }),
      ).rejects.toThrowError(
        new BrowserWalletRequestCancelledByUserError(errMessage),
      );
    });
  });
});
