import React from "react";

interface ConnectWalletCardProps {
  connectWallet: () => void;
  message?: string;
}

const ConnectWalletCard: React.FC<ConnectWalletCardProps> = ({
  connectWallet,
  message = "Connect your XRPL wallet to view your NFTs, pending offers, and requests.",
}) => {
  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[50vh]">
      <div className="bg-card p-6 rounded-lg shadow-lg mb-8 border-2 border-primary/30 max-w-md w-full text-center">
        <h2 className="text-2xl font-semibold mb-4 text-primary">
          Connect Your Wallet
        </h2>
        <p className="text-text-muted mb-6">{message}</p>
        <button
          onClick={connectWallet}
          className="bg-primary-color hover:bg-primary-color/90 text-white font-medium px-6 py-3 rounded-md transition-colors w-full"
        >
          Connect Wallet
        </button>
      </div>
    </div>
  );
};

export default ConnectWalletCard;
