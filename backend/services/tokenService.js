const { Client, Wallet, xrpToDrops } = require("xrpl");

const XRPL_SERVER = "wss://s.altnet.rippletest.net/";
const COLD_WALLET_SEED = process.env.COLD_WALLET_SEED;
const HOT_WALLET_SEED = process.env.HOT_WALLET_SEED;

/**
 * Set up and fund the cold wallet (issuer)
 * @returns {Promise<Object>} - Cold wallet details
 */
async function setupColdWallet() {
  const client = new Client(XRPL_SERVER);
  await client.connect();

  try {
    let coldWallet;

    if (COLD_WALLET_SEED) {
      coldWallet = Wallet.fromSeed(COLD_WALLET_SEED);
      console.log("Using existing cold wallet:", coldWallet.address);
    } else {
      // Create a wallet for the issuer account
      coldWallet = Wallet.generate();
      console.log("Created new cold wallet (issuer):", coldWallet.address);
      console.log("Cold wallet seed:", coldWallet.seed);
      console.log("IMPORTANT: Save this seed for future use!");
    }

    // Check if the account exists and fund it if needed
    try {
      const coldWalletInfo = await client.request({
        command: "account_info",
        account: coldWallet.address,
        ledger_index: "validated",
      });
      console.log("Cold wallet already exists");
    } catch (error) {
      if (error.data && error.data.error === "actNotFound") {
        console.log("Cold wallet not found, funding it...");
        const fund_result = await client.fundWallet(coldWallet);
        console.log("Cold wallet funded with", fund_result.balance, "XRP");
      } else {
        throw error;
      }
    }

    return {
      wallet: coldWallet,
      address: coldWallet.address,
      seed: coldWallet.seed,
    };
  } finally {
    await client.disconnect();
  }
}

/**
 * Set up and fund the hot wallet (operational account)
 * @returns {Promise<Object>} - Hot wallet details
 */
async function setupHotWallet() {
  const client = new Client(XRPL_SERVER);
  await client.connect();

  try {
    let hotWallet;

    if (HOT_WALLET_SEED) {
      hotWallet = Wallet.fromSeed(HOT_WALLET_SEED);
      console.log("Using existing hot wallet:", hotWallet.address);
    } else {
      // Create a wallet for the operational account
      hotWallet = Wallet.generate();
      console.log("Created new hot wallet (operational):", hotWallet.address);
      console.log("Hot wallet seed:", hotWallet.seed);
      console.log("IMPORTANT: Save this seed for future use!");
    }

    // Check if the account exists and fund it if needed
    try {
      const hotWalletInfo = await client.request({
        command: "account_info",
        account: hotWallet.address,
        ledger_index: "validated",
      });
      console.log("Hot wallet already exists");
    } catch (error) {
      if (error.data && error.data.error === "actNotFound") {
        console.log("Hot wallet not found, funding it...");
        const fund_result = await client.fundWallet(hotWallet);
        console.log("Hot wallet funded with", fund_result.balance, "XRP");
      } else {
        throw error;
      }
    }

    return {
      wallet: hotWallet,
      address: hotWallet.address,
      seed: hotWallet.seed,
    };
  } finally {
    await client.disconnect();
  }
}

/**
 * Configure the issuer account (cold wallet)
 * @param {Object} coldWallet - Cold wallet object
 * @returns {Promise<Object>} - Configuration result
 */
async function configureIssuer(coldWallet) {
  const client = new Client(XRPL_SERVER);
  await client.connect();

  try {
    // Configure issuer settings for the cold wallet
    const settings_tx = {
      TransactionType: "AccountSet",
      Account: coldWallet.address,
      TransferRate: 0, // No transfer fee initially
      TickSize: 5, // Recommended for tokens that may be traded in an order book
      Domain: Buffer.from("forestledger.org").toString("hex").toUpperCase(), // Replace with your domain
      SetFlag: 8, // Enable DefaultRipple
    };

    const settings_result = await client.submitAndWait(settings_tx, {
      wallet: coldWallet,
    });

    console.log(
      "Issuer settings configured:",
      settings_result.result.meta.TransactionResult
    );
    return settings_result;
  } finally {
    await client.disconnect();
  }
}

/**
 * Create a trust line from the hot wallet to the cold wallet
 * @param {Object} hotWallet - Hot wallet object
 * @param {string} coldWalletAddress - Cold wallet address
 * @param {string} currency - Currency code
 * @param {string} limit - Trust line limit
 * @returns {Promise<Object>} - Trust line result
 */
async function createTrustLine(hotWallet, coldWalletAddress, currency, limit) {
  const client = new Client(XRPL_SERVER);
  await client.connect();

  try {
    // Create trust line from hot wallet to issuer
    const trust_tx = {
      TransactionType: "TrustSet",
      Account: hotWallet.address,
      LimitAmount: {
        currency: currency,
        issuer: coldWalletAddress,
        value: limit,
      },
    };

    const trust_result = await client.submitAndWait(trust_tx, {
      wallet: hotWallet,
    });

    console.log(
      "Trust line created:",
      trust_result.result.meta.TransactionResult
    );
    return trust_result;
  } finally {
    await client.disconnect();
  }
}

