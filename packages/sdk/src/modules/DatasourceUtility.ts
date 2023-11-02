import { UNSTABLE_decodeObject } from "../utils";
import type { GetUnspentsResponse } from "../api/types";
import type { UTXO } from "../transactions/types";
import type { Inscription } from "../inscription/types";

interface SegregateUTXOsBySpendStatusArgOptions {
  utxos: UTXO[];
}

class DatasourceUtility {
  static transformInscriptions(inscriptions?: Inscription[]) {
    if (!inscriptions) return [];

    return inscriptions.map((inscription) => {
      inscription.meta = inscription.meta
        ? UNSTABLE_decodeObject(inscription.meta)
        : inscription.meta;
      return inscription;
    });
  }

  static segregateUTXOsBySpendStatus({
    utxos,
  }: SegregateUTXOsBySpendStatusArgOptions): GetUnspentsResponse {
    const { spendableUTXOs, unspendableUTXOs } = utxos.reduce(
      (acc, utxo) => {
        !utxo.safeToSpend
          ? acc.unspendableUTXOs.push(utxo)
          : acc.spendableUTXOs.push(utxo);
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
