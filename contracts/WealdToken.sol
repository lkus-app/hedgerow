// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WealdToken ($WEALD)
 * @author Hedgerow Protocol / The Greenwood Guild
 * @notice Native utility, governance, and OG reward token for the Hedgerow Protocol
 *         on Robinhood Chain (Arbitrum Orbit L2, Chain ID 4663).
 */
contract WealdToken {
    string public constant name = "Weald";
    string public constant symbol = "WEALD";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    // Robinhood Chain Genesis cap: 100,000,000 WEALD
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18;

    address public owner;
    address public ambushController;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => bool) public isOGMember;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OGBadgeAwarded(address indexed account, uint256 badgeId);

    modifier onlyOwner() {
        require(msg.sender == owner, "WEALD: not owner");
        _;
    }

    modifier onlyController() {
        require(msg.sender == ambushController || msg.sender == owner, "WEALD: not controller");
        _;
    }

    constructor() {
        owner = msg.sender;
        // Mint initial Greenwood Guild liquidity & OG Reserve (15%)
        uint256 initialMint = 15_000_000 * 10**18;
        totalSupply = initialMint;
        balanceOf[msg.sender] = initialMint;
        isOGMember[msg.sender] = true;
        emit Transfer(address(0), msg.sender, initialMint);
        emit OGBadgeAwarded(msg.sender, 1);
    }

    function setAmbushController(address _controller) external onlyOwner {
        ambushController = _controller;
    }

    function mintAmbushReward(address to, uint256 amount) external onlyController {
        require(totalSupply + amount <= MAX_SUPPLY, "WEALD: max supply exceeded");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function awardOGBadge(address account, uint256 badgeId) external onlyController {
        isOGMember[account] = true;
        emit OGBadgeAwarded(account, badgeId);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        return _transfer(msg.sender, to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        require(currentAllowance >= amount, "WEALD: allowance exceeded");
        if (currentAllowance != type(uint256).max) {
            allowance[from][msg.sender] = currentAllowance - amount;
        }
        return _transfer(from, to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal returns (bool) {
        require(balanceOf[from] >= amount, "WEALD: insufficient balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
