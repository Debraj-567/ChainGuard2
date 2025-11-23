async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);

  const SupplyChain = await ethers.getContractFactory('SupplyChain');
  const sc = await SupplyChain.deploy();
  await sc.deployed();

  console.log('SupplyChain deployed to:', sc.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
