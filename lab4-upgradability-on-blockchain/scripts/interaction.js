
async function main(){
    const tokenAddress = '0x47156D04fEFB001609b00591AAda5abdef127d6a';
    const proxyAddress = '0x5Bcf2ce26158C541baFC5574409241a75f7F20A8';

    // get users
    const [owner, otherAccount] = await ethers.getSigners();
    console.log(`Contract Owner Address -->  ${owner.address}`);
    console.log(`Other Account Address  -->  ${otherAccount.address}`);

    // get contract 
    const token = await ethers.getContractAt("token", tokenAddress);

    // send funds to otherAccount
    await token.connect(owner).transfer(otherAccount.address, 10000);
    
        
    // interact with contract
    const proxied_safe = await ethers.getContractAt("Safe", proxyAddress);


    // approve and send transaction
    await token.connect(otherAccount).approve(proxied_safe.target, 1000);
    await proxied_safe.connect(otherAccount).deposit(tokenAddress, 1000);

    // check user balance
    const balance = await proxied_safe.connect(otherAccount).getBalance(tokenAddress);
    
    // check deducted fee
    const fees_collected = await proxied_safe.connect(owner).getFeesCollected(tokenAddress);
    
    // owner call takeFee
    await proxied_safe.connect(owner).takeFee(token.target);
    const fees_took = await token.connect(owner).balanceOf(owner);

    // log to check interaction
    console.log(`Balance: ${balance}, Fees took: ${fees_took}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })