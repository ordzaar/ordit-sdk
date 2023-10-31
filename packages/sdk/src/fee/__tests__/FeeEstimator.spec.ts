import { FeeEstimator } from "../FeeEstimator";
import { createMockPsbt } from "../utils";

describe("FeeEstimator", () => {
  test("should return an estimated network fee for P2SH-P2WPKH psbt when calculateNetworkFee is called", () => {
    const feeEstimator = new FeeEstimator({
      feeRate: 1,
      network: "mainnet",
      psbt: createMockPsbt("p2sh-p2wpkh"),
    });
    expect(feeEstimator.calculateNetworkFee()).toBe(255);
  });
});
