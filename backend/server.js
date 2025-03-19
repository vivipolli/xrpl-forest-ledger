const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require("dotenv").config();
const { Wallet } = require("xrpl");

const {
  uploadFileToPinata,
  uploadJSONToPinata,
} = require("./services/pinataService");
const { mintNFT, fetchAccountNFTs } = require("./services/xrplService");
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

const app = express();
app.use(cors());
app.use(bodyParser.json());

const upload = multer({ dest: "uploads/" });

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

// Fetch NFTs endpoint
app.get("/nfts", async (req, res) => {
  try {
    const nfts = await fetchAccountNFTs();
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

    // Clean up the uploaded file
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
    res.json(requests);
  } catch (error) {
    console.error("Error fetching NFT requests:", error);
    res
      .status(500)
      .json({ error: "Error fetching NFT requests", details: error.message });
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
    const hexURI = Buffer.from(metadataURI).toString("hex");

    // Mint and transfer the NFT
    const nftResponse = await mintAndTransferNFT(
      hexURI,
      request.wallet_address
    );

    // Update the request status
    await updateNFTRequestStatus(requestId, "minted");

    res.status(200).json({
      message: "NFT request approved and minted successfully!",
      metadataURI: metadataURI,
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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
