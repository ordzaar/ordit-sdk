import { invert } from "../helper";

describe("addresses helper", () => {
  test("should invert key-value to value-key", () => {
    expect(invert({ a: "b" })).toEqual({ b: "a" });
    expect(invert({})).toEqual({});
  });
});
