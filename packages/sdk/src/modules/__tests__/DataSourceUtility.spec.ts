import { DatasourceUtility } from "..";
import {
  INSCRIPTIONS,
  INSCRIPTIONS_ENCODED_META,
  UNSPENT_UTXOS,
  UNSPENT_UTXOS_WITH_UNSAFE_TO_SPEND,
} from "../__fixtures__/DataSourceUtility.fixture";

describe("DatasourceUtility", () => {
  describe("transformInscriptions", () => {
    test("should return empty array if there are no inscriptions", () => {
      expect(DatasourceUtility.transformInscriptions(undefined)).toEqual([]);
      expect(DatasourceUtility.transformInscriptions([])).toEqual([]);
    });
    test("should transform all inscriptions in array", () => {
      expect(DatasourceUtility.transformInscriptions(INSCRIPTIONS)).toEqual(
        INSCRIPTIONS,
      );

      const INSCRIPTION_ENCODED_META_COPY = {
        ...INSCRIPTIONS_ENCODED_META[0],
        meta: { ...INSCRIPTIONS_ENCODED_META[0].meta },
      };
      const INSCRIPTION_DECODED_META = {
        ...INSCRIPTIONS_ENCODED_META[0],
        meta: {
          ...INSCRIPTIONS_ENCODED_META[0].meta,
          iid: "шеллы",
        },
      };
      expect(
        DatasourceUtility.transformInscriptions([
          INSCRIPTION_ENCODED_META_COPY,
        ]),
      ).toContainEqual(INSCRIPTION_DECODED_META);
      // TODO: Fix UNSTABLE_decodeObject to ensure immutability
      //expect(INSCRIPTION_ENCODED_META_COPY).toEqual(INSCRIPTIONS_ENCODED_META);
    });
  });
  describe("segregateUTXOsBySpendStatus", () => {
    test("should return all spendable utxos", () => {
      expect(
        DatasourceUtility.segregateUTXOsBySpendStatus({ utxos: UNSPENT_UTXOS }),
      ).toEqual({
        totalUTXOs: 2,
        spendableUTXOs: UNSPENT_UTXOS,
        unspendableUTXOs: [],
      });
    });

    test("should return all spendable and unspendable utxos", () => {
      const SAFE_TO_SPEND_UTXO = UNSPENT_UTXOS_WITH_UNSAFE_TO_SPEND[1];
      const UNSAFE_TO_SPEND_UTXO = UNSPENT_UTXOS_WITH_UNSAFE_TO_SPEND[0];

      expect(
        DatasourceUtility.segregateUTXOsBySpendStatus({
          utxos: UNSPENT_UTXOS_WITH_UNSAFE_TO_SPEND,
        }),
      ).toEqual({
        totalUTXOs: 2,
        spendableUTXOs: expect.arrayContaining([SAFE_TO_SPEND_UTXO]),
        unspendableUTXOs: expect.arrayContaining([UNSAFE_TO_SPEND_UTXO]),
      });
    });
  });
});
