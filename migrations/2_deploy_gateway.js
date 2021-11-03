const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const LuniverseGluwacoinGateway = artifacts.require('LuniverseGluwacoinGateway');
var USDCG_TOKEN_ADDRESS = "";
var gluwaAddress = "";
var luniverseAddress = "";

var skip = false;

module.exports = async function (deployer, network) {
    switch (network) {
        case "rinkeby": {
            USDCG_TOKEN_ADDRESS = "0x0aD1439A0e0bFdcD49939f9722866651a4AA9B3C";
            gluwaAddress = "0x928ef75709Ea7e8D112ed63B5c041Dd9493F8448";
            luniverseAddress = "0x697c720a3de7b4308f79d648b352c07b6d6a0b5b";
            break;
        }

        case "mainnet":
            {
                USDCG_TOKEN_ADDRESS = "0x1b9c206cf3df47c3b04941539b07f5784cbdde42";
                gluwaAddress = "0x8cDFCaAD5df8A24f983882BaF461F33e1bC24000";
                luniverseAddress = "0x8cDFCaAD5df8A24f983882BaF461F33e1bC24000";
                break;
            }

        default:
            {
                skip = true;
                break;
            }

    }
    if (!skip) {
        const instance = await deployProxy(LuniverseGluwacoinGateway, [USDCG_TOKEN_ADDRESS, gluwaAddress, luniverseAddress], { deployer, initializer: 'initialize' });
        console.log('Deployed ', instance.address);
        console.log('Token ' + (await instance.token()));
    }
};
