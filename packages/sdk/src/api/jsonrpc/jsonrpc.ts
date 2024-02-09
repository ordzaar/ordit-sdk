import fetch from "cross-fetch";

import { API_CONFIG } from "../../config";
import { OrditSDKError } from "../../errors";
import { Params, removeTrailingSlash } from "../utils";

type JsonRpcId = string | number | null;

function isNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    value > Number.NEGATIVE_INFINITY &&
    value < Number.POSITIVE_INFINITY
  );
}

function isInteger(value: unknown): value is number {
  return isNumber(value) && value % 1 === 0;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isJsonRpcId(value: unknown): value is JsonRpcId {
  return isString(value) || isInteger(value) || value === null;
}

class JsonRpc {
  constructor(readonly url: string) {}

  /**
   * Send a JSON-RPC 2.0 notification to the connected Sado compliant server.
   *
   * @param method - Method to call.
   * @param params - JSON-RPC 2.0 parameters.
   */
  async notify(method: string, params?: Params) {
    await fetch(`${this.url}/rpc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method,
        params,
      }),
    });
  }

  async call<T>(method: string, id: JsonRpcId): Promise<T>;
  async call<T>(method: string, params: Params, id: JsonRpcId): Promise<T>;
  async call<T>(
    method: string,
    paramsOrId: Params | JsonRpcId,
    id?: JsonRpcId,
  ): Promise<T> {
    let params: Params = {};
    let rpcId = id;
    if (isJsonRpcId(paramsOrId)) {
      rpcId = paramsOrId;
    } else {
      params = paramsOrId;
    }

    const response = await fetch(`${this.url}/rpc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method,
        params,
        id: rpcId,
      }),
    });
    if (response.status === 200) {
      const json = await response.json();
      if (json.error) {
        const error =
          typeof json.error.data === "string"
            ? json.error.data
            : json.error.message;
        throw new OrditSDKError(error);
      }
      return json.result;
    }
    throw new OrditSDKError(`Internal Server Error`);
  }
}

export const rpc = {
  get id() {
    return Math.floor(Math.random() * 100000);
  },
  mainnet: new JsonRpc(removeTrailingSlash(API_CONFIG.apis.mainnet.batter)),
  testnet: new JsonRpc(removeTrailingSlash(API_CONFIG.apis.testnet.batter)),
  regtest: new JsonRpc(removeTrailingSlash(API_CONFIG.apis.regtest.batter)),
} as const;
