import {
  outpointToIdFormat,
  UNSTABLE_decodeObject,
  UNSTABLE_encodeObject,
} from "..";

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

  describe("UNSTABLE_decodeObject", () => {
    const ENCODED = {
      nested: {
        k: "%D1%88%D0%B5%D0%BB%D0%BB%D1%8B",
      },
      k: "test%3F",
    };
    const DECODED = {
      nested: {
        k: "шеллы",
      },
      k: "test?",
    };
    test("should decode all object properties into valid URI components", () => {
      expect(UNSTABLE_decodeObject(ENCODED)).toEqual(DECODED);
    });
  });
  describe("UNSTABLE_encodeObject", () => {
    const ENCODED = {
      nested: {
        k: "%D1%88%D0%B5%D0%BB%D0%BB%D1%8B",
      },
      k: "test%3F",
    };
    const DECODED = {
      nested: {
        k: "шеллы",
      },
      k: "test?",
    };
    test("should decode all object properties into valid URI components", () => {
      expect(UNSTABLE_encodeObject(DECODED)).toEqual(ENCODED);
    });
  });
});
