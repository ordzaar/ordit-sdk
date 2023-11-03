export const apiConfig = {
  version: "0.0.0.10",
  apis: {
    mainnet: {
      batter: "https://mainnet.ordit.io/",
    },
    regtest: {
      batter: "https://regtest.ordit.io/",
    },
    testnet: {
      batter: "https://testnet.ordit.io/",
    },
  },
};

// Input from seller PSBT when unwrapped & merged,
// is placed on the 2nd index in instant-buy-sell flow
export const INSTANT_BUY_SELLER_INPUT_INDEX = 2;
