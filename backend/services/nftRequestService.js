const db = require("../config/database");

/**
 * Create a new NFT request
 * @param {string} userId - ID of the user making the request
 * @param {string} walletAddress - User's wallet address
 * @param {Object} metadata - NFT metadata
 * @returns {Promise<Object>} - Created request
 */
async function createNFTRequest(userId, walletAddress, metadata) {
  const query = `
    INSERT INTO nft_requests (user_id, wallet_address, metadata)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const result = await db.query(query, [userId, walletAddress, metadata]);
  return result.rows[0];
}

/**
 * Get all NFT requests
 * @param {string} status - Filter by status (optional)
 * @returns {Promise<Array>} - List of NFT requests
 */
async function getAllNFTRequests(status = null) {
  let query = "SELECT * FROM nft_requests";
  const params = [];

  if (status) {
    query += " WHERE status = $1";
    params.push(status);
  }

  query += " ORDER BY created_at DESC";

  const result = await db.query(query, params);
  return result.rows;
}

/**
 * Get NFT request by ID
 * @param {number} requestId - Request ID
 * @returns {Promise<Object>} - NFT request
 */
async function getNFTRequestById(requestId) {
  const query = "SELECT * FROM nft_requests WHERE id = $1";
  const result = await db.query(query, [requestId]);

  if (result.rows.length === 0) {
    throw new Error("NFT request not found");
  }

  return result.rows[0];
}

/**
 * Update NFT request status
 * @param {number} requestId - Request ID
 * @param {string} status - New status ('approved', 'rejected', 'minted')
 * @returns {Promise<Object>} - Updated request
 */
async function updateNFTRequestStatus(requestId, status) {
  const query = `
    UPDATE nft_requests
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *;
  `;

  const result = await db.query(query, [status, requestId]);

  if (result.rows.length === 0) {
    throw new Error("NFT request not found");
  }

  return result.rows[0];
}

/**
 * Get NFT requests by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - List of user's NFT requests
 */
async function getNFTRequestsByUserId(userId) {
  const query =
    "SELECT * FROM nft_requests WHERE user_id = $1 ORDER BY created_at DESC";
  const result = await db.query(query, [userId]);
  return result.rows;
}

module.exports = {
  createNFTRequest,
  getAllNFTRequests,
  getNFTRequestById,
  updateNFTRequestStatus,
  getNFTRequestsByUserId,
};
