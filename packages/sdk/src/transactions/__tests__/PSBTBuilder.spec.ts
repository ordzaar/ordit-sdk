import * as ecc from "@bitcoinerlab/secp256k1";
import { initEccLib } from "bitcoinjs-lib";

import { OrditSDKError } from "../..";
import * as jsonrpc from "../../api/jsonrpc";
import { convertBTCToSatoshis } from "../../utils";
import {
  ADDRESS_TO_GETSPENDABLES_RESPONSE,
  TAPROOT_ADDRESS_1,
  TAPROOT_ADDRESS_2,
  TAPROOT_ADDRESS_3,
} from "../__fixtures__/PSBTBuilder.fixture";
import { PSBTBuilder } from "../PSBTBuilder";
import { UTXOLimited } from "../types";

const INSUFFICIENT_FUNDS_ERROR = new OrditSDKError("Insufficient funds");

const mockCall = vi.fn((method, _params) => {
  const params = _params as {
    address: string;
    value: number;
    filter: string[];
  };
  if (method === "Address.GetSpendables") {
    const satsRequest = convertBTCToSatoshis(params.value);
    const utxos = ADDRESS_TO_GETSPENDABLES_RESPONSE[params.address].result
      .filter((tx) => !params.filter.includes(`${tx.txid}:${tx.n}`))
      .reduce((acc, utxo) => {
        const totalAmountFetched = acc.reduce((ac, curr) => ac + curr.sats, 0);
        if (totalAmountFetched < satsRequest) {
          return [...acc, utxo];
        }
        return acc;
      }, [] as Array<UTXOLimited>);

    if (utxos.length === 0) {
      return Promise.reject(INSUFFICIENT_FUNDS_ERROR);
    }
    return Promise.resolve(utxos);
  }
  throw new Error(`Unexpected mock call to RPC method ${method}`);
});

describe("PSBTBuilder", () => {
  beforeAll(() => {
    initEccLib(ecc);
  });

  const OUTPUT_ADDRESS = "tb1qatkgzm0hsk83ysqja5nq8ecdmtwl73zwurawww";

  // used by INPUT_ADDRESS_1
  const PUBLIC_KEY =
    "039ce27aa7666731648421004ba943b90b8273e23a175d9c58e3ec2e643a9b01d1";

  const PSBT_ARGS = {
    feeRate: 1,
    publicKey: PUBLIC_KEY,
    network: "testnet" as const,
  };

  describe("constructor", () => {
    test("should create a psbt", () => {
      const psbt = new PSBTBuilder({
        ...PSBT_ARGS,
        address: TAPROOT_ADDRESS_1,
        outputs: [
          {
            address: OUTPUT_ADDRESS,
            value: 600,
          },
        ],
      });

      expect(psbt).toBeTruthy();
    });
  });

  describe("prepare", () => {
    const mockJsonRpc = {
      call: vi.fn().mockResolvedValue(undefined),
      notify: vi.fn().mockResolvedValue(undefined),
      url: "",
    };
    const mockJsonRpcReturnParams = {
      id: 1,
      mainnet: mockJsonRpc,
      testnet: mockJsonRpc,
      regtest: mockJsonRpc,
    };
    afterAll(() => {
      vi.resetAllMocks();
    });
    beforeAll(() => {
      const jsonrpcSpy = vi.spyOn(jsonrpc, "rpc", "get");
      jsonrpcSpy.mockReturnValue({
        ...mockJsonRpcReturnParams,
        testnet: {
          ...mockJsonRpc,
          call: mockCall,
        },
      });
    });

    test("should fetch utxo using GetSpendables RPC and prepare psbt for sending", async () => {
      const psbt = new PSBTBuilder({
        ...PSBT_ARGS,
        address: TAPROOT_ADDRESS_1,
        outputs: [
          {
            address: OUTPUT_ADDRESS,
            value: 600,
          },
        ],
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

    test("should fetch utxo that is sufficient to cover fee, and utxo is more than that fee", async () => {
      const psbt = new PSBTBuilder({
        ...PSBT_ARGS,
        address: TAPROOT_ADDRESS_2,
        outputs: [
          {
            address: OUTPUT_ADDRESS,
            value: 4501000,
          },
        ],
      });

      expect(psbt).toBeTruthy();
      await psbt.prepare();
      expect(psbt.data).toStrictEqual({
        fee: 159,
        virtualSize: 159,
        weight: 636,
        changeAmount: 0,
        inputAmount: 4501159,
        outputAmount: 4501000,
      });
      expect(psbt.toHex()).toBe(
        "70736274ff01007b02000000020c206e2e9916b497fc2aa6988bf5eaa614833689c65332fd10c47104359687da0200000000fdffffff0c206e2e9916b497fc2aa6988bf5eaa614833689c65332fd10c47104359687da0300000000fdffffff0108ae440000000000160014eaec816df7858f124012ed2603e70ddaddff444e000000000001012b08ae44000000000022512029dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f80117209ce27aa7666731648421004ba943b90b8273e23a175d9c58e3ec2e643a9b01d10001012b9f0000000000000022512029dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f80117209ce27aa7666731648421004ba943b90b8273e23a175d9c58e3ec2e643a9b01d10000",
      );
      expect(psbt.toBase64()).toBe(
        "cHNidP8BAHsCAAAAAgwgbi6ZFrSX/CqmmIv16qYUgzaJxlMy/RDEcQQ1lofaAgAAAAD9////DCBuLpkWtJf8KqaYi/XqphSDNonGUzL9EMRxBDWWh9oDAAAAAP3///8BCK5EAAAAAAAWABTq7IFt94WPEkAS7SYD5w3a3f9ETgAAAAAAAQErCK5EAAAAAAAiUSAp2s0mkg0AOolNX38mOHcEamGM4udAhleyTHTEK3uA+AEXIJzieqdmZzFkhCEAS6lDuQuCc+I6F12cWOPsLmQ6mwHRAAEBK58AAAAAAAAAIlEgKdrNJpINADqJTV9/Jjh3BGphjOLnQIZXskx0xCt7gPgBFyCc4nqnZmcxZIQhAEupQ7kLgnPiOhddnFjj7C5kOpsB0QAA",
      );
    });

    // TODO: fix this test - adding the new utxo to cover the fee incurs another cost
    test.skip(
      "should pass when fetching utxo that is sufficient to cover fee and utxo is equal to fee",
    );

    test("should fail when utxos are sufficient for output but insufficient to cover fee", async () => {
      const psbt = new PSBTBuilder({
        ...PSBT_ARGS,
        address: TAPROOT_ADDRESS_3,
        outputs: [
          {
            address: OUTPUT_ADDRESS,
            value: 4501000,
          },
        ],
      });

      expect(psbt).toBeTruthy();
      await expect(() => psbt.prepare()).rejects.toThrowError(
        INSUFFICIENT_FUNDS_ERROR,
      );
    });

    test("should fail when utxos are insufficient to cover output", async () => {
      const psbt = new PSBTBuilder({
        ...PSBT_ARGS,
        address: TAPROOT_ADDRESS_1,
        outputs: [
          {
            address: OUTPUT_ADDRESS,
            value: 4501001,
          },
        ],
      });

      expect(psbt).toBeTruthy();
      await expect(() => psbt.prepare()).rejects.toThrowError(
        INSUFFICIENT_FUNDS_ERROR,
      );
    });
  });
});
