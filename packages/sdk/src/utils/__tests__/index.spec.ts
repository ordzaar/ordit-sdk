import { outpointToIdFormat } from "..";

describe("utils", () => {
  describe("outpointToIdFormat", () => {
    test("should replace : to i when outpoint format is passed", () => {
      expect(
        outpointToIdFormat(
          "87f4282652ef649c081d3f0d782394c56dbe0ffa6d2f3556426aa8a5d644bfda:0",
        ),
      ).toBe(
        "87f4282652ef649c081d3f0d782394c56dbe0ffa6d2f3556426aa8a5d644bfdai0",
      );
    });

    test("should append i0 to txid if hash is passed", () => {
      expect(
        outpointToIdFormat(
          "87f4282652ef649c081d3f0d782394c56dbe0ffa6d2f3556426aa8a5d644bfda",
        ),
      ).toBe(
        "87f4282652ef649c081d3f0d782394c56dbe0ffa6d2f3556426aa8a5d644bfdai0",
      );
    });
  });
});
