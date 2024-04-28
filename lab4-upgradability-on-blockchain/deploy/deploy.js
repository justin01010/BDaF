async function main(){
    const [owner] = await ethers.getSigners();
    console.log(`Contract Owner Address -->  ${owner.address}`);
    
        
    // get contract and deploy
    const Token = await ethers.getContractFactory("token"); 
    const token   = await Token.deploy();
    await token.waitForDeployment();
    console.log(`Token Contract Address -->  ${token.target}`);

    const Safe_v1 = await ethers.getContractFactory("Safe");
    const safe_v1 = await Safe_v1.deploy();
    await safe_v1.waitForDeployment();
    console.log(`SafeV1 Contract Address --> ${safe_v1.target}`);

    const Proxy = await ethers.getContractFactory("Proxy");
    const proxy   = await Proxy.deploy(safe_v1.target);
    await proxy.waitForDeployment();
    console.log(`Proxy Contract Address -->  ${proxy.target}`);

    const Safe_v2 = await ethers.getContractFactory("Safe_v2");
    const safe_v2 = await Safe_v2.deploy();
    console.log(`SafeV2 Contract Address --> ${safe_v2.target}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })