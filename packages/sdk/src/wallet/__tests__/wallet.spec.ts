import * as ecc from "@bitcoinerlab/secp256k1";
import { mnemonicToSeedSync } from "bip39";
import ECPairFactory from "ecpair";

import { OrditSDKError } from "../../errors";
import { deriveAddress, getNetwork } from "../../utils";
import { Ordit } from "../Ordit";

describe("Ordit Constructor", () => {
  let mockWIF: string;
  let mockPrivateKey: string;
  let mockSeed: string;
  let expectedPublicKey: string;
  let expectedAddress: string | undefined;
  const mockBip39 = "zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zone";

  const networkStr = "testnet";
  const network = getNetwork(networkStr);
  const format = "legacy";

  beforeAll(() => {
    const keyPair = ECPairFactory(ecc).makeRandom({ network });

    mockWIF = keyPair.toWIF();
    mockPrivateKey = keyPair.privateKey!.toString("hex");

    const seedBuffer = mnemonicToSeedSync(mockBip39);
    mockSeed = seedBuffer.toString("hex");

    expectedPublicKey = keyPair.publicKey.toString("hex");
    expectedAddress = deriveAddress(keyPair.publicKey, format, networkStr);
  });

  test("should initialize with WIF", () => {
    const ordit = new Ordit({
      wif: mockWIF,
      network: networkStr,
      format,
    });

    expect(ordit.network).toStrictEqual(networkStr);
    expect(ordit.publicKey).toStrictEqual(expectedPublicKey);
    expect(ordit.selectedAddress).toStrictEqual(expectedAddress);
    expect(ordit.selectedAddressType).toStrictEqual(format);
  });

  test("should initialize with privateKey", () => {
    const ordit = new Ordit({
      privateKey: mockPrivateKey,
      network: networkStr,
      format,
    });

    expect(ordit.network).toStrictEqual(networkStr);
    expect(ordit.publicKey).toStrictEqual(expectedPublicKey);
    expect(ordit.selectedAddress).toStrictEqual(expectedAddress);
    expect(ordit.selectedAddressType).toStrictEqual(format);
  });

  test("should initialize with seed", () => {
    const ordit = new Ordit({
      seed: mockSeed,
      network: networkStr,
      format,
    });

    expect(ordit.network).toStrictEqual(networkStr);
    expect(ordit.publicKey).toStrictEqual(
      "0351164f7e785238a7635e4b6ac9a7e34e8bd25e728fbb8dbadb497956d2d17ca6",
    );
    expect(ordit.selectedAddress).toStrictEqual(
      "n3siwy8unviTDpFm3BMzehf9p7G4HNvfcK",
    );
    expect(ordit.selectedAddressType).toStrictEqual(format);
  });

  test("should initialize with bip39 mnemonic", () => {
    const ordit = new Ordit({
      bip39: mockBip39,
      network: networkStr,
      format,
    });

    expect(ordit.network).toStrictEqual(networkStr);
    expect(ordit.publicKey).toStrictEqual(
      "0351164f7e785238a7635e4b6ac9a7e34e8bd25e728fbb8dbadb497956d2d17ca6",
    );
    expect(ordit.selectedAddress).toStrictEqual(
      "n3siwy8unviTDpFm3BMzehf9p7G4HNvfcK",
    );
    expect(ordit.selectedAddressType).toStrictEqual(format);
  });

  test("should throw an error when no valid options are provided", () => {
    const createOrditInstance = () => new Ordit({});
    expect(createOrditInstance).toThrow(OrditSDKError);
  });

  test("should throw an error when p2wsh is selected as address format", () => {
    const createOrditInstance = () =>
      new Ordit({
        wif: mockWIF,
        network: networkStr,
        format: "p2wsh",
      });
    expect(createOrditInstance).toThrow("p2wsh is not supported");
  });
});

describe("getAddressByType", () => {
  let ordit: Ordit;

  const mockBip39 = "zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zone";
  let mockSeed: string;
  const networkStr = "testnet";
  const format = "legacy";
  beforeEach(() => {
    const seedBuffer = mnemonicToSeedSync(mockBip39);
    mockSeed = seedBuffer.toString("hex");
  });

  test("should throw an error if the wallet is not initialized", () => {
    ordit = new Ordit({
      seed: mockSeed,
      network: networkStr,
      format,
    });

    ordit.allAddresses = [];

    expect(() =>
      ordit.getAddressByType("legacy", { accountIndex: 0, addressIndex: 0 }),
    ).toThrow(new OrditSDKError("Wallet not fully initialized."));
  });

  test("should return the correct address for the matching type and derivation index", () => {
    ordit = new Ordit({
      seed: mockSeed,
      network: networkStr,
      format,
    });

    const address = ordit.getAddressByType("legacy", {
      accountIndex: 0,
      addressIndex: 0,
    });

    expect(address?.format).toStrictEqual("legacy");
    expect(address?.address).toStrictEqual(
      "n3siwy8unviTDpFm3BMzehf9p7G4HNvfcK",
    );
    expect(address?.derivationPath).toStrictEqual({
      account: 0,
      addressIndex: 0,
      path: "m/44'/0'/0'/0/0",
    });
  });

  test("should return the correct address for the matching type and derivation index (segwit)", () => {
    const ordita = new Ordit({
      seed: mockSeed,
      network: networkStr,
      format: "segwit",
    });

    const address = ordita.getAddressByType("segwit", {
      accountIndex: 0,
      addressIndex: 0,
    });

    expect(address?.format).toStrictEqual("segwit");
    expect(address?.address).toStrictEqual(
      "tb1qg6f5cefvzf9epkq3krksaj7xjxhf9awk88fjf8",
    );
    expect(address?.derivationPath).toStrictEqual({
      account: 0,
      addressIndex: 0,
      path: "m/84'/0'/0'/0/0",
    });
  });

  test("should return undefined when no address matches the type and derivation index", () => {
    const address = ordit.getAddressByType("p2sh-p2wpkh", {
      accountIndex: 0,
      addressIndex: 1,
    });

    expect(address).toBeUndefined();
  });
});

