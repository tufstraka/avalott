# Project Title: Lottery-DAO

## Description

A Solidity smart contract `MultiTokenLottery` that implements a multi-token lottery system with the following features.

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
  # Fork this repository first
  git clone https://github.com/YOUR-USERNAME/Lottery-DAO.git
  # Remember to put your github username at {YOUR-USERNAME}
  cd backend
```

2. Install dependencies

```bash
  npm install
```

3. Compile the contracts

```bash
  npx hardhat compile
```

4. Configure the Avalanche network

Open [hardhat.config.js](./backend/hardhat.config.js) and add your Avalanche network details under the networks section.

5. Deploy to Avalanche network

```bash
  npx hardhat run scripts/deploy.js --netwrok avalanche
```

6. Run the application locally

```bash
  npm start
```

## Team Members

| Name | Email | Github | Role |
|------|--------|--------|------|
| Richard Kabi | [kabirichard27@gmail.com](mailto:kabirichard27@gmail.com) | [NebulaScout](https://github.com/NebulaScout) |
| Collins Kamau | [jbcollins254@gmail.com](mailto:jbcollins254@gmail.com) | [JBcollo1](https://github.com/JBcollo1) |
| Aisha Barasa | [aishabarasa19@gmail.com](mailto:aishabarasa19@gmail.com) | [Aisha-Barasa](https://github.com/Aisha-Barasa) |
| Alvin Kiprotich | [alvinkiprotichkipchoge@gmail.com](mailto:alvinkiprotichkipchoge@gmail.com) | [AlvinKiprotich-dev](https://github.com/AlvinKiprotich-dev) |
| Keith Kadima | [keithkadima@gmail.com](mailto:keithkadima@gmail.com) | [tufstraka](https://github.com/tufstraka) |
| Jude Kimathi | [judekimathii@gmail.com](mailto:judekimathii@gmail.com) | [jxkimathi](https://github.com/jxkimathi) |


## Milestones