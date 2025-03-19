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
 * Uploads JSON data to Pinata IPFS
 * @param {Object} jsonData - JSON data to upload
 * @returns {Promise<Object>} - Pinata response
 */
async function uploadJSONToPinata(jsonData) {
  const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

  const headers = {
    "Content-Type": "application/json",
    pinata_api_key: PINATA_API_KEY,
    pinata_secret_api_key: PINATA_SECRET_API_KEY,
  };

  const response = await axios.post(url, jsonData, { headers });
  return response.data;
}

module.exports = {
  uploadFileToPinata,
  uploadJSONToPinata,
};
