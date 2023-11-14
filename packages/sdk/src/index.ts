import * as ecc from "@bitcoinerlab/secp256k1";
import { initEccLib } from "bitcoinjs-lib";

// Required for all operations to function.
// This function will manage its own instance.
initEccLib(ecc);

export * from "./addresses";
export * from "./modules";
export * from "./ordinals/index";
export * from "./transactions";
