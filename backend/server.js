const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require("dotenv").config();
const { Wallet } = require("xrpl");
const { createNFTRequestsTable } = require("./services/dbService");
const axios = require("axios");
const { Client } = require("xrpl");

const {
  uploadFileToPinata,
  uploadJSONToPinata,
} = require("./services/pinataService");
const {
  mintNFT,
  fetchAccountNFTs,
  mintAndTransferNFT,
} = require("./services/xrplService");
const { cleanupFile } = require("./utils/fileUtils");
const {
  createNFTRequest,
  getAllNFTRequests,
  getNFTRequestById,
  updateNFTRequestStatus,
  getNFTRequestsByUserId,
} = require("./services/nftRequestService");
const {
  setupForestledgerToken,
  getTokenBalance,
  sendToken,
  issueToken,
  createTrustLine,
} = require("./services/tokenService");
const {
  createSignInPayload,
  getPayloadStatus,
} = require("./services/xummService");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const upload = multer({ dest: "uploads/" });

// Xumm API endpoints
app.post("/api/xumm/signin", async (req, res) => {
  try {
    const payload = await createSignInPayload();
    res.json(payload);
  } catch (error) {
    console.error("Error creating Xumm SignIn payload:", error);
    res.status(500).json({ error: "Failed to create SignIn payload" });
  }
});

app.get("/api/xumm/payload/:id", async (req, res) => {
  try {
    const status = await getPayloadStatus(req.params.id);
    res.json(status);
  } catch (error) {
    console.error("Error getting Xumm payload status:", error);
    res.status(500).json({ error: "Failed to get payload status" });
  }
});

// NFT minting endpoint
app.post("/mint-nft", upload.single("image"), async (req, res) => {
  try {
    const {
      vegetationCoverage,
      hectares,
      specificAttributes,
      waterBodies,
      springs,
      projects,
      carRegistry,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Image is required!" });
    }

    // Upload image to IPFS
    const imagePath = path.resolve(req.file.path);
    const imageResponse = await uploadFileToPinata(
      imagePath,
      req.file.originalname
    );
    const imageIPFS = `ipfs://${imageResponse.IpfsHash}`;

    // Create and upload metadata
    const metadata = {
      name: "Preservation Certificate",
      description: "NFT certifying the preservation of a protected area.",
      image: imageIPFS,
      attributes: [
        { trait_type: "Vegetation Coverage (%)", value: vegetationCoverage },
        { trait_type: "Number of Hectares", value: hectares },
        { trait_type: "Specific Attributes", value: specificAttributes },
        { trait_type: "Number of Water Bodies", value: waterBodies },
        { trait_type: "Number of Springs", value: springs },
        { trait_type: "Projects in Development", value: projects },
        { trait_type: "CAR Registry", value: carRegistry },
      ],
    };

    const metadataResponse = await uploadJSONToPinata(metadata);

    // Clean up the uploaded file
    cleanupFile(imagePath);

    // Mint the NFT
    const metadataURI = `ipfs://${metadataResponse.IpfsHash}`;
    const hexURI = Buffer.from(metadataURI).toString("hex");
    const mintResponse = await mintNFT(hexURI);

    res.status(200).json({
      message: "NFT successfully generated and minted!",
      metadataURI: metadataURI,
      mintResponse: mintResponse,
    });
  } catch (error) {
    console.error("Error generating NFT:", error);
    res
      .status(500)
      .json({ error: "Error generating NFT", details: error.message });
  }
});

// Get NFTs for an account
app.get("/nfts/:address", async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    const nfts = await fetchAccountNFTs(address);

    // For each NFT, fetch metadata if it has an IPFS URI
    const nftsWithMetadata = await Promise.all(
      nfts.map(async (nft) => {
        try {
          if (nft.decodedURI && nft.decodedURI.startsWith("ipfs://")) {
            const ipfsHash = nft.decodedURI.replace("ipfs://", "");
            const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

            try {
              const response = await axios.get(ipfsUrl);
              return {
                ...nft,
                metadata: response.data,
              };
            } catch (error) {
              console.error(
                `Error fetching metadata from IPFS: ${error.message}`
              );
              return {
                ...nft,
                metadata: null,
              };
            }
          }

          return nft;
        } catch (error) {
          console.error(`Error processing NFT: ${error.message}`);
          return nft;
        }
      })
    );

    res.json({ nfts: nftsWithMetadata });
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    res.status(500).json({
      error: "Error fetching NFTs",
      details: error.message,
    });
  }
});

