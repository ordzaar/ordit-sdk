import { Transaction as BTCTransaction } from "bitcoinjs-lib";

import { ordexer } from "../api/ordexer/ordexer-api";
import type {
  GetBalanceApiResponse,
  GetInscriptionContentApiResponse,
  GetInscriptionResponse,
  GetInscriptionsApiOptions,
  GetInscriptionsApiResponse,
  GetInscriptionUTXOResponse,
  GetSpendablesApiOptions,
  GetSpendablesApiResponse,
  GetTransactionApiResponse,
  GetTranscationApiOptions,
  GetUnspentsApiOptions,
  GetUnspentsApiResponse,
  RelayApiBody,
} from "../api/ordexer/types";
import { InscriptionOrder, SpentOrder } from "../api/ordexer/types";
import type {
  GetBalanceOptions,
  GetInscriptionOptions,
  GetInscriptionsOptions,
  GetInscriptionUTXOOptions,
  GetSpendablesOptions,
  GetTransactionOptions,
  GetTransactionResponse,
  GetUnspentsOptions,
  GetUnspentsResponse,
  RelayOptions,
} from "../api/types";
import type { Network } from "../config/types";
import { OrditSDKError } from "../errors";
import type { Inscription } from "../inscription/types";
import type {
  Transaction,
  UTXO,
  UTXOLimited,
  Vout,
} from "../transactions/types";
import { outpointToIdFormat } from "../utils";
import { BaseDatasource } from "./BaseDatasource";
import { DatasourceUtility } from "./DatasourceUtility";

export interface OrdexerDatasourceOptions {
  network: Network;
}

export class OrdexerDatasource extends BaseDatasource {
  constructor({ network }: OrdexerDatasourceOptions) {
    super({ network });
  }

  /**
   * Gets the total balance of available for an address.
   *
   * @param options List of options to modify the result provided.
   */
  async getBalance({ address }: GetBalanceOptions): Promise<number> {
    if (!address) {
      throw new OrditSDKError("Invalid request");
    }

    const response: GetBalanceApiResponse = await ordexer[this.network].get(
      `/addresses/${address}/balance`,
    );

    return response.balance;
  }

  /**
   * Gets an inscription by inscription id.
   *
   * @param options List of options to modify the result provided.
   */
  async getInscription({
    id: _id,
    decodeMetadata = false,
  }: GetInscriptionOptions): Promise<Inscription> {
    if (!_id) {
      throw new OrditSDKError("Invalid request");
    }

    const id = outpointToIdFormat(_id);

    const response: GetInscriptionResponse = await ordexer[this.network].get(
      `/ordinals/inscriptions/${id}`,
    );

    const mediaContent: string = await this.getInscriptionContent({ id });

    const inscription: Inscription = {
      id: response.inscriptionId,
      outpoint: response.outpoint,
      owner: response.owner ?? "",
      genesis: response.genesis,
      fee: response.fee,
      height: response.height,
      number: response.number,
      sat: response.sat,
      timestamp: response.timestamp,
      mediaType: response.mediaType ?? "",
      mediaSize: response.mediaSize,
      mediaContent,
      meta: response.meta,
    };

    return DatasourceUtility.parseInscription(inscription, { decodeMetadata });
  }

  /**
   * Gets an inscription UTXO by inscription id.
   *
   * @param options List of options to modify the result provided.
   */
  async getInscriptionUTXO({
    id: _id,
  }: GetInscriptionUTXOOptions): Promise<UTXO> {
    if (!_id) {
      throw new OrditSDKError("Invalid request");
    }

    const id = outpointToIdFormat(_id);

    const response: GetInscriptionUTXOResponse = await ordexer[
      this.network
    ].get(`/ordinals/inscriptions/${id}/utxo`);

    const utxo: UTXO = {
      txid: response.txid,
      n: response.n,
      sats: response.sats,
      scriptPubKey: response.scriptPubKey,
      safeToSpend: response.safeToSpend,
      confirmation: response.confirmations,
    };

    return utxo;
  }

