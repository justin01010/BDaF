// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import 'hardhat/console.sol';

contract Proxy {

    mapping(address => mapping(address => uint256)) internal balances; // User address -> Token address -> Balance
    mapping(address => uint256) internal feesCollected;                // Token address -> Total fees collected

    // Use unstructured storage to store “owner” and “implementation”
    bytes32 private constant IMPLEMENTATION_SLOT = bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1);
    bytes32 private constant OWNER_SLOT = bytes32(uint256(keccak256("eip1967.proxy.owner")) - 1);


    constructor (address _implementation) {
        _setImplementation(_implementation);
        _setOwner(msg.sender);
    }

    /* ----------------------------  helper functions/modifiers  ----------------------------*/
    
    modifier _ifOwner() {
        // if (msg.sender == _getOwner()) _;
        // else _fallback();
        require(msg.sender == _getOwner(), "no permission - owner only");
        _;
    }

    function _getOwner() private view returns (address) {
        return StorageSlot.getAddressSlot(OWNER_SLOT).value;
    }

    function _setOwner(address _admin) private {
        require(_admin != address(0), "admin = zero address");
        StorageSlot.getAddressSlot(OWNER_SLOT).value = _admin;
    }

    function _getImplementation() private view returns (address) {
        return StorageSlot.getAddressSlot(IMPLEMENTATION_SLOT).value;
    }

    function _setImplementation(address _implementation) private {
        require(_implementation.code.length > 0, "implementation is not contract");
        StorageSlot.getAddressSlot(IMPLEMENTATION_SLOT).value = _implementation;
    }

    // delegate call for users
    function _delegate(address _implementation) internal virtual {
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0.

            // calldatacopy(t, f, s) - copy s bytes from calldata at position f to mem at position t
            // calldatasize() - size of call data in bytes
            calldatacopy(0, 0, calldatasize())

            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.

            // delegatecall(g, a, in, insize, out, outsize) -
            // - call contract at address a
            // - with input mem[in…(in+insize))
            // - providing g gas
            // - and output area mem[out…(out+outsize))
            // - returning 0 on error (eg. out of gas) and 1 on success
            let result := delegatecall(gas(), _implementation, 0, calldatasize(), 0, 0)

            // Copy the returned data.
            // returndatacopy(t, f, s) - copy s bytes from returndata at position f to mem at position t
            // returndatasize() - size of the last returndata
            returndatacopy(0, 0, returndatasize())

            switch result
            // delegatecall returns 0 on error.
            case 0 {
                // revert(p, s) - end execution, revert state changes, return data mem[p…(p+s))
                revert(0, returndatasize())
            }
            default {
                // return(p, s) - end execution, return data mem[p…(p+s))
                return(0, returndatasize())
            }
        }
    }

    function _fallback() private {
        _delegate(_getImplementation());
    }

    /* ----------------------------  Admin Interface  ----------------------------*/

    // upgrade implementation
    function upgrade(address _implementation) external _ifOwner {
        _setImplementation(_implementation);
    }

    // get current implementation address
    function implementation() external view returns (address) {
        return _getImplementation();
    }

    function isOwner(address _sender) external view returns (bool) {
        if (_sender == _getOwner()) return true;
        else return false;
    }

    /* ----------------------------  User Interface  ----------------------------*/
    
    fallback() external {
        _fallback();
    }

}

library StorageSlot {
    struct AddressSlot {
        address value;
    }

    function getAddressSlot(bytes32 slot)
        internal
        pure
        returns (AddressSlot storage r)
    {
        assembly {
            r.slot := slot
        }
    }
}