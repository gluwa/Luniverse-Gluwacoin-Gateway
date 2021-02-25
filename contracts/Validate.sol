// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts-ethereum-package/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

/**
 * @dev Signature verification
 */
library Validate {
    using Address for address;
    using ECDSA for bytes32;

    /**
     * @dev Throws if given `sig` is an incorrect signature of the `sender`.
     */
    function validateSignature(bytes32 hash, address sender, bytes memory sig) internal pure {
        bytes32 messageHash = hash.toEthSignedMessageHash();

        address signer = messageHash.recover(sig);
        require(signer == sender, "Validate: invalid signature");
    }
}
