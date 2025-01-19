const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

// Default lottery duration is 7 days in seconds
const SEVEN_DAYS = 7 * 24 * 60 * 60;

module.exports = buildModule("MultiTokenLotteryModule", (m) => {
  // Allow duration to be configurable during deployment
  const lotteryDuration = m.getParameter("lotteryDuration", SEVEN_DAYS);

  // Deploy the MultiTokenLottery contract
  const multiTokenLottery = m.contract("MultiTokenLottery", [lotteryDuration]);

  return { multiTokenLottery };
});