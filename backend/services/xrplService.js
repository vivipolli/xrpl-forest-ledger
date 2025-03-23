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
 * Mint an NFT and transfer it to a recipient
 * @param {string} tokenURI - URI of the NFT metadata in hex format
 * @param {string} destinationAddress - Address to transfer the NFT to
 * @returns {Promise<Object>} - Transaction result
 */
async function mintAndTransferNFT(tokenURI, destinationAddress) {
  const client = new Client(XRPL_SERVER);
  await client.connect();

  try {
    // Ensure the URI is properly formatted
    // Remove any 0x prefix if present
    const formattedURI = tokenURI.startsWith("0x")
      ? tokenURI.slice(2)
      : tokenURI;

    console.log("Minting NFT with URI:", formattedURI);
    console.log("Destination address:", destinationAddress);

    // Check if any of the seed environment variables are defined
    const seed =
      process.env.XRPL_SEED || process.env.ACCOUNT_ADDRESS || process.env.SEED;
    if (!seed) {
      throw new Error("No XRPL seed found in environment variables");
    }

    console.log("Using seed (first 3 chars):", seed.substring(0, 3) + "...");

    let wallet;
    try {
      wallet = Wallet.fromSeed(seed);
    } catch (error) {
      console.error("Error creating wallet from seed:", error);
      throw new Error(`Invalid XRPL seed format: ${error.message}`);
    }

    console.log("Issuer wallet address:", wallet.address);

    // Prepare NFTokenMint transaction
    const transactionBlob = {
      TransactionType: "NFTokenMint",
      Account: wallet.address,
      URI: formattedURI,
      Flags: 8, // transferable
      TransferFee: 0, // 0%
      NFTokenTaxon: 0, // Required, but can be set to 0
    };

    // Sign and submit the transaction
    const tx = await client.submitAndWait(transactionBlob, { wallet });
    console.log("NFT minted successfully:", tx.result.meta.TransactionResult);

    // Get the NFTokenID from the transaction metadata
    const nftokenID = getNFTokenIDFromTx(tx.result.meta);

    if (!nftokenID) {
      throw new Error("Failed to retrieve NFTokenID from transaction metadata");
    }

    console.log("NFTokenID:", nftokenID);

    // Create NFTokenCreateOffer transaction to transfer the NFT
    const offerBlob = {
      TransactionType: "NFTokenCreateOffer",
      Account: wallet.address,
      NFTokenID: nftokenID,
      Amount: "0",
      Flags: 1, // tfSellNFToken
      Destination: destinationAddress,
    };

    // Sign and submit the offer transaction
    const offerTx = await client.submitAndWait(offerBlob, { wallet });
    console.log(
      "Offer created successfully:",
      offerTx.result.meta.TransactionResult
    );

    return {
      mint_tx: tx.result,
      offer_tx: offerTx.result,
      nft_id: nftokenID,
    };
  } catch (error) {
    console.error("Error in mintAndTransferNFT:", error);
    throw error;
  } finally {
    client.disconnect();
  }
}

/**
 * Extract NFTokenID from transaction metadata
 * @param {Object} meta - Transaction metadata
 * @returns {string|null} - NFTokenID or null if not found
 */
function getNFTokenIDFromTx(meta) {
  if (meta.AffectedNodes) {
    for (const node of meta.AffectedNodes) {
      if (
        node.ModifiedNode &&
        node.ModifiedNode.LedgerEntryType === "AccountRoot"
      ) {
        continue;
      }

      const nodeData = node.CreatedNode || node.ModifiedNode;
      if (nodeData && nodeData.LedgerEntryType === "NFTokenPage") {
        const nfts =
          nodeData.FinalFields?.NFTokens || nodeData.NewFields?.NFTokens;
        if (nfts && nfts.length > 0) {
          return nfts[nfts.length - 1].NFToken.NFTokenID;
        }
      }
    }
  }

  // Alternative method to find NFTokenID
  if (meta.delivered_amount) {
    return meta.delivered_amount.NFTokenID;
  }

  return null;
}

/**
 * Fetch NFTs for a specific account
 * @param {string} accountAddress - The XRPL account address to fetch NFTs for
 * @returns {Promise<Array>} - Array of NFTs owned by the account
 */
async function fetchAccountNFTs(accountAddress) {
  if (!accountAddress) {
    throw new Error("Account address is required");
  }

  const client = new Client(XRPL_SERVER);
  await client.connect();

  try {
    const response = await client.request({
      command: "account_nfts",
      account: accountAddress,
    });

    return response.result.account_nfts;
  } finally {
    client.disconnect();
  }
}

/**
 * Check if an account exists and is funded
 * @param {string} address - XRPL account address
 * @returns {Promise<boolean>} - True if account exists and is funded
 */
async function checkAccountExists(address) {
  const client = new Client(XRPL_SERVER);
  await client.connect();

  try {
    const response = await client.request({
      command: "account_info",
      account: address,
      strict: true,
    });

    return !!response.result.account_data;
  } catch (error) {
    if (error.data && error.data.error === "actNotFound") {
      return false;
    }
    throw error;
  } finally {
    client.disconnect();
  }
}

module.exports = {
  mintNFT,
  transferNFT,
  mintAndTransferNFT,
  fetchAccountNFTs,
  checkAccountExists,
};
