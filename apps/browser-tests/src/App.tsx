import { useCallback, useMemo, useState } from "react";
import type { DataSourceType, UTXOLimited } from "@ordzaar/ordit-sdk";
import {
  Address,
  DataSource,
  PSBTBuilder,
  PSBTBuilderOptions,
} from "@ordzaar/ordit-sdk";
import * as unisat from "@ordzaar/ordit-sdk/unisat";
import * as xverse from "@ordzaar/ordit-sdk/xverse";

import { RadioInput } from "./components/RadioInput";
import { Select } from "./components/Select";

type WalletProvider = "unisat" | "xverse";

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
      network: "testnet" as const,
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
          network: "testnet",
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
          "testnet",
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

function GetBalanceAPI({
  connectedAddresses,
  datasource,
}: {
  connectedAddresses: Address[];
  datasource: DataSourceType;
}) {
  const [walletBalance, setWalletBalance] = useState<number | undefined>();
  const [inputAddressInfo, setInputAddress] = useState(connectedAddresses[0]);
  const inputAddressesSelectOptions = useMemo(
    () =>
      connectedAddresses.map((addr) => ({
        name: addr.address,
        value: addr.address,
      })),
    [connectedAddresses],
  );

  const handleGetBalance = useCallback(async () => {
    const balance = await datasource.getBalance({
      address: inputAddressInfo.address,
    });
    setWalletBalance(balance);
  }, [inputAddressInfo.address, datasource]);

  return (
    <div
      className="flex flex-col"
      style={{ maxWidth: "600px", gap: "4px", width: "100%" }}
    >
      <h2>GetBalance API</h2>
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
      <button
        type="button"
        onClick={handleGetBalance}
        disabled={!connectedAddresses}
      >
        Get Balance
      </button>
      <p>Balance: {walletBalance}</p>
    </div>
  );
}

