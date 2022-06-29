const hre = require("hardhat");

var USDCG_TOKEN_ADDRESS = "";
var gluwaAddress = "";
var luniverseAddress = "";
let skip = false;


async function main() {
  const [deployer] = await hre.ethers.getSigners();

  switch (hre.network.name) {
    case "hardhat":
    {
      USDCG_TOKEN_ADDRESS = "0x000CC169848eC63466A7EfB59e1b925ABAb5F92b"; // ERC-20-Wrapper-Gluwacoin
      gluwaAddress = "0xd9d097435E7CF8e663CcB26daB9C31A7F2B64ab4";
      luniverseAddress = "0xd9d097435E7CF8e663CcB26daB9C31A7F2B64ab4";
      break;
    }
    case "goerli": {
      USDCG_TOKEN_ADDRESS = "0x000CC169848eC63466A7EfB59e1b925ABAb5F92b"; // ERC-20-Wrapper-Gluwacoin
      gluwaAddress = "0xd9d097435E7CF8e663CcB26daB9C31A7F2B64ab4";
      luniverseAddress = "0xd9d097435E7CF8e663CcB26daB9C31A7F2B64ab4";
      break;
  }
  case "rinkeby": {
      USDCG_TOKEN_ADDRESS = "0x0aD1439A0e0bFdcD49939f9722866651a4AA9B3C";
      gluwaAddress = "0xd9d097435E7CF8e663CcB26daB9C31A7F2B64ab4";
      luniverseAddress = "0xd9d097435E7CF8e663CcB26daB9C31A7F2B64ab4";
      break;
  }
  case "mainnet": {
      USDCG_TOKEN_ADDRESS = "0x1b9c206cf3df47c3b04941539b07f5784cbdde42";
      gluwaAddress = "0x8cDFCaAD5df8A24f983882BaF461F33e1bC24000";
      luniverseAddress = "0x8cDFCaAD5df8A24f983882BaF461F33e1bC24000";
      break;
  }
  default: {
      skip = true;
      break;
  }
  }

  if (!skip) {
    // We get the contract to deploy
    const LuniverseGluwacoinGateway = await hre.ethers.getContractFactory('LuniverseGluwacoinGateway');
    const luniverseGluwacoinGateway = await hre.upgrades.deployProxy(LuniverseGluwacoinGateway, [
      USDCG_TOKEN_ADDRESS, 
      gluwaAddress, 
      luniverseAddress
    ], { deployer, initializer: 'initialize' });
    const luniverseGluwacoinGatewayTnx = await luniverseGluwacoinGateway.deployTransaction.wait();
    hre.addressBook.saveContract(
        'LuniverseGluwacoinGateway',
        luniverseGluwacoinGateway.address,
        network.name,
        deployer.address,
        luniverseGluwacoinGatewayTnx.blockHash,
        luniverseGluwacoinGatewayTnx.blockNumber
    );

    await luniverseGluwacoinGateway.deployed();

    console.log("LuniverseGluwacoinGateway deployed to:", luniverseGluwacoinGateway.address);

    console.log(' ')

    // Get ProxyAdmin address from .openzeppelin/
    const ProxyAdmin_Address = await hre.addressBook.retrieveOZAdminProxyContract(network.config.chainId);
    console.log('Deployed using Proxy Admin contract address: ', ProxyAdmin_Address);
    addressBook.saveContract('ProxyAdmin', ProxyAdmin_Address, network.name, deployer.address);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
