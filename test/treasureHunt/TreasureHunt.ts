const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TreasureHunt", function () {
  let TreasureHunt;
  let treasureHunt: any;
  let owner;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    TreasureHunt = await ethers.getContractFactory("TreasureHunt");
    [owner, addr1, addr2] = await ethers.getSigners();
    treasureHunt = await TreasureHunt.deploy();
    await treasureHunt.deployed();
  });

  it("Should deploy with a random initial treasure position", async function () {
    const treasurePosition = await treasureHunt.treasurePosition();
    expect(treasurePosition).to.be.within(0, 99);
  });

  it("Should allow a player to move and update position", async function () {
    await treasureHunt.connect(addr1).move(1, { value: ethers.utils.parseEther("0.01") });
    const playerPosition = await treasureHunt.playerPositions(addr1.address);
    expect(playerPosition).to.equal(1);
  });

  it("Should move treasure to a random adjacent position if player moves to a multiple of 5", async function () {
    const oldTreasurePosition = await treasureHunt.treasurePosition();
    await treasureHunt.connect(addr1).move(5, { value: ethers.utils.parseEther("0.01") });
    const newTreasurePosition = await treasureHunt.treasurePosition();
    expect(newTreasurePosition).to.not.equal(oldTreasurePosition);
  });

  it("Should move treasure to a random position if player moves to a prime number", async function () {
    const oldTreasurePosition = await treasureHunt.treasurePosition();
    await treasureHunt.connect(addr1).move(7, { value: ethers.utils.parseEther("0.01") });
    const newTreasurePosition = await treasureHunt.treasurePosition();
    expect(newTreasurePosition).to.not.equal(oldTreasurePosition);
  });

  it("Should declare a winner if the player moves to the treasure position", async function () {
    const initialBalance = await ethers.provider.getBalance(addr1.address);

    // Assuming the initial treasure position is 0
    const tx = await treasureHunt.connect(addr1).move(0, { value: ethers.utils.parseEther("0.01") });
    const receipt = await tx.wait();

    const gasUsed = receipt.gasUsed.mul(tx.gasPrice);

    // Calculate the expected prize (90% of the contract balance)
    const prize = (await ethers.provider.getBalance(treasureHunt.address)).mul(90).div(100);

    // Calculate the expected final balance
    const expectedFinalBalance = initialBalance.sub(gasUsed).add(prize);

    const finalBalance = await ethers.provider.getBalance(addr1.address);

    // Allow for minor discrepancies
    const tolerance = ethers.utils.parseEther("0.01"); // Adjust as necessary
    expect(finalBalance).to.be.closeTo(expectedFinalBalance, tolerance);
  });

  it("Should not allow moves after the game has ended", async function () {
    await treasureHunt.connect(addr1).move(0, { value: ethers.utils.parseEther("0.01") });

    await expect(treasureHunt.connect(addr2).move(1, { value: ethers.utils.parseEther("0.01") })).to.be.revertedWith(
      "Game has ended",
    );
  });
});
