const db = require("../config/database");

/**
 * Check if the nft_requests table exists
 * @returns {Promise<boolean>} - True if table exists
 */
async function checkNFTRequestsTable() {
  try {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'nft_requests'
      );
    `;

    const result = await db.query(query);
    return result.rows[0].exists;
  } catch (error) {
    console.error("Error checking nft_requests table:", error);
    return false;
  }
}

/**
 * Create the nft-requests table if it doesn't exist
 */
async function createNFTRequestsTable() {
  try {
    const tableExists = await checkNFTRequestsTable();

    if (!tableExists) {
      console.log("Creating nft-requests table...");

      const query = `
        CREATE TABLE IF NOT EXISTS "nft-requests" (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          wallet_address VARCHAR(255) NOT NULL,
          metadata JSONB NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_nft_requests_user_id ON "nft-requests"(user_id);
        CREATE INDEX IF NOT EXISTS idx_nft_requests_wallet_address ON "nft-requests"(wallet_address);
        CREATE INDEX IF NOT EXISTS idx_nft_requests_status ON "nft-requests"(status);
      `;

      await db.query(query);
      console.log("nft-requests table created successfully");
    } else {
      console.log("nft-requests table already exists");
    }

    return true;
  } catch (error) {
    console.error("Error creating nft-requests table:", error);
    throw error;
  }
}

module.exports = {
  checkNFTRequestsTable,
  createNFTRequestsTable,
};
