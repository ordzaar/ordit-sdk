import { OrditSDKError } from "../../errors";
import { FeeEstimator } from "../FeeEstimator";
import { createMockPsbt } from "../utils";

describe("FeeEstimator", () => {
  describe("constructor", () => {
    const INVALID_FEE_RATE_ERROR = new OrditSDKError("Invalid feeRate");
    test("should throw an error for negative fee rate", () => {
      expect(() => {
        new FeeEstimator({
          feeRate: -1,
          network: "mainnet",
          psbt: createMockPsbt("p2sh-p2wpkh"),
        });
      }).toThrowError(INVALID_FEE_RATE_ERROR);
    });

    test("should throw an error for fee rates with decimals", () => {
      expect(() => {
        new FeeEstimator({
          feeRate: 1.1,
          network: "mainnet",
          psbt: createMockPsbt("p2sh-p2wpkh"),
        });
      }).toThrowError(INVALID_FEE_RATE_ERROR);
    });
  });

  describe("calculateNetworkFee", () => {
    test("should return network fee for P2SH-P2WPKH psbt", () => {
      const feeEstimator = new FeeEstimator({
        feeRate: 1,
        network: "mainnet",
        psbt: createMockPsbt("p2sh-p2wpkh"),
      });
      expect(feeEstimator.calculateNetworkFee()).toBe(255);
    });

    test("should return network fee for P2SH-P2WPKH psbt with a feeRate that would lose precision", () => {
      const feeEstimator = new FeeEstimator({
        // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
        feeRate: 1.000000000000000001,
        network: "mainnet",
        psbt: createMockPsbt("p2sh-p2wpkh"),
      });
      expect(feeEstimator.calculateNetworkFee()).toBe(255);
    });
  });
});