describe("setDefaultAddress", () => {
  let ordit: Ordit;

  const mockBip39 = "zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zone";
  let mockSeed: string;
  const networkStr = "testnet";
  const format = "legacy";
  beforeEach(() => {
    const seedBuffer = mnemonicToSeedSync(mockBip39);
    mockSeed = seedBuffer.toString("hex");
    ordit = new Ordit({
      seed: mockSeed,
      network: networkStr,
      format,
    });
  });

  test("should set the default address when a valid address type and derivation path are provided", () => {
    ordit.setDefaultAddress("legacy", { accountIndex: 0, addressIndex: 0 });

    expect(ordit.selectedAddressType).toStrictEqual("legacy");
    expect(ordit.selectedAddress).toStrictEqual(
      "n3siwy8unviTDpFm3BMzehf9p7G4HNvfcK",
    );
    expect(ordit.publicKey).toStrictEqual(
      "0351164f7e785238a7635e4b6ac9a7e34e8bd25e728fbb8dbadb497956d2d17ca6",
    );
  });

  test("should throw an error when the requested address type is not found", () => {
    expect(() =>
      ordit.setDefaultAddress("p2wsh", { accountIndex: 1, addressIndex: 0 }),
    ).toThrow(
      new OrditSDKError(
        "Address not found. Please add an address with the type and try again.",
      ),
    );
  });

  test("should reuse an existing default address if the same type is set again", () => {
    ordit.setDefaultAddress("legacy", { accountIndex: 0, addressIndex: 0 });

    const currentSelectedAddress = ordit.selectedAddress;
    const currentSelectedAddressType = ordit.selectedAddressType;

    ordit.setDefaultAddress("legacy", { accountIndex: 0, addressIndex: 0 });

    expect(ordit.selectedAddress).toStrictEqual(currentSelectedAddress);
    expect(ordit.selectedAddressType).toStrictEqual(currentSelectedAddressType);
  });
});

describe("generateAddress", () => {
  let ordit: Ordit;
  let orditPriv: Ordit;
  let mockSeed: string;
  let mockPrivateKey: string;
  let mockWIF: string;

  const mockBip39 = "zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zone";
  const networkStr = "testnet";
  const format = "legacy";
  const network = getNetwork(networkStr);
  beforeEach(() => {
    const keyPair = ECPairFactory(ecc).makeRandom({ network });

    mockWIF = keyPair.toWIF();
    mockPrivateKey = keyPair.privateKey!.toString("hex");
    const seedBuffer = mnemonicToSeedSync(mockBip39);
    mockSeed = seedBuffer.toString("hex");
    ordit = new Ordit({
      seed: mockSeed,
      network: networkStr,
      format,
    });
    orditPriv = new Ordit({
      privateKey: mockPrivateKey,
      network: networkStr,
      format,
    });
  });
  test("should throw an error if no HD node is found", () => {
    expect(() => orditPriv.generateAddress("legacy", 0, 0)).toThrow(
      new OrditSDKError(
        "No HD node found. Please reinitialize with BIP39 words or seed.",
      ),
    );
  });

  test("should generate a legacy address for a valid account and address index", () => {
    const generatedAddress = ordit.generateAddress("legacy", 0, 0);
    const addresses = ordit.getAllAddresses();
    expect(generatedAddress?.format).toStrictEqual("legacy");
    expect(addresses).toContainEqual(generatedAddress);
  });

  test("should generate a segwit address for a valid account and address index", () => {
    const generatedAddress = ordit.generateAddress("segwit", 0, 0);
    const addresses = ordit.getAllAddresses();
    expect(generatedAddress?.format).toStrictEqual("segwit");
    expect(addresses).toContainEqual(generatedAddress);
  });

  test("should generate a p2sh-p2wpkh address for a different account and address index", () => {
    const generatedAddress = ordit.generateAddress("p2sh-p2wpkh", 0, 0);
    const addresses = ordit.getAllAddresses();
    expect(generatedAddress?.format).toStrictEqual("p2sh-p2wpkh");
    expect(addresses).toContainEqual(generatedAddress);
  });
});