function GetSpendablesAPI({
  connectedAddresses,
  datasource,
}: {
  connectedAddresses: Address[];
  datasource: DataSourceType;
}) {
  const [spendables, setSpendables] = useState<UTXOLimited[] | undefined>();
  const [inputAddressInfo, setInputAddress] = useState(connectedAddresses[0]);
  const inputAddressesSelectOptions = useMemo(
    () =>
      connectedAddresses.map((addr) => ({
        name: addr.address,
        value: addr.address,
      })),
    [connectedAddresses],
  );

  const handleGetSpendables = useCallback(async () => {
    const spendablesData = await datasource.getSpendables({
      address: inputAddressInfo.address,
      value: 0,
    });
    setSpendables(spendablesData);
  }, [inputAddressInfo.address, datasource]);

  return (
    <div
      className="flex flex-col"
      style={{ maxWidth: "600px", gap: "4px", width: "100%" }}
    >
      <h2>GetSpendables API</h2>
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
      <button
        type="button"
        onClick={handleGetSpendables}
        disabled={!connectedAddresses}
      >
        Get Spendables
      </button>
      <div>
        {spendables && spendables.length > 0 ? (
          <div style={{ marginTop: "12px", maxWidth: "800px" }}>
            <h3>Connected Wallet Spendables</h3>
            {spendables.map((spendable) => (
              <div
                key={spendable.txid}
                style={{
                  padding: "8px",
                  border: "1px solid black",
                }}
              >
                <p>txid: {spendable.txid}</p>
                <p>n: {spendable.n}</p>
                <p>sats: {spendable.sats}</p>
                <p>scriptPubKey: {String(spendable.scriptPubKey)}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function GetUnspentsAPI({
  connectedAddresses,
  datasource,
}: {
  connectedAddresses: Address[];
  datasource: DataSourceType;
}) {
  const [unspents, setUnspents] = useState<UTXOLimited[] | undefined>();
  const [inputAddressInfo, setInputAddress] = useState(connectedAddresses[0]);
  const inputAddressesSelectOptions = useMemo(
    () =>
      connectedAddresses.map((addr) => ({
        name: addr.address,
        value: addr.address,
      })),
    [connectedAddresses],
  );

  const handleGetUnspents = useCallback(async () => {
    const unspentsData = await datasource.getUnspents({
      address: inputAddressInfo.address,
    });
    setUnspents(unspentsData.spendableUTXOs);
  }, [inputAddressInfo.address, datasource]);

  return (
    <div
      className="flex flex-col"
      style={{ maxWidth: "600px", gap: "4px", width: "100%" }}
    >
      <h2>GetUnspents API</h2>
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
      <button
        type="button"
        onClick={handleGetUnspents}
        disabled={!connectedAddresses}
      >
        Get Unspents
      </button>
      <div>
        {unspents && unspents.length > 0 ? (
          <div style={{ marginTop: "12px", maxWidth: "800px" }}>
            <h3>Connected Wallet Unspents</h3>
            {unspents.map((unspent) => (
              <div
                key={unspent.txid}
                style={{
                  padding: "8px",
                  border: "1px solid black",
                }}
              >
                <p>txid: {unspent.txid}</p>
                <p>n: {unspent.n}</p>
                <p>sats: {unspent.sats}</p>
                <p>script : {String(unspent.script)}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AddressesAPITest({
  connectedAddresses,
}: {
  connectedAddresses: Address[];
}) {
  const [selectedDatasource, setSelectedDatasource] =
    useState<string>("jsonrpc");
  const datasource = useMemo(() => {
    if (selectedDatasource === "jsonrpc") {
      return new DataSource.Jsonrpc({ network: "testnet" });
    }
    if (selectedDatasource === "ordexer") {
      return new DataSource.Ordexer({ network: "testnet" });
    }
    return undefined;
  }, [selectedDatasource]);

  return (
    <div>
      <h1>Test Datasource APIs</h1>
      <RadioInput
        name="selectedDatasource"
        onChange={(option) =>
          selectedDatasource !== option.value
            ? setSelectedDatasource(option.value)
            : undefined
        }
        options={[
          { name: "Jsonrpc", value: "jsonrpc" },
          { name: "Ordexer", value: "ordexer" },
        ]}
        value={selectedDatasource}
      />
      <h1>Addresses API Tester</h1>
      <GetBalanceAPI
        connectedAddresses={connectedAddresses}
        datasource={datasource}
      />
      <GetSpendablesAPI
        connectedAddresses={connectedAddresses}
        datasource={datasource}
      />
      <GetUnspentsAPI
        connectedAddresses={connectedAddresses}
        datasource={datasource}
      />
    </div>
  );
}

function GetTransactionAPI({ datasource }: { datasource: DataSourceType }) {
  const [txid, setTxid] = useState<string>("");
  const [transaction, setTransaction] = useState<any | undefined>();
  const [error, setError] = useState<string | undefined>();

  const handleGetTransaction = useCallback(async () => {
    setError(undefined);
    if (!txid) {
      setError("Txid is required");
      return;
    }

    try {
      const transactionData = await datasource.getTransaction({ txId: txid });
      setTransaction(transactionData);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [txid, datasource]);

  return (
    <div
      className="flex flex-col"
      style={{ maxWidth: "600px", gap: "4px", width: "100%" }}
    >
      <h2>GetTransaction API</h2>
      <label className="flex" htmlFor="txid">
        Txid
      </label>
      <input
        type="text"
        id="txid"
        name="txid"
        value={txid}
        onChange={(e) => setTxid(e.target.value)}
      />
      <button type="button" onClick={handleGetTransaction}>
        Get Transaction
      </button>
      <div>
        {transaction ? (
          <div style={{ marginTop: "12px", maxWidth: "800px" }}>
            <h3>Transaction</h3>
            <pre>{JSON.stringify(transaction, null, 2)}</pre>
          </div>
        ) : null}
      </div>
      <p>{error ? `Error: ${error}` : null}</p>
    </div>
  );
}

function GetInscriptionAPI({ datasource }: { datasource: DataSourceType }) {
  const [inscriptionId, setInscriptionId] = useState<string>("");
  const [inscription, setInscription] = useState<any | undefined>();
  const [error, setError] = useState<string | undefined>();

  const handleGetInscription = useCallback(async () => {
    setError(undefined);

    try {
      const inscriptionData = await datasource.getInscription({
        id: inscriptionId,
      });
      setInscription(inscriptionData);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [inscriptionId, datasource]);

  return (
    <div
      className="flex flex-col"
      style={{ maxWidth: "600px", gap: "4px", width: "100%" }}
    >
      <h2>GetInscription API</h2>
      <label className="flex" htmlFor="inscriptionId">
        Inscription ID
      </label>
      <input
        type="text"
        id="inscriptionId"
        name="inscriptionId"
        value={inscriptionId}
        onChange={(e) => setInscriptionId(e.target.value)}
      />
      <button type="button" onClick={handleGetInscription}>
        Get Inscription
      </button>
      <div>
        {inscription ? (
          <div style={{ marginTop: "12px", maxWidth: "800px" }}>
            <h3>Inscription</h3>
            <pre>{JSON.stringify(inscription, null, 2)}</pre>
          </div>
        ) : null}
      </div>
      <p>{error ? `Error: ${error}` : null}</p>
    </div>
  );
}

function NonAddressAPITest() {
  const [selectedDatasource, setSelectedDatasource] =
    useState<string>("jsonrpc");
  const datasource = useMemo(() => {
    if (selectedDatasource === "jsonrpc") {
      return new DataSource.Jsonrpc({ network: "testnet" });
    }
    if (selectedDatasource === "ordexer") {
      return new DataSource.Ordexer({ network: "testnet" });
    }
    return undefined;
  }, [selectedDatasource]);

  return (
    <div>
      <h1>Test Datasource APIs</h1>
      <RadioInput
        name="selectedDatasource"
        onChange={(option) =>
          selectedDatasource !== option.value
            ? setSelectedDatasource(option.value)
            : undefined
        }
        options={[
          { name: "Jsonrpc", value: "jsonrpc" },
          { name: "Ordexer", value: "ordexer" },
        ]}
        value={selectedDatasource}
      />
      <h1>Non Address API Tester</h1>
      <GetInscriptionAPI datasource={datasource} />
      <GetTransactionAPI datasource={datasource} />
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
      const addresses = await unisat.getAddresses("testnet");
      console.log("Unisat Connected: ", addresses);
      setConnectedAddresses(addresses);
    } else if (provider === "xverse") {
      const addresses = await xverse.getAddresses("testnet");
      setConnectedAddresses(addresses);
      console.log("Xverse Connected: ", addresses);
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
        ]}
        value={provider}
        disabled={!!connectedAddresses}
      />
      <p>Network: Testnet</p>
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
          <AddressesAPITest connectedAddresses={connectedAddresses} />
        </>
      ) : null}
      <NonAddressAPITest />
    </div>
  );
}

export default App;
