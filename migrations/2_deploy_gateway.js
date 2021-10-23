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
            gluwaAddress = "0xd9d097435E7CF8e663CcB26daB9C31A7F2B64ab4";
            luniverseAddress = "0xd9d097435E7CF8e663CcB26daB9C31A7F2B64ab4";
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