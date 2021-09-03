// Load dependencies
const { expect } = require('chai');
const { accounts, contract } = require('@openzeppelin/test-environment');
const Web3 = require('web3');
const web3 = new Web3(Web3.givenProvider || "127.0.0.1:7545");
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

// Import utilities from Test Helpers
const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS, MAX_UINT256 } = constants;

// Load compiled artifacts
const ERC20PresetMinterPauser     = artifacts.require('ERC20PresetMinterPauser');
const LuniverseGluwacoinGateway   = artifacts.require('LuniverseGluwacoinGateway');
const LuniverseGluwacoinGatewayV2 = artifacts.require('LuniverseGluwacoinGatewayUpgraded');
const new_variable = "New Variable";
const new_function = "New Function";
const upgraded_function = "token() is replaced";
var sign = require('./signature');
const unpegTxnHash = '0x2ff883f947eda8a14f54d1e372b8031bb47d721dede68c8934f49f818efe8620';
const unpegAmount = new BN('1000');

// Start test block
describe('LuniverseGluwacoinGateway_Upgrade test', function () {

    const GLUWA_ROLE = web3.utils.soliditySha3('GLUWA_ROLE');
    const GLUWA_ADMIN_ROLE = web3.utils.soliditySha3('GLUWA_ADMIN_ROLE');
    const LUNIVERSE_ROLE = web3.utils.soliditySha3('LUNIVERSE_ROLE');
    const LUNIVERSE_ADMIN_ROLE = web3.utils.soliditySha3('LUNIVERSE_ADMIN_ROLE');

    beforeEach(async function () {
        var [ deployer, other, another, gluwaAdmin, luniverseAdmin ] = await web3.eth.getAccounts();
            // Deploy a new ERC20 contract for each test
            this.baseToken  = await deployProxy(ERC20PresetMinterPauser,
                ['Gluwacoin', 'GC'], { from: deployer });
    
            // Deploy a new LuniverseGluwacoinGateway contract for each test
            this.token = await deployProxy(
                LuniverseGluwacoinGateway,
                [this.baseToken.address, gluwaAdmin, luniverseAdmin],
                { from: deployer, unsafeAllowCustomTypes: true, initializer: 'initialize' }
            );
    });
    // it('Gateway is initialized after upgraded', async function () {
    //     var [ deployer, other, another, gluwaAdmin, luniverseAdmin ] = await web3.eth.getAccounts();
    //     const newToken = await upgradeProxy(
    //         this.token.address, LuniverseGluwacoinGatewayV2,
    //     { from: deployer, initializer: 'initialize' });
    //     expect(await newToken.token()).to.be.equal(this.baseToken.address);
    // });
    it('Gluwa can unpeg', async function () {
        var [ deployer, other, another, gluwaAdmin, luniverseAdmin ] = await web3.eth.getAccounts();
        await this.token.unpeg(unpegTxnHash, unpegAmount, gluwaAdmin, { from : gluwaAdmin });
        expect(await this.token.isUnpegged(unpegTxnHash)).to.be.equal(true);
    });
    it('GluwaAdmin has role', async function () {
        var [ deployer, other, another, gluwaAdmin, luniverseAdmin ] = await web3.eth.getAccounts();
        const newToken = await upgradeProxy(
            this.token.address, LuniverseGluwacoinGatewayV2,
            { from: deployer, initializer: 'initialize' });
            expect(await newToken.hasRole(GLUWA_ROLE, gluwaAdmin));
        });
    it('Gluwa can unpeg after upgrade', async function () {
        var [ deployer, other, another, gluwaAdmin, luniverseAdmin ] = await web3.eth.getAccounts();
        const newToken = await upgradeProxy(
            this.token.address, LuniverseGluwacoinGatewayV2,
            [this.baseToken.address, gluwaAdmin, luniverseAdmin], { from: deployer, initializer: 'initialize' });

        await newToken.unpeg(unpegTxnHash, unpegAmount, other, {from: gluwaAdmin});
        expect(await newToken.isUnpegged(unpegTxnHash)).to.be.equal(true);
    });

    it('add new variable after upgraded', async function () {
        var [ deployer, other, another, gluwaAdmin, luniverseAdmin ] = await web3.eth.getAccounts();

        const newToken = await upgradeProxy(
            this.token.address, LuniverseGluwacoinGatewayV2, { from: deployer });

        expect(await newToken.NEW_VARIABLE()).to.equal(new_variable);
       
    });
    
    it('add new function after upgraded', async function () {
        var [ deployer, other, another, gluwaAdmin, luniverseAdmin ] = await web3.eth.getAccounts();

        const newToken = await upgradeProxy(
            this.token.address, LuniverseGluwacoinGatewayV2, { from: deployer });

        expect(await newToken._newFunction()).to.equal(new_function);
    });
    
   
    it('Can initialize after upgrade', async function () {
        var [ deployer, other, another, gluwaAdmin, luniverseAdmin ] = await web3.eth.getAccounts();

        const newToken = await upgradeProxy(
            this.token.address, LuniverseGluwacoinGatewayV2, 
             { from: deployer,initializer: 'initialize' });
        await newToken.initialize(this.baseToken.address, gluwaAdmin, luniverseAdmin);
        expect(await newToken.hasRole(GLUWA_ROLE, gluwaAdmin));
    });
 it('token() is replaced after upgraded', async function () {
    var [ deployer, other, another, gluwaAdmin, luniverseAdmin ] = await web3.eth.getAccounts();

        const newToken = await upgradeProxy(
            this.token.address, LuniverseGluwacoinGatewayV2, { from: deployer });

        expect(await newToken.token()).to.equal(upgraded_function);
    });
});

