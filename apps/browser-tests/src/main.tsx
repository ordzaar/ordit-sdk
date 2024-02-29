import React from "react";
import ReactDOM from "react-dom/client";
import { WalletStandardProvider } from "@wallet-standard/react";

import App from "./App";

import "./style.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WalletStandardProvider>
      <App />
    </WalletStandardProvider>
  </React.StrictMode>,
);
