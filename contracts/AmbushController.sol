// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IHedgerowVault {
    function recordAmbushProfit(uint256 profitAmount) external payable;
}

interface IWealdToken {
    function mintAmbushReward(address to, uint256 amount) external;
    function awardOGBadge(address account, uint256 badgeId) external;
}

/**
 * @title AmbushController
 * @author Hedgerow Protocol
 * @notice AI Sentinel automation controller for Robinhood Chain.
 *         Monitors off-hours short borrow rates and triggers automated gamma sweeps.
 */
contract AmbushController {
    address public owner;
    address public aiSentinel; // Friar-1 Autonomous Agent
    address public wealdToken;

    struct AmbushTarget {
        string ticker;          // e.g. "GME-RWA" or "NVDA-RWA"
        address vaultAddress;
        uint256 shortBorrowAPR; // in basis points (e.g. 14200 = 142%)
        bool isOffHoursActive;
        uint256 lastAmbushTime;
    }

    mapping(bytes32 => AmbushTarget) public targets;
    bytes32[] public activeTargetKeys;

    event AmbushTriggered(bytes32 indexed targetKey, string ticker, uint256 borrowAPR, uint256 sweptYield);
    event SentinelUpdated(address indexed newSentinel);

    modifier onlyOwner() {
        require(msg.sender == owner, "Controller: not owner");
        _;
    }

    modifier onlySentinel() {
        require(msg.sender == aiSentinel || msg.sender == owner, "Controller: not authorized sentinel");
        _;
    }

    constructor(address _aiSentinel, address _wealdToken) {
        owner = msg.sender;
        aiSentinel = _aiSentinel;
        wealdToken = _wealdToken;
    }

    function setSentinel(address _newSentinel) external onlyOwner {
        aiSentinel = _newSentinel;
        emit SentinelUpdated(_newSentinel);
    }

    function registerTarget(
        string memory ticker,
        address vaultAddress
    ) external onlyOwner {
        require(vaultAddress != address(0), "Controller: zero vault");
        bytes32 key = keccak256(abi.encodePacked(ticker));
        if (targets[key].vaultAddress == address(0)) {
            activeTargetKeys.push(key);
        }
        targets[key] = AmbushTarget({
            ticker: ticker,
            vaultAddress: vaultAddress,
            shortBorrowAPR: 0,
            isOffHoursActive: true,
            lastAmbushTime: block.timestamp
        });
    }

    /**
     * @notice Called autonomously by the Friar AI agent when off-market borrow fees or gamma sweeps trigger
     */
    function executeAmbushSweep(
        bytes32 targetKey,
        uint256 reportedAPR
    ) external payable onlySentinel {
        AmbushTarget storage target = targets[targetKey];
        require(target.vaultAddress != address(0), "Controller: target not found");
        // A sweep records real profit; an empty sweep would only produce a misleading event.
        require(msg.value > 0, "Controller: no profit");
        target.shortBorrowAPR = reportedAPR;
        target.lastAmbushTime = block.timestamp;

        // Forward the profit to the vault, raising every staker's share value pro rata.
        // (No $WEALD is minted here: the vault cannot hold or pass on reward tokens.)
        IHedgerowVault(target.vaultAddress).recordAmbushProfit{value: msg.value}(msg.value);

        emit AmbushTriggered(targetKey, target.ticker, reportedAPR, msg.value);
    }
}
