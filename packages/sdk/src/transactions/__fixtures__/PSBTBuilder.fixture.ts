export const ADDRESS_GETSPENDABLES_RESPONSE = {
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
        address:
          "tb1p98dv6f5jp5qr4z2dtaljvwrhq34xrr8zuaqgv4ajf36vg2mmsruqt5m3lv",
        type: "witness_v1_taproot",
      },
    },
  ],
  id: 0,
};

export const ADDRESS_GETSPENDABLES_TWO_UTXOS_RESPONSE = {
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
        address:
          "tb1p98dv6f5jp5qr4z2dtaljvwrhq34xrr8zuaqgv4ajf36vg2mmsruqt5m3lv",
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
        address:
          "tb1p98dv6f5jp5qr4z2dtaljvwrhq34xrr8zuaqgv4ajf36vg2mmsruqt5m3lv",
        type: "witness_v1_taproot",
      },
    },
  ],
  id: 0,
};

export const ADDRESS_GETSPENDABLES_TWO_UTXOS_RESPONSE_INSUFFICIENT = {
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
        address:
          "tb1p98dv6f5jp5qr4z2dtaljvwrhq34xrr8zuaqgv4ajf36vg2mmsruqt5m3lv",
        type: "witness_v1_taproot",
      },
    },
    {
      txid: "da8796350471c410fd3253c689368314a6eaf58b98a62afc97b416992e6e200c",
      n: 3,
      sats: 101, // for fee rate 1
      scriptPubKey: {
        asm: "1 29dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f8",
        desc: "rawtr(29dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f8)#68kgcmxp",
        hex: "512029dacd26920d003a894d5f7f263877046a618ce2e7408657b24c74c42b7b80f8",
        address:
          "tb1p98dv6f5jp5qr4z2dtaljvwrhq34xrr8zuaqgv4ajf36vg2mmsruqt5m3lv",
        type: "witness_v1_taproot",
      },
    },
  ],
  id: 0,
};
