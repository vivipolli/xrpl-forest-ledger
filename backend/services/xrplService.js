const { Client, Wallet } = require("xrpl");

const XRPL_SERVER = "wss://s.altnet.rippletest.net/";
const ACCOUNT_SEED = process.env.SEED;
const ACCOUNT_ADDRESS = process.env.ACCOUNT_ADDRESS;

/**
 * Mints an NFT on the XRP Ledger
 * @param {string} metadataURI - URI of the metadata in hex format
 * @returns {Promise<Object>} - Minting response
 */
async function mintNFT(metadataURI) {
  const client = new Client(XRPL_SERVER);
  await client.connect();

  try {
    const wallet = Wallet.fromSeed(ACCOUNT_SEED);

    console.log("Wallet address:", wallet.classicAddress);
    const transaction = {
      TransactionType: "NFTokenMint",
      Account: wallet.classicAddress,
      URI: metadataURI,
      Flags: 8,
      NFTokenTaxon: 0,
    };

    const response = await client.submitAndWait(transaction, { wallet });
    console.log("NFT minted:", response);
    return response;
  } finally {
    client.disconnect();
  }
}

/**
 * Transfers an NFT to a user's wallet
 * @param {string} tokenID - ID of the NFT to transfer
 * @param {string} destinationAddress - Destination wallet address
 * @returns {Promise<Object>} - Transfer response
 */
async function transferNFT(tokenID, destinationAddress) {
  const client = new Client(XRPL_SERVER);
  await client.connect();

  try {
    const wallet = Wallet.fromSeed(ACCOUNT_SEED);

    const transaction = {
      TransactionType: "NFTokenCreateOffer",
      Account: wallet.classicAddress,
      NFTokenID: tokenID,
      Amount: "0", // 0 for a gift
      Flags: 1, // 1 means it's a sell offer
      Destination: destinationAddress,
    };

    const response = await client.submitAndWait(transaction, { wallet });
    console.log("NFT transfer offer created:", response);

    // The offer is automatically accepted by the destination
    // if the Destination field is set

    return response;
  } finally {
    client.disconnect();
  }
}

/**
 * Extracts the NFTokenID from a successful mint transaction
 * @param {Object} mintTxResponse - The response from the mint transaction
 * @param {string} metadataURI - The URI used in the mint transaction
 * @returns {Promise<string>} - The NFTokenID
 */
async function getNFTokenIDFromMint(mintTxResponse, metadataURI) {
  const client = new Client(XRPL_SERVER);
  await client.connect();

  try {
    // Get the transaction hash from the mint response
    const txHash = mintTxResponse.result.hash;

    // Get transaction details
    const txResponse = await client.request({
      command: "tx",
      transaction: txHash,
      binary: false,
    });

    // Get the account's NFTs
    const nftsResponse = await client.request({
      command: "account_nfts",
      account: ACCOUNT_ADDRESS,
    });

    const nfts = nftsResponse.result.account_nfts;

    // Find the NFT with matching URI
    const hexURI = metadataURI;
    const matchingNFT = nfts.find((nft) => nft.URI === hexURI);

    if (matchingNFT) {
      return matchingNFT.NFTokenID;
    }

    // If we can't find by URI, use the transaction metadata
    // This is a more reliable method when available
    if (txResponse.result.meta && txResponse.result.meta.AffectedNodes) {
      for (const node of txResponse.result.meta.AffectedNodes) {
        if (
          node.CreatedNode &&
          node.CreatedNode.LedgerEntryType === "NFTokenPage"
        ) {
          const tokenPage = node.CreatedNode.NewFields;
          if (tokenPage.NFTokens && tokenPage.NFTokens.length > 0) {
            return tokenPage.NFTokens[0].NFToken.NFTokenID;
          }
        } else if (
          node.ModifiedNode &&
          node.ModifiedNode.LedgerEntryType === "NFTokenPage"
        ) {
          const tokenPage = node.ModifiedNode.FinalFields;
          if (tokenPage.NFTokens && tokenPage.NFTokens.length > 0) {
            // The most recently added NFT is likely the one we just minted
            return tokenPage.NFTokens[tokenPage.NFTokens.length - 1].NFToken
              .NFTokenID;
          }
        }
      }
    }

    throw new Error("Could not find the minted NFT ID");
  } finally {
    client.disconnect();
  }
}

/**
 * Mints an NFT and transfers it to a user's wallet
 * @param {string} metadataURI - URI of the metadata in hex format
 * @param {string} destinationAddress - Destination wallet address
 * @returns {Promise<Object>} - Complete operation response
 */
async function mintAndTransferNFT(metadataURI, destinationAddress) {
  // First mint the NFT
  const mintResponse = await mintNFT(metadataURI);

  // Get the NFT ID using the transaction information
  const nftID = await getNFTokenIDFromMint(mintResponse, metadataURI);

  // Transfer the NFT to the destination address
  const transferResponse = await transferNFT(nftID, destinationAddress);

  return {
    mintResponse,
    transferResponse,
    nftID,
  };
}

/**
 * Fetches all NFTs for the configured account
 * @returns {Promise<Array>} - List of NFTs
 */
async function fetchAccountNFTs() {
  const client = new Client(XRPL_SERVER);
  await client.connect();

  try {
    const response = await client.request({
      command: "account_nfts",
      account: ACCOUNT_ADDRESS,
    });

    return response.result.account_nfts;
  } finally {
    client.disconnect();
  }
}

module.exports = {
  mintNFT,
  transferNFT,
  mintAndTransferNFT,
  fetchAccountNFTs,
};
