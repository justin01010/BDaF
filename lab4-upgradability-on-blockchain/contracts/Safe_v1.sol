// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { Proxy } from './Proxy.sol';
import "hardhat/console.sol";

/*-------------------  Safe v1  -------------------*/
contract Safe {

    mapping(address => mapping(address => uint256)) internal balances; // User address -> Token address -> Balance
    mapping(address => uint256) internal feesCollected;                // Token address -> Total fees collected


    modifier _onlyOwner(address _sender) {
        // owner() is a function defined on the Proxy contract, which we can
        // reach through address(this), since we'll be inside a delegatecall context.
        require(Proxy(address(this)).isOwner(_sender), "no permission - owner only");
        _;
    }

    function version() external virtual pure returns (string memory) { return 'V1'; }


    function deposit(address token, uint256 amount) virtual external {
        ERC20(token).transferFrom(msg.sender, address(this), amount);
        balances[msg.sender][token] += amount * 999 / 1000; // contract takes 0.1% tax
        feesCollected[token] += amount / 1000;
        console.log("           Deposit: %s deposited %s token, %s token in total", msg.sender, amount, balances[msg.sender][token]);
    }

    function withdraw(address token, uint256 amount) virtual external {
        // check if balance is enough
        require (balances[msg.sender][token] >= amount, "Insufficient balance");
        ERC20(token).transfer(msg.sender, amount);
        balances[msg.sender][token] -= amount;
        console.log("           Withdraw:  %s withdraw %s token, remain %s token", msg.sender, amount, balances[msg.sender][token]);
    }

    function takeFee(address token) virtual external _onlyOwner(msg.sender) {
        ERC20(token).transfer(msg.sender, feesCollected[token]);
        console.log("           TakeFee: %s token transfered to owner", feesCollected[token]);
        feesCollected[token] = 0;
    }

    function getFeesCollected(address token) virtual external view _onlyOwner(msg.sender) returns(uint){
        return feesCollected[token];
    }

    function getBalance(address token) virtual external view returns (uint){
        return balances[msg.sender][token];
    }
}
