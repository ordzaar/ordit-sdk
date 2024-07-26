import type { AddressFormat } from "../addresses/types";
import type { Network } from "../config/types";
import { BIP32, CHAIN_CODE } from "../constants";
import { BaseDatasource, JsonRpcDatasource } from "../modules";
import { createPayment, getNetwork, toXOnly } from "../utils";
import type { UTXO, UTXOLimited } from "./types";

// TODO: replace below interfaces and custom types w/ PsbtInputExtended from bitcoinjs-lib
interface BaseInputType {
  hash: string;
  index: number;
  sighashType?: number;
}

type LegacyInputType = BaseInputType & {
  type: Extract<AddressFormat, "legacy">;
  nonWitnessUtxo?: Buffer;
  witnessUtxo?: {
    script: Buffer;
    value: number;
  };
};

type SegwitInputType = BaseInputType & {
  type: Extract<AddressFormat, "segwit">;
  witnessUtxo?: {
    script: Buffer;
    value: number;
  };
  witness?: Buffer[];
};

type P2SHP2WPKHInputType = BaseInputType &
  Omit<SegwitInputType, "type"> & {
    type: Extract<AddressFormat, "p2sh-p2wpkh">;
    redeemScript: Buffer;
  };

interface TapScript {
  leafVersion: number;
  script: Buffer;
}
export declare type ControlBlock = Buffer;
export interface TapLeafScript extends TapScript {
  controlBlock: ControlBlock;
}

type TaprootInputType = BaseInputType &
  Omit<SegwitInputType, "type"> & {
    type: Extract<AddressFormat, "taproot">;
    tapInternalKey: Buffer;
    tapLeafScript?: TapLeafScript[];
  };

export type InputType =
  | LegacyInputType
  | SegwitInputType
  | P2SHP2WPKHInputType
  | TaprootInputType;

interface ProcessInputOptions {
  utxo: UTXO | UTXOLimited;
  pubKey: string;
  network: Network;
  sighashType?: number;
  witness?: Buffer[];
  datasource?: BaseDatasource;
}

function generateTaprootInput({
  utxo,
  pubKey,
  network,
  sighashType,
  witness,
}: ProcessInputOptions): TaprootInputType {
  const key = BIP32.fromPublicKey(
    Buffer.from(pubKey, "hex"),
    CHAIN_CODE,
    getNetwork(network),
  );
  const xOnlyPubKey = toXOnly(key.publicKey);

  if (!utxo.scriptPubKey.hex) {
    throw new Error("Unable to process p2tr input");
  }

  return {
    type: "taproot",
    hash: utxo.txid,
    index: utxo.n,
    tapInternalKey: xOnlyPubKey,
    witnessUtxo: {
      script: Buffer.from(utxo.scriptPubKey.hex, "hex"),
      value: utxo.sats,
    },
    witness,
    ...(sighashType ? { sighashType } : undefined),
  };
}

function generateSegwitInput({
  utxo,
  sighashType,
}: Omit<ProcessInputOptions, "pubKey" | "network">): SegwitInputType {
  if (!utxo.scriptPubKey.hex) {
    throw new Error("Unable to process Segwit input");
  }

  return {
    type: "segwit",
    hash: utxo.txid,
    index: utxo.n,
    witnessUtxo: {
      script: Buffer.from(utxo.scriptPubKey.hex, "hex"),
      value: utxo.sats,
    },
    ...(sighashType ? { sighashType } : undefined),
  };
}

function generateP2SHP2WPKHInput({
  utxo,
  pubKey,
  network,
  sighashType,
}: ProcessInputOptions): P2SHP2WPKHInputType {
  const p2sh = createPayment(Buffer.from(pubKey, "hex"), "p2sh", network);
  if (!p2sh || !p2sh.output || !p2sh.redeem) {
    throw new Error("Unable to process P2SH input");
  }

  return {
    type: "p2sh-p2wpkh",
    hash: utxo.txid,
    index: utxo.n,
    redeemScript: p2sh.redeem.output!,
    witnessUtxo: {
      script: Buffer.from(utxo.scriptPubKey.hex, "hex"),
      value: utxo.sats,
    },
    ...(sighashType ? { sighashType } : undefined),
  };
}

async function generateLegacyInput({
  utxo,
  sighashType,
  network,
  pubKey,
  datasource,
}: ProcessInputOptions &
  Required<Pick<ProcessInputOptions, "datasource">>): Promise<LegacyInputType> {
  const { rawTx } = await datasource.getTransaction({
    txId: utxo.txid,
    hex: true,
  });
  if (!rawTx) {
    throw new Error("Unable to process legacy input");
  }

  const p2pkh = createPayment(Buffer.from(pubKey, "hex"), "p2pkh", network);

  return {
    type: "legacy",
    hash: utxo.txid,
    index: utxo.n,
    nonWitnessUtxo: rawTx?.toBuffer(),
    witnessUtxo: {
      script: p2pkh.output!,
      value: utxo.sats,
    },
    ...(sighashType ? { sighashType } : undefined),
  };
}

export async function processInput({
  utxo,
  pubKey,
  network,
  sighashType,
  witness,
  datasource: _datasource,
}: ProcessInputOptions): Promise<InputType> {
  const datasource = _datasource || new JsonRpcDatasource({ network });
  switch (utxo.scriptPubKey.type) {
    case "witness_v1_taproot":
      return generateTaprootInput({
        utxo,
        pubKey,
        network,
        sighashType,
        witness,
      });

    case "witness_v0_scripthash":
    case "witness_v0_keyhash":
      return generateSegwitInput({ utxo, sighashType });

    case "scripthash":
      return generateP2SHP2WPKHInput({ utxo, pubKey, network, sighashType });

    case "pubkeyhash":
      return generateLegacyInput({
        utxo,
        sighashType,
        network,
        pubKey,
        datasource,
      });

    default:
      throw new Error("invalid script pub type");
  }
}
