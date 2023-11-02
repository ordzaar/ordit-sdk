import type { GetUnspentsResponse } from "../api/types";
import type { Inscription } from "../inscription/types";
import type { UTXO } from "../transactions/types";
import { UNSTABLE_decodeObject } from "../utils";

interface SegregateUTXOsBySpendStatusArgOptions {
  utxos: UTXO[];
}

class DatasourceUtility {
  static transformInscriptions(inscriptions?: Inscription[]) {
    if (!inscriptions) return [];

    return inscriptions.map((inscription) => ({
      ...inscription,
      meta: inscription.meta
        ? UNSTABLE_decodeObject(inscription.meta)
        : inscription.meta,
    }));
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
