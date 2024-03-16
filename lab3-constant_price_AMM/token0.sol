// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12 <0.9.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract token0 is ERC20 {

  constructor() ERC20("Token0", "TKN0") {
    _mint(msg.sender, 100000000_000000_000000_000000);
  }
  
}
