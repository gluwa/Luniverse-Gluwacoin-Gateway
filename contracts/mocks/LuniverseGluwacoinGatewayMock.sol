// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

import "../LuniverseGluwacoinGateway.sol";

contract LuniverseGluwacoinGatewayMock is Initializable, LuniverseGluwacoinGateway {
    using Address for address;

    constructor(
        IERC20 token,
        address gluwa,
        address luniverse
    ) public {
        initialize(token, gluwa, luniverse);
    }

    uint256[50] private __gap;
}