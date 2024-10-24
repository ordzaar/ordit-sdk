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
import type { Chain, Network } from "../config/types";
import type { Inscription } from "../inscription/types";
import type { UTXO, UTXOLimited } from "../transactions/types";

export interface BaseDatasourceOptions {
  chain?: Chain;
  network: Network;
}

export abstract class BaseDatasource {
  protected readonly chain: Chain;

  protected readonly network: Network;

  constructor({ chain = "bitcoin", network }: BaseDatasourceOptions) {
    this.chain = chain;
    this.network = network;
  }

  /**
   * Gets the total balance of available for an address.
   *
   * @param options List of options to modify the result provided.
   */
  abstract getBalance({ address }: GetBalanceOptions): Promise<number>;

  /**
   * Gets an inscription by inscription id.
   *
   * @param options List of options to modify the result provided.
   */
  abstract getInscription({
    id,
    decodeMetadata,
  }: GetInscriptionOptions): Promise<Inscription>;

  /**
   * Gets an inscription UTXO by inscription id.
   *
   * @param options List of options to modify the result provided.
   */
  abstract getInscriptionUTXO({ id }: GetInscriptionUTXOOptions): Promise<UTXO>;

  /**
   * Gets a list of indexed inscriptions.
   *
   * @param options List of options to modify the result provided.
   */
  abstract getInscriptions({
    creator,
    owner,
    mimeType,
    mimeSubType,
    outpoint,
    sort,
    limit,
    next,
    decodeMetadata,
  }: GetInscriptionsOptions): Promise<Inscription[]>;

  /**
   * Gets a list of all spendable utxos under the given address.
   *
   * @param options List of options to modify the result provided.
   */
  abstract getSpendables({
    address,
    value,
    type,
    rarity,
    filter,
    limit,
  }: GetSpendablesOptions): Promise<UTXOLimited[]>;

  /**
   * Gets a transaction from the blockchain with optional projection and ordinal details.
   *
   * @param options List of options to modify the result provided.
   */
  abstract getTransaction({
    txId,
    ordinals,
    hex,
    witness,
    decodeMetadata,
  }: GetTransactionOptions): Promise<GetTransactionResponse>;

  /**
   * Gets a list of all unspent utxos under the given address.
   *
   * @param options List of options to modify the result provided.
   */
  abstract getUnspents({
    address,
    type,
    rarity,
    sort,
    limit,
    next,
  }: GetUnspentsOptions): Promise<GetUnspentsResponse>;

  /**
   * Submits a raw transaction (serialized, hex-encoded) to local node and network.
   *
   * Note that the transaction will be sent unconditionally to all peers, so using this for manual rebroadcast may degrade privacy by leaking the transaction’s origin, as nodes will normally not rebroadcast non-wallet transactions already in their mempool.
   *
   * See [sendrawtransaction](https://developer.bitcoin.org/reference/rpc/sendrawtransaction.html) for more information on the behavior of this method.
   *
   * @param options List of options to modify the result provided.
   */
  abstract relay({ hex, maxFeeRate, validate }: RelayOptions): Promise<string>;
}
