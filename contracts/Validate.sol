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
    function validateApproveSignature(address contractAddress, address sender, bytes32 txnHash, bytes memory sig)
    internal pure returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(contractAddress, sender, txnHash));
        bytes32 messageHash = hash.toEthSignedMessageHash();

        address signer = messageHash.recover(sig);
        require(signer == sender, "Validate: invalid signature");

        return true;
    }

    /**
     * @dev Throws if given `sig` is an incorrect signature of the `sender`.
     */
    function validateSignature(address contractAddress, address sender, bytes32 txnHash, uint256 fee, bytes memory sig)
    internal pure returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(contractAddress, sender, txnHash, fee));
        bytes32 messageHash = hash.toEthSignedMessageHash();

        address signer = messageHash.recover(sig);
        require(signer == sender, "Validate: invalid signature");

        return true;
    }
}
