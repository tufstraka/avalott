// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MultiTokenLottery is ReentrancyGuard, Ownable {
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
    
    mapping(address => TokenConfig) public supportedTokens;
    mapping(address => mapping(address => uint256)) public ticketHoldings;
    mapping(address => bool) public admins;

    
    Participant[] public participants;
    address[] public tokenList;
    
    // Custom errors with descriptive messages
    error InvalidTokenAddress(address token);
    error TokenAlreadySupported(address token);
    error TokenNotSupported(address token);
    error LotteryAlreadyActive();
    error NoTokensConfigured();
    error LotteryNotActive();
    error LotteryEnded();
    error LotteryStillOngoing(uint256 currentTime, uint256 endTime);
    error InsufficientTokenBalance(address token, uint256 required, uint256 available);
    error InsufficientTokenAllowance(address token, uint256 required, uint256 allowed);
    error TokenTransferFailed(address token);
    error NoParticipants();
    error PrizeTransferFailed(address token, address winner);
   //error CannotUpdateDuringLottery();
    error InvalidTicketAmount();
    error InvalidDuration();
    error Unauthorized();
    error AdminAlreadyExists(address admin);
    error AdminDoesNotExist(address admin);
    
    event TokenAdded(address indexed token, uint256 ticketPrice);
    event TokenRemoved(address indexed token);
    event TicketsPurchased(address indexed buyer, address indexed token, uint256 amount);
    event WinnerSelected(address indexed winner, address indexed token, uint256 prize);
    event LotteryStarted(uint256 endTime);
    event LotteryCompleted();
    event TicketPriceUpdated(address indexed token, uint256 newPrice);
    event DurationUpdated(uint256 newDuration);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    
    constructor(uint256 _lotteryDuration) Ownable(msg.sender) {
        if (_lotteryDuration == 0) revert InvalidDuration();
        lotteryDuration = _lotteryDuration;
    }

    modifier onlyAdminOrOwner() {
        if (msg.sender != owner() && !admins[msg.sender]) revert Unauthorized();
        _;
    }
    
    function addToken(address _token, uint256 _ticketPrice) external onlyAdminOrOwner() {
        if (_token == address(0)) revert InvalidTokenAddress(_token);
        if (_ticketPrice == 0) revert InvalidTicketAmount();
        if (supportedTokens[_token].isActive) revert TokenAlreadySupported(_token);
        
        supportedTokens[_token] = TokenConfig({
            isActive: true,
            ticketPrice: _ticketPrice,
            totalTickets: 0
        });
        tokenList.push(_token);
        
        emit TokenAdded(_token, _ticketPrice);
    }

    function addAdmin(address _admin) external onlyOwner {
        if (admins[_admin]) revert AdminAlreadyExists(_admin);
        admins[_admin] = true;
        emit AdminAdded(_admin);
    }
    
    function removeAdmin(address _admin) external onlyOwner {
        if (!admins[_admin]) revert AdminDoesNotExist(_admin);
        delete admins[_admin];
        emit AdminRemoved(_admin);
    }
    
    function isAdmin(address _admin) external view returns (bool) {
        return admins[_admin];
    }
    
    function removeToken(address _token) external onlyAdminOrOwner() {
        if (!supportedTokens[_token].isActive) revert TokenNotSupported(_token);
        if (lotteryActive) revert LotteryAlreadyActive();
        
        supportedTokens[_token].isActive = false;
        
        for (uint i = 0; i < tokenList.length; i++) {
            if (tokenList[i] == _token) {
                tokenList[i] = tokenList[tokenList.length - 1];
                tokenList.pop();
                break;
            }
        }
        
        emit TokenRemoved(_token);
    }
    
    function startLottery() external onlyAdminOrOwner() {
        if (lotteryActive) revert LotteryAlreadyActive();
        if (tokenList.length == 0) revert NoTokensConfigured();
        
        lotteryActive = true;
        lotteryEndTime = block.timestamp + lotteryDuration;
        
        emit LotteryStarted(lotteryEndTime);
    }
    
    function buyTickets(address _token, uint256 _amount) external nonReentrant {
        if (_amount == 0) revert InvalidTicketAmount();
        if (!lotteryActive) revert LotteryNotActive();
        if (block.timestamp >= lotteryEndTime) revert LotteryEnded();
        if (!supportedTokens[_token].isActive) revert TokenNotSupported(_token);
        
        TokenConfig storage tokenConfig = supportedTokens[_token];
        uint256 totalCost = tokenConfig.ticketPrice * _amount;
        
        IERC20 token = IERC20(_token);
        uint256 userBalance = token.balanceOf(msg.sender);
        uint256 userAllowance = token.allowance(msg.sender, address(this));
        
        if (userBalance < totalCost) revert InsufficientTokenBalance(_token, totalCost, userBalance);
        if (userAllowance < totalCost) revert InsufficientTokenAllowance(_token, totalCost, userAllowance);
        
        bool success = token.transferFrom(msg.sender, address(this), totalCost);
        if (!success) revert TokenTransferFailed(_token);
        
        _updateParticipantTickets(_token, _amount);
        
        emit TicketsPurchased(msg.sender, _token, _amount);
    }
    
    function _updateParticipantTickets(address _token, uint256 _amount) internal {
        bool found = false;
        for (uint i = 0; i < participants.length; i++) {
            if (participants[i].addr == msg.sender && participants[i].tokenUsed == _token) {
                participants[i].tickets += _amount;
                found = true;
                break;
            }
        }
        
        if (!found) {
            participants.push(Participant({
                addr: msg.sender,
                tickets: _amount,
                tokenUsed: _token
            }));
        }
        
        ticketHoldings[_token][msg.sender] += _amount;
        supportedTokens[_token].totalTickets += _amount;
    }
    
    function selectWinners() external onlyAdminOrOwner() {
        if (!lotteryActive) revert LotteryNotActive();
        if (block.timestamp < lotteryEndTime) {
            revert LotteryStillOngoing(block.timestamp, lotteryEndTime);
        }
        if (participants.length == 0) revert NoParticipants();
        
        for (uint t = 0; t < tokenList.length; t++) {
            address tokenAddress = tokenList[t];
            if (!supportedTokens[tokenAddress].isActive) continue;
            
            uint256 totalTickets = supportedTokens[tokenAddress].totalTickets;
            if (totalTickets == 0) continue;
            
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
            
            address winner = _selectWinnerForToken(tokenAddress, randomNumber);
            _distributePrize(tokenAddress, winner);
        }
        
        _resetLottery();
    }
    
    function _selectWinnerForToken(address tokenAddress, uint256 randomNumber) internal view returns (address) {
        uint256 ticketSum = 0;
        for (uint i = 0; i < participants.length; i++) {
            if (participants[i].tokenUsed != tokenAddress) continue;
            
            ticketSum += participants[i].tickets;
            if (randomNumber < ticketSum) {
                return participants[i].addr;
            }
        }
        return address(0); // Should never reach here if totalTickets > 0
    }
    
    function _distributePrize(address tokenAddress, address winner) internal {
        IERC20 token = IERC20(tokenAddress);
        uint256 prize = token.balanceOf(address(this));
        bool success = token.transfer(winner, prize);
        if (!success) revert PrizeTransferFailed(tokenAddress, winner);
        
        emit WinnerSelected(winner, tokenAddress, prize);
    }
    
    function _resetLottery() internal {
        lotteryActive = false;
        
        // Reset token ticket counts and holdings
        for (uint i = 0; i < tokenList.length; i++) {
            address tokenAddr = tokenList[i];
            if (supportedTokens[tokenAddr].isActive) {
                supportedTokens[tokenAddr].totalTickets = 0;
                for (uint j = 0; j < participants.length; j++) {
                    delete ticketHoldings[tokenAddr][participants[j].addr];
                }
            }
        }
        
        delete participants;
        emit LotteryCompleted();
    }
    
    function getTokens() external view returns (address[] memory) {
        return tokenList;
    }
    
    function getParticipantCount() external view returns (uint256) {
        return participants.length;
    }
    
    function updateTicketPrice(address _token, uint256 _newPrice) external onlyAdminOrOwner() {
        if (_newPrice == 0) revert InvalidTicketAmount();
        if (!supportedTokens[_token].isActive) revert TokenNotSupported(_token);
        //if (lotteryActive) revert CannotUpdateDuringLottery();
        
        supportedTokens[_token].ticketPrice = _newPrice;
        emit TicketPriceUpdated(_token, _newPrice);
    }
    
    function updateLotteryDuration(uint256 _newDuration) external onlyAdminOrOwner() {
        if (_newDuration == 0) revert InvalidDuration();
        //if (lotteryActive) revert CannotUpdateDuringLottery();
        
        lotteryDuration = _newDuration;
        emit DurationUpdated(_newDuration);
    }
<<<<<<< HEAD
}
=======
}
>>>>>>> 951ca7a8d36209f3ce75746cbff6c58aa6185452
