const hre = require("hardhat");

async function main() {

  const RBAC = await hre.ethers.getContractFactory("RBAC");

  const rbac = await RBAC.deploy();

  await rbac.waitForDeployment();

  console.log("RBAC deployed to:", await rbac.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});