const { deploy } = require("@nomicfoundation/ignition-core")
const { getWeth } = require("../scripts/getWeth")
const { getNamedAccounts } = require("hardhat")
const { bigint } = require("hardhat/internal/core/params/argumentTypes")
const AMOUNT = "2000000000000000000"
async function main() {
    await getWeth()
    const { deployer } = await getNamedAccounts()
    const lendingPool = await getLendingPool(deployer)
    console.log("lendingPool Address: ", lendingPool.address)
    console.log(deployer)
    const wethTokenAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
    console.log(wethTokenAddress)
    console.log(AMOUNT)

    await approveErc20(wethTokenAddress, lendingPool.address, AMOUNT, deployer)
    console.log("depositing...")
    await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0)
    console.log("successfully deposited")
    let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(lendingPool, deployer)
    let price = await getDaiPrice()
    console.log(ethers.utils.formatEther(price))
    // const amountDaiToBorrow = availableBorrowsETH.toString() * 0.95 * (1 / price.toNumber())
    const amountDaiToBorrow = availableBorrowsETH
        .mul(50)
        .div(100)
        .mul(ethers.constants.WeiPerEther)
        .div(price)
    console.log(amountDaiToBorrow)
    await borrowDai(
        "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        lendingPool,
        amountDaiToBorrow,
        deployer,
    )
    await getBorrowUserData(lendingPool, deployer)
    await repay(
        amountDaiToBorrow,
        "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        lendingPool,
        deployer,
    )
    await getBorrowUserData(lendingPool, deployer)
}
async function borrowDai(daiAddress, lendingpool, amountDaiToBorrow, account) {
    const borrowTx = await lendingpool.borrow(daiAddress, amountDaiToBorrow, 2, 0, account)
    await borrowTx.wait(1)
    console.log("You borrowed ", amountDaiToBorrow, " DAI!")
}
async function getLendingPool(account) {
    const signer = await ethers.getSigner(account)
    const lendingPoolAddressProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
        signer,
    )
    const lendingPoolAddress = await lendingPoolAddressProvider.getLendingPool()
    const lendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress, signer)
    return lendingPool
}
async function repay(amount, daiAddress, lendingPool, account) {
    await approveErc20(daiAddress, lendingPool.address, amount, account)
    const repayTx = await lendingPool.repay(daiAddress, amount, 2, account)
    await repayTx.wait(1)
    console.log("repaid")
}
async function getBorrowUserData(lendingPool, account) {
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
        await lendingPool.getUserAccountData(account)
    console.log(
        "you have, ",
        ethers.utils.formatEther(totalCollateralETH),
        " worth of eth deposited",
    )
    console.log("you have ", ethers.utils.formatEther(totalDebtETH), "worth of ETH borrowed")
    console.log("you can borrow ", ethers.utils.formatEther(availableBorrowsETH), " worth of ETH")
    return { availableBorrowsETH, totalDebtETH }
}
async function getDaiPrice() {
    const daiPriceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        "0x773616E4d11A78F511299002da57A0a94577F1f4",
    )
    const { answer } = await daiPriceFeed.latestRoundData()

    const price = answer

    return price
}
async function approveErc20(contractAddress, spenderAddress, amount, account) {
    const signer = await ethers.getSigner(account)
    const erc20Token = await ethers.getContractAt("IERC20", contractAddress, signer)
    const tx = await erc20Token.approve(spenderAddress, amount)
    await tx.wait(1)
    console.log("proved")
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
