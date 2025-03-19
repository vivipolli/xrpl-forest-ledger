const db = require("../config/database");

async function initializeDatabase() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS nft_requests (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        wallet_address VARCHAR(255) NOT NULL,
        metadata JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  } finally {
    db.pool.end();
  }
}

initializeDatabase();
