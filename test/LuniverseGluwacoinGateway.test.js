// Load dependencies
const { expect } = require('chai');
const { accounts, privateKeys, contract, web3 } = require('@openzeppelin/test-environment');

// Import utilities from Test Helpers
const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS, MAX_UINT256 } = constants;

// Load compiled artifacts
const ERC20PresetMinterPauser = contract.fromArtifact('ERC20PresetMinterPauserMockUpgradeSafe');
const LuniverseGluwacoinGateway = contract.fromArtifact('LuniverseGluwacoinGatewayMock');

var sign = require('./signature');

// Start test block
describe('LuniverseGluwacoinGateway_TokenAndRole', function () {

    const [ deployer, other, another, gluwaAdmin, luniverseAdmin ] = accounts;
    const [ deployer_privateKey, other_privateKey, another_privateKey ] = privateKeys;

    const GLUWA_ROLE = web3.utils.soliditySha3('GLUWA_ROLE');
    const GLUWA_ADMIN_ROLE = web3.utils.soliditySha3('GLUWA_ADMIN_ROLE');
    const LUNIVERSE_ROLE = web3.utils.soliditySha3('LUNIVERSE_ROLE');
    const LUNIVERSE_ADMIN_ROLE = web3.utils.soliditySha3('LUNIVERSE_ADMIN_ROLE');

    beforeEach(async function () {
        // Deploy a new ERC20 contract for each test
        this.baseToken = await ERC20PresetMinterPauser.new('Gluwacoin', 'GC', { from: deployer });
        // Deploy a new LuniverseGluwacoinGateway contract for each test
        this.token = await LuniverseGluwacoinGateway.new(this.baseToken.address, gluwaAdmin, luniverseAdmin, { from: deployer });
    });

    /* token related
    */
    it('token() returns baseToken address', async function () {
        expect(await this.token.token()).to.equal(this.baseToken.address);
    });

    /* role related
    */
    it('gluwa has GLUWA_ROLE', async function () {
        expect(await this.token.hasRole(GLUWA_ROLE, gluwaAdmin));
    });

    it('gluwa has GLUWA_ADMIN_ROLE', async function () {
        expect(await this.token.hasRole(GLUWA_ADMIN_ROLE, gluwaAdmin));
    });

    it('GLUWA_ADMIN_ROLE can grant GLUWA_ROLE', async function () {
        expect(await this.token.grantRole(GLUWA_ROLE, other, { from: gluwaAdmin }));
    });

    it('GLUWA_ADMIN_ROLE can revoke GLUWA_ROLE', async function () {
        await this.token.grantRole(GLUWA_ROLE, other, { from: gluwaAdmin });
        expect(await this.token.revokeRole(GLUWA_ROLE, other, { from: gluwaAdmin }));
    });

    it('GLUWA_ROLE cannot grant GLUWA_ROLE', async function () {
        await this.token.grantRole(GLUWA_ROLE, other, { from: gluwaAdmin });
        await expectRevert(
            this.token.grantRole(GLUWA_ROLE, another, { from: other }),
            'AccessControl: sender must be an admin to grant'
        );
    });

    it('non-gluwa cannot grant GLUWA_ROLE', async function () {
        await expectRevert(
            this.token.grantRole(GLUWA_ROLE, another, { from: other }),
            'AccessControl: sender must be an admin to grant'
        );
    });

    it('GLUWA_ROLE can renounce GLUWA_ROLE', async function () {
        expect(await this.token.grantRole(GLUWA_ROLE, other, { from: gluwaAdmin }));
        expect(await this.token.renounceRole(GLUWA_ROLE, other, { from: other }));
    });

    it('GLUWA_ADMIN_ROLE can renounce GLUWA_ADMIN_ROLE', async function () {
        expect(await this.token.renounceRole(GLUWA_ADMIN_ROLE, gluwaAdmin, { from: gluwaAdmin }));
    });
    
    it('luniverse has LUNIVERSE_ROLE', async function () {
        expect(await this.token.hasRole(LUNIVERSE_ROLE, luniverseAdmin));
    });

    it('luniverse has LUNIVERSE_ADMIN_ROLE', async function () {
        expect(await this.token.hasRole(LUNIVERSE_ADMIN_ROLE, luniverseAdmin));
    });

    it('LUNIVERSE_ADMIN_ROLE can grant LUNIVERSE_ROLE', async function () {
        expect(await this.token.grantRole(LUNIVERSE_ROLE, other, { from: luniverseAdmin }));
    });

    it('LUNIVERSE_ADMIN_ROLE can revoke LUNIVERSE_ROLE', async function () {
        await this.token.grantRole(LUNIVERSE_ROLE, other, { from: luniverseAdmin });
        expect(await this.token.revokeRole(LUNIVERSE_ROLE, other, { from: luniverseAdmin }));
    });

    it('LUNIVERSE_ROLE cannot grant LUNIVERSE_ROLE', async function () {
        await this.token.grantRole(LUNIVERSE_ROLE, other, { from: luniverseAdmin });
        await expectRevert(
            this.token.grantRole(LUNIVERSE_ROLE, another, { from: other }),
            'AccessControl: sender must be an admin to grant'
        );
    });

    it('non-luniverse cannot grant GLUWA_ROLE', async function () {
        await expectRevert(
            this.token.grantRole(LUNIVERSE_ROLE, another, { from: other }),
            'AccessControl: sender must be an admin to grant'
        );
    });

    it('LUNIVERSE_ROLE can renounce LUNIVERSE_ROLE', async function () {
        expect(await this.token.grantRole(LUNIVERSE_ROLE, other, { from: luniverseAdmin }));
        expect(await this.token.renounceRole(LUNIVERSE_ROLE, other, { from: other }));
    });

    it('LUNIVERSE_ADMIN_ROLE can renounce LUNIVERSE_ADMIN_ROLE', async function () {
        expect(await this.token.renounceRole(LUNIVERSE_ADMIN_ROLE, luniverseAdmin, { from: luniverseAdmin }));
    });
});
