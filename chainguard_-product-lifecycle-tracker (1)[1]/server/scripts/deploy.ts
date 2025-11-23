import { ethers } from 'hardhat';

async function main() {
  const SupplyChain = await ethers.getContractFactory('SupplyChain');
  const sc = await SupplyChain.deploy();
  await sc.deployed();
  console.log('SupplyChain deployed to:', sc.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
