async function main() {
    // Get the contract
    const contractAddress = "0x9D69dBDF20B915529e67f1BE7E7AF91C6Ae568AE";
    const lottery = await ethers.getContractAt("MultiTokenLottery", contractAddress);
  
    // Add tokens
    console.log("Adding USDC...");
    await lottery.addToken(
      "0x5425890298aed601595a70AB815c96711a31Bc65", // USDC address
      ethers.parseUnits("1", 6) // 1 USDC per ticket
    );
  
    console.log("Adding USDT...");
    await lottery.addToken(
      "0xAb231A5744C8E6c45481754928cCfFFFD4aa0732", // USDT address
      ethers.parseUnits("1", 6) // 1 USDT per ticket
    );
  
    // Start the lottery
    console.log("Starting lottery...");
    await lottery.startLottery();
    
    console.log("Initialization complete!");
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });