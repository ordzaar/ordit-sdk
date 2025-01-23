import { useCallback, useMemo, useState } from "react";
import {
  Address,
  Chain,
  PSBTBuilder,
  PSBTBuilderOptions,
} from "@ordzaar/ordit-sdk";
import * as leather from "@ordzaar/ordit-sdk/leather";
import * as magiceden from "@ordzaar/ordit-sdk/magiceden";
import * as okx from "@ordzaar/ordit-sdk/okx";
import * as unisat from "@ordzaar/ordit-sdk/unisat";
import * as xverse from "@ordzaar/ordit-sdk/xverse";
import * as phantom from "@ordzaar/ordit-sdk/phantom";
import * as oyl from "@ordzaar/ordit-sdk/oyl";

import { RadioInput } from "./components/RadioInput";
import { Select } from "./components/Select";

type WalletProvider =
  | "unisat"
  | "xverse"
  | "magiceden"
  | "leather"
  | "okx"
  | "phantom"
  | "oyl";

const NETWORK = "testnet" as const;

async function createAndPreparePsbt(psbtParams: PSBTBuilderOptions) {
  const psbt = new PSBTBuilder(psbtParams);
  console.log("Initial Psbt: ", psbt);

  // Duplicate the PSBT so that console log shows a different instance.
  const clonedPSBT = new PSBTBuilder(psbtParams);
  await clonedPSBT.prepare();
  console.log("Prepared Psbt: ", clonedPSBT);
  return clonedPSBT;
}

