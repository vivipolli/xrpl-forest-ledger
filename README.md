# ForestLedger - Environmental Reserve Certification Platform 🌿

A blockchain-based platform that enables landowners to tokenize their environmental reserves as NFTs, providing transparent and verifiable proof of environmental preservation.

## 🌍 Overview

ForestLedger transforms environmental preservation efforts into digital certificates using NFT technology on the XRP Ledger (XRPL). The platform integrates satellite imagery and environmental data to create unique digital certificates that represent verified environmental reserves, with an approval process to ensure data integrity.

## ✨ Key Features

- **Satellite Integration**: Automatic fetching of satellite imagery based on geographical coordinates
- **Environmental Data Verification**: Collection and verification of key environmental metrics:
  - Vegetation coverage
  - Water bodies count
  - Springs count
  - Hectares calculation
  - Ongoing preservation projects
  - CAR Registry (Rural Environmental Registry)
- **Approval Process**: Two-step verification system:
  - Initial request submission with environmental data
  - Admin review and approval before minting
- **NFT Generation**: Creation of unique digital certificates with:
  - Satellite imagery
  - Environmental metrics
  - Verification timestamps
  - Unique identifiers
- **Blockchain Integration**: Secure minting and storage on XRP Ledger
- **Wallet Integration**: Seamless connection with Xumm wallet

## 🛠 Technical Stack

- **Frontend**: React.js with TypeScript
- **Blockchain**: XRP Ledger (XRPL)
- **Wallet**: Xumm Wallet integration
- **Maps**: Satellite imagery API integration
- **Storage**: IPFS for NFT metadata

## 💡 Usage

1. Connect your Xumm wallet
2. Input environmental reserve coordinates
3. Fill in the environmental metrics form
4. Submit for verification
5. Wait for admin approval
6. Receive your environmental NFT certificate

## 🔒 Security

- All transactions are secured through XRP Ledger blockchain
- Environmental data is verified through satellite imagery and admin review
- NFT metadata is stored on IPFS for permanence
- Smart contract ensures immutable record keeping

## 🏆 Hackathon Implementation

This project was developed for Bizthon with the goal of bringing transparency and verifiability to environmental preservation efforts. Key implementation highlights:

- **Blockchain Innovation**: Novel use of NFTs for environmental certification
- **Real-world Impact**: Direct application for environmental preservation
- **Scalable Solution**: Ready for implementation across different regions
- **Verification System**: Multi-step approval process ensures data integrity

## 🔗 XRPL Integration Details

ForestLedger leverages the XRP Ledger (XRPL) as its blockchain foundation through several key components:

### Token Management

- **Custom Token Creation**: Issues a native "FLT" (ForestLedger Token) on XRPL using a two-wallet system (cold/hot) for secure token management
- **Trust Line Configuration**: Establishes proper trust lines between wallets for token transfers
- **Balance Tracking**: Monitors token balances across user wallets

### NFT Certification

- **Environmental NFT Minting**: Creates unique NFTs representing verified environmental reserves
- **Metadata Storage**: Stores environmental data and satellite imagery on IPFS with references on XRPL
- **Transfer Mechanism**: Enables secure transfer of NFT certificates to landowner wallets

### Wallet Integration

- **Xumm Wallet Support**: Seamless authentication and transaction signing via Xumm
- **SignIn Payload**: Simplified user authentication through Xumm's SignIn feature
- **Transaction Tracking**: Real-time monitoring of transaction status

### Request Processing

- **Approval Workflow**: Two-step verification before minting environmental NFTs
- **Status Tracking**: Monitors NFT requests through pending, approved, and minted states
- **Wallet Association**: Links NFT requests to specific XRPL wallet addresses

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔮 Future Roadmap

- [ ] **Token Economy System**: Implementation of FLT token utility:
  - Token distribution for supporters
  - Direct donations to forest NFT owners
  - Participation in Forest Guardians DAO
  - Access to pro-forest staking pools
- [ ] **Enhanced validation mechanisms**:
  - Improved user role management and security
  - Defined certification request rules and validation criteria
  - Multi-level approval workflows for environmental verification
- [ ] **Multi-chain support**:
  - Deployment on multiple blockchain networks
  - Cross-chain interoperability for NFTs and token transfers
- [ ] **Marketplace for environmental NFTs**: Platform for trading special seasonal NFTs to celebrate land protection milestones and incentives

---

Built with ❤️ for the planet 🌍
