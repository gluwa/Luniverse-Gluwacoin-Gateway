const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const LuniverseGluwacoinGateway = artifacts.require('LuniverseGluwacoinGateway');
var USDCG_TOKEN_ADDRESS = "";
var gluwaAddress = "";
var luniverseAddress = "";

module.exports = async function (deployer, network) {
    // if (network == "rinkeby" || network == "rinkeby-fork")
    // {
    //     USDCG_TOKEN_ADDRESS = "0x71B7E714f87D8b46711a2533c9783d73386B8287";
    //     gluwaAddress = "0x928ef75709ea7e8d112ed63b5c041dd9493f8448";
    //     luniverseAddress = "0x697c720a3de7b4308f79d648b352c07b6d6a0b5b";

    // }
    // const instance = await deployProxy(LuniverseGluwacoinGateway, [USDCG_TOKEN_ADDRESS, gluwaAddress, luniverseAddress], { deployer, initializer: 'initialize' });
    // console.log('Deployed ', instance.address);
    // console.log('Token ' + (await instance.token()));       
  };