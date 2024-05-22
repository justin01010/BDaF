// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12 <0.9.0;

import { MyOwnSafe } from './MyOwnSafe.sol';
import { MyOwnSafeUpgradeable } from './MyOwnSafeUpgradeable.sol';

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";


contract CreateSafeFactoryContract {

	address public create1Safe;
	address public create2Safe;
	address public create1Safe_withProxy;
	address public create2Safe_withProxy;


	/*----- deploy non-upgradable version using create1 ----- */
  	function deploySafe (address _owner) public {
		MyOwnSafe created_safe = new MyOwnSafe(_owner);
		create1Safe = address(created_safe);
  	}


	/*----- deploy non-upgradable version using create2 ----- */
	function deploySafeWithCreate2 (address _owner, bytes32 _salt) public {

		// get bytecode of smart contract
		bytes memory _bytecode = abi.encodePacked(
			type(MyOwnSafe).creationCode,
      		abi.encode(_owner)
    	);
		// create2 deploy
		create2Safe = Create2.deploy(0, _salt, _bytecode);
	}

	/*----- deploy upgradeable version using create1 -----*/
	function deploySafeUpgradeable (address _owner) public {
		// deploy MyOwnSafeUpgradeable
		MyOwnSafeUpgradeable createdSafe = new MyOwnSafeUpgradeable();

		// deploy proxy contract
		create1Safe_withProxy = Clones.clone(address(createdSafe));

		// proxy initialization
		MyOwnSafeUpgradeable(create1Safe_withProxy).initialize(_owner);
	}

	/*----- deploy upgradeable version using create2 -----*/
	function deploySafeUpgradeableWithCreate2 (address _owner, bytes32 _salt) public {
		// deploy MyOwnSafeUpgradeable
		MyOwnSafeUpgradeable createdSafe = new MyOwnSafeUpgradeable();

		// deploy proxy contract
		create2Safe_withProxy = Clones.cloneDeterministic(address(createdSafe), _salt);
		
		// proxy initialization
		MyOwnSafeUpgradeable(create2Safe_withProxy).initialize(_owner);
	}
}