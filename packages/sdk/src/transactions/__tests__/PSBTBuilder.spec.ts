import * as ecc from "@bitcoinerlab/secp256k1";
import { initEccLib } from "bitcoinjs-lib";

import * as jsonrpc from "../../api/jsonrpc";
import { Network } from "../../config/types";
import { ADDRESS_GETSPENDABLES_RESPONSE } from "../__fixtures__/PSBTBuilder.fixture";
import { PSBTBuilder } from "../PSBTBuilder";

describe("PSBTBuilder", () => {
  beforeAll(() => {
    initEccLib(ecc);
  });

  const INPUT_ADDRESS =
    "tb1p98dv6f5jp5qr4z2dtaljvwrhq34xrr8zuaqgv4ajf36vg2mmsruqt5m3lv";
  const OUTPUT_ADDRESS = "tb1qatkgzm0hsk83ysqja5nq8ecdmtwl73zwurawww";
  const PUBLIC_KEY =
    "039ce27aa7666731648421004ba943b90b8273e23a175d9c58e3ec2e643a9b01d1";

  const PSBT_ARGS = {
    address: INPUT_ADDRESS,
    feeRate: 1,
    publicKey: PUBLIC_KEY,
    outputs: [
      {
        address: OUTPUT_ADDRESS,
        value: 600,
      },
    ],
    network: "testnet" as Network,
  };

  describe("constructor", () => {
    test("should create a psbt", () => {
      const psbt = new PSBTBuilder({
        ...PSBT_ARGS,
      });

      expect(psbt).toBeTruthy();
    });
  });

  describe("prepare", () => {
    afterEach(() => {
      vi.resetAllMocks();
    });
    test("should fetch utxo using GetSpendables RPC and prepare psbt for sending", async () => {
      const mockJsonRpc = {
        call: vi.fn().mockResolvedValue(undefined),
        notify: vi.fn().mockResolvedValue(undefined),
        url: "",
      };

      const jsonrpcSpy = vi.spyOn(jsonrpc, "rpc", "get");
      jsonrpcSpy.mockReturnValue({
        id: 1,
        mainnet: mockJsonRpc,
        testnet: {
          ...mockJsonRpc,
          call: vi.fn((method) => {
            if (method === "Address.GetSpendables") {
              return Promise.resolve(ADDRESS_GETSPENDABLES_RESPONSE.result);
            }
            throw new Error(`Unexpected mock call to RPC method ${method}`);
          }),
        },
        regtest: mockJsonRpc,
      });

      const psbt = new PSBTBuilder({
        ...PSBT_ARGS,
      });

      expect(psbt).toBeTruthy();
      await psbt.prepare();
      expect(psbt).toBeTruthy();
      expect(psbt.data).toStrictEqual({
        fee: 144,
        virtualSize: 144,
        weight: 574,
        changeAmount: 4500256,
        inputAmount: 4501000,
        outputAmount: 600,
      });
      expect(psbt.toHex()).toBe(
        "70736274ff01007d02000000010c206e2e9916b497fc2aa6988bf5eaa614833689c65332fd10c47104359687da0200000000fdffffff025802000000000000160014eaec816df7858f124012ed2603e70ddaddff444e20ab44000000000022512029dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f8000000000001012b08ae44000000000022512029dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f80117209ce27aa7666731648421004ba943b90b8273e23a175d9c58e3ec2e643a9b01d1000000",
      );
      expect(psbt.toBase64()).toBe(
        "cHNidP8BAH0CAAAAAQwgbi6ZFrSX/CqmmIv16qYUgzaJxlMy/RDEcQQ1lofaAgAAAAD9////AlgCAAAAAAAAFgAU6uyBbfeFjxJAEu0mA+cN2t3/RE4gq0QAAAAAACJRICnazSaSDQA6iU1ffyY4dwRqYYzi50CGV7JMdMQre4D4AAAAAAABASsIrkQAAAAAACJRICnazSaSDQA6iU1ffyY4dwRqYYzi50CGV7JMdMQre4D4ARcgnOJ6p2ZnMWSEIQBLqUO5C4Jz4joXXZxY4+wuZDqbAdEAAAA=",
      );
    });
  });
});
