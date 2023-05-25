const { Gateway, Wallets, TxEventHandler, GatewayOptions, DefaultEventHandlerStrategies, TxEventHandlerFactory } = require('fabric-network');
const fs = require('fs');
const path = require("path")
const log4js = require('log4js');
const logger = log4js.getLogger('BasicNetwork');
const util = require('util')

const helper = require('./helper');

const invokeTransaction = async (channelName, chaincodeName, fcn, args, createdBy, updatedBy, lasttimestamp, username, org_name) => {
    console.log("args", args)
    console.log("inputs",createdBy, updatedBy, lasttimestamp, username, org_name)
    try {
        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));

        // load the network configuration
        // const ccpPath =path.resolve(__dirname, '..', 'config', 'connection-org1.json');
        // const ccpJSON = fs.readFileSync(ccpPath, 'utf8')
        const ccp = await helper.getCCP(org_name) //JSON.parse(ccpJSON);

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
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



        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
            // transaction: {
            //     strategy: createTransactionEventhandler()
            // }
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        let result
        let message;
        if (chaincodeName === "notarizer") {
            result = await contract.submitTransaction(fcn, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13]);
            message = `Successfully added the car asset with key ${args[0]}`
        } else if (chaincodeName === "circlerateregistry") {
            let transactionArray = []
            for (let i = 0; i < args.length; i++) {

                // result = await contract.submitTransaction(fcn, args[i].District, args[i].Taluka, args[i].Survey_No, args[i].Village, args[i].Land_Type, createdBy, updatedBy, lasttimestamp, args[i].Value, args[i].Category, args[i].Extension);
                // // let transactionId = await result.getTransactionId()
                // message = `Successfully added the asset with key ${args[2]}`

                const transaction = contract.createTransaction(fcn);
                const result = await transaction.submit(args[i].District, args[i].Taluka, args[i].Survey_No, args[i].Village, args[i].Land_Type, createdBy, updatedBy, lasttimestamp, args[i].Value, args[i].Category, args[i].Extension);
                console.log("Result:", result.toString())
                console.log("TxID:", transaction.getTransactionId());
                transactionArray.push(transaction.getTransactionId())
            }
            message = transactionArray

        } else if (chaincodeName === "certificateregistry") {
            result = await contract.submitTransaction(fcn, args[0], args[1], args[2], args[3], args[4], args[5], args[6],args[7],args[8], createdBy, updatedBy, lasttimestamp);
            // message = `Successfully added the certificate with key ${args[2]}`
            console.log("result",result)
            let submitVerifierData = await contract.submitTransaction("storeCertificateKey", args[4], args[5], createdBy, updatedBy, lasttimestamp);
            console.log("submitVerifierData",submitVerifierData)
            message = {
                message: `Successfully added the verifier and certificate data with key ${args[4]}`,
                verifierId: args[4]
            }
        }
        console.log("result====", message)

        await gateway.disconnect();
        console.log("result====", message)
        // result = JSON.parse(result.toString());

        return message



    } catch (error) {

        console.log(`Getting error: ${error}`)
        return error.message

    }
}

exports.invokeTransaction = invokeTransaction;
// let args=["dochash2", "BATCH002", "Block002", "MetaDataHash002", "DocHash002","SROID002","2023","Book1","DocumentType","manoj","test","LastUpdatedTimestamp","Doc_Index_Id","DocSeqNo"]
// invokeTransaction('mychannel', 'notarizer', 'invoke', args, 'admin', 'Org1')
