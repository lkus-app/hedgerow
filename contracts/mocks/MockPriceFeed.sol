// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Settable Chainlink-style feed for local tests.
contract MockPriceFeed {
    uint8 public immutable decimals;
    int256 public answer;
    uint256 public updatedAt;
    uint80 public roundId;

    constructor(uint8 _decimals, int256 _answer) {
        decimals = _decimals;
        setAnswer(_answer);
    }

    function setAnswer(int256 _answer) public {
        answer = _answer;
        updatedAt = block.timestamp;
        roundId++;
    }

    function setUpdatedAt(uint256 t) external {
        updatedAt = t;
    }

    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        return (roundId, answer, updatedAt, updatedAt, roundId);
    }
}