// Keep the original endpoint for backward compatibility
app.get("/nfts", async (req, res) => {
  try {
    // Use a default address if none is provided
    const nfts = await fetchAccountNFTs(process.env.DEFAULT_XRPL_ADDRESS);
    res.json(nfts);
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    res
      .status(500)
      .json({ error: "Error fetching NFTs", details: error.message });
  }
});

// Create NFT request endpoint
app.post("/request-nft", upload.single("image"), async (req, res) => {
  try {
    const {
      userId,
      vegetationCoverage,
      hectares,
      specificAttributes,
      waterBodies,
      springs,
      projects,
      carRegistry,
      walletAddress,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Image is required!" });
    }

    if (!userId || !walletAddress) {
      return res
        .status(400)
        .json({ error: "User ID and wallet address are required!" });
    }

    // Upload image to IPFS
    const imagePath = path.resolve(req.file.path);
    const imageResponse = await uploadFileToPinata(
      imagePath,
      req.file.originalname
    );
    const imageIPFS = `ipfs://${imageResponse.IpfsHash}`;

    // Create metadata
    const metadata = {
      name: "Preservation Certificate",
      description: "NFT certifying the preservation of a protected area.",
      image: imageIPFS,
      attributes: [
        { trait_type: "Vegetation Coverage (%)", value: vegetationCoverage },
        { trait_type: "Number of Hectares", value: hectares },
        { trait_type: "Specific Attributes", value: specificAttributes },
        { trait_type: "Number of Water Bodies", value: waterBodies },
        { trait_type: "Number of Springs", value: springs },
        { trait_type: "Projects in Development", value: projects },
        { trait_type: "CAR Registry", value: carRegistry },
      ],
    };

    cleanupFile(imagePath);

    // Store the request in the database
    const nftRequest = await createNFTRequest(userId, walletAddress, metadata);

    res.status(201).json({
      message: "NFT request created successfully!",
      request: nftRequest,
    });
  } catch (error) {
    console.error("Error creating NFT request:", error);
    res
      .status(500)
      .json({ error: "Error creating NFT request", details: error.message });
  }
});

// Get all NFT requests (admin only)
app.get("/admin/nft-requests", async (req, res) => {
  try {
    const { status } = req.query;
    const requests = await getAllNFTRequests(status);

    // Garantir que estamos enviando um array, mesmo que vazio
    res.json(requests || []);
  } catch (error) {
    console.error("Error fetching NFT requests:", error);
    // Garantir que estamos enviando um JSON válido mesmo em caso de erro
    res.status(500).json({
      error: "Error fetching NFT requests",
      details: error.message || String(error),
    });
  }
});

// Get NFT request by ID
app.get("/nft-requests/:id", async (req, res) => {
  try {
    const request = await getNFTRequestById(parseInt(req.params.id));
    res.json(request);
  } catch (error) {
    console.error("Error fetching NFT request:", error);
    res
      .status(404)
      .json({ error: "Error fetching NFT request", details: error.message });
  }
});

// Get user's NFT requests
app.get("/users/:userId/nft-requests", async (req, res) => {
  try {
    const requests = await getNFTRequestsByUserId(req.params.userId);
    res.json(requests);
  } catch (error) {
    console.error("Error fetching user's NFT requests:", error);
    res.status(500).json({
      error: "Error fetching user's NFT requests",
      details: error.message,
    });
  }
});

// Approve and mint NFT request
app.post("/admin/nft-requests/:id/approve", async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);

    // Get the request details
    const request = await getNFTRequestById(requestId);

    // Upload metadata to IPFS
    const metadataResponse = await uploadJSONToPinata(request.metadata);
    const metadataURI = `ipfs://${metadataResponse.IpfsHash}`;
    const hexURI = Buffer.from(metadataURI).toString("hex").toUpperCase();

    console.log("Original URI:", metadataURI);
    console.log("Hex encoded URI:", hexURI);

    // Mint and create offer for the NFT
    const nftResponse = await mintAndTransferNFT(
      hexURI,
      request.wallet_address
    );

    // Update the request status to "approved" (not "minted" yet)
    await updateNFTRequestStatus(requestId, "approved");

    res.status(200).json({
      message: "NFT request approved and offer created successfully!",
      note: "The recipient needs to accept the offer to receive the NFT.",
      metadataURI: metadataURI,
      hexURI: hexURI,
      nftResponse: nftResponse,
    });
  } catch (error) {
    console.error("Error approving NFT request:", error);
    res
      .status(500)
      .json({ error: "Error approving NFT request", details: error.message });
  }
});

// Reject NFT request
app.post("/admin/nft-requests/:id/reject", async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const request = await updateNFTRequestStatus(requestId, "rejected");

    res.status(200).json({
      message: "NFT request rejected successfully!",
      request: request,
    });
  } catch (error) {
    console.error("Error rejecting NFT request:", error);
    res
      .status(500)
      .json({ error: "Error rejecting NFT request", details: error.message });
  }
});

// Setup Forestledger token
app.post("/admin/setup-token", async (req, res) => {
  try {
    const result = await setupForestledgerToken();
    res.status(200).json({
      message: "Forestledger token setup completed successfully!",
      result: result,
    });
  } catch (error) {
    console.error("Error setting up token:", error);
    res
      .status(500)
      .json({ error: "Error setting up token", details: error.message });
  }
});

// Get token balance
app.get("/token/balance/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const { currency, issuer } = req.query;

    if (!currency || !issuer) {
      return res
        .status(400)
        .json({ error: "Currency and issuer are required" });
    }

    const balance = await getTokenBalance(address, currency, issuer);
    res.json({ address, currency, issuer, balance });
  } catch (error) {
    console.error("Error getting token balance:", error);
    res
      .status(500)
      .json({ error: "Error getting token balance", details: error.message });
  }
});

// Send tokens
app.post("/token/send", async (req, res) => {
  try {
    const { hotWalletSeed, destination, currency, amount, issuer } = req.body;

    if (!hotWalletSeed || !destination || !currency || !amount || !issuer) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const hotWallet = Wallet.fromSeed(hotWalletSeed);
    const result = await sendToken(
      hotWallet,
      destination,
      currency,
      amount,
      issuer
    );

    res.status(200).json({
      message: "Tokens sent successfully!",
      transaction: result,
    });
  } catch (error) {
    console.error("Error sending tokens:", error);
    res
      .status(500)
      .json({ error: "Error sending tokens", details: error.message });
  }
});

// Create trust line
app.post("/token/trust-line", async (req, res) => {
  try {
    const { walletSeed, issuer, currency, limit } = req.body;

    if (!walletSeed || !issuer || !currency || !limit) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const wallet = Wallet.fromSeed(walletSeed);
    const result = await createTrustLine(wallet, issuer, currency, limit);

    res.status(200).json({
      message: "Trust line created successfully!",
      transaction: result,
    });
  } catch (error) {
    console.error("Error creating trust line:", error);
    res
      .status(500)
      .json({ error: "Error creating trust line", details: error.message });
  }
});

// Get pending NFT offers for a wallet
app.get("/nfts/:address/pending-offers", async (req, res) => {
  try {
    const { address } = req.params;

    // Validate the address
    if (!address || typeof address !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet address",
      });
    }

    console.log(`Fetching pending offers for account ${address}`);

    // Connect to XRPL
    const client = new Client("wss://s.altnet.rippletest.net:51233");
    await client.connect();

    try {
      // Primeiro, buscar todos os NFTs que a conta possui
      const nftsResponse = await client.request({
        command: "account_nfts",
        account: address,
        ledger_index: "validated",
      });

      console.log(
        `Found ${
          nftsResponse.result.account_nfts?.length || 0
        } NFTs for account ${address}`
      );

      // Agora, buscar ofertas para cada NFT
      const pendingOffers = [];

      // Também buscar ofertas usando account_offers
      const offersResponse = await client.request({
        command: "account_offers",
        account: address,
        ledger_index: "validated",
      });

      console.log(
        `Found ${
          offersResponse.result.offers?.length || 0
        } offers for account ${address}`
      );

      // Adicionar ofertas de account_offers
      if (offersResponse.result.offers) {
        for (const offer of offersResponse.result.offers) {
          pendingOffers.push({
            index: offer.seq || "",
            nft_id: offer.NFTokenID || "",
            offer_details: offer,
          });
        }
      }

      // Buscar ofertas para o endereço em outros NFTs
      // Isso é mais complexo e pode exigir consultar a conta do emissor
      // Vamos usar o endereço do emissor do seu arquivo .env
      const issuerAddress = process.env.SEED;
      if (issuerAddress) {
        const issuerNftsResponse = await client.request({
          command: "account_nfts",
          account: issuerAddress,
          ledger_index: "validated",
        });

        console.log(
          `Found ${
            issuerNftsResponse.result.account_nfts?.length || 0
          } NFTs for issuer account`
        );

        // Para cada NFT do emissor, verificar se há ofertas para o endereço do usuário
        for (const nft of issuerNftsResponse.result.account_nfts || []) {
          try {
            const sellOffersResponse = await client.request({
              command: "nft_sell_offers",
              nft_id: nft.NFTokenID,
              ledger_index: "validated",
            });

            if (sellOffersResponse.result.offers) {
              for (const offer of sellOffersResponse.result.offers) {
                if (offer.destination === address) {
                  pendingOffers.push({
                    index: offer.nft_offer_index,
                    nft_id: nft.NFTokenID,
                    offer_details: offer,
                  });
                }
              }
            }
          } catch (error) {
            console.error(
              `Error fetching sell offers for NFT ${nft.NFTokenID}:`,
              error.message
            );
          }
        }
      }

      console.log(
        `Found a total of ${pendingOffers.length} pending offers for account ${address}`
      );

      res.json({ pendingOffers });
    } finally {
      await client.disconnect();
    }
  } catch (error) {
    console.error("Error fetching pending offers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending offers",
      error: error.message,
    });
  }
});

