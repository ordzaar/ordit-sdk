import type { GetUnspentsResponse } from "../api/types";
import type { Inscription } from "../inscription/types";
import type { UTXO } from "../transactions/types";
import { UNSTABLE_decodeObject } from "../utils";

interface SegregateUTXOsBySpendStatusArgOptions {
  utxos: UTXO[];
}

interface ParseInscriptionsOptions {
  decodeMetadata: boolean;
}

class DatasourceUtility {
  /**
   * Parses an inscription.
   *
   * @param inscription Inscription
   * @param options Options
   * - `decodeMetadata` decodes the metadata object into [valid URI components](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent).
   * @returns Parsed inscription
   */
  static parseInscription(
    inscription: Inscription,
    { decodeMetadata }: ParseInscriptionsOptions,
  ) {
    return {
      ...inscription,
      meta:
        decodeMetadata && inscription.meta
          ? UNSTABLE_decodeObject(inscription.meta)
          : inscription.meta,
    };
  }

  /**
   * Parses inscriptions.
   *
   * @param inscriptions Inscriptions
   * @param options Options
   * - `decodeMetadata` decodes the metadata object into [valid URI components](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent).
   * @returns Parsed inscriptions
   */
  static parseInscriptions(
    inscriptions: Inscription[],
    { decodeMetadata }: ParseInscriptionsOptions,
  ) {
    return inscriptions.map((inscription) =>
      this.parseInscription(inscription, { decodeMetadata }),
    );
  }

  static segregateUTXOsBySpendStatus({
    utxos,
  }: SegregateUTXOsBySpendStatusArgOptions): GetUnspentsResponse {
    const { spendableUTXOs, unspendableUTXOs } = utxos.reduce(
      (acc, utxo) => {
        if (utxo.safeToSpend) {
          acc.spendableUTXOs.push(utxo);
        } else {
          acc.unspendableUTXOs.push(utxo);
        }
        return acc;
      },
      {
        spendableUTXOs: [] as UTXO[],
        unspendableUTXOs: [] as UTXO[],
      },
    );

    return {
      totalUTXOs: utxos.length,
      spendableUTXOs,
      unspendableUTXOs,
    };
  }
}

export { DatasourceUtility };
