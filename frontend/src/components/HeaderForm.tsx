const HeaderForm = ({
  connected,
  xrplAddress,
  connectWallet,
  disconnect,
}: {
  connected: boolean;
  xrplAddress: string;
  connectWallet: () => void;
  disconnect: () => void;
}) => {
  return (
    <div className="flex justify-between items-center mb-6 w-full">
      <h1 className="text-3xl font-bold text-primary-color">
        My Approved Nfts Requests
      </h1>
      <div className="flex items-center space-x-4">
        {xrplAddress && (
          <div className="px-4 py-2 bg-background-light rounded-md">
            <p className="text-sm text-gray-300">XRPL Address</p>
            <p className="text-xs text-gray-400 truncate" title={xrplAddress}>
              {xrplAddress.slice(0, 6)}...{xrplAddress.slice(-4)}
            </p>
          </div>
        )}
        {connected && (
          <button
            onClick={disconnect}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors font-medium"
          >
            Disconnect Wallet
          </button>
        )}
      </div>
    </div>
  );
};

export default HeaderForm;
