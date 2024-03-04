// @vitest-environment happy-dom
import * as walletStandardCore from "@wallet-standard/core";
import { Wallet, Wallets } from "@wallet-standard/core";
import type {
  GetAddressOptions,
  GetAddressResponse,
  SignMessageResponse,
  SignTransactionOptions,
  SignTransactionResponse,
} from "sats-connect";
import * as satsConnect from "sats-connect";

import {
  BrowserWalletExtractTxFromNonFinalizedPsbtError,
  BrowserWalletRequestCancelledByUserError,
} from "../../../errors";
import { createMockPsbt } from "../../../fee/__tests__/utils";
import { WalletAddress } from "../../types";
import {
  getAddresses,
  getMagicEdenWalletProvider,
  isInstalled,
  MagicEdenBitcoinProvider,
  signMessage,
  signPsbt,
} from "..";

vi.mock("sats-connect", async (originalImport) => {
  const mod = (await originalImport()) as typeof satsConnect;
  return {
    __esModule: true,
    ...mod,
  };
});

vi.mock("@wallet-standard/core", async (originalImport) => {
  const mod = (await originalImport()) as typeof walletStandardCore;
  return {
    __esModule: true,
    ...mod,
  };
});

describe("Magic Eden Wallet", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    const mockWalletsResponse: Wallets = {
      get: () =>
        [
          {
            name: "Magic Eden",
            features: {
              "sats-connect:": {
                provider: {},
              },
            },
            version: "1.0.0",
            icon: "data:image/svg+xml;base64,magiceden-wallet.svg",
            chains: [],
            accounts: [],
          },
        ] as Wallet[],
      on: () => () => {},
      register: () => () => {},
    } as Wallets;

    const getWalletSpy = vi.spyOn(walletStandardCore, "getWallets");

    getWalletSpy.mockImplementation(() => mockWalletsResponse);
  });

  describe("getMagicEdenWalletProvider", () => {
    test("should return Magic Eden wallet provider", async () => {
      const mockMagicEdenWalletProvider = {
        isMagicEden: true,
      } as MagicEdenBitcoinProvider;

      const mockWalletsResponse: Wallets = {
        get: () =>
          [
            {
              name: "Magic Eden",
              features: {
                "sats-connect:": {
                  provider: mockMagicEdenWalletProvider,
                },
              },
              version: "1.0.0",
              icon: "data:image/svg+xml;base64,magiceden-wallet.svg",
              chains: [],
              accounts: [],
            },
          ] as Wallet[],
        on: () => () => {},
        register: () => () => {},
      } as Wallets;

      const getWalletSpy = vi.spyOn(walletStandardCore, "getWallets");

      getWalletSpy.mockImplementation(() => mockWalletsResponse);

      const magicEdenWalletProvider = await getMagicEdenWalletProvider();
      expect(magicEdenWalletProvider).toEqual(mockMagicEdenWalletProvider);
    });

    test("should throw error if Magic Eden wallet is not installed", async () => {
      const mockEmptyWalletsResponse: Wallets = {
        get: () => [] as Wallet[],
        on: () => () => {},
        register: () => () => {},
      } as Wallets;

      const getWalletSpy = vi.spyOn(walletStandardCore, "getWallets");

      getWalletSpy.mockImplementation(() => mockEmptyWalletsResponse);

      await expect(getMagicEdenWalletProvider()).rejects.toThrowError(
        "Magic Eden Wallet not installed.",
      );
    });
  });

  describe("isInstalled", () => {
    // test("should return true if installed", () => {
    //   expect(typeof window.BitcoinProvider).not.toBeUndefined();
    //   expect(isInstalled()).toBeTruthy();
    // });

    test("should return false if not installed", () => {
      const mockEmptyWalletsResponse: Wallets = {
        get: () => [] as Wallet[],
        on: () => () => {},
        register: () => () => {},
      } as Wallets;

      const getWalletSpy = vi.spyOn(walletStandardCore, "getWallets");

      getWalletSpy.mockImplementation(() => mockEmptyWalletsResponse);

      expect(typeof window).not.toBeUndefined();
      expect(isInstalled()).resolves.toBeFalsy();
    });
  });

  describe("getAddresses", () => {
    afterEach(() => {
      vi.resetAllMocks();
    });

    test("should return address from mainnet", () => {
      const mockData: WalletAddress[] = [
        {
          // https://bitcoin.design/guide/glossary/address/
          address:
            "bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297",
          publicKey:
            "02b9907521ddb85e0e6a37622b7c685efbdc8ae53a334928adbd12cf204ad4e717",
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

      const getAddressSpy = vi.spyOn(satsConnect, "getAddress");

      getAddressSpy.mockImplementation((options: GetAddressOptions) => {
        options.onFinish(mockResponse);
        return Promise.resolve();
      });
      expect(typeof window).not.toBeUndefined();
      expect(getAddresses("mainnet")).resolves.toEqual(mockData);
    });

    test("should throw error on testnet", () => {
      expect(typeof window).not.toBeUndefined();
      expect(getAddresses("testnet")).rejects.toThrowError();
    });

    test("should throw error on user cancel", () => {
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

  describe("signPsbt", () => {
    const mockResponse: SignTransactionResponse = {
      // Taken from bitcoinjs test fixture: "Sign PSBT with 1 input [P2TR] (script-path, 3-of-3) and one output [P2TR]"
      psbtBase64:
        "cHNidP8BAF4CAAAAAQU2GLj/HTOEN804Hc6JRNTLM7EmDlIBdjG2G1aUw266AAAAAAD/////AYAaBgAAAAAAIlEg35sLGepBXUbR93XfxDJcYBCHqNVjw/jogOgPVdic1UgAAAAAAAEBK6BoBgAAAAAAIlEgVZx4+tHeORcb0jDJnOytrOnNOGL1uS0MdMUg1GQeS15BFDlfgSndY7SlwvEhJOqgW3p+0w9w5R+5MwXe7MVC5/nrrqI0FdZdKILLLZgRVK8L9Bn2ijU6IcoqqyImKIWt3MtAA3alBoU7IBCkBk9OHD1wE8fJI4y+lbnTRj48e8AAwRM77q3Rml679qCzGvEAKAs99UNMaXHQIhgGfRP11AMlJkEUj4kary4texRheMVKh+Ku3dnR1oZpIleSjmfPCBdP83WuojQV1l0ogsstmBFUrwv0GfaKNTohyiqrIiYoha3cy0DYJZ6Lv7FZPIBRZFfVgF5v3gcRiQnT8aM82Q5IPkwkzZrGo4ThZblvunG/+hu8ZPuJrUU+uXb+s9rcwSH+BihIQRSoqze8FgnYNMOROzU42tHITX+baoNf/BdXd5FaN641cq6iNBXWXSiCyy2YEVSvC/QZ9oo1OiHKKqsiJiiFrdzLQEfQ5UkAg4lTbhJxjMzB7hu6ad1fywYxHCXjFXHHrm5PJTOFJLg2oTnwuQToz/Z2AW/UET7Op+WSoHZvW4tzzLhiFcFmuQP4s1ds7KJtMOh4fTw1QCgxkWUA3FUAuUzKHzjDvhpSnJ+zzX53bWG2IltsYQ6JBvuPqmxZrFw+lbX4LSnWGlKcn7PNfndtYbYiW2xhDokG+4+qbFmsXD6VtfgtKdZpII+JGq8uLXsUYXjFSofirt3Z0daGaSJXko5nzwgXT/N1rCA5X4Ep3WO0pcLxISTqoFt6ftMPcOUfuTMF3uzFQuf567ogqKs3vBYJ2DTDkTs1ONrRyE1/m2qDX/wXV3eRWjeuNXK6U5zAAAA=",
    };

    afterEach(() => {
      vi.resetAllMocks();
    });

    test("should sign a psbt with finalize and extractTx set to true when options is not defined", async () => {
      const signTransactionSpy = vi.spyOn(satsConnect, "signTransaction");
      signTransactionSpy.mockImplementation(
        (options: SignTransactionOptions) => {
          options.onFinish(mockResponse);
          return Promise.resolve();
        },
      );

      const psbt = createMockPsbt("taproot");
      const signedPsbtResponse = await signPsbt(psbt, {
        network: "mainnet",
        inputsToSign: [
          {
            // Dummy address that is not used. Only the signingIndexes are used in this case.
            address:
              "bc1pr09enf3yc43cz8qh7xwaasuv3xzlgfttdr3wn0q2dy9frkhrpdtsk05jqq",
            signingIndexes: [0],
          },
        ],
      });
      expect(signedPsbtResponse).toEqual({
        base64: null,
        hex: "02000000000101053618b8ff1d338437cd381dce8944d4cb33b1260e52017631b61b5694c36eba0000000000ffffffff01801a060000000000225120df9b0b19ea415d46d1f775dfc4325c601087a8d563c3f8e880e80f55d89cd548054047d0e549008389536e12718cccc1ee1bba69dd5fcb06311c25e31571c7ae6e4f25338524b836a139f0b904e8cff676016fd4113ecea7e592a0766f5b8b73ccb8400376a506853b2010a4064f4e1c3d7013c7c9238cbe95b9d3463e3c7bc000c1133beeadd19a5ebbf6a0b31af100280b3df5434c6971d02218067d13f5d403252640d8259e8bbfb1593c80516457d5805e6fde07118909d3f1a33cd90e483e4c24cd9ac6a384e165b96fba71bffa1bbc64fb89ad453eb976feb3dadcc121fe06284868208f891aaf2e2d7b146178c54a87e2aeddd9d1d686692257928e67cf08174ff375ac20395f8129dd63b4a5c2f12124eaa05b7a7ed30f70e51fb93305deecc542e7f9ebba20a8ab37bc1609d834c3913b3538dad1c84d7f9b6a835ffc175777915a37ae3572ba539c61c166b903f8b3576ceca26d30e8787d3c35402831916500dc5500b94cca1f38c3be1a529c9fb3cd7e776d61b6225b6c610e8906fb8faa6c59ac5c3e95b5f82d29d61a529c9fb3cd7e776d61b6225b6c610e8906fb8faa6c59ac5c3e95b5f82d29d600000000",
      });
    });

    test("should sign a psbt when extractTx is true", async () => {
      const signTransactionSpy = vi.spyOn(satsConnect, "signTransaction");
      signTransactionSpy.mockImplementation(
        (options: SignTransactionOptions) => {
          options.onFinish(mockResponse);
          return Promise.resolve();
        },
      );

      const psbt = createMockPsbt("taproot");
      const signedPsbtResponse = await signPsbt(psbt, {
        extractTx: true,
        network: "mainnet",
        inputsToSign: [
          {
            // Dummy address that is not used. Only the signingIndexes are used in this case.
            address:
              "bc1pr09enf3yc43cz8qh7xwaasuv3xzlgfttdr3wn0q2dy9frkhrpdtsk05jqq",
            signingIndexes: [0],
          },
        ],
      });
      expect(signedPsbtResponse).toEqual({
        base64: null,
        hex: "02000000000101053618b8ff1d338437cd381dce8944d4cb33b1260e52017631b61b5694c36eba0000000000ffffffff01801a060000000000225120df9b0b19ea415d46d1f775dfc4325c601087a8d563c3f8e880e80f55d89cd548054047d0e549008389536e12718cccc1ee1bba69dd5fcb06311c25e31571c7ae6e4f25338524b836a139f0b904e8cff676016fd4113ecea7e592a0766f5b8b73ccb8400376a506853b2010a4064f4e1c3d7013c7c9238cbe95b9d3463e3c7bc000c1133beeadd19a5ebbf6a0b31af100280b3df5434c6971d02218067d13f5d403252640d8259e8bbfb1593c80516457d5805e6fde07118909d3f1a33cd90e483e4c24cd9ac6a384e165b96fba71bffa1bbc64fb89ad453eb976feb3dadcc121fe06284868208f891aaf2e2d7b146178c54a87e2aeddd9d1d686692257928e67cf08174ff375ac20395f8129dd63b4a5c2f12124eaa05b7a7ed30f70e51fb93305deecc542e7f9ebba20a8ab37bc1609d834c3913b3538dad1c84d7f9b6a835ffc175777915a37ae3572ba539c61c166b903f8b3576ceca26d30e8787d3c35402831916500dc5500b94cca1f38c3be1a529c9fb3cd7e776d61b6225b6c610e8906fb8faa6c59ac5c3e95b5f82d29d61a529c9fb3cd7e776d61b6225b6c610e8906fb8faa6c59ac5c3e95b5f82d29d600000000",
      });
    });

    test("should sign a psbt when extractTx is false", async () => {
      const signTransactionSpy = vi.spyOn(satsConnect, "signTransaction");
      signTransactionSpy.mockImplementation(
        (options: SignTransactionOptions) => {
          options.onFinish(mockResponse);
          return Promise.resolve();
        },
      );

      const psbt = createMockPsbt("taproot");
      const signedPsbtResponse = await signPsbt(psbt, {
        extractTx: false,
        network: "mainnet",
        inputsToSign: [
          {
            // Dummy address that is not used. Only the signingIndexes are used in this case.
            address:
              "bc1pr09enf3yc43cz8qh7xwaasuv3xzlgfttdr3wn0q2dy9frkhrpdtsk05jqq",
            signingIndexes: [0],
          },
        ],
      });
      expect(signedPsbtResponse).toEqual({
        base64:
          "cHNidP8BAF4CAAAAAQU2GLj/HTOEN804Hc6JRNTLM7EmDlIBdjG2G1aUw266AAAAAAD/////AYAaBgAAAAAAIlEg35sLGepBXUbR93XfxDJcYBCHqNVjw/jogOgPVdic1UgAAAAAAAEBK6BoBgAAAAAAIlEgVZx4+tHeORcb0jDJnOytrOnNOGL1uS0MdMUg1GQeS14BCP2PAQVAR9DlSQCDiVNuEnGMzMHuG7pp3V/LBjEcJeMVcceubk8lM4UkuDahOfC5BOjP9nYBb9QRPs6n5ZKgdm9bi3PMuEADdqUGhTsgEKQGT04cPXATx8kjjL6VudNGPjx7wADBEzvurdGaXrv2oLMa8QAoCz31Q0xpcdAiGAZ9E/XUAyUmQNglnou/sVk8gFFkV9WAXm/eBxGJCdPxozzZDkg+TCTNmsajhOFluW+6cb/6G7xk+4mtRT65dv6z2tzBIf4GKEhoII+JGq8uLXsUYXjFSofirt3Z0daGaSJXko5nzwgXT/N1rCA5X4Ep3WO0pcLxISTqoFt6ftMPcOUfuTMF3uzFQuf567ogqKs3vBYJ2DTDkTs1ONrRyE1/m2qDX/wXV3eRWjeuNXK6U5xhwWa5A/izV2zsom0w6Hh9PDVAKDGRZQDcVQC5TMofOMO+GlKcn7PNfndtYbYiW2xhDokG+4+qbFmsXD6VtfgtKdYaUpyfs81+d21htiJbbGEOiQb7j6psWaxcPpW1+C0p1gAA",
        hex: "70736274ff01005e0200000001053618b8ff1d338437cd381dce8944d4cb33b1260e52017631b61b5694c36eba0000000000ffffffff01801a060000000000225120df9b0b19ea415d46d1f775dfc4325c601087a8d563c3f8e880e80f55d89cd548000000000001012ba068060000000000225120559c78fad1de39171bd230c99cecadace9cd3862f5b92d0c74c520d4641e4b5e0108fd8f01054047d0e549008389536e12718cccc1ee1bba69dd5fcb06311c25e31571c7ae6e4f25338524b836a139f0b904e8cff676016fd4113ecea7e592a0766f5b8b73ccb8400376a506853b2010a4064f4e1c3d7013c7c9238cbe95b9d3463e3c7bc000c1133beeadd19a5ebbf6a0b31af100280b3df5434c6971d02218067d13f5d403252640d8259e8bbfb1593c80516457d5805e6fde07118909d3f1a33cd90e483e4c24cd9ac6a384e165b96fba71bffa1bbc64fb89ad453eb976feb3dadcc121fe06284868208f891aaf2e2d7b146178c54a87e2aeddd9d1d686692257928e67cf08174ff375ac20395f8129dd63b4a5c2f12124eaa05b7a7ed30f70e51fb93305deecc542e7f9ebba20a8ab37bc1609d834c3913b3538dad1c84d7f9b6a835ffc175777915a37ae3572ba539c61c166b903f8b3576ceca26d30e8787d3c35402831916500dc5500b94cca1f38c3be1a529c9fb3cd7e776d61b6225b6c610e8906fb8faa6c59ac5c3e95b5f82d29d61a529c9fb3cd7e776d61b6225b6c610e8906fb8faa6c59ac5c3e95b5f82d29d60000",
      });
    });

    test("should sign a psbt when finalize and extractTx is false", async () => {
      const signTransactionSpy = vi.spyOn(satsConnect, "signTransaction");
      signTransactionSpy.mockImplementation(
        (options: SignTransactionOptions) => {
          options.onFinish(mockResponse);
          return Promise.resolve();
        },
      );

      const psbt = createMockPsbt("taproot");
      const signedPsbtResponse = await signPsbt(psbt, {
        finalize: false,
        extractTx: false,
        network: "mainnet",
        inputsToSign: [
          {
            // Dummy address that is not used. Only the signingIndexes are used in this case.
            address:
              "bc1pr09enf3yc43cz8qh7xwaasuv3xzlgfttdr3wn0q2dy9frkhrpdtsk05jqq",
            signingIndexes: [0],
          },
        ],
      });
      expect(signedPsbtResponse).toEqual({
        base64:
          "cHNidP8BAF4CAAAAAQU2GLj/HTOEN804Hc6JRNTLM7EmDlIBdjG2G1aUw266AAAAAAD/////AYAaBgAAAAAAIlEg35sLGepBXUbR93XfxDJcYBCHqNVjw/jogOgPVdic1UgAAAAAAAEBK6BoBgAAAAAAIlEgVZx4+tHeORcb0jDJnOytrOnNOGL1uS0MdMUg1GQeS15BFDlfgSndY7SlwvEhJOqgW3p+0w9w5R+5MwXe7MVC5/nrrqI0FdZdKILLLZgRVK8L9Bn2ijU6IcoqqyImKIWt3MtAA3alBoU7IBCkBk9OHD1wE8fJI4y+lbnTRj48e8AAwRM77q3Rml679qCzGvEAKAs99UNMaXHQIhgGfRP11AMlJkEUj4kary4texRheMVKh+Ku3dnR1oZpIleSjmfPCBdP83WuojQV1l0ogsstmBFUrwv0GfaKNTohyiqrIiYoha3cy0DYJZ6Lv7FZPIBRZFfVgF5v3gcRiQnT8aM82Q5IPkwkzZrGo4ThZblvunG/+hu8ZPuJrUU+uXb+s9rcwSH+BihIQRSoqze8FgnYNMOROzU42tHITX+baoNf/BdXd5FaN641cq6iNBXWXSiCyy2YEVSvC/QZ9oo1OiHKKqsiJiiFrdzLQEfQ5UkAg4lTbhJxjMzB7hu6ad1fywYxHCXjFXHHrm5PJTOFJLg2oTnwuQToz/Z2AW/UET7Op+WSoHZvW4tzzLhiFcFmuQP4s1ds7KJtMOh4fTw1QCgxkWUA3FUAuUzKHzjDvhpSnJ+zzX53bWG2IltsYQ6JBvuPqmxZrFw+lbX4LSnWGlKcn7PNfndtYbYiW2xhDokG+4+qbFmsXD6VtfgtKdZpII+JGq8uLXsUYXjFSofirt3Z0daGaSJXko5nzwgXT/N1rCA5X4Ep3WO0pcLxISTqoFt6ftMPcOUfuTMF3uzFQuf567ogqKs3vBYJ2DTDkTs1ONrRyE1/m2qDX/wXV3eRWjeuNXK6U5zAAAA=",
        hex: "70736274ff01005e0200000001053618b8ff1d338437cd381dce8944d4cb33b1260e52017631b61b5694c36eba0000000000ffffffff01801a060000000000225120df9b0b19ea415d46d1f775dfc4325c601087a8d563c3f8e880e80f55d89cd548000000000001012ba068060000000000225120559c78fad1de39171bd230c99cecadace9cd3862f5b92d0c74c520d4641e4b5e4114395f8129dd63b4a5c2f12124eaa05b7a7ed30f70e51fb93305deecc542e7f9ebaea23415d65d2882cb2d981154af0bf419f68a353a21ca2aab22262885addccb400376a506853b2010a4064f4e1c3d7013c7c9238cbe95b9d3463e3c7bc000c1133beeadd19a5ebbf6a0b31af100280b3df5434c6971d02218067d13f5d403252641148f891aaf2e2d7b146178c54a87e2aeddd9d1d686692257928e67cf08174ff375aea23415d65d2882cb2d981154af0bf419f68a353a21ca2aab22262885addccb40d8259e8bbfb1593c80516457d5805e6fde07118909d3f1a33cd90e483e4c24cd9ac6a384e165b96fba71bffa1bbc64fb89ad453eb976feb3dadcc121fe0628484114a8ab37bc1609d834c3913b3538dad1c84d7f9b6a835ffc175777915a37ae3572aea23415d65d2882cb2d981154af0bf419f68a353a21ca2aab22262885addccb4047d0e549008389536e12718cccc1ee1bba69dd5fcb06311c25e31571c7ae6e4f25338524b836a139f0b904e8cff676016fd4113ecea7e592a0766f5b8b73ccb86215c166b903f8b3576ceca26d30e8787d3c35402831916500dc5500b94cca1f38c3be1a529c9fb3cd7e776d61b6225b6c610e8906fb8faa6c59ac5c3e95b5f82d29d61a529c9fb3cd7e776d61b6225b6c610e8906fb8faa6c59ac5c3e95b5f82d29d669208f891aaf2e2d7b146178c54a87e2aeddd9d1d686692257928e67cf08174ff375ac20395f8129dd63b4a5c2f12124eaa05b7a7ed30f70e51fb93305deecc542e7f9ebba20a8ab37bc1609d834c3913b3538dad1c84d7f9b6a835ffc175777915a37ae3572ba539cc00000",
      });
    });

    test("should throw error when extractTx is true but finalize is false", () => {
      const EXTRACTION_TRANSACTION_NON_FINALIZED_PSBT =
        new BrowserWalletExtractTxFromNonFinalizedPsbtError();

      const psbt = createMockPsbt("taproot");
      expect(() =>
        signPsbt(psbt, {
          finalize: false,
          extractTx: true,
          network: "mainnet",
          inputsToSign: [
            {
              // Dummy address that is not used. Only the signingIndexes are used in this case.
              address:
                "bc1pr09enf3yc43cz8qh7xwaasuv3xzlgfttdr3wn0q2dy9frkhrpdtsk05jqq",
              signingIndexes: [0],
            },
          ],
        }),
      ).rejects.toThrowError(EXTRACTION_TRANSACTION_NON_FINALIZED_PSBT);
      expect(() =>
        signPsbt(psbt, {
          finalize: false,
          extractTx: true,
          network: "mainnet",
          inputsToSign: [
            {
              // Dummy address that is not used. Only the signingIndexes are used in this case.
              address:
                "bc1pr09enf3yc43cz8qh7xwaasuv3xzlgfttdr3wn0q2dy9frkhrpdtsk05jqq",
              signingIndexes: [0],
            },
          ],
        }),
      ).rejects.toThrowError(EXTRACTION_TRANSACTION_NON_FINALIZED_PSBT);
    });

    test("should throw error when extractTx is true but not all tx signed", () => {
      const EXTRACTION_TRANSACTION_NON_FINALIZED_PSBT =
        new BrowserWalletExtractTxFromNonFinalizedPsbtError();

      const mockPartialSignedResponse: SignTransactionResponse = {
        psbtBase64:
          "cHNidP8BAKACAAAAAqsJSaCMWvfEm4IS9Bfi8Vqz9cM9zxU4IagTn4d6W3vkAAAAAAD+////qwlJoIxa98SbghL0F+LxWrP1wz3PFTghqBOfh3pbe+QBAAAAAP7///8CYDvqCwAAAAAZdqkUdopAu9dAy+gdmI5x3ipNXHE5ax2IrI4kAAAAAAAAGXapFG9GILVT+glechue4O/p+gOcykWXiKwAAAAAAAEHakcwRAIgR1lmF5fAGwNrJZKJSGhiGDR9iYZLcZ4ff89X0eURZYcCIFMJ6r9Wqk2Ikf/REf3xM286KdqGbX+EhtdVRs7tr5MZASEDXNxh/HupccC1AaZGoqg7ECy0OIEhfKaC3Ibi1z+ogpIAAQEgAOH1BQAAAAAXqRQ1RebjO4MsRwUPJNPuuTycA5SLx4cBBBYAFIXRNTfy4mVAWjTbr6nj3aAfuCMIAAAA",
      };
      const signTransactionSpy = vi.spyOn(satsConnect, "signTransaction");
      signTransactionSpy.mockImplementation(
        (options: SignTransactionOptions) => {
          options.onFinish(mockPartialSignedResponse);
          return Promise.resolve();
        },
      );

      const psbt = createMockPsbt("taproot");
      expect(() =>
        signPsbt(psbt, {
          finalize: false,
          extractTx: true,
          network: "mainnet",
          inputsToSign: [
            {
              // Dummy address that is not used. Only the signingIndexes are used in this case.
              address:
                "bc1pr09enf3yc43cz8qh7xwaasuv3xzlgfttdr3wn0q2dy9frkhrpdtsk05jqq",
              signingIndexes: [0],
            },
          ],
        }),
      ).rejects.toThrowError(EXTRACTION_TRANSACTION_NON_FINALIZED_PSBT);
      expect(() =>
        signPsbt(psbt, {
          finalize: false,
          extractTx: true,
          network: "mainnet",
          inputsToSign: [
            {
              // Dummy address that is not used. Only the signingIndexes are used in this case.
              address:
                "bc1pr09enf3yc43cz8qh7xwaasuv3xzlgfttdr3wn0q2dy9frkhrpdtsk05jqq",
              signingIndexes: [0],
            },
          ],
        }),
      ).rejects.toThrowError(EXTRACTION_TRANSACTION_NON_FINALIZED_PSBT);
    });

    test("should throw error on user cancel", () => {
      const CANCELLED_BY_USER_ERROR =
        new BrowserWalletRequestCancelledByUserError();

      const signTransactionSpy = vi.spyOn(satsConnect, "signTransaction");
      signTransactionSpy.mockImplementation(
        (options: SignTransactionOptions) => {
          options.onCancel();
          return Promise.resolve();
        },
      );
      const psbt = createMockPsbt("taproot");
      expect(() =>
        signPsbt(psbt, {
          finalize: false,
          extractTx: false,
          network: "mainnet",
          inputsToSign: [
            {
              // Dummy address that is not used. Only the signingIndexes are used in this case.
              address:
                "bc1pr09enf3yc43cz8qh7xwaasuv3xzlgfttdr3wn0q2dy9frkhrpdtsk05jqq",
              signingIndexes: [0],
            },
          ],
        }),
      ).rejects.toThrowError(CANCELLED_BY_USER_ERROR);
      expect(() =>
        signPsbt(psbt, {
          finalize: false,
          extractTx: false,
          network: "mainnet",
          inputsToSign: [
            {
              // Dummy address that is not used. Only the signingIndexes are used in this case.
              address:
                "bc1pr09enf3yc43cz8qh7xwaasuv3xzlgfttdr3wn0q2dy9frkhrpdtsk05jqq",
              signingIndexes: [0],
            },
          ],
        }),
      ).rejects.toThrowError(CANCELLED_BY_USER_ERROR);
    });
  });

  describe("signMessage", () => {
    const mockResponse: SignMessageResponse =
      "G+LrYa7T5dUMDgQduAErw+i6ebK4GqTXYVWIDM+snYk7Yc6LdPitmaqM6j+iJOeID1CsMXOJFpVopvPiHBdulkE=";

    afterEach(() => {
      vi.resetAllMocks();
    });

    test("should sign a message", async () => {
      const signMessageSpy = vi.spyOn(satsConnect, "signMessage");
      signMessageSpy.mockImplementation(
        (options: satsConnect.SignMessageOptions) => {
          options.onFinish(mockResponse);
          return Promise.resolve();
        },
      );

      const signedMessageResponse = await signMessage(
        "abcdefghijk123456789",
        "bc1q7q5qyqgqjgq5qyqgqjgq5qyqgqjgq5qyqgq5qy",
        "mainnet",
      );

      expect(signedMessageResponse).toEqual({
        base64:
          "G+LrYa7T5dUMDgQduAErw+i6ebK4GqTXYVWIDM+snYk7Yc6LdPitmaqM6j+iJOeID1CsMXOJFpVopvPiHBdulkE=",
        hex: "1be2eb61aed3e5d50c0e041db8012bc3e8ba79b2b81aa4d76155880ccfac9d893b61ce8b74f8ad99aa8cea3fa224e7880f50ac317389169568a6f3e21c176e9641",
      });
    });

    test("should throw error on user cancel", () => {
      const CANCELLED_BY_USER_ERROR =
        new BrowserWalletRequestCancelledByUserError();

      const signMessageSpy = vi.spyOn(satsConnect, "signMessage");
      signMessageSpy.mockImplementation(
        (options: satsConnect.SignMessageOptions) => {
          options.onCancel();
          return Promise.resolve();
        },
      );
      expect(() =>
        signMessage(
          "abcdefghijk123456789",
          "bc1q7q5qyqgqjgq5qyqgqjgq5qyqgqjgq5qyqgq5qy",
          "mainnet",
        ),
      ).rejects.toThrowError(CANCELLED_BY_USER_ERROR);
    });
  });
});
