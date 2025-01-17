// Avalanche Fuji Testnet Token Mapping
const TOKEN_NAMES = {
    "0x57F1c63497AEe0bE305B8852b354CEc793da43bb": "USDC.e",
    "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846": "WAVAX",
    "0x5425890298aed601595a70AB815c96711a31Bc65": "USDC",
    "0xAb231A5744C8E6c45481754928cCfFFFD4aa0732": "USDT",
    "0x408d4cd0adb7cebd1f1a1c33a0ba2098e1295bab": "DAI",

  };
  
 export const getTokenName = (address) => {
    return TOKEN_NAMES[address] || `${address.slice(0, 6)}...${address.slice(-4)}`;
  };