// Generate Xumm link for accepting an NFT offer
app.get("/nft-offers/:offerId/xumm-link", async (req, res) => {
  try {
    const { offerId } = req.params;

    // Validate the offer ID
    if (!offerId || typeof offerId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid offer ID",
      });
    }

    console.log(`Generating Xumm link for offer ${offerId}`);

    // Não precisamos verificar a oferta no XRPL, apenas criar o payload para o Xumm
    // Create a payload for the Xumm API
    const payload = {
      txjson: {
        TransactionType: "NFTokenAcceptOffer",
        NFTokenSellOffer: offerId, // Usando SellOffer em vez de BuyOffer
      },
    };

    // Send the payload to the Xumm API
    const xummResponse = await axios.post(
      "https://xumm.app/api/v1/platform/payload",
      payload,
      {
        headers: {
          "X-API-Key": process.env.XUMM_API_KEY,
          "X-API-Secret": process.env.XUMM_API_SECRET,
          "Content-Type": "application/json",
        },
      }
    );

    if (
      !xummResponse.data ||
      !xummResponse.data.next ||
      !xummResponse.data.next.always
    ) {
      throw new Error("Failed to generate Xumm link");
    }

    res.json({
      xummLink: xummResponse.data.next.always,
      message: "Scan the QR code with your Xumm wallet to accept the NFT offer",
    });
  } catch (error) {
    console.error("Error generating Xumm link:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate Xumm link",
      error: error.message,
    });
  }
});

// Check the status of an NFT offer
app.get("/nft-offers/:offerId/status", async (req, res) => {
  try {
    const { offerId } = req.params;

    // Validate the offer ID
    if (!offerId || typeof offerId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid offer ID",
      });
    }

    console.log(`Checking status for offer ${offerId}`);

    // Connect to XRPL
    const client = new Client("wss://s.altnet.rippletest.net:51233");
    await client.connect();

    try {
      // Verificar se a oferta ainda existe usando o comando ledger_entry
      try {
        const offerResponse = await client.request({
          command: "ledger_entry",
          index: offerId,
          ledger_index: "validated",
        });

        // Se a oferta ainda existe, está pendente
        if (offerResponse.result && offerResponse.result.node) {
          return res.json({
            status: "pending",
            message: "The offer is still pending acceptance",
          });
        }
      } catch (error) {
        // Se recebermos um erro entryNotFound, a oferta não existe mais (pode ter sido aceita)
        if (error.message && error.message.includes("entryNotFound")) {
          return res.json({
            status: "accepted",
            message: "The offer has been accepted or cancelled",
          });
        }

        // Outros erros
        console.error("Error checking offer in ledger:", error);
      }

      // Se chegamos aqui, vamos assumir que a oferta foi aceita
      res.json({
        status: "accepted",
        message: "The offer appears to have been accepted or cancelled",
      });
    } finally {
      await client.disconnect();
    }
  } catch (error) {
    console.error("Error checking offer status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check offer status",
      error: error.message,
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
async function startServer() {
  try {
    // Check for required environment variables
    // Use SEED or ACCOUNT_ADDRESS as fallbacks for XRPL_SEED
    const xrplSeed =
      process.env.XRPL_SEED || process.env.ACCOUNT_ADDRESS || process.env.SEED;

    if (!xrplSeed) {
      console.error("ERROR: No XRPL seed found in environment variables");
      console.error(
        "Please set XRPL_SEED, ACCOUNT_ADDRESS, or SEED in your .env file"
      );
      process.exit(1);
    }

    // Validate the XRPL seed format
    try {
      Wallet.fromSeed(xrplSeed);
      console.log("XRPL seed is valid");
    } catch (error) {
      console.error("ERROR: Invalid XRPL seed format:", error.message);
      console.error(
        "Current seed value (first 3 chars):",
        xrplSeed.substring(0, 3) + "..."
      );
      console.error("Please check your seed in the .env file");
      process.exit(1);
    }

    // Initialize the database table
    await createNFTRequestsTable();
    console.log("Database tables initialized");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
