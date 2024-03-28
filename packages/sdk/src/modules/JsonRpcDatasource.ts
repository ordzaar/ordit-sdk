import { Transaction as BTCTransaction } from "bitcoinjs-lib";

import { rpc } from "../api/jsonrpc";
import type {
  GetBalanceOptions,
  GetInscriptionOptions,
  GetInscriptionsOptions,
  GetInscriptionUTXOOptions,
  GetRuneBalanceResponse,
  GetRuneBalancesOptions,
  GetRuneOptions,
  GetRuneResponse,
  GetSpendablesOptions,
  GetTransactionOptions,
  GetUnspentsOptions,
  GetUnspentsResponse,
  RelayOptions,
} from "../api/types";
import type { Network } from "../config/types";
import { OrditSDKError } from "../errors";
import type { Inscription } from "../inscription/types";
import { RuneBalance, RuneDetail } from "../runes/types";
import type { Transaction, UTXO, UTXOLimited } from "../transactions/types";
import { outpointToIdFormat } from "../utils";
import { BaseDatasource } from "./BaseDatasource";
import { DatasourceUtility } from "./DatasourceUtility";
import type {
  AddressGetUnspentsJsonRpcResponse,
  OrdinalsGetInscriptionsJsonRpcResponse,
} from "./types";

export interface JsonRpcDatasourceOptions {
  network: Network;
}

export class JsonRpcDatasource extends BaseDatasource {
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

  async getInscription({
    id: _id,
    decodeMetadata = false,
  }: GetInscriptionOptions) {
    if (!_id) {
      throw new OrditSDKError("Invalid request");
    }

    const id = outpointToIdFormat(_id);

    const inscription = await rpc[this.network].call<Inscription>(
      "Ordinals.GetInscription",
      { id },
      rpc.id,
    );

    return DatasourceUtility.parseInscription(inscription, { decodeMetadata });
  }

  async getInscriptionUTXO({ id: _id }: GetInscriptionUTXOOptions) {
    if (!_id) {
      throw new OrditSDKError("Invalid request");
    }

    const id = outpointToIdFormat(_id);

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
    decodeMetadata = false,
    sort = "asc",
    limit = 25,
    next: _next = null,
  }: GetInscriptionsOptions) {
    let inscriptions: Inscription[] = [];
    let next = _next;
    do {
      const { inscriptions: _inscriptions, pagination } = await rpc[
        this.network
      ].call<OrdinalsGetInscriptionsJsonRpcResponse>(
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
    return DatasourceUtility.parseInscriptions(inscriptions, {
      decodeMetadata,
    });
  }

  async getSpendables({
    address,
    value,
    rarity = ["common"],
    filter = [],
    limit = 200,
    type = "spendable",
  }: GetSpendablesOptions) {
    if (!address || Number.isNaN(value) || !value) {
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
  }: GetTransactionOptions) {
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

    tx.vout = tx.vout.map((vout) => ({
      ...vout,
      inscriptions: DatasourceUtility.parseInscriptions(vout.inscriptions, {
        decodeMetadata,
      }),
    }));

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
    next: _next = null,
  }: GetUnspentsOptions): Promise<GetUnspentsResponse> {
    if (!address) {
      throw new OrditSDKError("Invalid request");
    }

    let utxos: UTXO[] = [];
    let next = _next;
    do {
      const { unspents, pagination } = await rpc[
        this.network
      ].call<AddressGetUnspentsJsonRpcResponse>(
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

    if (maxFeeRate && (maxFeeRate < 0 || Number.isNaN(maxFeeRate))) {
      throw new OrditSDKError("Invalid max fee rate");
    }

    return rpc[this.network].call<string>(
      "Transactions.Relay",
      { hex, maxFeeRate, validate },
      rpc.id,
    );
  }

  async getRune({ runeQuery }: GetRuneOptions): Promise<RuneDetail> {
    if (!runeQuery) {
      throw new OrditSDKError("Invalid request");
    }

    const response = await rpc[this.network].call<GetRuneResponse>(
      "Runes.GetRune",
      { runeQuery },
      rpc.id,
    );

    return {
      ...response,
      mint: response.mint
        ? {
            ...response.mint,

            limit: response.mint.limit
              ? BigInt(response.mint.limit)
              : undefined,
          }
        : undefined,
      burned: response.burned ? BigInt(response.burned!) : undefined,
      mints: BigInt(response.mints),
      number: BigInt(response.number),
      supply: BigInt(response.supply),
      timestamp: response.timestamp * 1000,
    };
  }

  async getRuneBalances({
    address,
    showOutpoints = false,
  }: GetRuneBalancesOptions): Promise<RuneBalance[]> {
    if (!address) {
      throw new OrditSDKError("Invalid request");
    }

    const response = await rpc[this.network].call<GetRuneBalanceResponse[]>(
      "Runes.GetBalances",
      { address, showOutpoints },
      rpc.id,
    );

    return response.map((v) => ({
      ...v,
      amount: BigInt(v.amount),
      outpoints: v.outpoints
        ? v.outpoints.map((x) => [x[0], BigInt(x[1])])
        : undefined,
    }));
  }
}
