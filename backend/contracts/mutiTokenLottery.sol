// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MultiTokenLottery is ReentrancyGuard, Ownable(msg.sender) {
    
    struct TokenConfig {
        bool isActive;
        uint256 ticketPrice;
        uint256 totalTickets;
    }
    
    struct Participant {
        address addr;
        uint256 tickets;
        address tokenUsed;
    }
    
    uint256 public lotteryDuration;
    uint256 public lotteryEndTime;
    bool public lotteryActive;
    
    // Mapping token address => token configuration
    mapping(address => TokenConfig) public supportedTokens;
    // Mapping token address => participant address => ticket count
    mapping(address => mapping(address => uint256)) public ticketHoldings;
    
    Participant[] public participants;
    address[] public tokenList;
    
    error InvalidTokenAddress();
    error TokenAlreadySupported();
    error TokenNotSupported();
    error LotteryAlreadyActive();
    error NoTokensConfigured();
    error LotteryNotActive();
    error LotteryEnded();
    error LotteryStillOngoing();
    error InsufficientTokenBalance();
    error InsufficientTokenAllowance();
    error TokenTransferFailed();
    error NoParticipants();
    error PrizeTransferFailed();
    error CannotUpdateDuringLottery();
    
    event TokenAdded(address indexed token, uint256 ticketPrice);
    event TokenRemoved(address indexed token);
    event TicketsPurchased(address indexed buyer, address indexed token, uint256 amount);
    event WinnerSelected(address indexed winner, address indexed token, uint256 prize);
    event LotteryStarted(uint256 endTime);
    event LotteryCompleted();
    
    constructor(uint256 _lotteryDuration) {
        lotteryDuration = _lotteryDuration;
    }
    
    function addToken(address _token, uint256 _ticketPrice) external onlyOwner {
        if (_token == address(0)) revert InvalidTokenAddress();
        if (supportedTokens[_token].isActive) revert TokenAlreadySupported();
        
        supportedTokens[_token] = TokenConfig({
            isActive: true,
            ticketPrice: _ticketPrice,
            totalTickets: 0
        });
        tokenList.push(_token);
        
        emit TokenAdded(_token, _ticketPrice);
    }
    
    function removeToken(address _token) external onlyOwner {
        if (!supportedTokens[_token].isActive) revert TokenNotSupported();
        if (lotteryActive) revert LotteryAlreadyActive();
        
        supportedTokens[_token].isActive = false;
        
        // Remove from tokenList
        for (uint i = 0; i < tokenList.length; i++) {
            if (tokenList[i] == _token) {
                tokenList[i] = tokenList[tokenList.length - 1];
                tokenList.pop();
                break;
            }
        }
        
        emit TokenRemoved(_token);
    }
    
    function startLottery() external onlyOwner {
        if (lotteryActive) revert LotteryAlreadyActive();
        if (tokenList.length == 0) revert NoTokensConfigured();
        
        lotteryActive = true;
        lotteryEndTime = block.timestamp + lotteryDuration;
        
        emit LotteryStarted(lotteryEndTime);
    }
    
    function buyTickets(address _token, uint256 _amount) external nonReentrant {
        if (!lotteryActive) revert LotteryNotActive();
        if (block.timestamp >= lotteryEndTime) revert LotteryEnded();
        if (!supportedTokens[_token].isActive) revert TokenNotSupported();
        
        TokenConfig storage tokenConfig = supportedTokens[_token];
        uint256 totalCost = tokenConfig.ticketPrice * _amount;
        
        IERC20 token = IERC20(_token);
        if (token.balanceOf(msg.sender) < totalCost) revert InsufficientTokenBalance();
        if (token.allowance(msg.sender, address(this)) < totalCost) revert InsufficientTokenAllowance();
        
        bool success = token.transferFrom(msg.sender, address(this), totalCost);
        if (!success) revert TokenTransferFailed();
        
        if (ticketHoldings[_token][msg.sender] == 0) {
            participants.push(Participant({
                addr: msg.sender,
                tickets: _amount,
                tokenUsed: _token
            }));
        } else {
            for (uint i = 0; i < participants.length; i++) {
                if (participants[i].addr == msg.sender && participants[i].tokenUsed == _token) {
                    participants[i].tickets += _amount;
                    break;
                }
            }
        }
        
        ticketHoldings[_token][msg.sender] += _amount;
        tokenConfig.totalTickets += _amount;
        
        emit TicketsPurchased(msg.sender, _token, _amount);
    }
    
    function selectWinners() external onlyOwner {
        if (!lotteryActive) revert LotteryNotActive();
        if (block.timestamp < lotteryEndTime) revert LotteryStillOngoing();
        if (participants.length == 0) revert NoParticipants();
        
        // Select winner for each token pool
        for (uint t = 0; t < tokenList.length; t++) {
            address tokenAddress = tokenList[t];
            if (!supportedTokens[tokenAddress].isActive) continue;
            
            uint256 totalTickets = supportedTokens[tokenAddress].totalTickets;
            if (totalTickets == 0) continue;
            
            // Generate random number using a more secure method
            uint256 randomNumber = uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        blockhash(block.number - 1),
                        block.prevrandao,
                        tokenAddress,
                        totalTickets
                    )
                )
            ) % totalTickets;
            
            // Find winner for this token
            uint256 ticketSum = 0;
            address winner;
            for (uint i = 0; i < participants.length; i++) {
                if (participants[i].tokenUsed != tokenAddress) continue;
                
                ticketSum += participants[i].tickets;
                if (randomNumber < ticketSum) {
                    winner = participants[i].addr;
                    break;
                }
            }
            
            // Distribute prize
            IERC20 token = IERC20(tokenAddress);
            uint256 prize = token.balanceOf(address(this));
            bool success = token.transfer(winner, prize);
            if (!success) revert PrizeTransferFailed();
            
            emit WinnerSelected(winner, tokenAddress, prize);
        }
        
        // Reset lottery state
        lotteryActive = false;
        delete participants;
        
        // Reset token ticket counts
        for (uint i = 0; i < tokenList.length; i++) {
            if (supportedTokens[tokenList[i]].isActive) {
                supportedTokens[tokenList[i]].totalTickets = 0;
                // Reset all ticket holdings for this token
                // Note: This is gas intensive but necessary for complete reset
                for (uint j = 0; j < participants.length; j++) {
                    delete ticketHoldings[tokenList[i]][participants[j].addr];
                }
            }
        }
        
        emit LotteryCompleted();
    }
    
    function getTokens() external view returns (address[] memory) {
        return tokenList;
    }
    
    function getParticipantCount() external view returns (uint256) {
        return participants.length;
    }
    
    function updateTicketPrice(address _token, uint256 _newPrice) external onlyOwner {
        if (!supportedTokens[_token].isActive) revert TokenNotSupported();
        if (lotteryActive) revert CannotUpdateDuringLottery();
        supportedTokens[_token].ticketPrice = _newPrice;
    }
    
    function updateLotteryDuration(uint256 _newDuration) external onlyOwner {
        if (lotteryActive) revert CannotUpdateDuringLottery();
        lotteryDuration = _newDuration;
    }
}
