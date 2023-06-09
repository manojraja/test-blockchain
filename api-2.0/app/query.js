const { Gateway, Wallets, } = require('fabric-network');
const fs = require('fs');
const path = require("path")
const log4js = require('log4js');
const logger = log4js.getLogger('BasicNetwork');
const util = require('util')


const helper = require('./helper')
const query = async (channelName, chaincodeName, args, fcn, username, org_name) => {

    try {

        // load the network configuration
        // const ccpPath = path.resolve(__dirname, '..', 'config', 'connection-org1.json');
        // const ccpJSON = fs.readFileSync(ccpPath, 'utf8')
        const ccp = await helper.getCCP(org_name) //JSON.parse(ccpJSON);

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true }
        });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName);
        let result;
        if (chaincodeName === "circlerteregistry") {
            let resultArray = []
            if (args.length < 1) {
                result = await contract.evaluateTransaction(fcn, args[0]);
                result = JSON.parse(result.toString());
                return result
            } else {
                for (let i = 0; i < args.length; i++) {
                    result = await contract.evaluateTransaction(fcn, args[i].Survey_No);
                    result = JSON.parse(result.toString());
                    resultArray.push(result)
                }
                return resultArray
            }
        } else if (chaincodeName === "certificateregistry") {
            console.log("args",args, "length", args.length)
            if (fcn==="queryCertificateData") {
                let getCert = await contract.evaluateTransaction(fcn, args[0]);
                let certData = JSON.parse(getCert.toString());
                if(certData){
                    result = await contract.evaluateTransaction(fcn, certData.CertificateId);
                    result = JSON.parse(result.toString());
                    return result
                }else{
                    return {
                        result:"no data found"
                    }
                }
            
            }else{
                result = await contract.evaluateTransaction(fcn);
                result = JSON.parse(result.toString());
                return result
            }
        }

    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        return error.message

    }
}

exports.query = query
// let args=['Block001']
// query('mychannel', 'notarizer', args, 'queryNotarizer', 'admin', 'Org1')