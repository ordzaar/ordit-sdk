import { DatasourceUtility } from "..";
import {
  INSCRIPTIONS,
  INSCRIPTIONS_ENCODED_META,
  UNSPENT_UTXOS,
  UNSPENT_UTXOS_WITH_UNSAFE_TO_SPEND,
} from "../__fixtures__/DataSourceUtility.fixture";

describe("DatasourceUtility", () => {
  describe("parseInscriptions", () => {
    describe("when decodeMetadata is true", () => {
      test("should return identical inscriptions when metadata property values do not contain any special characters", () => {
        const INSCRIPTIONS_COPY = INSCRIPTIONS.map((inscription) => ({
          ...inscription,
          meta: { ...inscription.meta },
        }));
        expect(
          DatasourceUtility.parseInscriptions(INSCRIPTIONS, {
            decodeMetadata: true,
          }),
        ).toEqual(INSCRIPTIONS_COPY);
      });

      test("should transform all inscriptions in array", () => {
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
          DatasourceUtility.parseInscriptions([INSCRIPTION_ENCODED_META_COPY], {
            decodeMetadata: true,
          }),
        ).toContainEqual(INSCRIPTION_DECODED_META);
        // TODO: Fix UNSTABLE_decodeObject to ensure immutability
        // expect(INSCRIPTION_ENCODED_META_COPY).toEqual(INSCRIPTIONS_ENCODED_META);
      });
    });

    describe("when decodeMetadata is false", () => {
      test("should not transform all inscriptions in array", () => {
        const INSCRIPTION_ENCODED_META_COPY = {
          ...INSCRIPTIONS_ENCODED_META[0],
          meta: { ...INSCRIPTIONS_ENCODED_META[0].meta },
        };
        expect(
          DatasourceUtility.parseInscriptions([INSCRIPTION_ENCODED_META_COPY], {
            decodeMetadata: false,
          }),
        ).toEqual(INSCRIPTIONS_ENCODED_META);
      });
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
