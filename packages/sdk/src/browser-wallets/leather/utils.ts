import { BrowserWalletRequestCancelledByUserError, OrditSDKError } from "../..";
import { LeatherJsonRPCResponse } from "./types";

export type LeatherErrorResponse = {
  error: {
    code: number;
    message: string;
  };
  id: string;
  jsonrpc: string;
};

export async function leatherRequest<T>(
  arg: string,
  params?: object | string[],
): Promise<T> {
  try {
    const res = (await window.LeatherProvider.request(
      arg,
      params,
    )) as LeatherJsonRPCResponse<T>;

    return res.result;
  } catch (err) {
    const leatherError = err as LeatherErrorResponse;
    const { message } = leatherError.error;

    if (leatherError.error.code === 4001) {
      throw new BrowserWalletRequestCancelledByUserError(message);
    }

    throw new OrditSDKError(`Leather error: ${message}`);
  }
}
