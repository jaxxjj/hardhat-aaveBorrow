const { getNamedAccounts, ethers } = require("hardhat")

const AMOUNT = "2000000000000000000"
async function getWeth() {
    const { deployer } = await getNamedAccounts()
    //0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
    const signer = await ethers.getSigner(deployer)

    const iWeth = await ethers.getContractAt(
        "IWeth",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        signer,
    )
    const tx = await iWeth.deposit({ value: AMOUNT })
    await tx.wait(1)
    const wethBalance = await iWeth.balanceOf(deployer)
    console.log("User balance: ", wethBalance)
}
module.exports = { getWeth, AMOUNT }
