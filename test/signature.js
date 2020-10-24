var Web3 = require('web3');

var web3 = new Web3(Web3.givenProvider);

module.exports = {
    signApprove: function (contractAddress, sourceAddress, sourcePrivateKey, txnHash) {
        var hash = web3.utils.soliditySha3({ t: 'address', v: contractAddress },
            { t: 'address', v: sourceAddress },
            { t: 'bytes32', v: txnHash });

        var obj = web3.eth.accounts.sign(hash , sourcePrivateKey);

        var signature = obj.signature;

        return signature;
    },
    sign: function (contractAddress, sourceAddress, sourcePrivateKey, txnHash, fee) {
        var hash = web3.utils.soliditySha3({ t: 'address', v: contractAddress },
            { t: 'address', v: sourceAddress },
            { t: 'bytes32', v: txnHash },
            { t: 'uint256', v: fee });

        var obj = web3.eth.accounts.sign(hash , sourcePrivateKey);

        var signature = obj.signature;

        return signature;
    }
};