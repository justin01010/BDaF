const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const exp = require("constants");

describe("Factory Contract Test", function () {

    // define a fixture to reuse same setup in every test
    async function deployFixture() {

        // Contracts are deployed using the first signer/account by default7
        const [owner, otherAccount] = await ethers.getSigners();
        
        // get contract and deploy
        const Token = await ethers.getContractFactory("token"); 
        const token = await Token.deploy();
        await token.waitForDeployment();

        const CreateSafeFactoryContract = await ethers.getContractFactory("CreateSafeFactoryContract");
        const factoryContract = await CreateSafeFactoryContract.deploy();
        await factoryContract.waitForDeployment();

        const MyOwnSafe = await ethers.getContractFactory("MyOwnSafe");
		const MyOwnSafeUpgradeable = await ethers.getContractFactory("MyOwnSafeUpgradeable");


        // const proxied_safe = await ethers.getContractAt("Safe", proxy.target);

        // transfer some money to otherAccount for further usage
        //await token.connect(owner).approve(owner.address, 10000);
        await token.connect(owner).transfer(otherAccount.address, 10000);

        return { token, factoryContract, MyOwnSafe, MyOwnSafeUpgradeable, owner, otherAccount};
  }

    it("Test: non-upgradable safe with create1", async function () {

		const { token, owner, otherAccount, factoryContract, MyOwnSafe } = await loadFixture(deployFixture);

		// deploy safe
		await factoryContract.deploySafe(otherAccount.address);
		const safe_address = await factoryContract.create1Safe();
		const create1Safe = await MyOwnSafe.attach(safe_address);

		// mimic user send funds to their safe
		await token.connect(otherAccount).transfer(create1Safe.target, 1000);
		
		/*--- owner case ---*/
		expect(await create1Safe.owner()).to.equal(otherAccount.address);
		// check counter
		await create1Safe.connect(otherAccount).count();
		expect(await create1Safe.connect(otherAccount).counter()).to.equal(1);
		// check withdrawal
		const _possessToken = await token.connect(otherAccount).balanceOf(otherAccount);
		await create1Safe.connect(otherAccount).withdraw(token.target, 100);
		expect(await token.connect(otherAccount).balanceOf(otherAccount)).to.equal(_possessToken+100n);	
		
        /*--- non-owner case ---*/
        await expect(create1Safe.connect(owner).withdraw(token.target, 100)).to.be.revertedWith("!owner");
        await expect(create1Safe.connect(owner).count()).to.be.revertedWith("!owner");
	
    });
	
    it("Test: non-upgradable safe with create2", async function () {

		const { token, owner, otherAccount, factoryContract, MyOwnSafe } = await loadFixture(deployFixture);

		// deploy safe
		//const salt = ethers.utils.formatBytes32String("some_random_salt");
        const salt = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        await factoryContract.deploySafeWithCreate2(otherAccount.address, salt);
		const safe_address = await factoryContract.create2Safe();
		const create2Safe = await MyOwnSafe.attach(safe_address);

		// mimic user send funds to their safe
		await token.connect(otherAccount).transfer(create2Safe.target, 1000);
		
		// check owner
		expect(await create2Safe.owner()).to.equal(otherAccount.address);
		// check counter
		await create2Safe.connect(otherAccount).count();
		expect(await create2Safe.connect(otherAccount).counter()).to.equal(1);
		// check withdrawal
		const _possessToken = await token.connect(otherAccount).balanceOf(otherAccount);
		await create2Safe.connect(otherAccount).withdraw(token.target, 100);
		expect(await token.connect(otherAccount).balanceOf(otherAccount)).to.equal(_possessToken+100n);	

		/*--- non-owner case ---*/
        await expect(create2Safe.connect(owner).withdraw(token.target, 100)).to.be.revertedWith("!owner");
        await expect(create2Safe.connect(owner).count()).to.be.revertedWith("!owner");
		
    });

    it("Test: upgradable safe with create1", async function () {

		const { token, owner, otherAccount, factoryContract, MyOwnSafeUpgradeable } = await loadFixture(deployFixture);

		// deploy safe
		await factoryContract.deploySafeUpgradeable(otherAccount.address);
		const safe_address = await factoryContract.create1Safe_withProxy();
		const create1Safe_withProxy = await MyOwnSafeUpgradeable.attach(safe_address);
        

		// mimic user send funds to their safe
		await token.connect(otherAccount).transfer(create1Safe_withProxy.target, 1000);
		
		/*--- owner case ---*/
		expect(await create1Safe_withProxy.owner()).to.equal(otherAccount.address);
		// check counter
		await create1Safe_withProxy.connect(otherAccount).count();
		expect(await create1Safe_withProxy.connect(otherAccount).counter()).to.equal(1);
		// check withdrawal
		const _possessToken = await token.connect(otherAccount).balanceOf(otherAccount);
		await create1Safe_withProxy.connect(otherAccount).withdraw(token.target, 100);
		expect(await token.connect(otherAccount).balanceOf(otherAccount)).to.equal(_possessToken+100n);	
        // revert initialization
        await expect(create1Safe_withProxy
                        .connect(otherAccount)
                        .initialize(otherAccount.address))
                        .to.be.revertedWith("initialized");
		/*--- non-owner case ---*/
        await expect(create1Safe_withProxy.connect(owner).withdraw(token.target, 100)).to.be.revertedWith("!owner");
        await expect(create1Safe_withProxy.connect(owner).count()).to.be.revertedWith("!owner");
    });
    it("Test: upgradable safe with create2", async function () {

		const { token, owner, otherAccount, factoryContract, MyOwnSafeUpgradeable } = await loadFixture(deployFixture);

		// deploy safe
        const salt = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        await factoryContract.deploySafeUpgradeableWithCreate2(otherAccount.address, salt);

		const safe_address = await factoryContract.create2Safe_withProxy();
		const create2Safe_withProxy = await MyOwnSafeUpgradeable.attach(safe_address);

		// mimic user send funds to their safe
		await token.connect(otherAccount).transfer(create2Safe_withProxy.target, 1000);
		
		/*--- owner case ---*/
		expect(await create2Safe_withProxy.owner()).to.equal(otherAccount.address);
		// check counter
		await create2Safe_withProxy.connect(otherAccount).count();
		expect(await create2Safe_withProxy.connect(otherAccount).counter()).to.equal(1);
		// check withdrawal
		const _possessToken = await token.connect(otherAccount).balanceOf(otherAccount);
		await create2Safe_withProxy.connect(otherAccount).withdraw(token.target, 100);
		expect(await token.connect(otherAccount).balanceOf(otherAccount)).to.equal(_possessToken+100n);	
        // revert initialization
        await expect(create2Safe_withProxy
                        .connect(otherAccount)
                        .initialize(otherAccount.address))
                        .to.be.revertedWith("initialized");

		/*--- non-owner case ---*/
        await expect(create2Safe_withProxy.connect(owner).withdraw(token.target, 100)).to.be.revertedWith("!owner");
        await expect(create2Safe_withProxy.connect(owner).count()).to.be.revertedWith("!owner");
    });
});
