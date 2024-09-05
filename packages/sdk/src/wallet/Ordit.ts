import * as ecc from "@bitcoinerlab/secp256k1";
import BIP32Factory, { BIP32Interface } from "bip32";
import { mnemonicToSeedSync } from "bip39";
import { Address as AddressUtils, Signer } from "bip322-js";
import * as bitcoin from "bitcoinjs-lib";
import { isTaprootInput } from "bitcoinjs-lib/src/psbt/bip371";
import { sign } from "bitcoinjs-message";
import ECPairFactory, { ECPairInterface } from "ecpair";

import {
  Account,
  Address,
  ADDRESS_FORMAT_TO_TYPE,
  AddressFormat,
  getAccountDataFromHdNode,
  getAddressesFromPublicKey,
  getAllAccountsFromHdNode,
  OrditSDKError,
} from "..";
import { Network } from "../config/types";
import { getNetwork, tweakSigner } from "../utils";
import { DerivationIndex, SigningMessageOptions, WalletOptions } from "./types";

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);

export class Ordit {
  #network: Network = "testnet";

  #initialized = false;

  #keyPair: ECPairInterface | BIP32Interface;

  #hdNode: BIP32Interface | null = null;

  publicKey: string;

  allAddresses:
    | ReturnType<typeof getAddressesFromPublicKey>
    | ReturnType<typeof getAllAccountsFromHdNode> = [];

  selectedAddressType: AddressFormat | undefined;

  selectedAddress: string | undefined;

  constructor({
    wif,
    seed,
    privateKey,
    bip39,
    network = "testnet",
    format = "legacy",
    account = 0,
    addressIndex = 0,
  }: WalletOptions) {
    this.#network = network;
    const networkObj = getNetwork(network);
    const type = ADDRESS_FORMAT_TO_TYPE[format];
    if (type === "p2wsh") {
      throw new Error("p2wsh is not supported");
    }

    if (wif) {
      const keyPair = ECPair.fromWIF(wif, networkObj);
      this.#keyPair = keyPair;

      this.publicKey = keyPair.publicKey.toString("hex");

      const accounts = getAddressesFromPublicKey(
        keyPair.publicKey,
        network,
        type,
      );
      this.#initialize(accounts);
    } else if (privateKey) {
      const pkBuffer = Buffer.from(privateKey, "hex");
      const keyPair = ECPair.fromPrivateKey(pkBuffer, { network: networkObj });
      this.#keyPair = keyPair;

      this.publicKey = keyPair.publicKey.toString("hex");

      const accounts = getAddressesFromPublicKey(
        keyPair.publicKey,
        network,
        type,
      );
      this.#initialize(accounts);
    } else if (seed) {
      const seedBuffer = Buffer.from(seed, "hex");
      const hdNode = bip32.fromSeed(seedBuffer, networkObj);

      this.#hdNode = hdNode;

      const accounts = getAllAccountsFromHdNode({
        hdNode,
        network,
        account,
        addressIndex,
      });

      const pkBuf = Buffer.from(accounts[0].priv, "hex");
      this.#keyPair = ECPair.fromPrivateKey(pkBuf, { network: networkObj });

      this.publicKey = this.#keyPair.publicKey.toString("hex");

      this.#initialize(accounts);
    } else if (bip39) {
      const seedBuffer = mnemonicToSeedSync(bip39);
      const hdNode = bip32.fromSeed(seedBuffer, networkObj);

      this.#hdNode = hdNode;

      const accounts = getAllAccountsFromHdNode({
        hdNode,
        network,
        account,
        addressIndex,
      });
      this.#keyPair = accounts[0].child;

      this.publicKey = this.#keyPair.publicKey.toString("hex");

      this.#initialize(accounts);
    } else {
      throw new OrditSDKError("Invalid options provided.");
    }
  }

  get network() {
    return this.#network;
  }

  set network(value: Network) {
    this.#network = value;
  }

  getAddressByType(type: AddressFormat, derivationIndex: DerivationIndex) {
    if (!this.#initialized || !this.allAddresses.length) {
      throw new OrditSDKError("Wallet not fully initialized.");
    }
    return this.allAddresses.find(
      (address) =>
        address.format === type &&
        address.derivationPath?.account === derivationIndex.accountIndex &&
        address.derivationPath?.addressIndex === derivationIndex.addressIndex,
    );
  }

  getAllAddresses() {
    if (!this.#keyPair) {
      throw new OrditSDKError("Keypair not found");
    }

    return this.allAddresses;
  }

  setDefaultAddress(
    type: AddressFormat,
    { accountIndex, addressIndex }: DerivationIndex = {
      accountIndex: 0,
      addressIndex: 0,
    },
  ) {
    if (this.selectedAddressType === type) return;
    let addressToSelect: Account | null;

    const account = this.getAddressByType(type, {
      accountIndex,
      addressIndex,
    }) as Account;
    if (!account) {
      addressToSelect = this.generateAddress(type, accountIndex, addressIndex);
      if (addressToSelect) this.allAddresses.push(addressToSelect);
    } else {
      addressToSelect = account;
    }

    if (!addressToSelect) {
      throw new OrditSDKError(
        "Address not found. Please add an address with the type and try again.",
      );
    }

    this.selectedAddress = addressToSelect.address;
    this.publicKey = addressToSelect.publicKey;
    this.selectedAddressType = type;

    if (addressToSelect.child) {
      this.#keyPair = addressToSelect.child;
    }
  }

