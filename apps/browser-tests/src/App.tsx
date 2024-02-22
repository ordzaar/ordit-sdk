import { useCallback, useMemo, useState } from "react";
import { Address, PSBTBuilder, PSBTBuilderOptions } from "@ordzaar/ordit-sdk";
import * as leather from "@ordzaar/ordit-sdk/leather";
import * as magiceden from "@ordzaar/ordit-sdk/magiceden";
import * as unisat from "@ordzaar/ordit-sdk/unisat";
import * as xverse from "@ordzaar/ordit-sdk/xverse";

import { RadioInput } from "./components/RadioInput";
import { Select } from "./components/Select";

type WalletProvider = "unisat" | "xverse" | "magiceden";

const TESTNET = "testnet" as const;
// const MAINNET = "mainnet" as const;

// Change here to use the network you want to use
// MagicEden only supports mainnet
const network = TESTNET;

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
  connectedAddresses,
}: {
  provider: WalletProvider;
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
    "tb1qatkgzm0hsk83ysqja5nq8ecdmtwl73zwurawww",
  );
  const [feeRate, setFeeRate] = useState(1);
  const [amount, setAmount] = useState(600);
  const [error, setError] = useState<string | undefined>();

  const psbtParams = useMemo(
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
      network,
    }),
    [
      amount,
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
          network,
          inputsToSign: [
            {
              address: inputAddressInfo.address,
              signingIndexes: [0],
            },
          ],
        });
      } else if (provider === "magiceden") {
        signPsbtResponse = await magiceden.signPsbt(psbt.toPSBT(), {
          network,
          inputsToSign: [
            {
              address: inputAddressInfo.address,
              signingIndexes: [0],
            },
          ],
        });
      } else if (provider === "leather") {
        signPsbtResponse = await leather.signPsbt(psbt.toPSBT(), {
          network,
          finalize: true,
          signAtIndexes: [0],
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
          network,
        );
      } else if (provider === "magiceden") {
        signMessageResponse = await magiceden.signMessage(
          message,
          inputAddressInfo.address,
          network,
        );
      } else if (provider === "leather") {
        signMessageResponse = await leather.signMessage(message, {
          network: "testnet",
          paymentType: "p2tr",
        });
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
  const [connectedAddresses, setConnectedAddresses] = useState<
    Address[] | undefined
  >();

  const handleConnect = useCallback(async () => {
    if (provider === "unisat") {
      const addresses = await unisat.getAddresses(network);
      console.log("Unisat Connected: ", addresses);
      setConnectedAddresses(addresses);
    } else if (provider === "xverse") {
      const addresses = await xverse.getAddresses(network);
      setConnectedAddresses(addresses);
      console.log("Xverse Connected: ", addresses);
    } else if (provider === "leather") {
      const addresses = await leather.getAddresses("testnet");
      setConnectedAddresses(addresses);
      console.log("Leather Connected: ", addresses);
    } else if (provider === "magiceden") {
      const addresses = await magiceden.getAddresses(network);
      setConnectedAddresses(addresses);
      console.log("MagicEden Connected: ", addresses);
    } else {
      console.log("Unknown provider", provider);
    }
  }, [provider]);

  const handleDisconnect = useCallback(async () => {
    setConnectedAddresses(undefined);
  }, []);

  return (
    <div>
      <p>Connect wallet to run tests.</p>
      <h1>Select Provider</h1>
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
        ]}
        value={provider}
        disabled={!!connectedAddresses}
      />
      <p>Network: {network} </p>
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
            connectedAddresses={connectedAddresses}
          />
        </>
      ) : null}
    </div>
  );
}

export default App;
