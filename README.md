# Luniverse-Gluwacoin-Gateway
2-Way Peg Gluwacoin Gateway between the Ethereum network and the Luniverse

A Gluwacoin user can peg by transferring Gluwacoin to the contract's address.
Once pegged, the user will submit the transactionHash of the transfer to gatekeepers to verify the peg.
Gluwa and Luniverse serve as gatekeepers of the gateway.
Once both gatekeepers approve your peg,
a gatekeeper can mint corresponding Gluwacoins on Luniverse.
To withdraw your Luniverse Gluwacoin,
burn them and request gatekeepers to verify your burn by submitting its transactionHash.
Gatekeepers will verify that you destroyed Luniverse GLuwacoin,
and release the equivalent amount of Gluwacoin from the gateway to your address.
