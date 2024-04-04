import * as ecc from "@bitcoinerlab/secp256k1";
import { initEccLib, opcodes, payments, script } from "bitcoinjs-lib";
import { Tapleaf } from "bitcoinjs-lib/src/types";

import { MINIMUM_AMOUNT_IN_SATS } from "../constants";
import { OrditSDKError } from "../errors";
import { PSBTBuilder, PSBTBuilderOptions } from "../transactions";
import { InputType, processInput } from "../transactions/helper";
import { UTXOLimited } from "../transactions/types";
import {
  generateTxUniqueIdentifier,
  getDummyP2TRInput,
  getNetwork,
} from "../utils";
import {
  bigintToBuffer,
  parseRuneStrToNumber,
  parseToRuneSpacer,
  runeIdFromStr,
  runeNumberMinimumHeight,
} from "./helper";
import { Runestone } from "./runestone";
import {
  CreateRune,
  DEFAULT_CREATE_POINTER,
  DEFAULT_MINT_POINTER,
  DEFAULT_RUNE_SAT_VALUE,
  DEFAULT_TRANSFER_CHANGE_OUTPUT,
  DEFAULT_TRANSFER_RECEIVER_OUTPUT,
  MINIMUM_UTXO_CONFIRMATIONS,
  MintRune,
  RuneSpendables,
  TransferRune,
} from "./types";

initEccLib(ecc);

export interface CreateRuneBuilderArgOptions
  extends Pick<
    PSBTBuilderOptions,
    | "publicKey"
    | "network"
    | "address"
    | "changeAddress"
    | "feeRate"
    | "datasource"
  > {}

export interface MintRuneBuilderArgOptions
  extends Pick<
    PSBTBuilderOptions,
    | "publicKey"
    | "network"
    | "address"
    | "changeAddress"
    | "feeRate"
    | "datasource"
  > {
  receiveAddress: string;
}

// TODO:
// - add recovery script
// - integrate inscription script
export class CreateRuneTxBuilder extends PSBTBuilder {
  private commitAddress: string | null = null;

  private payment: payments.Payment | null = null;

  private runeCommit: Buffer | null = null;

  private witnessScripts: Record<"runeCommit", Buffer | null> = {
    runeCommit: null,
  };

  private taprootTree: Tapleaf[] = [];

  private suitableUnspent: UTXOLimited | null = null;

  private revealFee: number = 0;

  constructor({
    publicKey,
    network,
    address,
    feeRate,
    datasource,
  }: CreateRuneBuilderArgOptions) {
    super({
      publicKey,
      network,
      address,
      feeRate,
      datasource,
      autoAdjustment: false,
      outputs: [],
    });
  }

  async prepareRune({
    rune,
    divisibility,
    premine,
    symbol,
    terms,
    pointer = DEFAULT_CREATE_POINTER,
    validateMinimumHeight = true,
  }: CreateRune) {
    const runeSpacer = parseToRuneSpacer(rune);
    const runeNumber = parseRuneStrToNumber(runeSpacer.runeStr);

    const runeDetail = await this.datasource.getRune({
      runeQuery: runeSpacer.runeStr,
    });
    if (runeDetail) {
      throw new OrditSDKError(`Rune already exist/etched, try another name`);
    }

    if (validateMinimumHeight) {
      const info = await this.datasource.getInfo();
      const minimumHeight = runeNumberMinimumHeight(
        this.network,
        BigInt(info.indexes.blockchain),
      );
      if (runeNumber < minimumHeight) {
        throw new OrditSDKError(
          `Rune is less than minimum rune height, try another name`,
        );
      }
    }

    const runestone = new Runestone({
      edicts: [],
      etching: {
        rune: runeNumber,
        divisibility,
        premine,
        symbol,
        spacers: runeSpacer.spacers,
        terms,
      },
      pointer,
    });
    const buff = runestone.encipher();

    this.opReturnScripts = [buff];
    this.runeCommit = bigintToBuffer(runeNumber);
  }

  buildCommitScript() {
    if (!this.runeCommit) {
      throw new OrditSDKError(
        `Commit buff is empty, please prepare the rune first`,
      );
    }

    const stacks = [
      Buffer.from(this.xKey, "hex"),

      opcodes.OP_CHECKSIG,
      opcodes.OP_FALSE,
      opcodes.OP_IF,
      // the position of the rune commit doesn't matter,
      // as long as the buffer is inside the if statement.
      // https://github.com/ordinals/ord/blob/0.17.1/src/index/updater/rune_updater.rs#L382
      this.runeCommit,
      opcodes.OP_ENDIF,
    ];

    return script.compile(stacks);
  }

