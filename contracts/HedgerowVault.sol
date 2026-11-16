// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title HedgerowVault
 * @author Hedgerow Protocol / The Greenwood Guild
 * @notice Vault for pooling retail capital to execute off-hours gamma sweeps and
 *         asymmetric short ambushes on Robinhood Chain (Arbitrum L2: 4663).
 */
contract HedgerowVault {
    string public name;
    string public symbol;
    address public immutable asset; // e.g. WETH or Tokenized Stock RWA
    address public immutable wealdToken;
    address public owner;
    address public ambushSentinel;

    uint256 public totalAssets;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    uint256 public constant ACCURACY = 1e18;
    uint256 public accumulatedYieldPerShare;
    mapping(address => uint256) public userRewardDebt;

    event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares);
    event Withdraw(address indexed caller, address indexed receiver, uint256 assets, uint256 shares);
    event AmbushHarvested(uint256 profitAmount, uint256 epochTimestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Vault: not owner");
        _;
    }

    modifier onlySentinel() {
        require(msg.sender == ambushSentinel || msg.sender == owner, "Vault: not sentinel");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _asset,
        address _wealdToken,
        address _sentinel
    ) {
        name = _name;
        symbol = _symbol;
        asset = _asset;
        wealdToken = _wealdToken;
        owner = msg.sender;
        ambushSentinel = _sentinel;
    }

    function deposit(uint256 assets, address receiver) external payable returns (uint256 shares) {
        if (asset == address(0)) {
            require(msg.value == assets, "Vault: invalid ETH value");
        }
        require(assets > 0, "Vault: zero assets");

        if (totalSupply == 0) {
            shares = assets;
        } else {
            shares = (assets * totalSupply) / totalAssets;
        }

        totalSupply += shares;
        totalAssets += assets;
        balanceOf[receiver] += shares;

        emit Deposit(msg.sender, receiver, assets, shares);
    }

    function recordAmbushProfit(uint256 profitAmount) external payable onlySentinel {
        if (asset == address(0)) {
            require(msg.value == profitAmount, "Vault: invalid profit payload");
        }
        totalAssets += profitAmount;
        if (totalSupply > 0) {
            accumulatedYieldPerShare += (profitAmount * ACCURACY) / totalSupply;
        }
        emit AmbushHarvested(profitAmount, block.timestamp);
    }

    function withdraw(uint256 shares, address receiver) external returns (uint256 assets) {
        require(balanceOf[msg.sender] >= shares, "Vault: insufficient shares");
        require(shares > 0, "Vault: zero shares");

        assets = (shares * totalAssets) / totalSupply;

        balanceOf[msg.sender] -= shares;
        totalSupply -= shares;
        totalAssets -= assets;

        if (asset == address(0)) {
            (bool success, ) = receiver.call{value: assets}("");
            require(success, "Vault: ETH transfer failed");
        }

        emit Withdraw(msg.sender, receiver, assets, shares);
    }

    receive() external payable {}
}
