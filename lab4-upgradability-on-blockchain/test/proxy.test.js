const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const exp = require("constants");

describe("Proxy Contract Test", function () {

    // define a fixture to reuse same setup in every test
    async function deployFixture() {

        // Contracts are deployed using the first signer/account by default7
        const [owner, otherAccount] = await ethers.getSigners();
        
        // get contract and deploy
        const Token = await ethers.getContractFactory("token"); 
        const token   = await Token.deploy();
        await token.waitForDeployment();

        const Safe_v1 = await ethers.getContractFactory("Safe");
        const safe_v1 = await Safe_v1.deploy();
        await safe_v1.waitForDeployment();

        const Proxy = await ethers.getContractFactory("Proxy");
        const proxy   = await Proxy.deploy(safe_v1.target);
        await proxy.waitForDeployment();

        const Safe_v2 = await ethers.getContractFactory("Safe_v2");
        const safe_v2 = await Safe_v2.deploy();
        await safe_v2.waitForDeployment();

        const proxied_safe = await ethers.getContractAt("Safe", proxy.target);

        // transfer some money to otherAccount for further usage
        //await token.connect(owner).approve(owner.address, 10000);
        await token.connect(owner).transfer(otherAccount.address, 10000);

        return { token, proxy, safe_v1, safe_v2, proxied_safe, owner, otherAccount };
  }

    describe("Deployment", function () {

        it("owner check", async function () {
            const { proxy, owner, otherAccount } = await loadFixture(deployFixture);

            expect(await proxy.connect(owner).isOwner(owner.address)).to.equal(true);
            expect(await proxy.connect(otherAccount).isOwner(otherAccount.address)).to.equal(false);

        });

        it("otherAccount should receive funds", async function () {
            const { token, otherAccount } = await loadFixture(deployFixture);

            expect(await token.connect(otherAccount)
                                .balanceOf(otherAccount.address))
                                .to.equal(10000);
        });
    });

    describe("Upgradability Test", function () {

        it("check initial version", async function () {
            const { proxy, safe_v1, safe_v2 } = await loadFixture(deployFixture);

            expect(await proxy.implementation()).to.equal(safe_v1.target);
        });

        it("check upgradability by owner", async function () {
            const { proxy, owner, safe_v2, otherAccount } = await loadFixture(deployFixture);

            await proxy.connect(owner).upgrade(safe_v2.target);
            expect(await proxy.implementation()).to.equal(safe_v2.target);
        });

        it("check upgradability by others (reverted)", async function () {
            const { proxy, owner, safe_v2, otherAccount } = await loadFixture(deployFixture);

            await expect(proxy.connect(otherAccount)
                               .upgrade(safe_v2.target))
                               .to.be.revertedWith(
                                    "no permission - owner only"
                               );
        }); 
    }); 

    describe("Original Safe Test", function () {

        it("check implementation version", async function () {
            const { proxied_safe } = await loadFixture(deployFixture);

            expect(await proxied_safe.version()).to.equal('V1');
        });

        it("check balance", async function () {
            const { token, proxied_safe, owner, otherAccount } = await loadFixture(deployFixture);

            // approve and send transaction - 1
            await token.connect(otherAccount).approve(proxied_safe.target, 1000);
            await proxied_safe.connect(otherAccount).deposit(token.target, 1000);

            // check user balance
            expect(await proxied_safe.connect(otherAccount)
                                .getBalance(token.target))
                                .to.equal(999);
            
            // check deducted fee
            expect(await proxied_safe.connect(owner)
                                      .getFeesCollected(token.target))
                                      .to.equal(1);

            // approve and send transaction - 2
            await token.connect(otherAccount).approve(proxied_safe.target, 4000);
            await proxied_safe.connect(otherAccount).deposit(token.target, 4000);

            // check user balance
            expect(await proxied_safe.connect(otherAccount)
                               .getBalance(token.target))
                               .to.equal(4995);
           
            // check deducted fee
            expect(await proxied_safe.connect(owner)
                                     .getFeesCollected(token.target))
                                     .to.equal(5); 

            // user deposit fee
            const otherAccountPossessToken = await token.connect(otherAccount).balanceOf(otherAccount);
            await proxied_safe.connect(otherAccount).withdraw(token.target, 1000);
            expect(await proxied_safe.connect(otherAccount)
                                      .getBalance(token.target))
                                      .to.equal(3995);

            expect(await token.connect(otherAccount)
                               .balanceOf(otherAccount))
                               .to.equal(otherAccountPossessToken+1000n);
            
        });

        it("check takeFee()", async function () {
            const { token, proxied_safe, owner, otherAccount } = await loadFixture(deployFixture);

            // approve and send transaction - 1
            await token.connect(otherAccount).approve(proxied_safe.target, 1000);
            await proxied_safe.connect(otherAccount).deposit(token.target, 1000);

            // check user balance
            expect(await proxied_safe.connect(otherAccount)
                                .getBalance(token.target))
                                .to.equal(999);
            
            // check deducted fee
            expect(await proxied_safe.connect(owner)
                                      .getFeesCollected(token.target))
                                      .to.equal(1);

            // others call takeFee (reverted)
            await expect(proxied_safe.connect(otherAccount)
                                      .takeFee(token.target))
                                      .to.be.revertedWith(
                                            'no permission - owner only'
                                      );
            

            // owner call takeFee
            const ownerPossessToken = await token.connect(owner).balanceOf(owner);
            await proxied_safe.connect(owner).takeFee(token.target);
            expect(await token.connect(owner).balanceOf(owner)).to.equal(ownerPossessToken+1n);
        }); 
    });
    
    describe("Upgraded Safe Test", function () {

        it("check upgraded version", async function () {
            const { proxy, owner, proxied_safe, safe_v2 } = await loadFixture(deployFixture); 

            // upgrade contract
            await proxy.connect(owner).upgrade(safe_v2.target);

            expect(await proxied_safe.version()).to.equal('V2');
        });
        
        
        it("check balance with only safe v2", async function () {
            const { token, proxy, proxied_safe, safe_v2, owner, otherAccount } = await loadFixture(deployFixture);
            await proxy.connect(owner).upgrade(safe_v2.target);

            // approve and send transaction - 1
            await token.connect(otherAccount).approve(proxied_safe.target, 1000);
            await proxied_safe.connect(otherAccount).deposit(token.target, 1000);

            // check user balance
            expect(await proxied_safe.connect(otherAccount)
                                .getBalance(token.target))
                                .to.equal(1000);
            

            // approve and send transaction - 2
            await token.connect(otherAccount).approve(proxied_safe.target, 4000);
            await proxied_safe.connect(otherAccount).deposit(token.target, 4000);

            // check user balance
            expect(await proxied_safe.connect(otherAccount)
                               .getBalance(token.target))
                               .to.equal(5000);
           
            // check deducted fee
            expect(await proxied_safe.connect(owner)
                                     .getFeesCollected(token.target))
                                     .to.equal(0);
        });
        
        it("check balance with safe v1&v2", async function () {
            const { token, proxy, proxied_safe, safe_v2, owner, otherAccount } = await loadFixture(deployFixture);

            // approve and send transaction - 1
            await token.connect(otherAccount).approve(proxied_safe.target, 1000);
            await proxied_safe.connect(otherAccount).deposit(token.target, 1000);

            // check user balance
            expect(await proxied_safe.connect(otherAccount)
                                .getBalance(token.target))
                                .to.equal(999);
            
            await proxy.connect(owner).upgrade(safe_v2.target);

            // approve and send transaction - 2
            await token.connect(otherAccount).approve(proxied_safe.target, 4000);
            await proxied_safe.connect(otherAccount).deposit(token.target, 4000);

            // check user balance
            expect(await proxied_safe.connect(otherAccount)
                               .getBalance(token.target))
                               .to.equal(4999);

        });

        it("check takeFee()", async function () {
            const { token, proxy, proxied_safe, safe_v2, owner, otherAccount } = await loadFixture(deployFixture);
            await proxy.connect(owner).upgrade(safe_v2.target);

            // approve and send transaction - 1
            await token.connect(otherAccount).approve(proxied_safe.target, 1000);
            await proxied_safe.connect(otherAccount).deposit(token.target, 1000);

            // others call takeFee (reverted)
            await expect(proxied_safe.connect(otherAccount)
                                      .takeFee(token.target))
                                      .to.be.revertedWith(
                                            'no permission - owner only'
                                      );
            
            // owner call takeFee
            const ownerPossessToken = await token.connect(owner).balanceOf(owner);
            await expect(proxied_safe.connect(owner)
                                      .takeFee(token.target))
                                      .to.be.revertedWith("takeFee() is banned");
            
        }); 


    });
});