  /**
   * Gets a list of indexed inscriptions.
   *
   * @param options List of options to modify the result provided.
   */
  async getInscriptions({
    creator,
    owner,
    mimeType,
    mimeSubType,
    outpoint,
    decodeMetadata = false,
    sort: _sort = "asc",
    limit = 25,
    next: _next = null,
  }: GetInscriptionsOptions): Promise<Inscription[]> {
    let inscriptions: Inscription[] = [];
    let next = _next;

    let sort;
    if (_sort === "asc") {
      sort = InscriptionOrder.NUMBER_ASCENDING;
    } else if (_sort === "desc") {
      sort = InscriptionOrder.NUMBER_DESCENDING;
    } else {
      sort = undefined;
    }

    do {
      const requestParams: GetInscriptionsApiOptions = {
        creator,
        owner,
        mimeType,
        mimeSubtype: mimeSubType,
        outpoint,
        orderBy: sort,
        next: next ?? undefined,
        size: limit,
      };
      const response: GetInscriptionsApiResponse = await ordexer[
        this.network
      ].get(`/addresses/inscriptions`, requestParams);

      const responseInscriptions: Inscription[] = await Promise.all(
        response.data.map(async (inscription) => ({
          id: inscription.inscriptionId,
          outpoint: inscription.outpoint,
          owner: inscription.owner ?? "",
          genesis: inscription.genesis,
          fee: inscription.fee,
          height: inscription.height,
          number: inscription.number,
          sat: inscription.sat,
          timestamp: inscription.timestamp,
          mediaType: inscription.mediaType ?? "",
          mediaSize: inscription.mediaSize,
          mediaContent: await this.getInscriptionContent({
            id: inscription.inscriptionId,
          }),
          meta: inscription.meta,
        })),
      );

      inscriptions = inscriptions.concat(responseInscriptions);
      next = response.page?.next ?? null;
    } while (next !== null);

    return DatasourceUtility.parseInscriptions(inscriptions, {
      decodeMetadata,
    });
  }

  /**
   * Gets a list of all spendable utxos under the given address.
   *
   * @param options List of options to modify the result provided.
   */
  async getSpendables({
    address,
    value,
    type = "spendable",
    filter,
  }: GetSpendablesOptions): Promise<UTXOLimited[]> {
    const requestParams: GetSpendablesApiOptions = {
      value,
      safetospend: type === "spendable",
      filter,
    };
    const response: GetSpendablesApiResponse = await ordexer[this.network].get(
      `/addresses/${address}/spendables`,
      requestParams,
    );

    return response.data.map((spendable) => ({
      txid: spendable.txid,
      n: spendable.n,
      sats: spendable.sats,
      scriptPubKey: spendable.scriptPubKey,
    }));
  }

  /**
   * Gets a transaction from the blockchain with optional projection and ordinal details.
   *
   * @param options List of options to modify the result provided.
   */
  async getTransaction({
    txId,
    ordinals = true,
    hex = false,
    witness = true,
    decodeMetadata = true,
  }: GetTransactionOptions): Promise<GetTransactionResponse> {
    if (!txId) {
      throw new OrditSDKError("Invalid request");
    }

    const requestParams: GetTranscationApiOptions = {
      ord: ordinals,
      hex,
      witness,
    };
    const response: GetTransactionApiResponse = await ordexer[this.network].get(
      `/transactions/${txId}`,
      requestParams,
    );

    const transactionVouts: Vout[] = await Promise.all(
      response.vout.map(async (vout) => ({
        value: vout.value,
        n: vout.n,
        ordinals: vout.ordinals,
        spent: vout.spent,
        scriptPubKey: vout.scriptPubKey,
        inscriptions: await Promise.all(
          vout.inscriptions.map(async (inscription) => ({
            id: inscription.inscriptionId,
            outpoint: inscription.outpoint,
            owner: inscription.owner,
            genesis: inscription.genesis,
            fee: inscription.fee,
            height: inscription.height,
            number: inscription.number,
            sat: inscription.sat,
            timestamp: inscription.timestamp,
            mediaType: inscription.mediaType ?? "",
            mediaSize: inscription.mediaSize,
            mediaContent: await this.getInscriptionContent({
              id: inscription.inscriptionId,
            }),
            meta: inscription.meta,
          })),
        ),
      })),
    );

    const transaction: Transaction = {
      hex: response.hex,
      txid: response.txid,
      hash: response.hash,
      size: response.size,
      vsize: response.vsize,
      version: response.version,
      locktime: response.locktime,
      vin: response.vin,
      vout: transactionVouts,
      blockhash: response.blockhash,
      confirmations: response.confirmations,
      time: response.time,
      blocktime: response.blocktime,
      weight: response.weight,
      fee: response.fee,
      blockheight: response.blockheight,
    };

    transaction.vout = transaction.vout.map((vout) => ({
      ...vout,
      inscriptions: DatasourceUtility.parseInscriptions(vout.inscriptions, {
        decodeMetadata,
      }),
    }));

    return {
      tx: transaction,
      rawTx:
        hex && transaction.hex
          ? BTCTransaction.fromHex(transaction.hex)
          : undefined,
    };
  }

  /**
   * Gets a list of all unspent utxos under the given address.
   *
   * @param options List of options to modify the result provided.
   */
  async getUnspents({
    address,
    type = "spendable",
    rarity = ["common"],
    sort: _sort = "desc",
    limit = 50,
    next: _next = null,
  }: GetUnspentsOptions): Promise<GetUnspentsResponse> {
    if (!address) {
      throw new OrditSDKError("Invalid request");
    }
    let utxos: UTXO[] = [];
    let next = _next;

    let sort;
    if (_sort === "asc") {
      sort = SpentOrder.SATS_ASCENDING;
    } else if (_sort === "desc") {
      sort = SpentOrder.SATS_DESCENDING;
    } else {
      sort = undefined;
    }

    do {
      const requestParams: GetUnspentsApiOptions = {
        allowedRarities: rarity,
        safetospend: type === "spendable",
        orderBy: sort,
        size: limit,
        next: next ?? undefined,
      };
      const response: GetUnspentsApiResponse = await ordexer[this.network].get(
        `/addresses/${address}/unspents`,
        requestParams,
      );

      const responseUTXOs: UTXO[] = response.data.map((unspent) => ({
        txid: unspent.txid,
        n: unspent.n,
        sats: unspent.sats,
        scriptPubKey: unspent.scriptPubKey,
        safeToSpend: unspent.safeToSpend,
        confirmation: unspent.confirmations,
      }));

      utxos = utxos.concat(responseUTXOs);
      next = response.page?.next ?? null;
    } while (next !== null);

    return DatasourceUtility.segregateUTXOsBySpendStatus({ utxos });
  }

  /**
   * Submits a raw transaction (serialized, hex-encoded) to local node and network.
   *
   * Note that the transaction will be sent unconditionally to all peers, so using this for manual rebroadcast may degrade privacy by leaking the transaction’s origin, as nodes will normally not rebroadcast non-wallet transactions already in their mempool.
   *
   * See [sendrawtransaction](https://developer.bitcoin.org/reference/rpc/sendrawtransaction.html) for more information on the behavior of this method.
   *
   * @param options List of options to modify the result provided.
   */
  async relay({ hex, maxFeeRate, validate }: RelayOptions): Promise<string> {
    if (!hex) {
      throw new OrditSDKError("Invalid request");
    }

    if (maxFeeRate && (maxFeeRate < 0 || Number.isNaN(maxFeeRate))) {
      throw new OrditSDKError("Invalid max fee rate");
    }

    const requestBody: RelayApiBody = {
      hex,
      maxFeeRate,
      validate,
    };
    const response: string = await ordexer[this.network].post(
      "transactions/relay",
      requestBody,
    );
    return response;
  }

  async getInscriptionContent({ id: _id }: { id: string }): Promise<string> {
    if (!_id) {
      throw new OrditSDKError("Invalid request");
    }

    const id = outpointToIdFormat(_id);

    const response: GetInscriptionContentApiResponse = await ordexer[
      this.network
    ].get(`/ordinals/inscriptions/${id}/content`);

    const content = response.buffer.toString("base64");

    return content;
  }
}
