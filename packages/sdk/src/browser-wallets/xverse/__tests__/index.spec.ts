// @vitest-environment happy-dom
import { isInstalled } from "..";

describe("Xverse Wallet", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("isInstalled", () => {
    test("should return true if installed", () => {
      vi.stubGlobal("BitcoinProvider", {});
      expect(typeof window).not.toBeUndefined();
      expect(isInstalled()).toBeTruthy();
    });

    test("should return false if not installed", () => {
      expect(typeof window).not.toBeUndefined();
      expect(isInstalled()).toBeFalsy();
    });
  });
});
