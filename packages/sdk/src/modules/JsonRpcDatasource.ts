import { Transaction as BTCTransaction } from "bitcoinjs-lib";

import { rpc } from "../api/jsonrpc";
import type {
  GetBalanceOptions,
  GetInfo,
  GetInscriptionOptions,
  GetInscriptionsOptions,
  GetInscriptionUTXOOptions,
  GetRuneBalanceResponse,
  GetRuneBalancesOptions,
  GetRuneOptions,
  GetRuneResponse,
  GetRuneSpendablesOptions,
  GetRuneSpendablesResponse,
  GetSpendablesOptions,
  GetTransactionOptions,
  GetUnspentsOptions,
  GetUnspentsResponse,
  RelayOptions,
} from "../api/types";
import type { Network } from "../config/types";
import { OrditSDKError } from "../errors";
import type { Inscription } from "../inscription/types";
import { RuneBalance, RuneDetail, RuneSpendables } from "../runes/types";
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
      inscriptions: DatasourceUtility.parseInscriptions(
        vout.inscriptions ? vout.inscriptions : [],
        {
          decodeMetadata,
        },
      ),
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

  async getInfo() {
    return rpc[this.network].call<GetInfo>("GetInfo", rpc.id);
  }

  async getRune({ runeQuery }: GetRuneOptions): Promise<RuneDetail | null> {
    if (!runeQuery) {
      throw new OrditSDKError("Invalid request");
    }

    // TODO: handle error properly
    let response: GetRuneResponse;
    try {
      response = await rpc[this.network].call<GetRuneResponse>(
        "Runes.GetRune",
        { runeQuery },
        rpc.id,
      );
    } catch (error) {
      return null;
    }
    response = response!;

    return {
      ...response,
      terms: response.terms
        ? {
            amount: response.terms.amount
              ? BigInt(response.terms.amount)
              : undefined,
            cap: response.terms.cap ? BigInt(response.terms.cap) : undefined,
            height: response.terms.height
              ? [
                  response.terms.height[0]
                    ? BigInt(response.terms.height[0])
                    : undefined,
                  response.terms.height[1]
                    ? BigInt(response.terms.height[1])
                    : undefined,
                ]
              : undefined,
            offset: response.terms.offset
              ? [
                  response.terms.offset[0]
                    ? BigInt(response.terms.offset[0])
                    : undefined,
                  response.terms.offset[1]
                    ? BigInt(response.terms.offset[1])
                    : undefined,
                ]
              : undefined,
          }
        : undefined,
      block: BigInt(response.block),
      mints: BigInt(response.mints),
      number: BigInt(response.number),
      premine: BigInt(response.premine),
      burned: response.burned ? BigInt(response.burned) : undefined,
      timestamp: parseInt(response.timestamp, 10) * 1000,
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
        ? v.outpoints.map((x) => ({
            outpoint: x.outpoint,
            amount: BigInt(x.amount),
            utxo: x.utxo,
          }))
        : undefined,
    }));
  }

  async getRuneSpendables({
    address,
    spacedRune,
    amount,
  }: GetRuneSpendablesOptions): Promise<RuneSpendables> {
    if (!(address && spacedRune && amount)) {
      throw new OrditSDKError("Invalid request");
    }

    const response = await rpc[this.network].call<GetRuneSpendablesResponse>(
      "Runes.GetSpendables",
      { address, spacedRune, amount: amount.toString() },
      rpc.id,
    );

    return {
      utxos: response.utxos.map((v) => ({
        utxo: v.utxo,
        amount: BigInt(v.amount),
      })),
      changeAmount: BigInt(response.changeAmount),
    };
  }
}
