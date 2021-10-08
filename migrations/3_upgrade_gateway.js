const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const LuniverseGluwacoinGatewayV2 = artifacts.require('LuniverseGluwacoinGatewayV2');
const LuniverseGluwacoinGateway = artifacts.require('LuniverseGluwacoinGateway');

module.exports = async function (deployer, network) {  

  // const instance = await upgradeProxy(LuniverseGluwacoinGateway.address, LuniverseGluwacoinGatewayV2, { deployer });
  // console.info("Deployed " + instance.address);
  // console.log('Token ' + (await instance.token()));       
  // console.log('Version ' + (await instance.version()));       

};