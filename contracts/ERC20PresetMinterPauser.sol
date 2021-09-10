// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts-ethereum-package/contracts/presets/ERC20PresetMinterPauser.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

contract ERC20PresetMinterPauser is Initializable, ERC20PresetMinterPauserUpgradeSafe {

    

    function __ERC20PresetMinterPauserMock_init(string memory name, string memory symbol) internal initializer {
        __Context_init_unchained();
        __AccessControl_init_unchained();
        __ERC20_init_unchained(name, symbol);
        __ERC20Burnable_init_unchained();
        __Pausable_init_unchained();
        __ERC20Pausable_init_unchained();
        __ERC20PresetMinterPauser_init_unchained(name, symbol);
        __ERC20PresetMinterPauserMock_init_unchained(name, symbol);
    }

    function __ERC20PresetMinterPauserMock_init_unchained(string memory name, string memory symbol) internal initializer {



    }


    uint256[50] private __gap;
}