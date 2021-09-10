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

describe('LuniverseGluwacoinGateway_Unpeggable', function () {
    const [ deployer, other, another, gluwaAdmin, luniverseAdmin ] = accounts;
    const [ deployer_privateKey, other_privateKey, another_privateKey, gluwaAdmin_privateKey, luniverseAdmin_privateKey ] = privateKeys;

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
        this.token = await LuniverseGluwacoinGateway.new(this.baseToken.address, gluwaAdmin, luniverseAdmin, { from: deployer });
    });

    /* Unpeggable related
    */
    // unpeg related
    describe('unpeg test', async function () {
        it('Gluwa can unpeg', async function () {
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
            expect(await this.token.isUnpegged(unpegTxnHash)).to.be.equal(true);
        });
    
        it('newly-created Gluwa can unpeg', async function () {
            await this.token.grantRole(GLUWA_ROLE, other, { from: gluwaAdmin });
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : other });
            expect(await this.token.isUnpegged(unpegTxnHash)).to.be.equal(true);
        });
    
        it('Luniverse can unpeg', async function () {
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : luniverseAdmin });
            expect(await this.token.isUnpegged(unpegTxnHash)).to.be.equal(true);
        });
    
        it('newly-created Luniverse can unpeg', async function () {
            await this.token.grantRole(LUNIVERSE_ROLE, other, { from: luniverseAdmin });
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : other });
            expect(await this.token.isUnpegged(unpegTxnHash)).to.be.equal(true);
        });
    
        it('non-Gluwa and non-Luniverse cannot unpeg', async function () {
            await expectRevert(
                this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : another }),
                'Unpeggable: caller does not have the Gluwa role or the Luniverse role'
            );
        });
    });

    // getUnpeg related
    describe('getUnpeg test', async function () {
        it('GluwaAdmin can get an existing unpeg', async function () {
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
    
            var unpeg = await this.token.getUnpeg(unpegTxnHash, { from : deployer });
            expect(unpeg.amount).to.be.bignumber.equal(unpegAmount);
            expect(unpeg.sender).to.be.bignumber.equal(other);
            expect(!unpeg.gluwaApproved);
            expect(!unpeg.luniverseApproved);
            expect(!unpeg.processed);
        });
    
        it('other can get an existing unpeg', async function () {
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
    
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
    });

    // gluwaApprove related
    describe('gluwaApprove test', async function () {
        // role related
        it('GluwaAdmin can gluwaApprove', async function () {
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
            await this.token.methods['gluwaApprove(bytes32)'](unpegTxnHash, { from : gluwaAdmin });
        });
    
        it('newly-created Gluwa can gluwaApprove', async function () {
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
    
            await this.token.grantRole(GLUWA_ROLE, other, { from: gluwaAdmin });
            await this.token.methods['gluwaApprove(bytes32)'](unpegTxnHash, { from : other });

            var unpeg = await this.token.getUnpeg(unpegTxnHash, { from : other });
            expect(unpeg.amount).to.be.bignumber.equal(unpegAmount);
            expect(unpeg.sender).to.be.bignumber.equal(other);
            expect(unpeg.gluwaApproved);
            expect(!unpeg.luniverseApproved);
            expect(!unpeg.processed);
        });
    
        it('non-Gluwa cannot gluwaApprove', async function () {
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
    
            await expectRevert(
                this.token.methods['gluwaApprove(bytes32)'](unpegTxnHash, { from : other }),
                'Unpeggable: caller does not have the Gluwa role'
            );
        });
    
        it('Luniverse cannot gluwaApprove', async function () {
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
    
            await expectRevert(
                this.token.methods['gluwaApprove(bytes32)'](unpegTxnHash, { from : luniverseAdmin }),
                'Unpeggable: caller does not have the Gluwa role'
            );
        });

        it('Gluwa cannot gluwaApprove non-existing unpeg', async function () {
            await expectRevert(
                this.token.methods['gluwaApprove(bytes32)'](unpegTxnHash, { from : gluwaAdmin }),
                'Unpeggable: the txnHash is not unpegged'
            );
        });
    });

    // ETHless gluwaApprove related
    describe('gluwaApprove ETHless test', async function () {
        it('non-Gluwa can ETHless gluwaApprove', async function () {
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });

            var sig = sign.signApprove(this.token.address, gluwaAdmin, gluwaAdmin_privateKey, unpegTxnHash);
            await this.token.gluwaApprove(unpegTxnHash, gluwaAdmin, sig, { from : another });

            var unpeg = await this.token.getUnpeg(unpegTxnHash, { from : other });
            expect(unpeg.gluwaApproved);
        });

        it('cannot ETHless gluwaApprove with a signature of a non-Gluwa', async function () {
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });

            var sig = sign.signApprove(this.token.address, another, another_privateKey, unpegTxnHash);

            await expectRevert(
                this.token.gluwaApprove(unpegTxnHash, another, sig, { from : other }),
                'Unpeggable: approver does not have the Gluwa role'
            );
        });

        it('Gluwa cannot ETHless gluwaApprove with a signature of a non-Gluwa', async function () {
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });

            var sig = sign.signApprove(this.token.address, another, another_privateKey, unpegTxnHash);

            await expectRevert(
                this.token.gluwaApprove(unpegTxnHash, another, sig, { from : gluwaAdmin }),
                'Unpeggable: approver does not have the Gluwa role'
            );
        });

        it('Gluwa cannot ETHless gluwaApprove non-existing unpeg', async function () {
            var sig = sign.signApprove(this.token.address, gluwaAdmin, gluwaAdmin_privateKey, unpegTxnHash);
            await expectRevert(
                this.token.gluwaApprove(unpegTxnHash, gluwaAdmin, sig, { from : gluwaAdmin }),
                'Unpeggable: the txnHash is not unpegged'
            );
        });
    });

    // luniverseApprove related
    describe('luniverseApprove test', async function () {
        it('LuniverseAdmin can luniverseApprove', async function () {
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : luniverseAdmin });
            await this.token.methods['luniverseApprove(bytes32)'](unpegTxnHash, { from : luniverseAdmin });

            var unpeg = await this.token.getUnpeg(unpegTxnHash, { from : other });
            expect(unpeg.amount).to.be.bignumber.equal(unpegAmount);
            expect(unpeg.sender).to.be.bignumber.equal(other);
            expect(!unpeg.gluwaApproved);
            expect(unpeg.luniverseApproved);
            expect(!unpeg.processed);
        });
    
        it('newly-created Luniverse can luniverseApprove', async function () {
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
    
            await this.token.grantRole(LUNIVERSE_ROLE, other, { from: luniverseAdmin });
            await this.token.methods['luniverseApprove(bytes32)'](unpegTxnHash, { from : other });
        });
    
        it('non-Luniverse cannot luniverseApprove', async function () {
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
    
            await expectRevert(
                this.token.methods['luniverseApprove(bytes32)'](unpegTxnHash, { from : other }),
                'Unpeggable: caller does not have the Luniverse role'
            );
        });
    
        it('Gluwa cannot luniverseApprove', async function () {
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
    
            await expectRevert(
                this.token.methods['luniverseApprove(bytes32)'](unpegTxnHash, { from : gluwaAdmin }),
                'Unpeggable: caller does not have the Luniverse role'
            );
        });

        it('Luniverse cannot luniverseApprove non-existing unpeg', async function () {
            await expectRevert(
                this.token.methods['luniverseApprove(bytes32)'](unpegTxnHash, { from : gluwaAdmin }),
                'Unpeggable: the txnHash is not unpegged'
            );
        });
    });

    // ETHless luniverseApprove related
    describe('luniverseApprove ETHless test', async function () {
        it('non-Luniverse can ETHless luniverseApprove', async function () {
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });

            var sig = sign.signApprove(this.token.address, luniverseAdmin, luniverseAdmin_privateKey, unpegTxnHash);
            await this.token.methods['luniverseApprove(bytes32,address,bytes)'](unpegTxnHash,luniverseAdmin,sig, { from : another });

            var unpeg = await this.token.getUnpeg(unpegTxnHash, { from : other });
            expect(unpeg.luniverseApproved);
        });

        it('cannot ETHless luniverseApprove with a signature of a non-Luniverse', async function () {
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });

            var sig = sign.signApprove(this.token.address, another, another_privateKey, unpegTxnHash);

            await expectRevert(
                this.token.methods['luniverseApprove(bytes32,address,bytes)'](unpegTxnHash,another,sig, { from : another }),
                'Unpeggable: approver does not have the Luniverse role'
            );
        });

        it('Luniverse cannot ETHless luniverseApprove with a signature of a non-Gluwa', async function () {
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });

            var sig = sign.signApprove(this.token.address, another, another_privateKey, unpegTxnHash);

            await expectRevert(
                this.token.methods['luniverseApprove(bytes32,address,bytes)'](unpegTxnHash,another,sig, { from : luniverseAdmin }),
                'Unpeggable: approver does not have the Luniverse role'
            );
        });

        it('Luniverse cannot ETHless luniverseApprove non-existing unpeg', async function () {
            var sig = sign.signApprove(this.token.address, luniverseAdmin, luniverseAdmin_privateKey, unpegTxnHash);
            await expectRevert(
                this.token.methods['luniverseApprove(bytes32,address,bytes)'](unpegTxnHash,luniverseAdmin,sig, { from : luniverseAdmin }),
                'Unpeggable: the txnHash is not unpegged'
            );
        });
    });
    
    // processUnpeg related
    describe('processUnpeg test', async function () {
        const invalidUnpegTxnHash = "dummy";
        
        it('Gluwa can processUnpeg', async function () {
            await this.baseToken.mint(this.token.address, unpegAmount, { from : deployer });
    
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
            await this.token.methods['gluwaApprove(bytes32)'](unpegTxnHash, { from : gluwaAdmin });
            await this.token.methods['luniverseApprove(bytes32)'](unpegTxnHash, { from : luniverseAdmin });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
    
            await this.token.methods['processUnpeg(bytes32)'](unpegTxnHash, { from : gluwaAdmin });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal(unpegAmount);
        });
    
        it('Luniverse can processUnpeg', async function () {
            await this.baseToken.mint(this.token.address, unpegAmount, { from : deployer });
    
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
            await this.token.methods['gluwaApprove(bytes32)'](unpegTxnHash, { from : gluwaAdmin });
            await this.token.methods['luniverseApprove(bytes32)'](unpegTxnHash, { from : luniverseAdmin });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
    
            await this.token.methods['processUnpeg(bytes32)'](unpegTxnHash, { from : luniverseAdmin });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal(unpegAmount);
        });
    
        it('non-Gluwa/non-Luniverse can processUnpeg', async function () {
            await this.baseToken.mint(this.token.address, unpegAmount, { from : deployer });
    
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
            await this.token.methods['gluwaApprove(bytes32)'](unpegTxnHash, { from : gluwaAdmin });
            await this.token.methods['luniverseApprove(bytes32)'](unpegTxnHash, { from : luniverseAdmin });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
    
            await this.token.methods['processUnpeg(bytes32)'](unpegTxnHash, { from : another });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal(unpegAmount);
        });
    
        it('non-Gluwa/non-Luniverse cannot processUnpeg when not Gluwa approved', async function () {
            await this.baseToken.mint(this.token.address, unpegAmount, { from : deployer });
    
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
            await this.token.methods['luniverseApprove(bytes32)'](unpegTxnHash, { from : luniverseAdmin });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
    
            await expectRevert(
                this.token.methods['processUnpeg(bytes32)'](unpegTxnHash, { from : other }),
                'Unpeggable: the txnHash is not Gluwa Approved'
            );
        });
    
        it('non-Gluwa/non-Luniverse cannot processUnpeg when not Luniverse approved', async function () {
            await this.baseToken.mint(this.token.address, unpegAmount, { from : deployer });
    
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
            await this.token.methods['gluwaApprove(bytes32)'](unpegTxnHash, { from : gluwaAdmin });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
    
            await expectRevert(
                this.token.methods['processUnpeg(bytes32)'](unpegTxnHash, { from : other }),
                'Unpeggable: the txnHash is not Luniverse Approved'
            );
        });
    
        it('non-Gluwa/non-Luniverse cannot processUnpeg when already processed', async function () {
            await this.baseToken.mint(this.token.address, unpegAmount, { from : deployer });
    
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
            await this.token.methods['gluwaApprove(bytes32)'](unpegTxnHash, { from : gluwaAdmin });
            await this.token.methods['luniverseApprove(bytes32)'](unpegTxnHash, { from : luniverseAdmin });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
    
            await this.token.methods['processUnpeg(bytes32)'](unpegTxnHash, { from : other });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal(unpegAmount);
    
            await expectRevert(
                this.token.methods['processUnpeg(bytes32)'](unpegTxnHash, { from : other }),
                'Unpeggable: the txnHash is already processed'
            );
        });

        it('cannot processUnpeg with invalid unpegTxnHash', async function () {
            await this.baseToken.mint(this.token.address, unpegAmount, { from : deployer });
    
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
            await this.token.methods['gluwaApprove(bytes32)'](unpegTxnHash, { from : gluwaAdmin });
            await this.token.methods['luniverseApprove(bytes32)'](unpegTxnHash, { from : luniverseAdmin });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
    
            await expectRevert(
                this.token.methods['processUnpeg(bytes32)'](invalidUnpegTxnHash, { from : other }),
                'invalid arrayify value'
            );
        });
    });
    
    // ETHless processUnpeg related
    describe('processUnpeg ETHless test', async function () {

        const invalidUnpegTxnHash = "dummy";

        beforeEach(async function () {
            await this.baseToken.mint(this.token.address, unpegAmount, { from : deployer });
        });

        it('Gluwa can processUnpeg', async function () {
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
            await this.token.methods['gluwaApprove(bytes32)'](unpegTxnHash, { from : gluwaAdmin });
            await this.token.methods['luniverseApprove(bytes32)'](unpegTxnHash, { from : luniverseAdmin });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
    
            var signature = sign.sign(this.token.address, other, other_privateKey, unpegTxnHash, fee);
    
            await this.token.processUnpeg(unpegTxnHash, other, fee, signature, { from : gluwaAdmin });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal(unpegAmount.sub(fee));
            expect(await this.baseToken.balanceOf(gluwaAdmin)).to.be.bignumber.equal(fee);
        });
    
        it('Luniverse cannot processUnpeg', async function () {
    
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
            await this.token.methods['gluwaApprove(bytes32)'](unpegTxnHash, { from : gluwaAdmin });
            await this.token.methods['luniverseApprove(bytes32)'](unpegTxnHash, { from : luniverseAdmin });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
    
            var signature = sign.sign(this.token.address, other, other_privateKey, unpegTxnHash, fee);
    
            await expectRevert(
                this.token.processUnpeg(unpegTxnHash, other, fee, signature, { from : luniverseAdmin }),
                'Unpeggable: caller does not have the Gluwa role'
            );
        });
    
        it('non-Gluwa cannot processUnpeg', async function () {            
    
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
            await this.token.methods['gluwaApprove(bytes32)'](unpegTxnHash, { from : gluwaAdmin });
            await this.token.methods['luniverseApprove(bytes32)'](unpegTxnHash, { from : luniverseAdmin });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
    
            var signature = sign.sign(this.token.address, other, other_privateKey, unpegTxnHash, fee);
    
            await expectRevert(
                this.token.processUnpeg(unpegTxnHash, other, fee, signature, { from : other }),
                'Unpeggable: caller does not have the Gluwa role'
            );
        });
    
        it('Gluwa cannot processUnpeg when not Gluwa approved', async function () {
    
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
            await this.token.methods['luniverseApprove(bytes32)'](unpegTxnHash, { from : luniverseAdmin });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
    
            var signature = sign.sign(this.token.address, other, other_privateKey, unpegTxnHash, fee);
    
            await expectRevert(
                this.token.processUnpeg(unpegTxnHash, other, fee, signature, { from : gluwaAdmin }),
                'Unpeggable: the txnHash is not Gluwa Approved'
            );
        });
    
        it('Gluwa cannot processUnpeg when not Luniverse approved', async function () {
    
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
            await this.token.methods['gluwaApprove(bytes32)'](unpegTxnHash, { from : gluwaAdmin });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
    
            var signature = sign.sign(this.token.address, other, other_privateKey, unpegTxnHash, fee);
    
            await expectRevert(
                this.token.processUnpeg(unpegTxnHash, other, fee, signature, { from : gluwaAdmin }),
                'Unpeggable: the txnHash is not Luniverse Approved'
            );
        });
    
        it('Gluwa cannot processUnpeg when already processed', async function () {

            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
            await this.token.methods['gluwaApprove(bytes32)'](unpegTxnHash, { from : gluwaAdmin });
            await this.token.methods['luniverseApprove(bytes32)'](unpegTxnHash, { from : luniverseAdmin });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
    
            var signature = sign.sign(this.token.address, other, other_privateKey, unpegTxnHash, fee);
    
            await this.token.processUnpeg(unpegTxnHash, other, fee, signature, { from : gluwaAdmin });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal(unpegAmount.sub(fee));
            expect(await this.baseToken.balanceOf(gluwaAdmin)).to.be.bignumber.equal(fee);
    
            await expectRevert(
                this.token.processUnpeg(unpegTxnHash, other, fee, signature, { from : gluwaAdmin }),
                'Unpeggable: the txnHash is already processed'
            );
        });

        it('Gluwa cannot processUnpeg random 32bytes', async function () {
            var signature = sign.sign(this.token.address, other, other_privateKey, unpegTxnHash, fee);
    
            await expectRevert(
                this.token.processUnpeg(unpegTxnHash, other, fee, signature, { from : gluwaAdmin }),
                "Unpeggable: the txnHash is not unpegged"
            );
        });

        it('cannot processUnpeg with invalid unpegTxnHash', async function () {
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
    
            var signature = sign.sign(this.token.address, other, other_privateKey, invalidUnpegTxnHash, fee);

            await expectRevert(
                this.token.processUnpeg(invalidUnpegTxnHash, other, fee, signature, { from : gluwaAdmin }),
                "invalid arrayify value"
            );
        });

        it('cannot processUnpeg with invalid signature', async function () {
            await this.token.unpeg(unpegTxnHash, unpegAmount, other, { from : gluwaAdmin });
            await this.token.methods['gluwaApprove(bytes32)'](unpegTxnHash, { from : gluwaAdmin });
            await this.token.methods['luniverseApprove(bytes32)'](unpegTxnHash, { from : luniverseAdmin });
    
            expect(await this.baseToken.balanceOf(other)).to.be.bignumber.equal('0');
            var dummy_fee = new BN('2');
            var signature = sign.sign(this.token.address, other, other_privateKey, unpegTxnHash, dummy_fee);
    
            await expectRevert(
                this.token.processUnpeg(unpegTxnHash, other, fee, signature, { from : gluwaAdmin }),
                'Validate: invalid signature'
            );
        });
    });
});