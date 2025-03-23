const axios = require("axios");

const XUMM_API_KEY = process.env.XUMM_API_KEY;
const XUMM_API_SECRET = process.env.XUMM_API_SECRET;

/**
 * Creates a SignIn payload with Xumm
 * @returns {Promise<Object>} - Xumm payload response
 */
async function createSignInPayload() {
  try {
    // The correct payload format for SignIn
    const payload = {
      txjson: {
        TransactionType: "SignIn",
      },
    };

    console.log("Creating SignIn payload with API Key:", XUMM_API_KEY);

    const response = await axios.post(
      "https://xumm.app/api/v1/platform/payload",
      payload,
      {
        headers: {
          "X-API-Key": XUMM_API_KEY,
          "X-API-Secret": XUMM_API_SECRET,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error creating Xumm SignIn payload:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

/**
 * Gets the status of a Xumm payload
 * @param {string} payloadId - The UUID of the payload
 * @returns {Promise<Object>} - Payload status
 */
async function getPayloadStatus(payloadId) {
  try {
    console.log("Getting payload status for:", payloadId);

    const response = await axios.get(
      `https://xumm.app/api/v1/platform/payload/${payloadId}`,
      {
        headers: {
          "X-API-Key": XUMM_API_KEY,
          "X-API-Secret": XUMM_API_SECRET,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error getting Xumm payload status:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

module.exports = {
  createSignInPayload,
  getPayloadStatus,
};
