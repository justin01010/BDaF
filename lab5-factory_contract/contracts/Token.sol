// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12 <0.9.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import 'hardhat/console.sol';

contract token is ERC20 {

  constructor() ERC20("Token", "TKN") {
    _mint(msg.sender, 100000000_000000_000000_000000);
  }
  
}