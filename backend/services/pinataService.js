const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

/**
 * Uploads a file to Pinata IPFS
 * @param {string} filePath - Path to the file
 * @param {string} fileName - Name of the file
 * @returns {Promise<Object>} - Pinata response
 */
async function uploadFileToPinata(filePath, fileName) {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";

  const data = new FormData();
  data.append("file", fs.createReadStream(filePath), fileName);

  const headers = {
    ...data.getHeaders(),
    pinata_api_key: PINATA_API_KEY,
    pinata_secret_api_key: PINATA_SECRET_API_KEY,
  };

  const response = await axios.post(url, data, { headers });
  return response.data;
}

/**
 * Upload JSON metadata to Pinata
 * @param {Object} jsonData - JSON data to upload
 * @returns {Promise<Object>} - Pinata response
 */
async function uploadJSONToPinata(jsonData) {
  try {
    const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

    // Ensure the JSON is properly formatted
    const formattedJson =
      typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;

    const response = await axios.post(url, formattedJson, {
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
        "Content-Type": "application/json",
      },
    });

    console.log("JSON uploaded to Pinata:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error uploading JSON to Pinata:", error);
    throw new Error(`Failed to upload JSON to Pinata: ${error.message}`);
  }
}

module.exports = {
  uploadFileToPinata,
  uploadJSONToPinata,
};
