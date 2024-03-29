// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

import "../Validate.sol";

/**
 * @dev 2-Way Peg Gluwacoin Gateway contract between the Ethereum network and the Luniverse.
 * Gluwa and Luniverse serve as gatekeepers of the gateway.
 * You can deposit to the contract's address to peg your Gluwacoin.
 * Once pegged, submit the deposit transactionHash and request gatekeepers to verify your peg.
 * Your Gluwacoins will get released on the Luniverse when both gatekeepers complete the verification.
 * You can also withdraw your Luniverse Gluwacoin from the contract.
 * Burn your Luniverse Gluwacoin and request gatekeepers to verify your burn by submitting its transactionHash.
 * Once both gatekeepers verify the burn, your Gluwacoin will get released from the contract to your address.
 */
contract LuniverseGluwacoinGatewayUpgraded is Initializable, ContextUpgradeSafe, AccessControlUpgradeSafe  {
    using Address for address;
    using ECDSA for bytes32;
    string constant public NEW_VARIABLE="New Variable"; 
    // base token, the token to be pegged
    IERC20 private _token;

    bytes32 public constant GLUWA_ROLE = keccak256("GLUWA_ROLE");
    bytes32 public constant GLUWA_ADMIN_ROLE = keccak256("GLUWA_ADMIN_ROLE");
    bytes32 public constant LUNIVERSE_ROLE = keccak256("LUNIVERSE_ROLE");
    bytes32 public constant LUNIVERSE_ADMIN_ROLE = keccak256("LUNIVERSE_ADMIN_ROLE");

    // unpeg request object
    struct Unpeg {
        uint256 _amount;
        address _sender;
        bool _gluwaApproved;
        bool _luniverseApproved;
        bool _processed;
    }

    // transactionHash mapping to Unpeg.
    mapping (bytes32 => Unpeg) private _unpegged;

    function initialize(IERC20 token, address gluwa, address luniverse) public {
        _token = token;
        _setupRole(GLUWA_ROLE, gluwa);
        _setupRole(GLUWA_ADMIN_ROLE, gluwa);
        _setRoleAdmin(GLUWA_ROLE, GLUWA_ADMIN_ROLE);
        _setupRole(LUNIVERSE_ROLE, luniverse);
        _setupRole(LUNIVERSE_ADMIN_ROLE, luniverse);
        _setRoleAdmin(LUNIVERSE_ROLE, LUNIVERSE_ADMIN_ROLE);
    }

    /**
     * @dev Returns the address of the base token.
     */
    function token() external view returns (string memory) {
        return "token() is replaced";
    }

    /**
     * @dev Returns if there is Unpeg for the {txnHash}.
     */
    function isUnpegged(bytes32 txnHash) external view returns (bool unpegged) {
        return _isUnpegged(txnHash);
    }

    /**
     * @dev Returns Unpeg for the {txnHash}.
     */
    function getUnpeg(bytes32 txnHash) external view returns (uint256 amount, address sender, bool gluwaApproved,
        bool luniverseApproved, bool processed) {
        require(_isUnpegged(txnHash), "Unpeggable: the txnHash is not unpegged");

        Unpeg memory unpeg = _unpegged[txnHash];

        amount = unpeg._amount;
        sender = unpeg._sender;
        gluwaApproved = unpeg._gluwaApproved;
        luniverseApproved = unpeg._luniverseApproved;
        processed = unpeg._processed;
    }

    /**
     * @dev Creates Unpeg for the {txnHash}. The creator must submit correct address of the {sender} and the {amount},
     * else gatekeepers will not approve the unpeg request.
     */
    function unpeg(bytes32 txnHash, uint256 amount, address sender) external {
        require(!_isUnpegged(txnHash), "Unpeggable: the txnHash is already unpegged");
        require(hasRole(GLUWA_ROLE, _msgSender()) || hasRole(LUNIVERSE_ROLE, _msgSender()),
            "Unpeggable: caller does not have the Gluwa role or the Luniverse role");

        _unpegged[txnHash] = Unpeg(amount, sender, false, false, false);
    }

    /**
     * @dev Gluwa approves Unpeg with the {txnHash}.
     * There must be an Unpeg object with the {txnHash}.
     * The caller must have a Gluwa role.
     * The Unpeg object must not be Gluwa approved already.
    **/
    function gluwaApprove(bytes32 txnHash) external {
        require(_isUnpegged(txnHash), "Unpeggable: the txnHash is not unpegged");
        require(hasRole(GLUWA_ROLE, _msgSender()), "Unpeggable: caller does not have the Gluwa role");
        require(!_unpegged[txnHash]._gluwaApproved, "Peggable: the txnHash is already Gluwa Approved");

        _unpegged[txnHash]._gluwaApproved = true;
    }

    /**
     * @dev Gluwa approves Unpeg with the {txnHash}, ETHlessly.
     * The {sig} must be a correct signature of the {approver}.
     * There must be an Unpeg object with the {txnHash}.
     * The {approver} must have a Gluwa role.
     * The Unpeg object must not be Gluwa approved already.
    **/
    function gluwaApprove(bytes32 txnHash, address approver, bytes memory sig) external {
        require(_isUnpegged(txnHash), "Unpeggable: the txnHash is not unpegged");
        require(hasRole(GLUWA_ROLE, approver), "Unpeggable: approver does not have the Gluwa role");
        require(!_unpegged[txnHash]._gluwaApproved, "Peggable: the txnHash is already Gluwa Approved");

        bytes32 hash = keccak256(abi.encodePacked(address(this), approver, txnHash));
        Validate.validateSignature(hash, approver, sig);

        _unpegged[txnHash]._gluwaApproved = true;
    }

    /**
     * @dev Luniverse approves Unpeg with the {txnHash}.
     * There must be an Unpeg object with the {txnHash}.
     * The caller must have a Luniverse role.
     * The Unpeg object must not be Luniverse approved already.
    **/
    function luniverseApprove(bytes32 txnHash) external {
        require(_isUnpegged(txnHash), "Unpeggable: the txnHash is not unpegged");
        require(hasRole(LUNIVERSE_ROLE, _msgSender()), "Unpeggable: caller does not have the Luniverse role");
        require(!_unpegged[txnHash]._luniverseApproved, "Peggable: the txnHash is already Luniverse Approved");

        _unpegged[txnHash]._luniverseApproved = true;
    }

    /**
     * @dev Luniverse approves Unpeg with the {txnHash}, ETHlessly.
     * The {sig} must be a correct signature of the {approver}.
     * There must be an Unpeg object with the {txnHash}.
     * The {approver} must have a Luniverse role.
     * The Unpeg object must not be Luniverse approved already.
    **/
    function luniverseApprove(bytes32 txnHash, address approver, bytes memory sig) external {
        require(_isUnpegged(txnHash), "Unpeggable: the txnHash is not unpegged");
        require(hasRole(LUNIVERSE_ROLE, approver), "Unpeggable: approver does not have the Luniverse role");
        require(!_unpegged[txnHash]._luniverseApproved, "Peggable: the txnHash is already Luniverse Approved");

        bytes32 hash = keccak256(abi.encodePacked(address(this), approver, txnHash));
        Validate.validateSignature(hash, approver, sig);

        _unpegged[txnHash]._luniverseApproved = true;
    }

    /**
     * @dev Process Unpeg request and release the unpegged Gluwacoin to the requestor.
     *
     * Requirements:
     *
     * - the Unpeg must be Gluwa Approved and Luniverse Approved.
     * - the Unpeg must be not processed yet.
     */
    function processUnpeg(bytes32 txnHash) external {
        require(_isUnpegged(txnHash), "Unpeggable: the txnHash is not unpegged");
        require(_unpegged[txnHash]._gluwaApproved, "Unpeggable: the txnHash is not Gluwa Approved");
        require(_unpegged[txnHash]._luniverseApproved, "Unpeggable: the txnHash is not Luniverse Approved");
        require(!_unpegged[txnHash]._processed, "Unpeggable: the txnHash is already processed");

        address account = _unpegged[txnHash]._sender;
        uint256 amount = _unpegged[txnHash]._amount;

        _unpegged[txnHash]._processed = true;

        _token.transfer(account, amount);
    }

    /**
     * @dev Process Unpeg request ETHlessly and release the unpegged Gluwacoin to the requestor.
     *
     * Requirements:
     *
     * - the Unpeg must be Gluwa Approved and Luniverse Approved.
     * - the Unpeg must be not processed yet.
     * - the caller must have the Gluwa role.
     */
    function processUnpeg(bytes32 txnHash, address sender, uint256 fee, bytes memory sig) external {
        require(_isUnpegged(txnHash), "Unpeggable: the txnHash is not unpegged");
        require(hasRole(GLUWA_ROLE, _msgSender()), "Unpeggable: caller does not have the Gluwa role");
        require(_unpegged[txnHash]._gluwaApproved, "Unpeggable: the txnHash is not Gluwa Approved");
        require(_unpegged[txnHash]._luniverseApproved, "Unpeggable: the txnHash is not Luniverse Approved");
        require(!_unpegged[txnHash]._processed, "Unpeggable: the txnHash is already processed");

        address account = _unpegged[txnHash]._sender;
        uint256 amount = _unpegged[txnHash]._amount;

        bytes32 hash = keccak256(abi.encodePacked(address(this), sender, txnHash, fee));
        Validate.validateSignature(hash, sender, sig);

        _unpegged[txnHash]._processed = true;

        _token.transfer(account, SafeMath.sub(amount, fee));
        _token.transfer(_msgSender(), fee);
    }

    /**
     * @dev Returns if there is Unpeg for the {txnHash}.
     */
    function _isUnpegged(bytes32 txnHash) private view returns (bool unpegged) {
        return (_unpegged[txnHash]._sender != address(0));
    }
    function _newFunction()public view returns(string memory){
        return "New Function";
    }
    uint256[50] private __gap;
}