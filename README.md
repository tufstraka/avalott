# Lottery-DAO
## Description
A decentralized lottery system built on the Avalanche blockchain. The project enables users to participate in token based with multiple supported ERC20 tokens. The system uses Avalanche's high speed transactions and low fees to provide an efficient and seamless user experience. Key features include secure ticket management, automated winner selection using blockchain randomness and automatic prize disrtribution.

## Features

### 1. **Multi-Token Support**

- Supports multiple ERC20 tokens for ticket purchases.
- Each token has its own ticket price and pool.
- Configurable token addition/removal by the owner.

### 2. **Ticket Management**

- Users can purchase tickets using supported tokens.
- Tracks individual ticket holdings per token.
- Maintains total ticket counts per token pool.

### 3. **Secutiry features**

- Implements `ReentrancyGuard` for transaction safety.
- `Ownable` pattern for administrative functions.
- Safe token transfer handling with error checks.

### 4. Lottery Mechanics

- Configurable lottery duration.
- Automated winner selection using blockchain-based randomness.
- Separate winner selection for each token pool.
- Automatic prize distribution to winners.

## Tech Stack

- **Languages**: JavaScript, Solidity
- **Framework**: Avalanche, React
- **Tools**    : Hardhat, OpenZeppelin

## Setup Instructions

1. Fork and clone the repository

```bash
  git clone <repo-url>
  cd backend
```

2. Install dependencies

```bash
  npm install
```

3. Configure the Avalanche network

Open [hardhat.config.js](./backend/hardhat.config.js) and add your Avalanche network details under the networks section.

4. Deploy and initialize the contract on Avalanche Fuji

```bash
  npx hardhat ignition deploy ./ignition/modules/multiTokenLottery.js --network avalancheFuji

  npx hardhat run scripts/initialize.js --network avalancheFuji
```

6. Run the application locally

```bash
  cd ..
  npm install
  npm run dev
```

Ps. Make sure you replace the contract address variable with yours

## Team Members

| Name | Email | Github | Role |
|------|--------|--------|------|
| Richard Kabi | [kabirichard27@gmail.com](mailto:kabirichard27@gmail.com) | [NebulaScout](https://github.com/NebulaScout) |
| Collins Kamau | [jbcollins254@gmail.com](mailto:jbcollins254@gmail.com) | [JBcollo1](https://github.com/JBcollo1) |
| Aisha Barasa | [aishabarasa19@gmail.com](mailto:aishabarasa19@gmail.com) | [Aisha-Barasa](https://github.com/Aisha-Barasa) | Developer
| Alvin Kiprotich | [alvinkiprotichkipchoge@gmail.com](mailto:alvinkiprotichkipchoge@gmail.com) | [AlvinKiprotich-dev](https://github.com/AlvinKiprotich-dev) |
| Keith Kadima | [keithkadima@gmail.com](mailto:keithkadima@gmail.com) | [tufstraka](https://github.com/tufstraka) | full stack dev
| Jude Kimathi | [judekimathii@gmail.com](mailto:judekimathii@gmail.com) | [jxkimathi](https://github.com/jxkimathi) | Backend dev


## Milestones
### Landing page and wallet integration
#### Ojective
A landing page was successfully developed to enable wallet connection and provide access to the lottery system.

#### Completed tasks
##### 1. Design Landing page
A visually appealing page was created with fields for connect wallet and play now.
The page includes project description as well

![image](https://github.com/user-attachments/assets/ba6f5807-9237-4b56-842e-4979ef8cd91f) 

##### 2. Wallet connection
- Integrated wallet connection functionality ( e.g. MetaMask)
- Displays users wallet information upon connection

##### 3. Lottery System access
- Users can view available lotteries and ticket options after connecting their wallet.
- A user friendly interface allowing ticket purchases and participation.

![image](https://github.com/user-attachments/assets/57976104-a487-46c8-a6e9-31cc2bb30af0) 

![image](https://github.com/user-attachments/assets/a24f5a53-f655-483f-9042-80f8a47d9737) 

##### 4. Admin Page
- Developed a secure admin page for managing the lottery system.
- Provides functionalities for token management, configuring ticket prices, setting lottery durations and monitoring participation metrics.

![image](https://github.com/user-attachments/assets/016f7bd2-0492-4ffd-b2e8-55f81b6ce89d) 

![image](https://github.com/user-attachments/assets/b3e777a3-9b3b-4332-834f-f7640ade8b6d) 

![image](https://github.com/user-attachments/assets/9409ba6e-2a60-4ae8-a759-3a3b13a52923) 

##### 5. Backend Integration
- Wallet addresses and admin actions are sucurely stored.

## Avalanche Checkpoints
### 1. Using Avalanche
- The project is fully integrated with the Avalanche network for handling blockchain transactions. Avalanche's speed and low costs enhance user experience and transactions efficiency.

### 2. Deploying Smart Contracts on  Avalanche
- Smart contracts are deployed on Avalanche's Fuji testnet using Hardhat. They manage token pools, ticket sales and automated winner selection.

### 3. Taking Advantage of Avalanche's speed and low costs
- The lottery system uses Avalanche's fast transactions finality and minimal fees to povide an affordable and seamless platform for users.

## Conclusion
This project showcases the potential of blockchain technology in creating transparent and secure decentralized applications. We look forward to scaling this idea and engaging the community with innovative features.




