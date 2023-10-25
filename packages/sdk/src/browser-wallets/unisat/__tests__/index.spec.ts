// @vitest-environment happy-dom
import { unisat } from "..";

describe("Unisat Wallet", () => {
  describe("isInstalled", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    test("should return true if installed", () => {
      vi.stubGlobal("unisat", {});
      expect(typeof window).not.toBeUndefined();
      expect(unisat.isInstalled()).toBeTruthy();
    });

    test("should return false if not installed", () => {
      expect(typeof window).not.toBeUndefined();
      expect(unisat.isInstalled()).toBeFalsy();
    });
  });
});
