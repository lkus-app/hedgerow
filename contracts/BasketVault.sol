// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20Basket {
    function balanceOf(address) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
}

interface IWETH9 is IERC20Basket {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

/// @dev Chainlink AggregatorV3Interface subset.
interface IPriceFeed {
    function decimals() external view returns (uint8);
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

/// @dev Uniswap SwapRouter02 `exactInput` (no deadline field; the tx itself is the deadline on an L2).
interface ISwapRouter02 {
    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }

    function exactInput(ExactInputParams calldata params) external payable returns (uint256 amountOut);
}

/**
 * @title BasketVault
 * @notice Deposit ETH, own a pro-rata slice of a fixed, weighted basket of ERC-20s
 *         (e.g. tokenized stocks), priced by Chainlink and traded on Uniswap.
 *
 * Trust model:
 *  - Basket tokens, weights, price feeds and swap paths are fixed at deployment.
 *  - Anyone can call rebalance(); every swap's minimum output is derived from the oracle
 *    price minus `maxSlippageBps`, so a caller cannot route value away from the vault.
 *  - Withdrawals are paid in kind (each token + ETH) and need no oracle or swap, so they
 *    keep working when markets are closed, feeds are stale, or deposits are paused.
 *  - The owner can only pause deposits and tune slippage / drift / cooldown within hard caps.
 *    No role can move user funds.
 */
contract BasketVault {
    // ---------------------------------------------------------------- config
    struct Component {
        IERC20Basket token;
        IPriceFeed feed;
        uint16 weightBps;
        uint8 tokenDecimals;
        uint8 feedDecimals;
        uint32 maxStaleness;
        bytes buyPath; // WETH -> ... -> token
        bytes sellPath; // token -> ... -> WETH
    }

    struct ComponentConfig {
        address token;
        address feed;
        uint16 weightBps;
        uint32 maxStaleness;
        bytes buyPath;
        bytes sellPath;
    }

    uint256 public constant BPS = 10_000;
    uint256 public constant MAX_SLIPPAGE_CAP_BPS = 500; // 5%
    uint256 public constant MIN_LIQUIDITY = 1_000; // shares burned on first deposit (inflation-attack guard)
    address private constant DEAD = 0x000000000000000000000000000000000000dEaD;

    string public name;
    string public symbol;
    uint8 public constant decimals = 18;

    IWETH9 public immutable weth;
    ISwapRouter02 public immutable router;
    IPriceFeed public immutable ethUsdFeed;
    uint8 public immutable ethFeedDecimals;
    uint32 public immutable ethMaxStaleness;

    Component[] internal components;

    address public owner;
    bool public depositsPaused;
    uint16 public maxSlippageBps;
    uint16 public driftBps; // rebalance allowed when any slice is off target by more than this share of NAV
    uint32 public rebalanceCooldown;
    uint64 public lastRebalance;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    uint256 private _locked = 1;

    // ---------------------------------------------------------------- events
    event Deposit(address indexed user, uint256 ethIn, uint256 usdValue, uint256 shares);
    event Withdraw(address indexed user, uint256 shares, uint256 ethOut);
    event Swapped(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    event Rebalanced(address indexed caller, uint256 navBefore, uint256 navAfter);
    event ParamsUpdated(uint16 maxSlippageBps, uint16 driftBps, uint32 rebalanceCooldown);
    event DepositsPaused(bool paused);
    event OwnershipTransferred(address indexed from, address indexed to);

    modifier nonReentrant() {
        require(_locked == 1, "Basket: reentrant");
        _locked = 2;
        _;
        _locked = 1;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Basket: not owner");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _weth,
        address _router,
        address _ethUsdFeed,
        uint32 _ethMaxStaleness,
        ComponentConfig[] memory _components,
        uint16 _maxSlippageBps,
        uint16 _driftBps,
        uint32 _rebalanceCooldown
    ) {
        require(_weth != address(0) && _router != address(0) && _ethUsdFeed != address(0), "Basket: zero address");
        require(_components.length > 0 && _components.length <= 10, "Basket: 1-10 components");
        require(_maxSlippageBps <= MAX_SLIPPAGE_CAP_BPS, "Basket: slippage cap");

        name = _name;
        symbol = _symbol;
        weth = IWETH9(_weth);
        router = ISwapRouter02(_router);
        ethUsdFeed = IPriceFeed(_ethUsdFeed);
        ethFeedDecimals = IPriceFeed(_ethUsdFeed).decimals();
        require(ethFeedDecimals <= 18, "Basket: feed decimals");
        ethMaxStaleness = _ethMaxStaleness;
        owner = msg.sender;
        maxSlippageBps = _maxSlippageBps;
        driftBps = _driftBps;
        rebalanceCooldown = _rebalanceCooldown;

        uint256 totalWeight;
        for (uint256 i = 0; i < _components.length; i++) {
            ComponentConfig memory c = _components[i];
            require(c.token != address(0) && c.token != _weth && c.feed != address(0), "Basket: bad component");
            require(c.weightBps > 0, "Basket: zero weight");
            require(IPriceFeed(c.feed).decimals() <= 18 && IERC20Basket(c.token).decimals() <= 36, "Basket: decimals");
            for (uint256 j = 0; j < i; j++) require(_components[j].token != c.token, "Basket: duplicate token");
            require(_pathStart(c.buyPath) == _weth && _pathEnd(c.buyPath) == c.token, "Basket: bad buy path");
            require(_pathStart(c.sellPath) == c.token && _pathEnd(c.sellPath) == _weth, "Basket: bad sell path");
            totalWeight += c.weightBps;

            components.push(
                Component({
                    token: IERC20Basket(c.token),
                    feed: IPriceFeed(c.feed),
                    weightBps: c.weightBps,
                    tokenDecimals: IERC20Basket(c.token).decimals(),
                    feedDecimals: IPriceFeed(c.feed).decimals(),
                    maxStaleness: c.maxStaleness,
                    buyPath: c.buyPath,
                    sellPath: c.sellPath
                })
            );
            require(IERC20Basket(c.token).approve(_router, type(uint256).max), "Basket: approve failed");
        }
        require(totalWeight == BPS, "Basket: weights must sum to 100%");
        require(IWETH9(_weth).approve(_router, type(uint256).max), "Basket: approve failed");

        emit OwnershipTransferred(address(0), msg.sender);
    }

    // ---------------------------------------------------------------- views

    function componentCount() external view returns (uint256) {
        return components.length;
    }

    /// @notice USD price (18 decimals) and whether it is within the staleness window.
    function _price(IPriceFeed feed, uint8 feedDecimals, uint32 maxStaleness) internal view returns (uint256 price, bool fresh) {
        (, int256 answer,, uint256 updatedAt,) = feed.latestRoundData();
        if (answer <= 0) return (0, false);
        price = uint256(answer) * 10 ** (18 - feedDecimals);
        fresh = updatedAt <= block.timestamp && block.timestamp - updatedAt <= maxStaleness;
    }

    function _usd(uint256 amount, uint8 tokenDecimals, uint256 price18) internal pure returns (uint256) {
        return (amount * price18) / 10 ** tokenDecimals;
    }

    /**
     * @notice Full basket state for UIs and keepers. Never reverts on stale prices:
     *         `pricesFresh` tells whether NAV can be trusted (deposits/rebalance require it).
     * @return tokens Component token addresses
     * @return weightsBps Target weights
     * @return balances Token balances held
     * @return valuesUsd USD value of each component (18 decimals)
     * @return wethBalance Idle WETH held
     * @return wethValueUsd USD value of idle WETH
     * @return navUsd Total USD value
     * @return pricesFresh True when every feed is within its staleness window
     */
    function composition()
        public
        view
        returns (
            address[] memory tokens,
            uint16[] memory weightsBps,
            uint256[] memory balances,
            uint256[] memory valuesUsd,
            uint256 wethBalance,
            uint256 wethValueUsd,
            uint256 navUsd,
            bool pricesFresh
        )
    {
        uint256 n = components.length;
        tokens = new address[](n);
        weightsBps = new uint16[](n);
        balances = new uint256[](n);
        valuesUsd = new uint256[](n);
        pricesFresh = true;

        (uint256 ethPrice, bool ethFresh) = _price(ethUsdFeed, ethFeedDecimals, ethMaxStaleness);
        pricesFresh = ethFresh;
        wethBalance = weth.balanceOf(address(this));
        wethValueUsd = _usd(wethBalance, 18, ethPrice);
        navUsd = wethValueUsd;

        for (uint256 i = 0; i < n; i++) {
            Component storage c = components[i];
            (uint256 p, bool fresh) = _price(c.feed, c.feedDecimals, c.maxStaleness);
            if (!fresh) pricesFresh = false;
            tokens[i] = address(c.token);
            weightsBps[i] = c.weightBps;
            balances[i] = c.token.balanceOf(address(this));
            valuesUsd[i] = _usd(balances[i], c.tokenDecimals, p);
            navUsd += valuesUsd[i];
        }
    }

    /// @notice Total basket value in USD (18 decimals). Reverts if any price is stale.
    function totalValue() public view returns (uint256 navUsd) {
        bool fresh;
        (,,,,,, navUsd, fresh) = composition();
        require(fresh, "Basket: stale price");
    }

    /// @notice USD value of `shares` (18 decimals), using current oracle prices.
    function valueOfShares(uint256 shares) external view returns (uint256) {
        if (totalSupply == 0) return 0;
        return (shares * totalValue()) / totalSupply;
    }

    /// @notice Shares that a deposit of `ethAmount` would mint right now.
    function previewDeposit(uint256 ethAmount) public view returns (uint256 shares) {
        (uint256 ethPrice, bool fresh) = _price(ethUsdFeed, ethFeedDecimals, ethMaxStaleness);
        require(fresh, "Basket: stale price");
        uint256 depositUsd = _usd(ethAmount, 18, ethPrice);
        if (totalSupply == 0) {
            require(depositUsd > MIN_LIQUIDITY, "Basket: deposit too small");
            return depositUsd - MIN_LIQUIDITY;
        }
        return (depositUsd * totalSupply) / totalValue();
    }

    /// @notice True when rebalance() would do something and the cooldown has passed.
    function needsRebalance() public view returns (bool) {
        if (block.timestamp < uint256(lastRebalance) + rebalanceCooldown) return false;
        (,, , uint256[] memory valuesUsd,, uint256 wethValueUsd, uint256 navUsd, bool fresh) = composition();
        if (!fresh || navUsd == 0) return false;
        uint256 band = (navUsd * driftBps) / BPS;
        if (wethValueUsd > band) return true;
        for (uint256 i = 0; i < components.length; i++) {
            uint256 target = (navUsd * components[i].weightBps) / BPS;
            uint256 v = valuesUsd[i];
            if (v > target + band || v + band < target) return true;
        }
        return false;
    }

    // ---------------------------------------------------------------- user actions

    /// @notice Deposit ETH. It is held as WETH until the next rebalance() buys the basket.
    function deposit(uint256 minShares) external payable nonReentrant returns (uint256 shares) {
        require(!depositsPaused, "Basket: deposits paused");
        require(msg.value > 0, "Basket: zero deposit");

        // Price the deposit against NAV *before* the new ETH is counted.
        shares = previewDeposit(msg.value);
        require(shares > 0 && shares >= minShares, "Basket: slippage");

        weth.deposit{value: msg.value}();
        if (totalSupply == 0) {
            totalSupply = MIN_LIQUIDITY;
            balanceOf[DEAD] = MIN_LIQUIDITY;
        }
        totalSupply += shares;
        balanceOf[msg.sender] += shares;

        emit Deposit(msg.sender, msg.value, _usdOfEth(msg.value), shares);
    }

    /**
     * @notice Burn `shares` and receive your pro-rata slice of every basket token plus ETH.
     *         Paid in kind: no swaps and no oracle, so it works at any time.
     */
    function withdraw(uint256 shares) external nonReentrant returns (uint256 ethOut) {
        require(shares > 0 && balanceOf[msg.sender] >= shares, "Basket: insufficient shares");
        uint256 supply = totalSupply;

        balanceOf[msg.sender] -= shares;
        totalSupply = supply - shares;

        for (uint256 i = 0; i < components.length; i++) {
            IERC20Basket t = components[i].token;
            uint256 amt = (t.balanceOf(address(this)) * shares) / supply;
            if (amt > 0) require(t.transfer(msg.sender, amt), "Basket: transfer failed");
        }

        ethOut = (weth.balanceOf(address(this)) * shares) / supply;
        if (ethOut > 0) {
            weth.withdraw(ethOut);
            (bool ok,) = msg.sender.call{value: ethOut}("");
            require(ok, "Basket: ETH transfer failed");
        }
        emit Withdraw(msg.sender, shares, ethOut);
    }

    /**
     * @notice Trade the basket back to its target weights. Anyone may call it once the
     *         cooldown has passed and the basket has drifted. Sells overweight slices into
     *         WETH first, then buys underweight slices with the WETH.
     */
    function rebalance() external nonReentrant {
        require(needsRebalance(), "Basket: nothing to rebalance");
        lastRebalance = uint64(block.timestamp);

        (uint256 ethPrice,) = _price(ethUsdFeed, ethFeedDecimals, ethMaxStaleness);
        (,,, uint256[] memory valuesUsd,,, uint256 navBefore,) = composition();
        uint256 n = components.length;
        uint256 band = (navBefore * driftBps) / BPS;

        uint256[] memory prices = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            (prices[i],) = _price(components[i].feed, components[i].feedDecimals, components[i].maxStaleness);
        }

        // 1) Sell overweight slices into WETH.
        for (uint256 i = 0; i < n; i++) {
            Component storage c = components[i];
            uint256 target = (navBefore * c.weightBps) / BPS;
            if (valuesUsd[i] <= target + band) continue;
            uint256 sellUsd = valuesUsd[i] - target;
            uint256 amountIn = (sellUsd * 10 ** c.tokenDecimals) / prices[i];
            uint256 expectedWeth = (sellUsd * 1e18) / ethPrice;
            _swap(c.sellPath, address(c.token), address(weth), amountIn, expectedWeth);
        }

        // 2) Buy underweight slices with WETH, never spending more than we hold.
        for (uint256 i = 0; i < n; i++) {
            Component storage c = components[i];
            uint256 target = (navBefore * c.weightBps) / BPS;
            if (valuesUsd[i] >= target) continue;
            uint256 buyUsd = target - valuesUsd[i];
            uint256 wethIn = (buyUsd * 1e18) / ethPrice;
            uint256 available = weth.balanceOf(address(this));
            if (wethIn > available) {
                wethIn = available;
                buyUsd = _usd(wethIn, 18, ethPrice);
            }
            if (wethIn == 0) continue;
            uint256 expectedOut = (buyUsd * 10 ** c.tokenDecimals) / prices[i];
            _swap(c.buyPath, address(weth), address(c.token), wethIn, expectedOut);
        }

        emit Rebalanced(msg.sender, navBefore, totalValue());
    }

    function _swap(bytes memory path, address tokenIn, address tokenOut, uint256 amountIn, uint256 expectedOut) internal {
        if (amountIn == 0) return;
        uint256 minOut = (expectedOut * (BPS - maxSlippageBps)) / BPS;
        uint256 out = router.exactInput(
            ISwapRouter02.ExactInputParams({path: path, recipient: address(this), amountIn: amountIn, amountOutMinimum: minOut})
        );
        require(out >= minOut, "Basket: slippage");
        emit Swapped(tokenIn, tokenOut, amountIn, out);
    }

    function _usdOfEth(uint256 amount) internal view returns (uint256) {
        (uint256 p,) = _price(ethUsdFeed, ethFeedDecimals, ethMaxStaleness);
        return _usd(amount, 18, p);
    }

    // ---------------------------------------------------------------- owner (cannot touch funds)

    function setParams(uint16 _maxSlippageBps, uint16 _driftBps, uint32 _rebalanceCooldown) external onlyOwner {
        require(_maxSlippageBps <= MAX_SLIPPAGE_CAP_BPS, "Basket: slippage cap");
        require(_driftBps <= 2_000, "Basket: drift cap");
        require(_rebalanceCooldown <= 7 days, "Basket: cooldown cap");
        maxSlippageBps = _maxSlippageBps;
        driftBps = _driftBps;
        rebalanceCooldown = _rebalanceCooldown;
        emit ParamsUpdated(_maxSlippageBps, _driftBps, _rebalanceCooldown);
    }

    function setDepositsPaused(bool paused) external onlyOwner {
        depositsPaused = paused;
        emit DepositsPaused(paused);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ---------------------------------------------------------------- path helpers

    function _pathStart(bytes memory path) internal pure returns (address a) {
        require(path.length >= 43 && (path.length - 20) % 23 == 0, "Basket: bad path");
        assembly {
            a := shr(96, mload(add(path, 32)))
        }
    }

    function _pathEnd(bytes memory path) internal pure returns (address a) {
        uint256 len = path.length;
        assembly {
            a := shr(96, mload(add(add(path, 32), sub(len, 20))))
        }
    }

    /// @dev Only WETH may send plain ETH here (when unwrapping for withdrawals).
    receive() external payable {
        require(msg.sender == address(weth), "Basket: use deposit()");
    }
}
