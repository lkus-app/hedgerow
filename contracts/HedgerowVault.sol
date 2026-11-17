// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20Minimal {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title HedgerowVault
 * @author Hedgerow Protocol / The Greenwood Guild
 * @notice Vault for pooling retail capital to execute off-hours gamma sweeps and
 *         asymmetric short ambushes on Robinhood Chain (Arbitrum Orbit L2).
 *         `asset == address(0)` means the vault holds native ETH; otherwise it
 *         holds the ERC-20 at `asset` (e.g. a tokenized stock).
 */
contract HedgerowVault {
    string public name;
    string public symbol;
    address public immutable asset; // address(0) = native ETH
    address public immutable wealdToken;
    address public owner;
    address public ambushSentinel;

    uint256 public totalAssets;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    uint256 public constant ACCURACY = 1e18;
    uint256 public accumulatedYieldPerShare;

    uint256 private _locked = 1;

    event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares);
    event Withdraw(address indexed caller, address indexed receiver, uint256 assets, uint256 shares);
    event AmbushHarvested(uint256 profitAmount, uint256 epochTimestamp);
    event SentinelUpdated(address indexed newSentinel);

    modifier onlyOwner() {
        require(msg.sender == owner, "Vault: not owner");
        _;
    }

    modifier onlySentinel() {
        require(msg.sender == ambushSentinel || msg.sender == owner, "Vault: not sentinel");
        _;
    }

    modifier nonReentrant() {
        require(_locked == 1, "Vault: reentrant");
        _locked = 2;
        _;
        _locked = 1;
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

    function setSentinel(address _sentinel) external onlyOwner {
        ambushSentinel = _sentinel;
        emit SentinelUpdated(_sentinel);
    }

    function previewDeposit(uint256 assets) public view returns (uint256) {
        return totalSupply == 0 ? assets : (assets * totalSupply) / totalAssets;
    }

    function convertToAssets(uint256 shares) public view returns (uint256) {
        return totalSupply == 0 ? shares : (shares * totalAssets) / totalSupply;
    }

    function deposit(uint256 assets, address receiver) external payable nonReentrant returns (uint256 shares) {
        require(assets > 0, "Vault: zero assets");
        require(receiver != address(0), "Vault: zero receiver");

        shares = previewDeposit(assets);
        require(shares > 0, "Vault: zero shares");

        if (asset == address(0)) {
            require(msg.value == assets, "Vault: invalid ETH value");
        } else {
            require(msg.value == 0, "Vault: ETH not accepted");
            require(IERC20Minimal(asset).transferFrom(msg.sender, address(this), assets), "Vault: transferFrom failed");
        }

        totalSupply += shares;
        totalAssets += assets;
        balanceOf[receiver] += shares;

        emit Deposit(msg.sender, receiver, assets, shares);
    }

    function recordAmbushProfit(uint256 profitAmount) external payable onlySentinel nonReentrant {
        require(totalSupply > 0, "Vault: no stakers");
        if (asset == address(0)) {
            require(msg.value == profitAmount, "Vault: invalid profit payload");
        } else {
            require(msg.value == 0, "Vault: ETH not accepted");
            require(IERC20Minimal(asset).transferFrom(msg.sender, address(this), profitAmount), "Vault: transferFrom failed");
        }
        totalAssets += profitAmount;
        accumulatedYieldPerShare += (profitAmount * ACCURACY) / totalSupply;
        emit AmbushHarvested(profitAmount, block.timestamp);
    }

    function withdraw(uint256 shares, address receiver) external nonReentrant returns (uint256 assets) {
        require(shares > 0, "Vault: zero shares");
        require(balanceOf[msg.sender] >= shares, "Vault: insufficient shares");
        require(receiver != address(0), "Vault: zero receiver");

        assets = convertToAssets(shares);

        balanceOf[msg.sender] -= shares;
        totalSupply -= shares;
        totalAssets -= assets;

        if (asset == address(0)) {
            (bool success, ) = receiver.call{value: assets}("");
            require(success, "Vault: ETH transfer failed");
        } else {
            require(IERC20Minimal(asset).transfer(receiver, assets), "Vault: transfer failed");
        }

        emit Withdraw(msg.sender, receiver, assets, shares);
    }

    /// @dev Plain ETH sent here is not credited to anyone; use deposit().
    receive() external payable {
        revert("Vault: use deposit()");
    }
}
