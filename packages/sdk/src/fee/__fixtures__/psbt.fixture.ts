export const P2SH_P2WPKH = {
  INPUTS: [
    {
      hash: "87f4282652ef649c081d3f0d782394c56dbe0ffa6d2f3556426aa8a5d644bfda",
      index: 0,
      witnessUtxo: {
        script: Buffer.from([
          169, 20, 146, 214, 221, 252, 159, 13, 36, 218, 98, 87, 182, 72, 202,
          56, 88, 32, 128, 42, 14, 122, 135,
        ]),
        value: 50000,
      },
      redeemScript: Buffer.from([
        0, 20, 181, 189, 37, 150, 102, 141, 210, 250, 47, 230, 193, 222, 193,
        109, 134, 103, 118, 219, 234, 80,
      ]),
    },
    {
      hash: "b74b9fcea9273289d6b5a8b5b78a6d0dd15aa197f44551f705e319d0d6bb090c",
      index: 0,
      witnessUtxo: {
        script: Buffer.from([
          169, 20, 146, 214, 221, 252, 159, 13, 36, 218, 98, 87, 182, 72, 202,
          56, 88, 32, 128, 42, 14, 122, 135,
        ]),
        value: 50000,
      },
      redeemScript: Buffer.from([
        0, 20, 181, 189, 37, 150, 102, 141, 210, 250, 47, 230, 193, 222, 193,
        109, 134, 103, 118, 219, 234, 80,
      ]),
    },
  ],
  OUTPUTS: [
    {
      script: Buffer.from([
        169, 20, 146, 214, 221, 252, 159, 13, 36, 218, 98, 87, 182, 72, 202, 56,
        88, 32, 128, 42, 14, 122, 135,
      ]),
      value: 20000,
    },
    {
      script: Buffer.from([
        169, 20, 146, 214, 221, 252, 159, 13, 36, 218, 98, 87, 182, 72, 202, 56,
        88, 32, 128, 42, 14, 122, 135,
      ]),
      value: 70000,
    },
  ],
};

export const P2WPKH = {
  INPUTS: [
    {
      hash: "68115c006db166c6b92ca30dfced206a3501422f64044effcad3c18c97befcc9",
      index: 0,
      witnessUtxo: {
        script: Buffer.from([
          0, 20, 181, 189, 37, 150, 102, 141, 210, 250, 47, 230, 193, 222, 193,
          109, 134, 103, 118, 219, 234, 80,
        ]),
        value: 50000,
      },
    },
  ],
  OUTPUTS: [{ address: "mui37H2932ZJLpbmo2fVLZWcX8CEnaSR5G", value: 20000 }],
};

export const P2TR = {
  INPUTS: [
    {
      hash: "c6de8dbe322cf19e1f7a4d57a44b6cd07e54669bd00d7b166699034a409cd44f",
      index: 0,
      sequence: 10,
      witnessUtxo: {
        value: 420000,
        script: Buffer.from([
          81, 32, 31, 126, 199, 253, 193, 80, 120, 219, 205, 202, 214, 194, 108,
          254, 243, 118, 170, 156, 208, 82, 38, 74, 175, 130, 41, 12, 215, 237,
          49, 96, 64, 221,
        ]),
      },
    },
  ],
  OUTPUTS: [
    {
      value: 410000,
      address:
        "bcrt1pnr7erhxvxpgavz7g9rtuy5d3qn8wev807eqvj2secjmp00kf5caspgykj7",
    },
  ],
};
