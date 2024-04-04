/* eslint-disable*/

import * as ecc from "@bitcoinerlab/secp256k1";
import { initEccLib, networks, payments } from "bitcoinjs-lib";
import ECPairFactory from "ecpair";

// for development only
import {
  JsonRpcDatasource,
  MintRuneTxBuilder,
  CreateRuneTxBuilder,
  TransferRuneTxBuilder,
} from "../../../packages/sdk/src/index";

initEccLib(ecc);

// set the network
const network = "regtest"; // regtest | testnet mainnet
const ECpair = ECPairFactory(ecc);
// generate your WIF
// console.log(ECpair.makeRandom().toWIF());
const keypair = ECpair.fromWIF("");

// sample use p2pkh address, can use any address
const p2pkhPayment = payments.p2pkh({
  pubkey: keypair.publicKey,
  network: networks[network],
});
console.log(`p2pkh address: ${p2pkhPayment.address}`);

const datasource = new JsonRpcDatasource({ network });

async function createRune() {
  const runeTxBuilder = new CreateRuneTxBuilder({
    publicKey: keypair.publicKey.toString("hex"),
    address: "2NApV2xu5cphZuHqg2g5ZKMi7kmfKNtzGAJ", // premine target address
    network,
    feeRate: 1,
    datasource,
  });

  await runeTxBuilder.prepareRune({
    rune: "ORDZAAR.RUNE.TOKEN",
    divisibility: 0,
    premine: 100000n,
    symbol: "O",
    validateMinimumHeight: false, // validate the minimum rune height, set true to make it more strict
    terms: {
      amount: 100n,
      cap: 1000000000n,
    },
  });

  const commit = await runeTxBuilder.generateCommit();
  console.log(
    `Please fund ${commit.revealFee} sats / ${commit.revealFee / 10 ** 8} to this address: ${commit.address}`,
  );

  console.log("checking the utxo: ");
  while (true) {
    try {
      await runeTxBuilder.checkAndSetCommitUTXO();
      await runeTxBuilder.build();
      break;
    } catch (error) {
      console.log((error as any).message);
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }
  }
  const psbt = runeTxBuilder.toPSBT();

  psbt.signInput(0, keypair);
  psbt.finalizeInput(0);

  const txHex = psbt.extractTransaction(true).toHex();
  await datasource.relay({ hex: txHex });
  console.log("ok");
}

async function mintRune() {
  const mintRuneTxBuilder = new MintRuneTxBuilder({
    publicKey: keypair.publicKey.toString("hex"),
    address: p2pkhPayment.address!,
    network,
    receiveAddress: p2pkhPayment.address!,
    feeRate: 1,
    datasource,
  });

  await mintRuneTxBuilder.mint({
    spacedRune: "ORDZAAR•RUNE•TOKEN",
  });

  const psbt = mintRuneTxBuilder.toPSBT();

  psbt.signInput(0, keypair);
  psbt.finalizeInput(0);

  const txHex = psbt.extractTransaction(true).toHex();
  await datasource.relay({ hex: txHex });

  console.log("ok");
}

async function transferRune() {
  const transferRuneTxBuilder = new TransferRuneTxBuilder({
    publicKey: keypair.publicKey.toString("hex"),
    address: p2pkhPayment.address!,
    network,
    receiveAddress:
      "bcrt1pck7k2wn7pfcd7qa4dwrg86lfhrhayzl8mfda274kju8srrp9ektspy5d5t",
    feeRate: 1,
    datasource,
  });

  await transferRuneTxBuilder.transfer({
    spacedRune: "ORDZAAR.RUNE.TOKEN",
    amount: 1n,
  });

  const psbt = transferRuneTxBuilder.toPSBT();

  psbt.signAllInputs(keypair);
  psbt.finalizeAllInputs();

  const txHex = psbt.extractTransaction(true).toHex();
  await datasource.relay({ hex: txHex });
  console.log("success");
}

async function main() {
  // await createRune()
  // await mintRune();
  // await transferRune();
}

await main();
