declare interface Window {
  unisat: Unisat;
  LeatherProvider: LeatherProvider;
  ethereum: MetaMask;
  okxwallet: OKXWallet;
  wizz: Wizz;
}

type UnisatNetwork = "livenet" | "testnet";
type WizzNetwork = "livenet" | "testnet";

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

type Wizz = {
  getAccounts: () => Promise<string[]>;
  requestAccounts(): Promise<string[]>;
  getNetwork(): Promise<NetworkType>;
  getPublicKey(): Promise<string>;
  getInscriptions(
    cursor?: number,
    size?: number,
  ): Promise<InscriptionsResponse>;
  getInscriptionsByAddress(
    address: string,
    cursor?: number,
    size?: number,
  ): Promise<InscriptionsResponse>;
  signMessage(
    message: string,
    type?: string | SignMessageType,
  ): Promise<string>;
  signPsbt(psbtHex: string, options?: SignOptions): Promise<string>;
  signPsbts(psbtHexs: string[], options?: SignOptions): Promise<string[]>;
  getVersion(): Promise<string>;
  getBalance(): Promise<BalanceSummary>;
  getAssets(): Promise<WalletAssetBalance>;
  switchNetwork(network: NetworkType): Promise<NetworkType>;
  sendBitcoin(
    toAddress: string,
    satoshis: number,
    options?: {
      feeRate?: number;
    },
  ): Promise<string>;
  sendARC20(
    toAddress: string,
    arc20: string,
    satoshis: number,
    options?: {
      feeRate: number;
    },
  ): Promise<string>;
  sendAtomicals(
    toAddress: string,
    atomicalIds: string[],
    options?: {
      feeRate: number;
    },
  ): Promise<string>;
  requestMint(params: RequestMintParams): Promise<void>;
  pushTx({ rawtx }: { rawtx: string }): Promise<string>;
  pushPsbt(psbt: string): Promise<string>;
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
