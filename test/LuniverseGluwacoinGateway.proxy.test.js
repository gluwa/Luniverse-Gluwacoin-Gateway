// Load dependencies
const { expect } = require('chai');
const { accounts, privateKeys, contract, web3 } = require('@openzeppelin/test-environment');
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

// Import utilities from Test Helpers
const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS, MAX_UINT256 } = constants;

// Load compiled artifacts
const ERC20PresetMinterPauser     = contract.fromArtifact('ERC20PresetMinterPauserMockUpgradeSafe');
const LuniverseGluwacoinGateway   = artifacts.require('LuniverseGluwacoinGateway');
const LuniverseGluwacoinGatewayV2 = artifacts.require('LuniverseGluwacoinGatewayUpgraded');
const new_variable = "New Variable";
const new_function = "New Function";
const upgraded_function = "token() is replaced";
var sign = require('./signature');

// Start test block
describe('LuniverseGluwacoinGateway_Upgrade test', function () {
    const [ deployer, other, another, gluwaAdmin, luniverseAdmin ] = accounts;
    const [ deployer_privateKey, other_privateKey, another_privateKey ] = privateKeys;

    beforeEach(async function () {
        // Deploy a new ERC20 contract for each test
        this.baseToken  = await ERC20PresetMinterPauser.new('Gluwacoin', 'GC', { from: deployer });

        // Deploy a new LuniverseGluwacoinGateway contract for each test
        this.token = await deployProxy(
            LuniverseGluwacoinGateway,
            [this.baseToken.address, gluwaAdmin, luniverseAdmin],
            { from: deployer, unsafeAllowCustomTypes: true, initializer: 'initialize' }
        );
    });


    it('add new variable after upgraded', async function () {

        const newToken = await upgradeProxy(
            this.token.address, LuniverseGluwacoinGatewayV2, { from: deployer });

        expect(await newToken.NEW_VARIABLE()).to.equal(new_variable);
       
    });
    
    it('add new function after upgraded', async function () {

        const newToken = await upgradeProxy(
            this.token.address, LuniverseGluwacoinGatewayV2, { from: deployer });

        expect(await newToken._newFunction()).to.equal(new_function);
    });
    
    it('token() is replaced after upgraded', async function () {

        const newToken = await upgradeProxy(
            this.token.address, LuniverseGluwacoinGatewayV2, { from: deployer });

        expect(await newToken.token()).to.equal(upgraded_function);
    });
});
