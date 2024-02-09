export type ParamRecord = { [k in string]: Params };
export type Params =
  | string
  | string[]
  | number
  | number[]
  | boolean
  | boolean[]
  | null
  | undefined
  | ParamRecord;

export function removeTrailingSlash(str: string): string {
  return str.replace(/\/+$/, '');
}
