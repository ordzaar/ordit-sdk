import { OrditSDKError } from "../errors";
import { PSBTBuilder, PSBTBuilderOptions } from "../transactions";
import { parseRuneStrToNumber, parseToRuneSpacer } from "./helper";
import { Runestone } from "./runestone";
import {
  CreateRune,
  DEFAULT_RUNE_OUTPUT_INDEX,
  DEFAULT_RUNE_SAT_VALUE,
  DEFAULT_RUNE_SCRIPT_INDEX,
  Edict,
  MintRune,
  Rune,
} from "./types";

export interface RuneBuilderArgOptions
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

export class RuneTxBuilder extends PSBTBuilder {
  private receiveAddress: string;

  private rune: Rune | null = null;

  constructor({
    publicKey,
    network,
    address,
    receiveAddress,
    feeRate,
    datasource,
  }: RuneBuilderArgOptions) {
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

  private setOutputs() {
    if (!this.rune) {
      throw new OrditSDKError(`Rune data is empty`);
    }

    const runestone = new Runestone(this.rune);
    const runeScript = runestone.encipher();

    this.opReturnScripts = [runeScript];
    this.outputs[DEFAULT_RUNE_SCRIPT_INDEX] = {
      script: runeScript,
      value: 0,
    };
    this.outputs[DEFAULT_RUNE_OUTPUT_INDEX] = {
      address: this.receiveAddress,
      value: DEFAULT_RUNE_SAT_VALUE,
    };
  }

  public async build() {
    if (this.outputs.length === 0) {
      throw new OrditSDKError(`Outputs are empty`);
    }

    this.setOutputs();
    await this.prepare();
  }

  public async createRune({
    rune,
    symbol,
    divisibility,
    deadline,
    term,
    limit,
    supply,
  }: CreateRune) {
    const runeSpacer = parseToRuneSpacer(rune);

    const runeId = parseRuneStrToNumber(runeSpacer.runeStr);
    const runeSpacers = runeSpacer.spacers;
    // TODO: validate rune on chain

    const edicts: Edict[] = [];
    if (supply !== undefined) {
      edicts.push({
        id: BigInt(0),
        amount: supply,
        output: BigInt(DEFAULT_RUNE_OUTPUT_INDEX),
      });
    }

    this.rune = {
      edicts,
      etching: {
        divisibility,
        mint: {
          deadline,
          limit,
          term,
        },
        rune: runeId,
        spacers: runeSpacers,
        symbol,
      },
    };

    return this.build();
  }

  public mintRune({ rune, runeEdictId, amount }: MintRune) {
    const id = runeEdictId;
    if (!id) {
      if (!rune) {
        throw new OrditSDKError(`Required rune value or rune edict id`);
      }

      // TODO get rune id from rune name
      // need to create new api on ordit
    }

    this.rune = {
      edicts: [
        {
          id: id!,
          amount,
          output: BigInt(DEFAULT_RUNE_OUTPUT_INDEX),
        },
      ],
    };

    return this;
  }

  // TODO transfer rune
  // public transferRune() { }
}
