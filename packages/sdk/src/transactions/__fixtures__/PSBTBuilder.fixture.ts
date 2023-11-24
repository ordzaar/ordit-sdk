import { UTXOLimited } from "../types";

export const TAPROOT_ADDRESS_1 =
  "tb1p98dv6f5jp5qr4z2dtaljvwrhq34xrr8zuaqgv4ajf36vg2mmsruqt5m3lv";

export const TAPROOT_ADDRESS_2 =
  "tb1phduuvgaulft7xyt4zal284rxgjgah4nzf0huqk690fvcrc2229ss24ef72";

export const TAPROOT_ADDRESS_3 =
  "tb1pjqc8lk0txq59mvkwlfh0rzzkhydtlln5gfh9qz9tk50ulrnqjpls8kyxde";

export const ADDRESS_TO_GETSPENDABLES_RESPONSE: Record<
  string,
  { jsonrpc: string; id: number; result: UTXOLimited[] }
> = {
  [TAPROOT_ADDRESS_1]: {
    jsonrpc: "2.0",
    result: [
      {
        txid: "da8796350471c410fd3253c689368314a6eaf58b98a62afc97b416992e6e200c",
        n: 2,
        sats: 4501000,
        scriptPubKey: {
          asm: "1 29dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f8",
          desc: "rawtr(29dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f8)#68kgcmxp",
          hex: "512029dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f8",
          address: TAPROOT_ADDRESS_1,
          type: "witness_v1_taproot",
        },
      },
    ],
    id: 0,
  },
  [TAPROOT_ADDRESS_2]: {
    jsonrpc: "2.0",
    result: [
      {
        txid: "da8796350471c410fd3253c689368314a6eaf58b98a62afc97b416992e6e200c",
        n: 2,
        sats: 4501000,
        scriptPubKey: {
          asm: "1 29dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f8",
          desc: "rawtr(29dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f8)#68kgcmxp",
          hex: "512029dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f8",
          address: TAPROOT_ADDRESS_2,
          type: "witness_v1_taproot",
        },
      },
      {
        txid: "da8796350471c410fd3253c689368314a6eaf58b98a62afc97b416992e6e200c",
        n: 3,
        sats: 159, // for fee rate 1, fee is 101 but adding the utxo costs another 58
        scriptPubKey: {
          asm: "1 29dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f8",
          desc: "rawtr(29dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f8)#68kgcmxp",
          hex: "512029dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f8",
          address: TAPROOT_ADDRESS_2,
          type: "witness_v1_taproot",
        },
      },
    ],
    id: 0,
  },
  [TAPROOT_ADDRESS_3]: {
    jsonrpc: "2.0",
    result: [
      {
        txid: "da8796350471c410fd3253c689368314a6eaf58b98a62afc97b416992e6e200c",
        n: 2,
        sats: 4501000,
        scriptPubKey: {
          asm: "1 29dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f8",
          desc: "rawtr(29dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f8)#68kgcmxp",
          hex: "512029dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f8",
          address: TAPROOT_ADDRESS_3,
          type: "witness_v1_taproot",
        },
      },
      {
        txid: "da8796350471c410fd3253c689368314a6eaf58b98a62afc97b416992e6e200c",
        n: 3,
        sats: 101, // for fee rate 1, fee is 101 but is insufficient since adding this utxo costs another 58
        scriptPubKey: {
          asm: "1 29dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f8",
          desc: "rawtr(29dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f8)#68kgcmxp",
          hex: "512029dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f8",
          address: TAPROOT_ADDRESS_3,
          type: "witness_v1_taproot",
        },
      },
    ],
    id: 0,
  },
};