function Transactions({
  provider,
  chain,
  connectedAddresses,
}: {
  provider: WalletProvider;
  chain: Chain;
  connectedAddresses: Address[];
}) {
  const [inputAddressInfo, setInputAddress] = useState(connectedAddresses[0]);
  const inputAddressesSelectOptions = useMemo(
    () =>
      connectedAddresses.map((addr) => ({
        name: addr.address,
        value: addr.address,
      })),
    [connectedAddresses],
  );

  const [outputAddress, setOutputAddress] = useState(
    connectedAddresses[0].address,
  );
  const [feeRate, setFeeRate] = useState(1);
  const [amount, setAmount] = useState(600);
  const [error, setError] = useState<string | undefined>();

  const psbtParams: PSBTBuilderOptions = useMemo(
    () => ({
      address: inputAddressInfo.address,
      feeRate,
      publicKey: inputAddressInfo.publicKey,
      outputs: [
        {
          address: outputAddress,
          value: amount,
        },
      ],
      network: NETWORK,
      chain,
    }),
    [
      amount,
      chain,
      feeRate,
      inputAddressInfo.address,
      inputAddressInfo.publicKey,
      outputAddress,
    ],
  );

  const handleCreateAndPreparePsbt = useCallback(async () => {
    setError(undefined);

    try {
      const psbt = await createAndPreparePsbt(psbtParams);
      return psbt;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    }
  }, [psbtParams]);

  const handleSignPsbt = useCallback(async () => {
    setError(undefined);

    try {
      const psbt = await createAndPreparePsbt(psbtParams);
      let signPsbtResponse;
      if (provider === "unisat") {
        signPsbtResponse = await unisat.signPsbt(psbt.toPSBT());
      } else if (provider === "xverse") {
        signPsbtResponse = await xverse.signPsbt(psbt.toPSBT(), {
          network: NETWORK,
          inputsToSign: [
            {
              address: inputAddressInfo.address,
              signingIndexes: [0],
            },
          ],
        });
      } else if (provider === "magiceden") {
        signPsbtResponse = await magiceden.signPsbt(psbt.toPSBT(), {
          network: NETWORK,
          inputsToSign: [
            {
              address: inputAddressInfo.address,
              signingIndexes: [0],
            },
          ],
        });
      } else if (provider === "leather") {
        signPsbtResponse = await leather.signPsbt(psbt.toPSBT(), {
          network: NETWORK,
          finalize: true,
          signAtIndexes: [0],
        });
      } else if (provider === "okx") {
        signPsbtResponse = await okx.signPsbt(psbt.toPSBT(), {
          network: NETWORK,
          inputsToSign: [
            {
              address: inputAddressInfo.address,
              signingIndexes: [0],
            },
          ],
        });
      } else if (provider === "phantom") {
        signPsbtResponse = await phantom.signPsbt(psbt.toPSBT(), {
          network: NETWORK,
          inputsToSign: [
            {
              address: inputAddressInfo.address,
              signingIndexes: [0],
            },
          ],
        });
      } else if (provider === "oyl") {
        signPsbtResponse = await oyl.signPsbt(psbt.toPSBT(), {
          network: NETWORK,
          inputsToSign: [
            {
              address: inputAddressInfo.address,
              signingIndexes: [0],
            },
          ],
        });
      } else {
        throw new Error("Unknown provider");
      }
      console.log("Sign PSBT Response", signPsbtResponse);
    } catch (e) {
      setError((e as Error).message);
      throw e;
    }
  }, [psbtParams, provider, inputAddressInfo.address]);

  const handleSignMessage = useCallback(async () => {
    setError(undefined);

    try {
      let signMessageResponse;
      const message =
        "This is a test message and will not be sent to the network.";
      if (provider === "unisat") {
        signMessageResponse = await unisat.signMessage(message);
      } else if (provider === "xverse") {
        signMessageResponse = await xverse.signMessage(
          message,
          inputAddressInfo.address,
          NETWORK,
        );
      } else if (provider === "magiceden") {
        signMessageResponse = await magiceden.signMessage(
          message,
          inputAddressInfo.address,
          NETWORK,
        );
      } else if (provider === "leather") {
        signMessageResponse = await leather.signMessage(message, {
          network: NETWORK,
          paymentType: leather.LeatherAddressType.P2TR,
        });
      } else if (provider === "okx") {
        signMessageResponse = await okx.signMessage(message, "ecdsa", NETWORK);
      } else if (provider === "phantom") {
        signMessageResponse = await phantom.signMessage(
          message,
          inputAddressInfo.address,
          NETWORK,
        );
      } else if (provider === "oyl") {
        signMessageResponse = await oyl.signMessage(
          message,
          inputAddressInfo.address,
          NETWORK,
        );
      } else {
        throw new Error("Unknown provider");
      }
      console.log("Sign Message Response", signMessageResponse);
    } catch (e) {
      setError((e as Error).message);
      throw e;
    }
  }, [inputAddressInfo.address, provider]);

  return (
    <div
      className="flex flex-col"
      style={{ maxWidth: "600px", gap: "4px", width: "100%" }}
    >
      <h1>Transactions</h1>
      <label className="flex" htmlFor="inputAddress">
        Input Address
      </label>
      <Select
        options={inputAddressesSelectOptions}
        name="inputAddress"
        id="inputAddress"
        defaultValue={inputAddressesSelectOptions[0].value}
        onChange={(newInputAddress) =>
          setInputAddress(
            connectedAddresses.find(
              (connectedAddr) => connectedAddr.address === newInputAddress,
            )!,
          )
        }
      />
      <label className="flex" htmlFor="feeRate">
        Fee Rate (sats/vB)
      </label>
      <input
        type="text"
        id="feeRate"
        name="feeRate"
        value={feeRate}
        onChange={(e) => setFeeRate(Number(e.target.value))}
      />
      <label className="flex" htmlFor="amount">
        Transfer Amount (sats) (Excluding network fee)
      </label>
      <input
        type="text"
        id="amount"
        name="amount"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <label className="flex" htmlFor="outputAddress">
        Output Address
      </label>
      <input
        type="text"
        id="outputAddress"
        name="outputAddress"
        value={outputAddress}
        onChange={(e) => setOutputAddress(e.target.value)}
      />
      <div className="flex" style={{ marginTop: "12px", gap: "4px" }}>
        <button
          type="button"
          onClick={handleCreateAndPreparePsbt}
          disabled={!connectedAddresses || !outputAddress}
        >
          Create and Prepare PSBT
        </button>
        <button
          type="button"
          onClick={handleSignPsbt}
          disabled={!connectedAddresses || !outputAddress}
        >
          Sign PSBT
        </button>
        <button
          type="button"
          onClick={handleSignMessage}
          disabled={!connectedAddresses || !outputAddress}
        >
          Sign Message
        </button>
      </div>
      <p>{error ? `Error: ${error}` : null}</p>
    </div>
  );
}