/**
 * Issue tokens from the cold wallet to the hot wallet
 * @param {Object} coldWallet - Cold wallet object
 * @param {string} hotWalletAddress - Hot wallet address
 * @param {string} currency - Currency code
 * @param {string} amount - Amount to issue
 * @returns {Promise<Object>} - Issue result
 */
async function issueToken(coldWallet, hotWalletAddress, currency, amount) {
  const client = new Client(XRPL_SERVER);
  await client.connect();

  try {
    // Issue tokens from cold wallet to hot wallet
    const issue_tx = {
      TransactionType: "Payment",
      Account: coldWallet.address,
      Destination: hotWalletAddress,
      Amount: {
        currency: currency,
        value: amount,
        issuer: coldWallet.address,
      },
    };

    const issue_result = await client.submitAndWait(issue_tx, {
      wallet: coldWallet,
    });

    console.log("Tokens issued:", issue_result.result.meta.TransactionResult);
    return issue_result;
  } finally {
    await client.disconnect();
  }
}

/**
 * Get the balance of a specific token for an account
 * @param {string} address - Account address
 * @param {string} currency - Currency code
 * @param {string} issuer - Issuer address
 * @returns {Promise<string>} - Token balance
 */
async function getTokenBalance(address, currency, issuer) {
  const client = new Client(XRPL_SERVER);
  await client.connect();

  try {
    const balances = await client.request({
      command: "account_lines",
      account: address,
      peer: issuer,
    });

    for (const line of balances.result.lines) {
      if (line.currency === currency) {
        return line.balance;
      }
    }

    return "0";
  } finally {
    await client.disconnect();
  }
}

/**
 * Send tokens from the hot wallet to a destination
 * @param {Object} hotWallet - Hot wallet object
 * @param {string} destination - Destination address
 * @param {string} currency - Currency code
 * @param {string} amount - Amount to send
 * @param {string} issuer - Issuer address
 * @returns {Promise<Object>} - Send result
 */
async function sendToken(hotWallet, destination, currency, amount, issuer) {
  const client = new Client(XRPL_SERVER);
  await client.connect();

  try {
    // Check if destination has a trust line
    try {
      const dest_lines = await client.request({
        command: "account_lines",
        account: destination,
        peer: issuer,
      });

      let has_trust_line = false;
      for (const line of dest_lines.result.lines) {
        if (line.currency === currency) {
          has_trust_line = true;
          break;
        }
      }

      if (!has_trust_line) {
        throw new Error(
          `Destination ${destination} does not have a trust line for ${currency}`
        );
      }
    } catch (error) {
      if (error.data && error.data.error === "actNotFound") {
        throw new Error(`Destination account ${destination} does not exist`);
      } else {
        throw error;
      }
    }

    // Send tokens from hot wallet to destination
    const send_tx = {
      TransactionType: "Payment",
      Account: hotWallet.address,
      Destination: destination,
      Amount: {
        currency: currency,
        value: amount,
        issuer: issuer,
      },
    };

    const send_result = await client.submitAndWait(send_tx, {
      wallet: hotWallet,
    });

    console.log("Tokens sent:", send_result.result.meta.TransactionResult);
    return send_result;
  } finally {
    await client.disconnect();
  }
}

/**
 * Set up the complete token issuance process
 * @returns {Promise<Object>} - Setup result
 */
async function setupForestledgerToken() {
  try {
    // Currency code for Forestledger token
    const CURRENCY_CODE = "FLT";

    // Set up cold and hot wallets
    const coldWalletInfo = await setupColdWallet();
    const hotWalletInfo = await setupHotWallet();

    // Configure issuer settings
    await configureIssuer(coldWalletInfo.wallet);

    // Create trust line from hot wallet to cold wallet
    await createTrustLine(
      hotWalletInfo.wallet,
      coldWalletInfo.address,
      CURRENCY_CODE,
      "1000000000"
    );

    // Issue initial tokens to hot wallet
    await issueToken(
      coldWalletInfo.wallet,
      hotWalletInfo.address,
      CURRENCY_CODE,
      "500000000"
    );

    // Get token balance
    const balance = await getTokenBalance(
      hotWalletInfo.address,
      CURRENCY_CODE,
      coldWalletInfo.address
    );

    return {
      currency: CURRENCY_CODE,
      coldWallet: {
        address: coldWalletInfo.address,
        seed: coldWalletInfo.seed,
      },
      hotWallet: {
        address: hotWalletInfo.address,
        seed: hotWalletInfo.seed,
        balance: balance,
      },
    };
  } catch (error) {
    console.error("Error setting up Forestledger token:", error);
    throw error;
  }
}

module.exports = {
  setupForestledgerToken,
  getTokenBalance,
  sendToken,
  issueToken,
  createTrustLine,
};
