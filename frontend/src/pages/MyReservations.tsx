import { useState, useEffect } from "react";
import { Reservation, ReservationStatus } from "../types/reservation";
import { nftService } from "../services/nft";
import { getSatelliteImage } from "../services/satellite";
import { createSignInPayload, getPayloadStatus } from "../services/xummService";
import ReservationCard from "../components/ReservationCard";
import EmptyReservationCard from "../components/EmptyReservationCard";
import HeaderForm from "../components/HeaderForm";
import LoadingSpinner from "../components/LoadingSpinner";
import ConnectWalletCard from "../components/ConnectWalletCard";

function MyReservations() {
  const [connected, setConnected] = useState<boolean>(() => {
    // Initialize from localStorage if available
    const savedConnection = localStorage.getItem("walletConnected");
    return savedConnection === "true";
  });

  const [publicKey, setPublicKey] = useState<string | null>(() => {
    // Initialize from localStorage if available
    return localStorage.getItem("walletPublicKey");
  });

  const [xrplAddress, setXrplAddress] = useState<string>(() => {
    // Initialize from localStorage if available
    return localStorage.getItem("walletAddress") || "";
  });

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [xrpBalance, setXrpBalance] = useState<string>("0");

  const [formData, setFormData] = useState({
    vegetationCoverage: "",
    hectaresNumber: "",
    specificAttributes: "",
    waterBodiesCount: "",
    springsCount: "",
    ongoingProjects: "",
    carRegistry: "",
    longitude: "",
    latitude: "",
    bufferKm: "",
  });

  const [accountError, setAccountError] = useState(false);

  const fetchNFTs = async (walletAddress: string) => {
    setLoading(true);
    try {
      const nfts = await nftService.getNFTs(walletAddress);
      if (nfts.length === 0) {
        // If no NFTs exist, create a reservation with empty status
        setReservations([
          {
            id: "empty",
            status: "empty" as ReservationStatus,
            createdAt: new Date().toISOString().split("T")[0],
          },
        ]);
      } else {
        // Transform existing NFTs into reservations with proper metadata
        const nftReservations: Reservation[] = nfts.map((nft) => ({
          id: nft.NFTokenID || "unknown",
          status: "approved" as ReservationStatus,
          createdAt: new Date().toISOString().split("T")[0],
          nftData: {
            imageUrl: nft.metadata?.image?.replace(
              "ipfs://",
              "https://gateway.pinata.cloud/ipfs/"
            ),
            title: nft.metadata?.name || "Unnamed NFT",
            description:
              nft.metadata?.description || "No description available",
            attributes:
              nft.metadata?.attributes?.reduce((acc, attr) => {
                acc[attr.trait_type] = attr.value;
                return acc;
              }, {} as Record<string, string>) || {},
            issueDate: new Date().toISOString().split("T")[0],
          },
        }));
        setReservations(nftReservations);
      }
    } catch (error) {
      console.error("Error fetching NFTs:", error);

      // Check if it's an "Account not found" error
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("Account not found") ||
        (error as any)?.data?.error === "actNotFound"
      ) {
        console.log("Account not activated yet. Showing empty state.");
        setAccountError(true);
      } else {
        setAccountError(false);
      }

      // On error, set to empty to show the form
      setReservations([
        {
          id: "empty",
          status: "empty" as ReservationStatus,
          createdAt: new Date().toISOString().split("T")[0],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If we have a saved connection, fetch NFTs
    if (connected && xrplAddress) {
      fetchNFTs(xrplAddress);
    } else {
      // Initialize with an empty reservation if not connected
      setReservations([
        {
          id: "empty",
          status: "empty" as ReservationStatus,
          createdAt: new Date().toISOString().split("T")[0],
        },
      ]);
      setLoading(false);
    }
  }, [connected, xrplAddress]);

  // Save connection state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("walletConnected", connected.toString());
    localStorage.setItem("walletPublicKey", publicKey || "");
    localStorage.setItem("walletAddress", xrplAddress);
  }, [connected, publicKey, xrplAddress]);

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
          setPublicKey(statusResult.response.account);
          setConnected(true);

          // Save to localStorage
          localStorage.setItem("walletConnected", "true");
          localStorage.setItem(
            "walletPublicKey",
            statusResult.response.account
          );
          localStorage.setItem("walletAddress", statusResult.response.account);

          // Fetch NFTs for this address
          fetchNFTs(statusResult.response.account);
        }
      }, 3000); // Check every 3 seconds
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect wallet. Please try again later.");
    }
  };

  const disconnect = () => {
    setConnected(false);
    setXrplAddress("");
    setXrpBalance("0");
    setPublicKey(null);

    // Clear localStorage
    localStorage.removeItem("walletConnected");
    localStorage.removeItem("walletPublicKey");
    localStorage.removeItem("walletAddress");

    // Reset to an empty reservation
    setReservations([
      {
        id: "empty",
        status: "empty" as ReservationStatus,
        createdAt: new Date().toISOString().split("T")[0],
      },
    ]);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const urlToFile = async (url: string): Promise<File> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], "satellite-image.jpg", { type: "image/jpeg" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const coordinates = [
      [Number(formData.longitude), Number(formData.latitude)],
    ];
    const bufferKm = Number(formData.bufferKm);

    setIsLoading(true);
    try {
      // 1. Get satellite image
      const satelliteImageUrl = await getSatelliteImage(coordinates, bufferKm);

      // 2. Convert URL to File
      const imageFile = await urlToFile(satelliteImageUrl);

      // 3. Use requestNFT instead of mintCertificationNFT
      console.log("Starting NFT request...");
      const nftRequest = await nftService.requestNFT(
        publicKey || "user-id", // Use publicKey as userId
        xrplAddress, // Wallet address
        imageFile,
        {
          vegetationCoverage: formData.vegetationCoverage,
          hectaresNumber: formData.hectaresNumber,
          specificAttributes: formData.specificAttributes,
          waterBodiesCount: formData.waterBodiesCount,
          springsCount: formData.springsCount,
          ongoingProjects: formData.ongoingProjects,
          carRegistry: formData.carRegistry,
        }
      );

      // 4. Update reservation status to pending and add NFT data
      setReservations((prevReservations) =>
        prevReservations.map((reservation) =>
          reservation.status === "empty"
            ? {
                ...reservation,
                id: String(nftRequest.id),
                status: "pending" as ReservationStatus,
                nftData: {
                  imageUrl: satelliteImageUrl,
                  title: `Carbon Credit Certificate Request #${nftRequest.id}`,
                  description:
                    "Environmental Preservation Certificate (Pending Approval)",
                  attributes: {},
                  issueDate: new Date().toISOString().split("T")[0],
                },
              }
            : reservation
        )
      );

      setShowForm(false);
    } catch (error) {
      console.error("Error creating reservation:", error);
      alert("Failed to create reservation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderReservations = () => {
    return reservations.map((reservation) =>
      reservation.status === "empty" ? (
        <EmptyReservationCard
          key={reservation.id}
          showForm={showForm}
          setShowForm={setShowForm}
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          connected={connected}
          accountError={accountError}
        />
      ) : (
        <ReservationCard key={reservation.id} reservation={reservation} />
      )
    );
  };

  return (
    <div className="min-h-screen w-screen max-w-full flex flex-col p-6">
      <HeaderForm
        connected={connected}
        xrplAddress={xrplAddress}
        connectWallet={connectWallet}
        disconnect={disconnect}
      />

      {loading ? (
        <LoadingSpinner />
      ) : !connected ? (
        <ConnectWalletCard
          connectWallet={connectWallet}
          message="Connect your XRPL wallet to view and create preservation certificates."
        />
      ) : (
        <div className="w-full max-w-2xl mx-auto">{renderReservations()}</div>
      )}
    </div>
  );
}

export default MyReservations;