function App() {
  const [provider, setProvider] = useState<WalletProvider>("unisat");
  const [chain, setChain] = useState<Chain>("bitcoin");
  const [connectedAddresses, setConnectedAddresses] = useState<
    Address[] | undefined
  >();

  const handleConnect = useCallback(async () => {
    if (provider === "unisat") {
      const addresses = await unisat.getAddresses(NETWORK, chain);
      console.log("Unisat Connected: ", addresses);
      setConnectedAddresses(addresses);
    } else if (provider === "xverse") {
      const addresses = await xverse.getAddresses(NETWORK);
      setConnectedAddresses(addresses);
      console.log("Xverse Connected: ", addresses);
    } else if (provider === "leather") {
      const addresses = await leather.getAddresses(NETWORK);
      setConnectedAddresses(addresses);
      console.log("Leather Connected: ", addresses);
    } else if (provider === "magiceden") {
      const addresses = await magiceden.getAddresses(NETWORK);
      setConnectedAddresses(addresses);
      console.log("MagicEden Connected: ", addresses);
    } else if (provider === "okx") {
      const addresses = await okx.getAddresses(NETWORK);
      setConnectedAddresses(addresses);
      console.log("OKX Wallet Connected: ", addresses);
    } else if (provider === "phantom") {
      const addresses = await phantom.getAddresses(NETWORK);
      setConnectedAddresses(addresses);
      console.log("Phantom Wallet Connected: ", addresses);
    } else if (provider === "oyl") {
      const addresses = await oyl.getAddresses(NETWORK);
      setConnectedAddresses(addresses);
      console.log("Oyl Wallet Connected: ", addresses);
    } else {
      console.log("Unknown provider", provider);
    }
  }, [chain, provider]);

  const handleDisconnect = useCallback(async () => {
    setConnectedAddresses(undefined);
  }, []);

  return (
    <div>
      <h1>Connect wallet to run tests</h1>
      <p>Provider</p>
      <RadioInput
        name="provider"
        onChange={(option) =>
          provider !== option.value
            ? setProvider(option.value as WalletProvider)
            : undefined
        }
        options={[
          { name: "Unisat", value: "unisat" },
          { name: "Xverse", value: "xverse" },
          { name: "Leather", value: "leather" },
          { name: "Magic Eden", value: "magiceden" },
          { name: "OKX", value: "okx" },
          { name: "Phantom", value: "phantom" },
          { name: "Oyl", value: "oyl" },
        ]}
        value={provider}
        disabled={!!connectedAddresses || chain === "fractal-bitcoin"}
      />
      <p>Chain</p>
      <RadioInput
        name="chain"
        onChange={(option) =>
          chain !== option.value ? setChain(option.value as Chain) : undefined
        }
        options={[
          { name: "Bitcoin", value: "bitcoin" },
          { name: "Fractal Bitcoin", value: "fractal-bitcoin" },
        ]}
        value={chain}
        disabled={!!connectedAddresses || provider !== "unisat"}
      />
      <p>Network: {NETWORK} </p>
      <button
        type="button"
        style={{ marginTop: "12px" }}
        onClick={handleConnect}
        disabled={!!connectedAddresses}
      >
        Connect
      </button>
      <button
        type="button"
        style={{ marginTop: "12px" }}
        onClick={handleDisconnect}
        disabled={!connectedAddresses}
      >
        Disconnect
      </button>
      {connectedAddresses && connectedAddresses.length > 0 ? (
        <>
          <div style={{ marginTop: "12px", maxWidth: "800px" }}>
            <h1>Connected Wallet Info</h1>
            {connectedAddresses.map((addressInfo) => (
              <div
                key={addressInfo.address}
                style={{
                  padding: "8px",
                  border: "1px solid black",
                }}
              >
                <p>Address: {addressInfo.address}</p>
                <p>Format: {addressInfo.format}</p>
                <p>Public Key: {addressInfo.publicKey}</p>
              </div>
            ))}
          </div>
          <Transactions
            provider={provider}
            chain={chain}
            connectedAddresses={connectedAddresses}
          />
        </>
      ) : null}
    </div>
  );
}

export default App;
