# Avalot

A lottery system with the following features.

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
| Aisha Barasa | [aishabarasa19@gmail.com](mailto:aishabarasa19@gmail.com) | [Aisha-Barasa](https://github.com/Aisha-Barasa) | project lead
| Alvin Kiprotich | [alvinkiprotichkipchoge@gmail.com](mailto:alvinkiprotichkipchoge@gmail.com) | [AlvinKiprotich-dev](https://github.com/AlvinKiprotich-dev) |
| Keith Kadima | [keithkadima@gmail.com](mailto:keithkadima@gmail.com) | [tufstraka](https://github.com/tufstraka) | full stack dev
| Jude Kimathi | [judekimathii@gmail.com](mailto:judekimathii@gmail.com) | [jxkimathi](https://github.com/jxkimathi) |


## Milestones
