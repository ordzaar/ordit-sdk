import axios from "axios";

import { API_CONFIG, ORDEXER_AUTH_TOKEN } from "../../config";
import { OrditSDKError } from "../../errors";
import { Params, removeTrailingSlash } from "../utils";

class OrdexerApi {
  constructor(readonly url: string) {}

  async get(endpoint: string, params?: Params) {
    const response = await axios({
      method: "get",
      baseURL: this.url,
      url: endpoint,
      headers: {
        Authorization: `Bearer ${ORDEXER_AUTH_TOKEN}`,
      },
      params,
    });

    if (response.status !== 200) {
      throw new OrditSDKError(response.statusText);
    }

    return response.data;
  }

  async post(endpoint: string, data: object) {
    const response = await axios({
      method: "post",
      baseURL: this.url,
      url: endpoint,
      headers: {
        Authorization: `Bearer ${ORDEXER_AUTH_TOKEN}`,
      },
      data,
    });

    if (response.status !== 200) {
      throw new OrditSDKError(response.statusText);
    }

    return response.data;
  }
}

export const ordexer = {
  get id() {
    return Math.floor(Math.random() * 100000);
  },
  mainnet: new OrdexerApi(removeTrailingSlash(API_CONFIG.apis.mainnet.ordexer)),
  testnet: new OrdexerApi(removeTrailingSlash(API_CONFIG.apis.testnet.ordexer)),
  regtest: new OrdexerApi(removeTrailingSlash(API_CONFIG.apis.regtest.ordexer)),
} as const;
