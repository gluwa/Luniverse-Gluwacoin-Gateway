// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

import "./Validate.sol";

/**
 * @dev 2-Way Peg Gluwacoin Gateway contract between the Ethereum network and the Luniverse.
 * Gluwa and Luniverse serves as gatekeepers of the gateway.
 * You can deposit to the contract's address to peg your Gluwacoin.
 * Once pegged, submit the deposit transactionHash and request gatekeepers to verify your peg.
 * Your Gluwacoins will get released on the Luniverse when both gatekeepers complete the verification.
 * You can also withdraw your Luniverse Gluwacoin from the contract.
 * Burn your Luniverse Gluwacoin and request gatekeepers to verify your burn by submitting its transactionHash.
 * Once both gatekeepers verifies the burn, your Gluwacoin will get released from the contract to your address.
 */
contract LuniverseGluwacoinGateway is Initializable, ContextUpgradeSafe, AccessControlUpgradeSafe  {
    using Address for address;

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
    function token() public view returns (IERC20) {
        return _token;
    }

    /**
     * @dev Returns if there is Unpeg for the {txnHash}.
     */
    function isUnpegged(bytes32 txnHash) public view returns (bool unpegged) {
        if (_unpegged[txnHash]._sender != address(0)) {
            return true;
        }

        return false;
    }

    /**
     * @dev Returns Unpeg for the {txnHash}.
     */
    function getUnpeg(bytes32 txnHash) public view returns (uint256 amount, address sender, bool gluwaApproved,
        bool luniverseApproved, bool processed) {
        require(_unpegged[txnHash]._sender != address(0), "Unpeggable: the txnHash is not unpegged");

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
    function unpeg(bytes32 txnHash, uint256 amount, address sender) public {
        require(_unpegged[txnHash]._sender == address(0), "Unpeggable: the txnHash is already unpegged");
        require(hasRole(GLUWA_ROLE, msg.sender) || hasRole(LUNIVERSE_ROLE, msg.sender),
            "Unpeggable: caller does not have the Gluwa role or the Luniverse role");

        _unpegged[txnHash] = Unpeg(amount, sender, false, false, false);
    }

    function gluwaApprove(bytes32 txnHash) public {
        require(hasRole(GLUWA_ROLE, msg.sender),
            "Unpeggable: caller does not have the Gluwa role");
        require(!_unpegged[txnHash]._gluwaApproved, "Peggable: the txnHash is already Gluwa Approved");

        _unpegged[txnHash]._gluwaApproved = true;
    }

    function luniverseApprove(bytes32 txnHash) public {
        require(hasRole(LUNIVERSE_ROLE, msg.sender),
            "Unpeggable: caller does not have the Luniverse role");
        require(!_unpegged[txnHash]._luniverseApproved, "Peggable: the txnHash is already Luniverse Approved");

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
    function processUnpeg(bytes32 txnHash) public {
        require(_unpegged[txnHash]._gluwaApproved, "Unpeggable: the txnHash is not Gluwa Approved");
        require(_unpegged[txnHash]._luniverseApproved, "Unpeggable: the txnHash is not Luniverse Approved");
        require(!_unpegged[txnHash]._processed, "Unpeggable: the txnHash is already processed");

        address account = _unpegged[txnHash]._sender;
        uint256 amount = _unpegged[txnHash]._amount;

        _token.transfer(account, amount);

        _unpegged[txnHash]._processed = true;
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
    function processUnpeg(bytes32 txnHash, address sender, uint256 fee, bytes memory sig) public {
        require(hasRole(GLUWA_ROLE, msg.sender), "Unpeggable: caller does not have the Gluwa role");
        require(_unpegged[txnHash]._gluwaApproved, "Unpeggable: the txnHash is not Gluwa Approved");
        require(_unpegged[txnHash]._luniverseApproved, "Unpeggable: the txnHash is not Luniverse Approved");
        require(!_unpegged[txnHash]._processed, "Unpeggable: the txnHash is already processed");

        address account = _unpegged[txnHash]._sender;
        uint256 amount = _unpegged[txnHash]._amount;

        Validate.validateSignature(address(this), sender, txnHash, fee, sig);

        _token.transfer(account, SafeMath.sub(amount, fee));
        _token.transfer(msg.sender, fee);

        _unpegged[txnHash]._processed = true;
    }

    uint256[50] private __gap;
}