  buildWitness() {
    this.witnessScripts = {
      runeCommit: this.buildCommitScript(),
    };
  }

  buildTaprootTree() {
    this.buildWitness();
    this.taprootTree = [{ output: this.witnessScripts.runeCommit! }];
  }

  getRuneCommitRedeemScript(): payments.Payment["redeem"] {
    return {
      output: this.witnessScripts.runeCommit!,
      redeemVersion: 192,
    };
  }

  private async calculatePreviewNetworkFee() {
    // use dummy input to calclulate preview fee
    this.suitableUnspent = getDummyP2TRInput();
    await this.build();

    this.calculateNetworkFee();

    // reset the psbt
    this.initPSBT();
    this.suitableUnspent = null;
  }

  async generateCommit() {
    this.buildTaprootTree();
    this.payment = payments.p2tr({
      internalPubkey: Buffer.from(this.xKey, "hex"),
      network: getNetwork(this.network),
      scriptTree: this.taprootTree[0],
      redeem: this.getRuneCommitRedeemScript(),
    });

    this.witness = this.payment.witness;
    this.commitAddress = this.payment.address!;

    await this.calculatePreviewNetworkFee();
    this.revealFee = this.fee + this.outputAmount;

    return {
      address: this.payment.address!,
      revealFee: this.revealFee,
    };
  }

  async checkAndSetCommitUTXO() {
    if (this.revealFee <= 0) {
      throw new OrditSDKError(
        "Reveal fee is <= zero, make sure you're already generated the commit address",
      );
    }
    const amount = this.revealFee;

    // Output to be paid to user
    if (amount < MINIMUM_AMOUNT_IN_SATS) {
      throw new OrditSDKError(
        "Requested output amount is lower than minimum dust amount",
      );
    }

    const utxos = await this.retrieveSelectedUTXOs(this.commitAddress!, amount);
    if (utxos.length === 0) {
      throw new OrditSDKError("No selected utxos retrieved");
    }
    const utxo = utxos[0];
    if (utxo.sats < amount) {
      throw new OrditSDKError("Sat utxo is not enough to cover the tx");
    }

    const tx = await this.datasource.getTransaction({
      txId: utxo.txid,
      ordinals: false,
      hex: false,
      witness: false,
      decodeMetadata: false,
    });
    const utxoConfirmations = tx.tx.confirmations;

    if (utxoConfirmations < MINIMUM_UTXO_CONFIRMATIONS) {
      throw new OrditSDKError(
        `Need to wait until UTXO has minimum ${MINIMUM_UTXO_CONFIRMATIONS} confirmations, current confirmations: ${utxoConfirmations}`,
      );
    }

    this.suitableUnspent = utxo;
    return utxo;
  }

  async build() {
    if (!this.suitableUnspent || !this.payment) {
      throw new OrditSDKError("Failed to build PSBT. Transaction not ready");
    }

    this.inputs = [
      {
        type: "taproot",
        hash: this.suitableUnspent.txid,
        index: this.suitableUnspent.n,
        tapInternalKey: Buffer.from(this.xKey, "hex"),
        witnessUtxo: {
          script: this.payment.output!,
          value: this.suitableUnspent.sats,
        },
        tapLeafScript: [
          {
            leafVersion: this.payment.redeemVersion!,
            script: this.payment.redeem!.output!,
            controlBlock:
              this.payment.witness![this.payment.witness!.length - 1],
          },
        ],
      },
    ];

    const outputs = [];

    // mint output
    outputs[DEFAULT_CREATE_POINTER] = {
      address: this.address,
      value: DEFAULT_RUNE_SAT_VALUE,
    };
    // script output
    outputs[outputs.length] = {
      script: this.opReturnScripts[0],
      value: 0,
    };
    this.outputs = outputs;

    await this.prepare();
  }
}

export class MintRuneTxBuilder extends PSBTBuilder {
  private receiveAddress: string;

  constructor({
    publicKey,
    network,
    address,
    receiveAddress,
    feeRate,
    datasource,
  }: MintRuneBuilderArgOptions) {
    super({
      publicKey,
      network,
      address,
      feeRate,
      datasource,
      autoAdjustment: true,
      outputs: [],
    });

    this.receiveAddress = receiveAddress;
  }

