import { JsonRpcDatasource } from "./JsonRpcDatasource";
import { OrdexerDatasource } from "./OrdexerDatasource";

export type DataSourceOptions = "jsonrpc" | "ordexer";

export type DataSourceType = JsonRpcDatasource | OrdexerDatasource;

export const DataSource = {
  Jsonrpc: JsonRpcDatasource,
  Ordexer: OrdexerDatasource,
} as const;
