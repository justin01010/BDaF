// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12 <0.9.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract censorshipToken is ERC20 {
  address public censor;
  address public master;

  mapping (address => bool) public blacklisted_address;


  constructor() ERC20("CensorshipToken", "CST") {
    // set to the deployer of the contract upon deployment
    censor = msg.sender;
    master = msg.sender;

    // deployer gets 100M of the token
    _mint(msg.sender, 100000000_000000_000000_000000);
  }


  /*--- Modifier Declaration ---*/

  // check for execution permission for master/master&censor
  modifier _onlyMaster() {
    require( msg.sender == master, "Caller isn't master");
    _;
  }
  modifier _onlyCensorOrMaster() {
    require( msg.sender == censor || msg.sender == master, "Caller isn't master or censor");
    _;
  }
  
  // check if an address is blacklisted 
  modifier _blacklistedAddressCheck(address from, address to) {
    require(!blacklisted_address[from], "Sender is blacklisted");
    require(!blacklisted_address[to], "Recipient is blacklisted");
    _;
  }


  /*--- Added Censorship Functions ---*/

  // change master/censor: only executable for master
  function changeMaster(address newMaster) external _onlyMaster {
    master = newMaster;
  }
  function changeCensor(address newCensor) external _onlyMaster {
    censor = newCensor;
  }

  // blacklist an address: only executable for censor & master
  function setBlacklist(address target, bool blacklisted) external _onlyCensorOrMaster {
    blacklisted_address[target] = blacklisted;
  }

  // claw tokens back: only executable by master
  function clawback(address target, uint256 amount) external _onlyMaster {
    _transfer(target, master, amount);
  }

  // mint/burn tokens to any address: only executable for master
  function mint(address target, uint256 amount) external _onlyMaster {
    _mint(target, amount);
  }
  function burn(address target, uint amount) external _onlyMaster {
    _burn(target, amount);
  }
  

  /*--- Overrided Functions ---*/

  // overwrite functions for transferring token to add blacklist check (using modifier)
  function transferFrom (address from, address to, uint256 value) public virtual override _blacklistedAddressCheck(from, to) returns(bool) {
    return super.transferFrom(from, to, value);
  }

  function transfer(address to, uint value) public virtual override _blacklistedAddressCheck(msg.sender, to) returns(bool) {
    return super.transfer(to, value);
  }
  
}

