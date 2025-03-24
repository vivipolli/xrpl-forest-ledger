/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useWeb3Auth } from "@web3auth/modal-react-hooks";
import { ADAPTER_STATUS } from "@web3auth/base";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Profile from "./pages/Profile";
import MyReservations from "./pages/MyReservations";
import MyNFTs from "./pages/MyNFTs";
import { Toaster } from "react-hot-toast";
import AdminNFTRequests from "./pages/AdminNFTRequests";
import AdminRoute from "./components/AdminRoute";

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo } from "react";
import "@solana/wallet-adapter-react-ui/styles.css";

function App() {
  const { status } = useWeb3Auth();
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Router>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "#1a1a1a",
                  color: "#D4D4D4",
                  border: "1px solid #00A8CC",
                },
                success: {
                  iconTheme: {
                    primary: "#B5E61D",
                    secondary: "#0D0D0D",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "#ff4b4b",
                    secondary: "#0D0D0D",
                  },
                },
              }}
            />
            <div className="app-bg">
              {status === ADAPTER_STATUS.CONNECTED ? (
                <Layout>
                  <Routes>
                    <Route path="/" element={<MyReservations />} />
                    <Route path="/my-nfts" element={<MyNFTs />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route
                      path="/admin/nft-requests"
                      element={
                        <AdminRoute>
                          <AdminNFTRequests />
                        </AdminRoute>
                      }
                    />
                  </Routes>
                </Layout>
              ) : (
                <Login />
              )}
              <div
                id="console"
                className="hidden"
                style={{ whiteSpace: "pre-line" }}
              >
                <p style={{ whiteSpace: "pre-line" }}></p>
              </div>
            </div>
          </Router>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
