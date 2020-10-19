// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

import "../LuniverseGluwacoinGateway.sol";

contract LuniverseGluwacoinGatewayMock is Initializable, LuniverseGluwacoinGateway {

    constructor(
        IERC20 token
    ) public {
        initialize(token);
    }

    uint256[50] private __gap;
}