  async mint({ spacedRune, receiveAddress = this.receiveAddress }: MintRune) {
    const runeDetail = await this.datasource.getRune({
      runeQuery: spacedRune,
    });
    if (!runeDetail) {
      throw new OrditSDKError(`Rune not found`);
    }
    if (!runeDetail.mintable) {
      throw new OrditSDKError(`Rune is not mintable`);
    }

    const runestone = new Runestone({
      mint: runeIdFromStr(runeDetail.rune_id),
      pointer: DEFAULT_MINT_POINTER,
      edicts: [],
    });

    const buff = runestone.encipher();

    this.opReturnScripts = [buff];

    // mint output
    this.outputs[DEFAULT_MINT_POINTER] = {
      address: receiveAddress,
      value: DEFAULT_RUNE_SAT_VALUE,
    };

    // script output
    this.outputs[this.outputs.length] = {
      script: buff,
      value: 0,
    };

    return this.prepare();
  }
}

export class TransferRuneTxBuilder extends PSBTBuilder {
  private receiveAddress: string;

  constructor({
    publicKey,
    network,
    address,
    receiveAddress,
    feeRate,
    datasource,
  }: MintRuneBuilderArgOptions) {
    super({
      publicKey,
      network,
      address,
      feeRate,
      datasource,
      autoAdjustment: true,
      outputs: [],
    });

    this.receiveAddress = receiveAddress;
  }

  async prepareRuneInputs(runeSpendables: RuneSpendables) {
    const promises: Promise<InputType>[] = [];
    for (let i = 0; i < runeSpendables.utxos.length; i += 1) {
      const { utxo } = runeSpendables.utxos[i];
      const promise = processInput({
        utxo,
        pubKey: this.publicKey,
        network: this.network,
        datasource: this.datasource,
      });

      promises.push(promise);
    }

    const response = await Promise.all(promises);
    for (let i = 0; i < response.length; i += 1) {
      const txUniqueIdentifier = generateTxUniqueIdentifier(
        response[i].hash,
        response[i].index,
      );
      if (this.usedUTXOs.includes(txUniqueIdentifier)) {
        return;
      }
      this.usedUTXOs.push(txUniqueIdentifier);
    }

    this.inputs = response;
  }

  async transfer({
    spacedRune,
    amount,
    receiveAddress = this.receiveAddress,
  }: TransferRune) {
    const runeDetail = await this.datasource.getRune({
      runeQuery: spacedRune,
    });
    if (!runeDetail) {
      throw new OrditSDKError(`Rune not found`);
    }

    const runeBalances = await this.datasource.getRuneBalances({
      address: this.address,
      showOutpoints: true,
    });

    const runeBalance = runeBalances.filter(
      (v) => v.spaced_rune === `${runeDetail.spaced_rune}`,
    )[0];
    if (!runeBalance) {
      throw new OrditSDKError(`Address doesn't have the rune token`);
    }
    if (runeBalance.amount < amount) {
      throw new OrditSDKError(`Not enough rune balance`);
    }

    const runeSpendables = await this.datasource.getRuneSpendables({
      address: this.address,
      spacedRune: runeDetail.spaced_rune,
      amount,
    });

    await this.prepareRuneInputs(runeSpendables);

    const changeRuneAmount = runeSpendables.changeAmount;
    const runestone = new Runestone({
      edicts: [
        {
          id: runeIdFromStr(runeDetail.rune_id),
          amount,
          output: BigInt(DEFAULT_TRANSFER_RECEIVER_OUTPUT),
        },
        ...(changeRuneAmount > 0
          ? [
              {
                id: runeIdFromStr(runeDetail.rune_id),
                amount: changeRuneAmount,
                output: BigInt(DEFAULT_TRANSFER_CHANGE_OUTPUT),
              },
            ]
          : []),
      ],
    });
    const buff = runestone.encipher();

    this.opReturnScripts = [buff];

    // receiver output
    this.outputs[DEFAULT_TRANSFER_RECEIVER_OUTPUT] = {
      address: receiveAddress,
      value: DEFAULT_RUNE_SAT_VALUE,
    };

    // change output if any
    if (changeRuneAmount > 0) {
      this.outputs[DEFAULT_TRANSFER_CHANGE_OUTPUT] = {
        address: this.address,
        value: DEFAULT_RUNE_SAT_VALUE,
      };
    }

    // script output
    this.outputs[this.outputs.length] = {
      script: buff,
      value: 0,
    };

    await this.prepare();
  }
}
