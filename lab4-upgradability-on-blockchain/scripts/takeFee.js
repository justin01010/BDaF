
async function main(){
    const tokenAddress = '0x47156D04fEFB001609b00591AAda5abdef127d6a';
    const proxyAddress = '0x5Bcf2ce26158C541baFC5574409241a75f7F20A8';
    const [owner] = await ethers.getSigners();
    console.log(`Contract Owner Address -->  ${owner.address}`);
    
        
    // interact with takeFee contract
    const proxied_safe = await ethers.getContractAt("Safe", proxyAddress);
    const txResponse = await proxied_safe.connect(owner).takeFee(tokenAddress);

    const txReceipt = await txResponse.wait();

    // The transaction hash can be accessed from the transaction response
    console.log(`Transaction Hash -->  ${txResponse.hash}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })