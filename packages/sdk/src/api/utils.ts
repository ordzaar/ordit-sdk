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

export function getUrl(value: string): string {
  if (value[value.length - 1] === "/") {
    return value.substring(0, value.length - 1);
  }
  return value;
}
