import React, { useState, useEffect } from "react";
import { useWeb3Auth } from "@web3auth/modal-react-hooks";
import {
  nftService,
  NFTResponse,
  NFTRequest,
  PendingOffer,
} from "../services/nft";
import {
  FaCheckCircle,
  FaHourglassHalf,
  FaExclamationTriangle,
  FaExternalLinkAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";
import HeaderForm from "../components/HeaderForm";
import { createSignInPayload, getPayloadStatus } from "../services/xummService";
import ConnectWalletCard from "../components/ConnectWalletCard";

const MyNFTs: React.FC = () => {
  const { web3Auth } = useWeb3Auth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [nfts, setNfts] = useState<NFTResponse[]>([]);
  const [pendingOffers, setPendingOffers] = useState<PendingOffer[]>([]);
  const [requests, setRequests] = useState<NFTRequest[]>([]);
  const [acceptingOffer, setAcceptingOffer] = useState<string | null>(null);

  const [connected, setConnected] = useState<boolean>(() => {
    // Initialize from localStorage if available
    const savedConnection = localStorage.getItem("walletConnected");
    return savedConnection === "true";
  });

  const [xrplAddress, setXrplAddress] = useState<string>(() => {
    return localStorage.getItem("walletAddress") || "";
  });

  const [userId, setUserId] = useState<string>("");

  // Add connect and disconnect functions
  const connectWallet = async () => {
    try {
      // Create a SignIn payload using our backend service
      const payload = await createSignInPayload();

      // Open the QR code for the user to scan with the Xaman app
      window.open(payload.next.always, "_blank");

      // Poll for the result
      const checkInterval = setInterval(async () => {
        const statusResult = await getPayloadStatus(payload.uuid);

        if (statusResult.meta && statusResult.meta.signed) {
          clearInterval(checkInterval);

          // Set the user's XRPL address
          setXrplAddress(statusResult.response.account);
          setConnected(true);

          // Save to localStorage
          localStorage.setItem("walletConnected", "true");
          localStorage.setItem("walletAddress", statusResult.response.account);
        }
      }, 30000); // Check every 3 seconds
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Failed to connect wallet. Please try again later.");
    }
  };

  const disconnect = () => {
    setConnected(false);
    setXrplAddress("");

    // Clear localStorage
    localStorage.removeItem("walletConnected");
    localStorage.removeItem("walletAddress");

    // Clear NFT data
    setNfts([]);
    setPendingOffers([]);
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (web3Auth) {
        try {
          const user = await web3Auth.getUserInfo();
          if (user.email) {
            setUserId(user.email);
          }
        } catch (err) {
          console.error("Error fetching user info:", err);
          setError("Failed to load user information");
        }
      }
    };

    fetchUserInfo();
  }, [web3Auth]);

  useEffect(() => {
    const fetchData = async () => {
      if (!connected || !xrplAddress) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch NFTs
        const nftData = await nftService.getNFTs(xrplAddress);
        setNfts(nftData);

        // Fetch pending offers
        const offersData = await nftService.getPendingOffers(xrplAddress);
        setPendingOffers(offersData.pendingOffers || []);

        // Fetch NFT requests
        if (userId) {
          const requestsData = await nftService.getUserNFTRequests(userId);
          setRequests(requestsData);
        }

        setError(null);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load NFT data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [connected, xrplAddress, userId]);

  const handleAcceptOffer = async (offerId: string) => {
    setAcceptingOffer(offerId);

    try {
      const xummResponse = await nftService.getXummLink(offerId);
      window.open(xummResponse.xummLink, "_blank");

      toast.success(
        "Offer acceptance initiated. Please complete the process in your Xumm wallet."
      );

      const checkInterval = setInterval(async () => {
        try {
          const statusResult = await nftService.checkOfferStatus(offerId);

          if (statusResult.status === "accepted") {
            clearInterval(checkInterval);
            toast.success("NFT offer accepted successfully!");

            const nftsData = await nftService.getNFTs(xrplAddress);
            setNfts(nftsData);
            setPendingOffers((prev) =>
              prev.filter((offer) => offer.index !== offerId)
            );
          }
        } catch (error) {
          console.error("Error checking offer status:", error);
        }
      }, 5000);

      setTimeout(() => {
        clearInterval(checkInterval);
      }, 300000);
    } catch (err) {
      console.error("Error accepting offer:", err);
      toast.error("Failed to initiate offer acceptance. Please try again.");
    } finally {
      setAcceptingOffer(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "pending") {
      return (
        <span className="flex items-center bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
          <FaHourglassHalf className="mr-1" />
          Pending
        </span>
      );
    } else if (status === "approved") {
      return (
        <span className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
          <FaCheckCircle className="mr-1" />
          Approved
        </span>
      );
    } else if (status === "rejected") {
      return (
        <span className="flex items-center bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
          <FaExclamationTriangle className="mr-1" />
          Rejected
        </span>
      );
    }
    return <span>{status}</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh] bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 bg-background">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen max-w-full flex flex-col p-6 bg-background text-text-default">
      <HeaderForm
        connected={connected}
        xrplAddress={xrplAddress}
        connectWallet={connectWallet}
        disconnect={disconnect}
      />

      {!connected ? (
        <ConnectWalletCard connectWallet={connectWallet} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6 text-primary gradient-header p-4 rounded-lg shadow-lg">
            My NFTs Collection
          </h1>

          {/* Owned NFTs Section */}
          <div className="bg-card p-6 rounded-lg shadow-lg mb-8 border-2 border-primary/30 transform transition-all hover:scale-[1.01]">
            <h2 className="text-2xl font-semibold mb-4 text-primary border-b-2 border-primary/50 pb-2">
              My Owned NFTs
            </h2>
            {nfts.length === 0 ? (
              <div className="bg-background-light border-2 border-primary/30 text-text-default px-4 py-3 rounded-lg">
                <p className="text-center text-lg">
                  You don't have any NFTs yet.
                </p>
                <p className="text-center text-text-muted mt-2">
                  Check back after accepting offers or minting new NFTs.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nfts.map((nft, index) => (
                  <div
                    key={nft.NFTokenID || index}
                    className="bg-background-light border-2 border-primary/30 rounded-lg overflow-hidden hover:border-primary transition-all shadow-lg transform hover:-translate-y-1"
                  >
                    <div className="h-48 overflow-hidden relative">
                      {nft.metadata && nft.metadata.image ? (
                        <img
                          src={nft.metadata.image.replace(
                            "ipfs://",
                            "https://gateway.pinata.cloud/ipfs/"
                          )}
                          alt={nft.metadata.name || "NFT"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              "https://via.placeholder.com/400x300?text=Image+Not+Available";
                          }}
                        />
                      ) : (
                        <div className="h-full bg-background flex items-center justify-center text-text-muted">
                          <span className="bg-primary/20 px-3 py-1 rounded-lg">
                            No image available
                          </span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                        Owned
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-b from-background-light to-background">
                      <h3 className="text-xl font-semibold text-primary mb-2">
                        {nft.metadata?.name || "Unnamed NFT"}
                      </h3>
                      <p className="text-text-muted mb-3">
                        {nft.metadata?.description ||
                          "No description available"}
                      </p>

                      <div className="mt-3 flex items-center justify-between bg-primary/5 p-2 rounded-lg border border-primary/10">
                        <span className="text-primary font-medium">
                          Token ID:
                        </span>
                        <span className="text-text-muted text-xs">
                          {nft.NFTokenID
                            ? `${nft.NFTokenID.substring(
                                0,
                                6
                              )}...${nft.NFTokenID.substring(
                                nft.NFTokenID.length - 4
                              )}`
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Offers Section */}
          <div className="bg-card p-6 rounded-lg shadow-lg mb-8 border-2 border-yellow-500/30 transform transition-all hover:scale-[1.01]">
            <h2 className="text-2xl font-semibold mb-4 text-yellow-500 border-b-2 border-yellow-500/50 pb-2">
              Pending NFT Offers
            </h2>
            {pendingOffers.length === 0 ? (
              <div className="bg-background-light border-2 border-yellow-500/30 text-text-default px-4 py-3 rounded-lg">
                <p className="text-center text-lg">
                  You don't have any pending NFT offers.
                </p>
                <p className="text-center text-text-muted mt-2">
                  Check back later for new offers.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingOffers.map((offer) => (
                  <div
                    key={offer.index}
                    className="bg-background-light border-2 border-yellow-500/30 rounded-lg overflow-hidden hover:border-yellow-500 transition-all shadow-lg transform hover:-translate-y-1"
                  >
                    <div className="p-5 bg-gradient-to-b from-background-light to-background">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-yellow-500">
                          NFT Offer
                        </h3>
                        <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                          Pending
                        </span>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/10">
                          <span className="text-yellow-500 font-medium block mb-1">
                            NFT ID:
                          </span>
                          <span className="text-text-muted text-sm break-all">
                            {offer.nft_id
                              ? `${offer.nft_id.substring(
                                  0,
                                  8
                                )}...${offer.nft_id.substring(
                                  offer.nft_id.length - 8
                                )}`
                              : "N/A"}
                          </span>
                        </div>

                        <div className="bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/10">
                          <span className="text-yellow-500 font-medium block mb-1">
                            From:
                          </span>
                          <span className="text-text-muted text-sm break-all">
                            {offer.offer_details?.owner
                              ? `${offer.offer_details.owner.substring(
                                  0,
                                  8
                                )}...${offer.offer_details.owner.substring(
                                  offer.offer_details.owner.length - 8
                                )}`
                              : "Unknown"}
                          </span>
                        </div>

                        <div className="bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/10">
                          <span className="text-yellow-500 font-medium block mb-1">
                            To:
                          </span>
                          <span className="text-text-muted text-sm break-all">
                            {offer.offer_details?.destination
                              ? `${offer.offer_details.destination.substring(
                                  0,
                                  8
                                )}...${offer.offer_details.destination.substring(
                                  offer.offer_details.destination.length - 8
                                )}`
                              : "Unknown"}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAcceptOffer(offer.index)}
                        disabled={acceptingOffer === offer.index}
                        className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-medium py-3 px-4 rounded-md flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                      >
                        {acceptingOffer === offer.index ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <FaExternalLinkAlt className="mr-2" />
                            <span>Accept with Xumm Wallet</span>
                          </>
                        )}
                      </button>

                      <div className="mt-3 text-xs bg-yellow-500/5 p-2 rounded-lg border border-yellow-500/10 text-center">
                        <span className="text-yellow-500">Offer ID:</span>{" "}
                        {offer.index.substring(0, 6)}...
                        {offer.index.substring(offer.index.length - 4)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* NFT Requests Section */}
          <div className="bg-card p-6 rounded-lg shadow-lg mb-8 border-2 border-blue-500/30 transform transition-all hover:scale-[1.01]">
            <h2 className="text-2xl font-semibold mb-4 text-blue-500 border-b-2 border-blue-500/50 pb-2">
              Your NFT Requests
            </h2>
            {requests.length === 0 ? (
              <div className="bg-background-light border-2 border-blue-500/30 text-text-default px-4 py-3 rounded-lg">
                <p className="text-center text-lg">
                  You haven't made any NFT requests yet.
                </p>
                <p className="text-center text-text-muted mt-2">
                  Create a request to mint a new NFT.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-background-light border-2 border-blue-500/30 rounded-lg overflow-hidden hover:border-blue-500 transition-all shadow-lg transform hover:-translate-y-1"
                  >
                    <div className="h-48 overflow-hidden relative">
                      {request.metadata && request.metadata.image ? (
                        <img
                          src={request.metadata.image.replace(
                            "ipfs://",
                            "https://gateway.pinata.cloud/ipfs/"
                          )}
                          alt="NFT Request"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              "https://via.placeholder.com/400x300?text=Image+Not+Available";
                          }}
                        />
                      ) : (
                        <div className="h-full bg-background flex items-center justify-center text-text-muted">
                          <span className="bg-blue-500/20 px-3 py-1 rounded-lg">
                            No image available
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-gradient-to-b from-background-light to-background">
                      <h3 className="text-xl font-semibold text-blue-500 mb-2">
                        {request.metadata?.name || `Request #${request.id}`}
                      </h3>
                      <p className="text-text-muted mb-3">
                        {request.metadata?.description ||
                          "No description available"}
                      </p>

                      <div className="mt-3 flex items-center justify-between bg-blue-500/5 p-2 rounded-lg border border-blue-500/10">
                        <span className="text-blue-400 font-medium">
                          Status:
                        </span>
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyNFTs;
