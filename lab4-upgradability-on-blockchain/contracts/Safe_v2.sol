// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { Proxy } from './Proxy.sol';
import { Safe } from './Safe_v1.sol';
import "hardhat/console.sol";

/*-------------------  Safe v2  -------------------*/
contract Safe_v2 is Safe {

    
    function version() external override pure returns (string memory) { return 'V2'; }

    function deposit(address token, uint256 amount) override external {
        ERC20(token).transferFrom(msg.sender, address(this), amount);
        balances[msg.sender][token] += amount;
        console.log("           Deposit: %s deposited %s token, %s token in total", msg.sender, amount, balances[msg.sender][token]);
    }

    function takeFee(address token) override external _onlyOwner(msg.sender){
        revert('takeFee() is banned');
    }
}