  generateAddress(type: AddressFormat, account: number, addressIndex: number) {
    if (!this.#hdNode) {
      throw new OrditSDKError(
        "No HD node found. Please reinitialize with BIP39 words or seed.",
      );
    }

    return getAccountDataFromHdNode({
      hdNode: this.#hdNode,
      format: type,
      network: this.#network,
      account,
      addressIndex,
    });
  }

  signPsbt(
    value: string,
    {
      finalize = true,
      extractTx = true,
      isRevealTx = false,
    }: SignPSBTOptions = {},
  ) {
    const networkObj = getNetwork(this.#network);
    let psbt: bitcoin.Psbt | null = null;

    if (!this.#keyPair || !this.#initialized) {
      throw new OrditSDKError("Wallet not fully initialized.");
    }

    try {
      psbt = bitcoin.Psbt.fromHex(value);
    } catch (error) {
      psbt = bitcoin.Psbt.fromBase64(value);
    }

    if (!psbt || !psbt.inputCount) {
      throw new OrditSDKError("Invalid PSBT provided.");
    }

    const inputsToSign: Input[] = [];

    psbt.data.inputs.forEach((v, index) => {
      let script = null;

      if (v.witnessUtxo) {
        script = v.witnessUtxo.script;
      } else if (v.nonWitnessUtxo) {
        const tx = bitcoin.Transaction.fromBuffer(v.nonWitnessUtxo);
        const output = tx.outs[psbt!.txInputs[index].index];

        script = output.script;
      }
      const isSigned = v.finalScriptSig || v.finalScriptWitness;
      if (script && !isSigned) {
        const address = bitcoin.address.fromOutputScript(script, networkObj);

        // TODO: improvise the below logic by accepting indexes to sign
        if (isRevealTx || (!isRevealTx && this.selectedAddress === address)) {
          inputsToSign.push({
            index,
            publicKey: this.publicKey,
            sighashTypes: v.sighashType ? [v.sighashType] : undefined,
          });
        }
      }
    });

    if (!inputsToSign.length) {
      throw new OrditSDKError("Cannot sign PSBT with no signable inputs.");
    }

    let psbtHasBeenSigned = false;

    for (let i = 0; i < inputsToSign.length; i += 1) {
      const input = psbt.data.inputs[inputsToSign[i].index];
      psbtHasBeenSigned = !!(input.finalScriptSig || input.finalScriptWitness);

      // eslint-disable-next-line no-continue
      if (psbtHasBeenSigned) continue;

      if (isTaprootInput(input)) {
        const tweakedSigner = tweakSigner(this.#keyPair, {
          network: networkObj,
        });

        const signer =
          input.witnessUtxo?.script &&
          input.tapInternalKey &&
          !input.tapLeafScript
            ? tweakedSigner
            : this.#keyPair;

        psbt.signInput(
          inputsToSign[i].index,
          signer,
          inputsToSign[i].sighashTypes,
        );
      } else {
        psbt.signInput(
          inputsToSign[i].index,
          this.#keyPair,
          inputsToSign[i].sighashTypes,
        );
      }
    }

    if (finalize) {
      psbt.finalizeAllInputs();
    }

    if (extractTx) {
      return psbt.extractTransaction().toHex();
    }

    return psbt.toHex();
  }

  signMessage(
    message: string,
    type?: AddressFormat,
    opts?: SigningMessageOptions,
  ) {
    const addressType = type || this.selectedAddressType;
    const accountIndexToSign: number =
      opts?.accountIndex === undefined ? 0 : opts?.accountIndex;
    const addressIndexToSign: number =
      opts?.addressIndex === undefined ? 0 : opts?.addressIndex;
    const node = this.getAddressByType(addressType!, {
      accountIndex: accountIndexToSign,
      addressIndex: addressIndexToSign,
    }) as Account;
    const signature = AddressUtils.isP2PKH(node.address!)
      ? sign(message, node.child.privateKey!)
      : Signer.sign(node.child.toWIF(), node.address!, message);

    return signature.toString("base64");
  }

  #initialize(addresses: Address[] | Account[]) {
    this.allAddresses = addresses;

    const addressFormat = addresses[0].format as AddressFormat;
    this.selectedAddressType = addressFormat;
    this.selectedAddress = addresses[0].address;

    this.#initialized = true;
  }
}

export interface Input {
  index: number;
  publicKey: string;
  sighashTypes?: number[];
}

export interface SignPSBTOptions {
  extractTx?: boolean;
  finalize?: boolean;
  isRevealTx?: boolean;
}
