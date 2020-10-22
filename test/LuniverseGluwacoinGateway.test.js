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
describe('LuniverseGluwacoinGateway', function () {
    const [ deployer, other, another, gluwa, luniverse ] = accounts;
    const [ deployer_privateKey, other_privateKey, another_privateKey ] = privateKeys;

    const amount = new BN('5000');
    const fee = new BN('1');

    const GLUWA_ROLE = web3.utils.soliditySha3('GLUWA_ROLE');
    const GLUWA_ADMIN_ROLE = web3.utils.soliditySha3('GLUWA_ADMIN_ROLE');
    const LUNIVERSE_ROLE = web3.utils.soliditySha3('LUNIVERSE_ROLE');
    const LUNIVERSE_ADMIN_ROLE = web3.utils.soliditySha3('LUNIVERSE_ADMIN_ROLE');

    const unpegTxnHash = '0x2ff883f947eda8a14f54d1e372b8031bb47d721dede68c8934f49f818efe8620';
    const unpegAmount = new BN('1000');

    beforeEach(async function () {
        // Deploy a new ERC20 contract for each test
        this.baseToken = await ERC20PresetMinterPauser.new('Gluwacoin', 'GC', { from: deployer });
        // Deploy a new LuniverseGluwacoinGateway contract for each test
        this.token = await LuniverseGluwacoinGateway.new(this.baseToken.address, gluwa, luniverse, { from: deployer });
    });

    /* token related
    */
    it('token() returns baseToken address', async function () {
        expect(await this.token.token()).to.equal(this.baseToken.address);
    });

    /* role related
    */
    it('gluwa has GLUWA_ROLE', async function () {
        expect(await this.token.hasRole(GLUWA_ROLE, gluwa));
    });

    it('gluwa has GLUWA_ADMIN_ROLE', async function () {
        expect(await this.token.hasRole(GLUWA_ADMIN_ROLE, gluwa));
    });

    it('GLUWA_ADMIN_ROLE can grant GLUWA_ROLE', async function () {
        expect(await this.token.grantRole(GLUWA_ROLE, other, { from: gluwa }));
    });

    it('GLUWA_ADMIN_ROLE can revoke GLUWA_ROLE', async function () {
        await this.token.grantRole(GLUWA_ROLE, other, { from: gluwa });
        expect(await this.token.revokeRole(GLUWA_ROLE, other, { from: gluwa }));
    });

    it('GLUWA_ROLE cannot grant GLUWA_ROLE', async function () {
        await this.token.grantRole(GLUWA_ROLE, other, { from: gluwa });
        await expectRevert(
            this.token.grantRole(GLUWA_ROLE, another, { from: other }),
            'AccessControl: sender must be an admin to grant'
        );
    });

    it('GLUWA_ROLE can renounce GLUWA_ROLE', async function () {
        expect(await this.token.grantRole(GLUWA_ROLE, other, { from: gluwa }));
        expect(await this.token.renounceRole(GLUWA_ROLE, other, { from: other }));
    });

    it('GLUWA_ADMIN_ROLE can renounce GLUWA_ADMIN_ROLE', async function () {
        expect(await this.token.renounceRole(GLUWA_ADMIN_ROLE, gluwa, { from: gluwa }));
    });
    
    it('luniverse has LUNIVERSE_ROLE', async function () {
        expect(await this.token.hasRole(LUNIVERSE_ROLE, luniverse));
    });

    it('luniverse has LUNIVERSE_ADMIN_ROLE', async function () {
        expect(await this.token.hasRole(LUNIVERSE_ADMIN_ROLE, luniverse));
    });

    it('LUNIVERSE_ADMIN_ROLE can grant LUNIVERSE_ROLE', async function () {
        expect(await this.token.grantRole(LUNIVERSE_ROLE, other, { from: luniverse }));
    });

    it('LUNIVERSE_ADMIN_ROLE can revoke LUNIVERSE_ROLE', async function () {
        await this.token.grantRole(LUNIVERSE_ROLE, other, { from: luniverse });
        expect(await this.token.revokeRole(LUNIVERSE_ROLE, other, { from: luniverse }));
    });

    it('LUNIVERSE_ROLE cannot grant LUNIVERSE_ROLE', async function () {
        await this.token.grantRole(LUNIVERSE_ROLE, other, { from: luniverse });
        await expectRevert(
            this.token.grantRole(LUNIVERSE_ROLE, another, { from: other }),
            'AccessControl: sender must be an admin to grant'
        );
    });

    it('LUNIVERSE_ROLE can renounce LUNIVERSE_ROLE', async function () {
        expect(await this.token.grantRole(LUNIVERSE_ROLE, other, { from: luniverse }));
        expect(await this.token.renounceRole(LUNIVERSE_ROLE, other, { from: other }));
    });

    it('LUNIVERSE_ADMIN_ROLE can renounce LUNIVERSE_ADMIN_ROLE', async function () {
        expect(await this.token.renounceRole(LUNIVERSE_ADMIN_ROLE, luniverse, { from: luniverse }));
    });

    /* Unpeggable related
    */
    // unpeg related
    it('Gluwa can unpeg', async function () {
        await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwa });
        expect(await this.token.isUnpegged(unpegTxnHash)).to.be.equal(true);
    });

    it('newly-created Gluwa can unpeg', async function () {
        await this.token.grantRole(GLUWA_ROLE, other, { from: gluwa });
        await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : other });
        expect(await this.token.isUnpegged(unpegTxnHash)).to.be.equal(true);
    });

    it('Luniverse can unpeg', async function () {
        await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : luniverse });
        expect(await this.token.isUnpegged(unpegTxnHash)).to.be.equal(true);
    });

    it('newly-created Luniverse can unpeg', async function () {
        await this.token.grantRole(LUNIVERSE_ROLE, other, { from: luniverse });
        await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : other });
        expect(await this.token.isUnpegged(unpegTxnHash)).to.be.equal(true);
    });

    it('non-Gluwa and non-Luniverse cannot unpeg', async function () {
        await expectRevert(
            this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : another }),
            'Unpeggable: caller does not have the Gluwa role or the Luniverse role'
        );
    });

    // getUnpeg related
    it('Gluwa can get an existing unpeg', async function () {
        await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwa });

        var unpeg = await this.token.getUnpeg(unpegTxnHash, { from : deployer });
        expect(unpeg.amount).to.be.bignumber.equal(unpegAmount);
        expect(unpeg.sender).to.be.bignumber.equal(other);
        expect(!unpeg.gluwaApproved);
        expect(!unpeg.luniverseApproved);
        expect(!unpeg.processed);
    });

    it('other can get an existing unpeg', async function () {
        await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwa });

        var unpeg = await this.token.getUnpeg(unpegTxnHash, { from : other });
        expect(unpeg.amount).to.be.bignumber.equal(unpegAmount);
        expect(unpeg.sender).to.be.bignumber.equal(other);
        expect(!unpeg.gluwaApproved);
        expect(!unpeg.luniverseApproved);
        expect(!unpeg.processed);
    });

    it('cannot get a non-existing unpeg', async function () {
        await expectRevert(
            this.token.getUnpeg(unpegTxnHash, { from : deployer }),
            'Unpeggable: the txnHash is not unpegged'
        );
    });

    // gluwaApprove related
    it('Gluwa can gluwaApprove', async function () {
        await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwa });
        await this.token.gluwaApprove(unpegTxnHash, { from : gluwa });
    });

    it('newly-created Gluwa can gluwaApprove', async function () {
        await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwa });

        await this.token.grantRole(GLUWA_ROLE, other, { from: gluwa });
        await this.token.gluwaApprove(unpegTxnHash, { from : other });
    });

    it('non-Gluwa cannot gluwaApprove', async function () {
        await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwa });

        await expectRevert(
            this.token.gluwaApprove(unpegTxnHash, { from : other }),
            'Unpeggable: caller does not have the Gluwa role'
        );
    });

    it('Luniverse cannot gluwaApprove', async function () {
        await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwa });

        await expectRevert(
            this.token.gluwaApprove(unpegTxnHash, { from : luniverse }),
            'Unpeggable: caller does not have the Gluwa role'
        );
    });

    // luniverseApprove related
    it('Luniverse can luniverseApprove', async function () {
        await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : luniverse });
        await this.token.luniverseApprove(unpegTxnHash, { from : luniverse });
    });

    it('newly-created Luniverse can luniverseApprove', async function () {
        await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwa });

        await this.token.grantRole(LUNIVERSE_ROLE, other, { from: luniverse });
        await this.token.luniverseApprove(unpegTxnHash, { from : other });
    });

    it('non-Luniverse cannot luniverseApprove', async function () {
        await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwa });

        await expectRevert(
            this.token.luniverseApprove(unpegTxnHash, { from : other }),
            'Unpeggable: caller does not have the Luniverse role'
        );
    });

    it('Gluwa cannot luniverseApprove', async function () {
        await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwa });

        await expectRevert(
            this.token.luniverseApprove(unpegTxnHash, { from : gluwa }),
            'Unpeggable: caller does not have the Luniverse role'
        );
    });

    // processUnpeg related
    it('Gluwa can processUnpeg', async function () {
        await this.baseToken.mint(this.token.address, unpegAmount, { from : deployer });

        await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwa });
        await this.token.gluwaApprove(unpegTxnHash, { from : gluwa });
        await this.token.luniverseApprove(unpegTxnHash, { from : luniverse });

        expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');

        await this.token.processUnpeg(unpegTxnHash, { from : gluwa });

        expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal(unpegAmount);
    });

    it('Luniverse can processUnpeg', async function () {
        await this.baseToken.mint(this.token.address, unpegAmount, { from : deployer });

        await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwa });
        await this.token.gluwaApprove(unpegTxnHash, { from : gluwa });
        await this.token.luniverseApprove(unpegTxnHash, { from : luniverse });

        expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');

        await this.token.processUnpeg(unpegTxnHash, { from : luniverse });

        expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal(unpegAmount);
    });

    it('non-Gluwa/non-Luniverse can processUnpeg', async function () {
        await this.baseToken.mint(this.token.address, unpegAmount, { from : deployer });

        await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwa });
        await this.token.gluwaApprove(unpegTxnHash, { from : gluwa });
        await this.token.luniverseApprove(unpegTxnHash, { from : luniverse });

        expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');

        await this.token.processUnpeg(unpegTxnHash, { from : other });

        expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal(unpegAmount);
    });

    // ETHless processUnpeg related
    it('Gluwa can processUnpeg', async function () {
        await this.baseToken.mint(this.token.address, unpegAmount, { from : deployer });

        await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwa });
        await this.token.gluwaApprove(unpegTxnHash, { from : gluwa });
        await this.token.luniverseApprove(unpegTxnHash, { from : luniverse });

        expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');

        var signature = sign.sign(this.token.address, other, other_privateKey, unpegTxnHash, fee);

        await this.token.processUnpeg(unpegTxnHash, other, fee, { from : gluwa });

        expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal(unpegAmount);
    });
});