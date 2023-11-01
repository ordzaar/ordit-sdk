import { Transaction as BTCTransaction } from "bitcoinjs-lib";

import { rpc } from "../api/jsonrpc";
import type {
  GetBalanceOptions,
  GetInscriptionOptions,
  GetInscriptionsOptions,
  GetInscriptionUTXOOptions,
  GetSpendablesOptions,
  GetTxOptions,
  GetUnspentsOptions,
  GetUnspentsResponse,
  RelayOptions,
} from "../api/types";
import type { Network } from "../config/types";
import { OrditSDKError } from "../errors";
import type { Inscription } from "../inscription/types";
import type { Transaction, UTXO, UTXOLimited } from "../transactions/types";
import { outpointToIdFormat } from "../utils";
import { BaseDatasource } from "./BaseDatasource";
import { DatasourceUtility } from "./DatasourceUtility";
import type { JsonRpcPagination } from "./types";

interface JsonRpcDatasourceOptions {
  network: Network;
}

class JsonRpcDatasource extends BaseDatasource {
  constructor({ network }: JsonRpcDatasourceOptions) {
    super({ network });
  }

  async getBalance({ address }: GetBalanceOptions) {
    if (!address) {
      throw new OrditSDKError("Invalid request");
    }

    return rpc[this.network].call<number>(
      "Address.GetBalance",
      { address },
      rpc.id,
    );
  }

  async getInscription({ id: _id, decodeMetadata }: GetInscriptionOptions) {
    if (!_id) {
      throw new OrditSDKError("Invalid request");
    }

    const id = outpointToIdFormat(_id);

    let inscription = await rpc[this.network].call<Inscription>(
      "Ordinals.GetInscription",
      { id },
      rpc.id,
    );
    if (decodeMetadata) {
      inscription = DatasourceUtility.transformInscriptions([inscription])[0];
    }

    return inscription;
  }

  async getInscriptionUTXO({ id: _id }: GetInscriptionUTXOOptions) {
    if (!_id) {
      throw new OrditSDKError("Invalid request");
    }

    const id = outpointToIdFormat;

    return rpc[this.network].call<UTXO>(
      "Ordinals.GetInscriptionUtxo",
      { id },
      rpc.id,
    );
  }

  async getInscriptions({
    creator,
    owner,
    mimeType,
    mimeSubType,
    outpoint,
    decodeMetadata,
    sort = "asc",
    limit = 25,
    next = null,
  }: GetInscriptionsOptions) {
    let inscriptions: Inscription[] = [];
    do {
      const { inscriptions: _inscriptions, pagination } = await rpc[
        this.network
      ].call<{
        inscriptions: Inscription[];
        pagination: JsonRpcPagination;
      }>(
        "Ordinals.GetInscriptions",
        {
          filter: { creator, owner, mimeType, mimeSubType, outpoint },
          sort: { number: sort },
          pagination: { limit, next },
        },
        rpc.id,
      );
      inscriptions = inscriptions.concat(_inscriptions);
      next = pagination.next;
    } while (next !== null);
    return decodeMetadata
      ? DatasourceUtility.transformInscriptions(inscriptions)
      : inscriptions;
  }

  async getSpendables({
    address,
    value,
    rarity = ["common"],
    filter = [],
    limit = 200,
    type = "spendable",
  }: GetSpendablesOptions) {
    if (!address || isNaN(value) || !value) {
      throw new OrditSDKError("Invalid request");
    }

    return rpc[this.network].call<UTXOLimited[]>(
      "Address.GetSpendables",
      {
        address,
        value,
        safetospend: type === "spendable",
        allowedrarity: rarity,
        filter,
        limit,
      },
      rpc.id,
    );
  }

  async getTransaction({
    txId,
    ordinals = true,
    hex = false,
    witness = true,
    decodeMetadata = true,
  }: GetTxOptions) {
    if (!txId) {
      throw new OrditSDKError("Invalid request");
    }

    const tx = await rpc[this.network].call<Transaction>(
      "Transactions.GetTransaction",
      {
        txid: txId,
        options: {
          ord: ordinals,
          hex,
          witness,
        },
      },
      rpc.id,
    );

    tx.vout = tx.vout.map((vout) => {
      vout.inscriptions = decodeMetadata
        ? DatasourceUtility.transformInscriptions(vout.inscriptions)
        : vout.inscriptions;
      return vout;
    });

    return {
      tx,
      rawTx: hex && tx.hex ? BTCTransaction.fromHex(tx.hex) : undefined,
    };
  }

  async getUnspents({
    address,
    type = "spendable",
    rarity = ["common"],
    sort = "desc",
    limit = 50,
    next = null,
  }: GetUnspentsOptions): Promise<GetUnspentsResponse> {
    if (!address) {
      throw new OrditSDKError("Invalid request");
    }

    let utxos: UTXO[] = [];
    do {
      const { unspents, pagination } = await rpc[this.network].call<{
        unspents: UTXO[];
        pagination: JsonRpcPagination;
      }>(
        "Address.GetUnspents",
        {
          address,
          options: {
            allowedrarity: rarity,
            safetospend: type === "spendable",
          },
          pagination: {
            limit,
            next,
          },
          sort: { value: sort },
        },
        rpc.id,
      );

      utxos = utxos.concat(unspents);
      next = pagination.next;
    } while (next !== null);

    return DatasourceUtility.segregateUTXOsBySpendStatus({ utxos });
  }

  async relay({ hex, maxFeeRate, validate = true }: RelayOptions) {
    if (!hex) {
      throw new OrditSDKError("Invalid request");
    }

    if (maxFeeRate && (maxFeeRate < 0 || isNaN(maxFeeRate))) {
      throw new OrditSDKError("Invalid max fee rate");
    }

    return rpc[this.network].call<string>(
      "Transactions.Relay",
      { hex, maxFeeRate, validate },
      rpc.id,
    );
  }
}

export { JsonRpcDatasource };
