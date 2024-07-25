declare interface Window {
  unisat: Unisat;
  LeatherProvider: LeatherProvider;
  ethereum: MetaMask;
  okxwallet: OKXWallet;
}

type UnisatNetwork = "livenet" | "testnet";

type MessageSignatureTypes = "bip322-simple" | "ecdsa";

type Unisat = {
  getNetwork: () => Promise<UnisatNetwork>;
  switchNetwork: (targetNetwork: UnisatNetwork) => Promise<void>;
  requestAccounts: () => Promise<string[]>;
  getAccounts: () => Promise<string[]>;
  getPublicKey: () => Promise<string>;
  signPsbt: (
    hex: string,
    { autoFinalized }: Record<string, boolean>,
  ) => Promise<string>;
  signMessage: (
    message: string,
    type: MessageSignatureTypes,
  ) => Promise<string>;
};

interface BtcKitRequestFn {
  (arg: object | string, params?: object | string[]): Promise<object>;
}

type LeatherProvider = {
  request: BtcKitRequestFn;
};

type MetaMask = {
  isMetaMask: boolean;
  request: (options: { method: string; params?: unknown }) => Promise<unknown>;
};

type OKXAccount = {
  address: string;
  publicKey: string;
};

type OKXSignInput = {
  index: number;
  address?: string;
  publicKey?: string;
  sighashTypes?: number[];
};

type OKXWalletProvider = {
  connect: () => Promise<OKXAccount>;
  signMessage: (
    message: string,
    type: MessageSignatureTypes,
  ) => Promise<string>;
  signPsbt: (
    psbtHex: string,
    options: {
      autoFinalized: boolean;
      toSignInputs: OKXSignInput[];
    },
  ) => Promise<string>;
};

type OKXWallet = {
  bitcoin: OKXWalletProvider;
  bitcoinTestnet: OKXWalletProvider;
  bitcoinSignet: OKXWalletProvider;
};

declare module "buffer-reverse" {
  export = (_: Buffer): Buffer => {};
}
