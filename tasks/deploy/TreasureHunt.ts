import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

import type { TreasureHunt } from "../../types/TreasureHunt";
import type { TreasureHunt__factory } from "../../types/factories/TreasureHunt__factory";

task("deploy:TreasureHunt")
  .addParam("signer", "Say hello, be nice")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    const treasureHuntFactory: TreasureHunt__factory = <TreasureHunt__factory>(
      await ethers.getContractFactory("TreasureHunt")
    );
    const treasureHunt: TreasureHunt = <TreasureHunt>await treasureHuntFactory.connect(signers[0]).deploy();
    await treasureHunt.deployed();
    console.log("TreasureHunt deployed to: ", treasureHunt.address);
  });
