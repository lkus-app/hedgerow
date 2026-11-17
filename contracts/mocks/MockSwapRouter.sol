// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMockToken {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
}

interface IMockFeed {
    function decimals() external view returns (uint8);
    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80);
}

/// @notice Local stand-in for Uniswap SwapRouter02.exactInput. Fills at the oracle price
///         minus a fee, times `executionBps` (set < 10000 to simulate a bad fill).
///         It must hold enough of each output token (fund it before use).
contract MockSwapRouter {
    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }

    mapping(address => address) public feedOf;
    uint256 public feeBps = 30;
    uint256 public executionBps = 10_000;

    function setFeed(address token, address feed) external {
        feedOf[token] = feed;
    }

    function setExecutionBps(uint256 bps) external {
        executionBps = bps;
    }

    function _usdPrice(address token) internal view returns (uint256) {
        IMockFeed f = IMockFeed(feedOf[token]);
        (, int256 a,,,) = f.latestRoundData();
        return uint256(a) * 10 ** (18 - f.decimals());
    }

    function exactInput(ExactInputParams calldata p) external payable returns (uint256 out) {
        bytes memory path = p.path;
        address tokenIn;
        address tokenOut;
        uint256 len = path.length;
        assembly {
            tokenIn := shr(96, mload(add(path, 32)))
            tokenOut := shr(96, mload(add(add(path, 32), sub(len, 20))))
        }
        require(IMockToken(tokenIn).transferFrom(msg.sender, address(this), p.amountIn), "Router: pull failed");

        uint256 usd = (p.amountIn * _usdPrice(tokenIn)) / 10 ** IMockToken(tokenIn).decimals();
        out = (usd * 10 ** IMockToken(tokenOut).decimals()) / _usdPrice(tokenOut);
        out = (out * (10_000 - feeBps) * executionBps) / 10_000 / 10_000;
        require(out >= p.amountOutMinimum, "Too little received");
        require(IMockToken(tokenOut).transfer(p.recipient, out), "Router: pay failed");
    }
}
