import * as ecc from "@bitcoinerlab/secp256k1";
import { BIP32Factory } from "bip32";
import { Buffer } from "buffer";

import type { Network } from "../config/types";
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
  type: "legacy";
  nonWitnessUtxo?: Buffer;
  witnessUtxo?: {
    script: Buffer;
    value: number;
  };
};

type SegwitInputType = BaseInputType & {
  type: "segwit";
  witnessUtxo?: {
    script: Buffer;
    value: number;
  };
  witness?: Buffer[];
};

type NestedSegwitInputType = BaseInputType &
  Omit<SegwitInputType, "type"> & {
    type: "nested-segwit";
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
    type: "taproot";
    tapInternalKey: Buffer;
    tapLeafScript?: TapLeafScript[];
  };

export type InputType =
  | LegacyInputType
  | SegwitInputType
  | NestedSegwitInputType
  | TaprootInputType;

interface ProcessInputOptions {
  utxo: UTXO | UTXOLimited;
  pubKey: string;
  network: Network;
  sighashType?: number;
  witness?: Buffer[];
  datasource?: BaseDatasource;
}

const bip32 = BIP32Factory(ecc);

function generateTaprootInput({
  utxo,
  pubKey,
  network,
  sighashType,
  witness,
}: ProcessInputOptions): TaprootInputType {
  const chainCode = Buffer.alloc(32);
  chainCode.fill(1);

  const key = bip32.fromPublicKey(
    Buffer.from(pubKey, "hex"),
    chainCode,
    getNetwork(network)
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

function generateNestedSegwitInput({
  utxo,
  pubKey,
  network,
  sighashType,
}: ProcessInputOptions): NestedSegwitInputType {
  const p2sh = createPayment(Buffer.from(pubKey, "hex"), "p2sh", network);
  if (!p2sh || !p2sh.output || !p2sh.redeem) {
    throw new Error("Unable to process Segwit input");
  }

  return {
    type: "nested-segwit",
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
      return generateNestedSegwitInput({ utxo, pubKey, network, sighashType });

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
