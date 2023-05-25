'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('BasicNetwork');
const bodyParser = require('body-parser');
const http = require('http')
const util = require('util');
const express = require('express')
const app = express();
const { expressjwt: jwtToken } = require('express-jwt');
const jwt = require('jsonwebtoken');
const bearerToken = require('express-bearer-token');
const cors = require('cors');
const constants = require('./config/constants.json')
const crypto = require('crypto');
const XLSX = require("xlsx");
const _ = require("underscore")
const host = process.env.HOST || constants.host;
const port = process.env.PORT || constants.port;
const moment = require("moment")
const multer = require("multer")
const fs = require("fs")
const uniqid = require('uniqid');
const helper = require('./app/helper')
const invoke = require('./app/invoke')
const qscc = require('./app/qscc')
const {
    v1: uuidv1,
    v4: uuidv4,
} = require('uuid');
const query = require('./app/query')
const sendMail = require('./utils/mailServer')

app.options('*', cors());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
// set secret variable
app.set('secret', 'thisismysecret');

app.use(bearerToken());

logger.level = 'debug';

const upload = multer({ dest: "uploads/" });







var server = http.createServer(app).listen(port, function () { console.log(`Server started on ${port}`) });
logger.info('****************** SERVER STARTED ************************');
logger.info('***************  http://%s:%s  ******************', host, port);
server.timeout = 240000;

function getErrorMessage(field) {
    var response = {
        success: false,
        message: field + ' field is missing or Invalid in the request'
    };
    return response;
}

// Register and enroll user
app.post('/users', async function (req, res) {
    var username = req.body.username;
    var orgName = req.body.orgName;
    logger.debug('End point : /users');
    logger.debug('User name : ' + username);
    logger.debug('Org name  : ' + orgName);
    if (!username) {
        res.json(getErrorMessage('\'username\''));
        return;
    }
    if (!orgName) {
        res.json(getErrorMessage('\'orgName\''));
        return;
    }

    var token = jwt.sign({
        exp: Math.floor(Date.now() / 1000) + parseInt(constants.jwt_expiretime),
        username: username,
        orgName: orgName
    }, app.get('secret'));

    let response = await helper.getRegisteredUser(username, orgName, true);

    logger.debug('-- returned from registering the username %s for organization %s', username, orgName);
    if (response && typeof response !== 'string') {
        logger.debug('Successfully registered the username %s for organization %s', username, orgName);
        response.token = token;
        res.json(response);
    } else {
        logger.debug('Failed to register the username %s for organization %s with::%s', username, orgName, response);
        res.json({ success: false, message: response });
    }

});

// Register and enroll user
app.post('/register', async function (req, res) {
    var username = req.body.username;
    var orgName = req.body.orgName;
    logger.debug('End point : /users');
    logger.debug('User name : ' + username);
    logger.debug('Org name  : ' + orgName);
    if (!username) {
        res.json(getErrorMessage('\'username\''));
        return;
    }
    if (!orgName) {
        res.json(getErrorMessage('\'orgName\''));
        return;
    }

    var token = jwt.sign({
        exp: Math.floor(Date.now() / 1000) + parseInt(constants.jwt_expiretime),
        username: username,
        orgName: orgName
    }, app.get('secret'));

    console.log(token)

    let response = await helper.registerAndGerSecret(username, orgName);

    logger.debug('-- returned from registering the username %s for organization %s', username, orgName);
    if (response && typeof response !== 'string') {
        logger.debug('Successfully registered the username %s for organization %s', username, orgName);
        response.token = token;
        res.json(response);
    } else {
        logger.debug('Failed to register the username %s for organization %s with::%s', username, orgName, response);
        res.json({ success: false, message: response });
    }

});

// Login and get jwt
app.post('/users/login', async function (req, res) {
    var username = req.body.username;
    var orgName = req.body.orgName;
    logger.debug('End point : /users');
    logger.debug('User name : ' + username);
    logger.debug('Org name  : ' + orgName);
    if (!username) {
        res.json(getErrorMessage('\'username\''));
        return;
    }
    if (!orgName) {
        res.json(getErrorMessage('\'orgName\''));
        return;
    }

    var token = jwt.sign({
        exp: Math.floor(Date.now() / 1000) + parseInt(constants.jwt_expiretime),
        username: username,
        orgName: orgName
    }, app.get('secret'));

    let isUserRegistered = await helper.isUserRegistered(username, orgName);

    if (isUserRegistered) {
        res.json({ success: true, message: { token: token } });

    } else {
        res.json({ success: false, message: `User with username ${username} is not registered with ${orgName}, Please register first.` });
    }
});


// Invoke transaction on chaincode on target peers
app.post('/invokeNotarizer', async function (req, res) {
    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        var channelName = req.body.channelName;
        var chaincodeName = req.body.chaincodeName;
        console.log(`chaincode name is :${chaincodeName}`)
        let args = req.body.args;
        let fcn = req.body.fcn;
        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('fcn  : ' + fcn);
        logger.debug('args  : ' + args);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!fcn) {
            res.json(getErrorMessage('\'fcn\''));
            return;
        }
        if (!args) {
            res.json(getErrorMessage('\'args\''));
            return;
        }

        let message = await invoke.invokeTransaction(channelName, chaincodeName, fcn, args, req.body.username, req.body.orgname);
        console.log(`message result is : ${message}`)

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }
        res.send(response_payload);

    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/queryNotarizer', async function (req, res) {
    try {
        logger.debug('==================== QUERY BY CHAINCODE ==================');

        var channelName = req.body.channelName;
        var chaincodeName = req.body.chaincodeName;
        console.log(`chaincode name is :${chaincodeName}`)
        let args = req.body.args;
        let fcn = req.body.fcn;

        logger.debug('channelName : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('fcn : ' + fcn);
        logger.debug('args : ' + args);

        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!fcn) {
            res.json(getErrorMessage('\'fcn\''));
            return;
        }
        if (!args) {
            res.json(getErrorMessage('\'args\''));
            return;
        }
        console.log('args==========', args);
        // args = args.replace(/'/g, '"');
        // args = JSON.parse(args);
        // logger.debug(args);
        console.log(channelName, chaincodeName, args, fcn, req.body.username, req.body.orgname)
        let message = await query.query(channelName, chaincodeName, args, fcn, req.body.username, req.body.orgname);

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }

        res.send(response_payload);
    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/invokeCircleRateRegistry', async function (req, res) {
    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        console.log("req", req.body)
        var hash = crypto.createHash('sha256');
        var channelName = req.body.channelName;
        var chaincodeName = req.body.chaincodeName;
        console.log(`chaincode name is :${chaincodeName}`)

        let fcn = req.body.fcn;
        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('fcn  : ' + fcn);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!fcn) {
            res.json(getErrorMessage('\'fcn\''));
            return;
        }

        var workbook = XLSX.readFile('./GoG__IGR__JantriRates.xlsx');
        var sheet_name_list = workbook.SheetNames;
        let jsonData = XLSX.utils.sheet_to_json(
            workbook.Sheets[sheet_name_list[0]]
        );
        if (jsonData.length === 0) {
            return res.status(400).json({
                success: false,
                message: "xml sheet has no data",
            });
        }
        console.log("jsonData", jsonData)
        let args = jsonData
        let responseArray = []
        let date = new Date()
        let timestamp = moment(date).format("YYYY-MM-DD hh:mm:ss")

        let message = await invoke.invokeTransaction(channelName, chaincodeName, fcn, args, req.body.createdBy, req.body.updatedBy, timestamp, req.body.username, req.body.orgname);
        console.log(`message result is : ${message}`)



        //  })

        res.send({ status: true, result: message })
    } catch (error) {
        console.log("error", error)
        const responseArray = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(responseArray)
    }
});

app.post('/readFile', async function (req, res) {
    try {
        var workbook = XLSX.readFile('./GoG__IGR__JantriRates.xlsx');
        var sheet_name_list = workbook.SheetNames;
        let jsonData = XLSX.utils.sheet_to_json(
            workbook.Sheets[sheet_name_list[0]]
        );
        if (jsonData.length === 0) {
            return res.status(400).json({
                success: false,
                message: "xml sheet has no data",
            });
        }
        console.log("jsonData", jsonData)
        return res.status(200).json({
            success: true,
            message: jsonData,
        });

    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err
        })
        console.log("error", err)
    }
})

app.post('/uploadCertificate',upload.array("files"), async function (req, res) {
   try{
    console.log("req",req.files, "chaincode", req.body.chaincodeName)
    let fileUpload = await uploadFiles(req)
    console.log("fileUpoad",fileUpload)
    let timestamp = moment(new Date()).format("YYYY-MM-DD hh:mm:ss")
    var channelName = req.body.channelName;
    var chaincodeName = req.body.chaincodeName;
    console.log(`chaincode name is :${chaincodeName}`)
 
    let fcn = req.body.fcn;
    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    }
    if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    }
    if (!fcn) {
        res.json(getErrorMessage('\'fcn\''));
        return;
    }
    let args=[]
    args[0] = req.body.issuerName
    args[1] = req.body.issuerDate
    args[2] = req.body.certificate_type
    args[3] = req.body.verifier_email
    args[4] = uniqid('verifier_')
    args[5] = uniqid('cert_')
    args[6] = fileUpload.fileHash
    args[7] = fileUpload.filePath
    args[8] = req.body.placeOfIssuance
    let message = await invoke.invokeTransaction(channelName, chaincodeName, fcn, args, req.body.createdBy, req.body.updatedBy, timestamp, req.body.username, req.body.orgname);
        console.log(`message result is : ${message}`)
    let sendEmail = await sendMail.mailServer( req.body.verifier_email,message.verifierId)
    return res.status(200).json({
        success: true,
        message: message
    })

    
   }catch (err) {
    return res.status(400).json({
        success: false,
        message: err
    })
}

});

app.post('/verifyCertificate',upload.array("files"), async function (req, res) {
    try{
     console.log("req",req.files, "chaincode", req.body.chaincodeName)
     let fileUpload = await uploadFiles(req)
     console.log("fileUpoad",fileUpload)
     let timestamp = moment(new Date()).format("YYYY-MM-DD hh:mm:ss")
     var channelName = req.body.channelName;
     var chaincodeName = req.body.chaincodeName;
     console.log(`chaincode name is :${chaincodeName}`)
  
     let fcn = req.body.fcn;
     if (!chaincodeName) {
         res.json(getErrorMessage('\'chaincodeName\''));
         return;
     }
     if (!channelName) {
         res.json(getErrorMessage('\'channelName\''));
         return;
     }
     if (!fcn) {
         res.json(getErrorMessage('\'fcn\''));
         return;
     }
     let args = [req.body.verifierId];
     let issuerName = req.body.issuerName
     let issuerDate = req.body.issuerDate
     let certificate_type = req.body.certificate_type
     let verifierEmail = req.body.verifier_email
     let placeIssued = req.body.placeOfIssuance
     let message = await query.query(channelName, chaincodeName, args, fcn, req.body.username, req.body.orgname);
     console.log("message",message)
     let resJson;
     let fileStatus = 0;
     let issuerNameStatus = 0;
     let issuerDateStatus = 0;
     let certificateTypeStatus = 0;
     let placeIssuedStatus = 0;
     if(fileUpload.fileHash === message.FileHash){
         fileStatus = 1;
        if(issuerName === message.IssuerName){
        issuerNameStatus = 1;
        }if(issuerDate === message.IssuerDate){
            issuerDateStatus = 1;
        }if(certificate_type === message.CertificateType){
            certificateTypeStatus = 1;
        }if(placeIssued === message.PlaceOfIssuance){
            placeIssuedStatus = 1;  
        }
        if(issuerNameStatus == 1 && issuerDateStatus == 1 && certificateTypeStatus == 1 && placeIssuedStatus == 1){
            resJson={
                "file": "successfully matched",
                "certMetadata": "Metadata successfully matched",
                 fileStatus,
                 issuerNameStatus,
                 issuerDateStatus,
                 certificateTypeStatus,
                 placeIssuedStatus
            }
        }else{
            resJson={
                "file": "successfully matched",
                "certMetadata": "Metadata not matched",
                 fileStatus,
                 issuerNameStatus,
                 issuerDateStatus,
                 certificateTypeStatus,
                 placeIssuedStatus
            }
        }
        
     }else{
        resJson={
            "file": "file not matched",
             fileStatus
        }
     }
     return res.status(200).json({
         success: true,
         message: resJson
     })
 
     
    }catch (err) {
     return res.status(400).json({
         success: false,
         message: err
     })
 }
 
 });

app.post('/queryCertificateData', async function (req, res) {
    try {
        logger.debug('==================== QUERY BY CHAINCODE ==================');

        var channelName = req.body.channelName;
        var chaincodeName = req.body.chaincodeName;
        console.log(`chaincode name is :${chaincodeName}`)
        let args;
        if(undefined!=req.body.verifierId){
            args = [req.body.verifierId];

        }else{
            args=[]
        }
        let fcn = req.body.fcn;

        logger.debug('channelName : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('fcn : ' + fcn);
        logger.debug('args : ' + args);

        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!fcn) {
            res.json(getErrorMessage('\'fcn\''));
            return;
        }
        if (!args) {
            res.json(getErrorMessage('\'args\''));
            return;
        }
        console.log('args==========', args);
        // args = args.replace(/'/g, '"');
        // args = JSON.parse(args);
        // logger.debug(args);
        console.log(channelName, chaincodeName, args, fcn, req.body.username, req.body.orgname)
        let message = await query.query(channelName, chaincodeName, args, fcn, req.body.username, req.body.orgname);

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }

        res.send(response_payload);
    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

async function uploadFiles(req, res) {
    console.log(req.body);
    console.log("file",req.files);
    const buff = fs.readFileSync(req.files[0].path);
    console.log("buff",buff)
    let fileHash = await createHash(buff)
    return {"fileHash":fileHash, "filePath":req.files[0].path};
}
function createHash(data) {
    let secret = "BlockchainCircleRateRegistry"

    const sha256Hasher = crypto.createHmac("sha256", secret);
    const hash = sha256Hasher.update(data).digest("hex");
    return hash;
}
app.post('/queryCircleRateRegistry', async function (req, res) {
    try {
        logger.debug('==================== QUERY BY CHAINCODE ==================');

        var channelName = req.body.channelName;
        var chaincodeName = req.body.chaincodeName;
        console.log(`chaincode name is :${chaincodeName}`)
        let fcn = req.body.fcn;

        logger.debug('channelName : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('fcn : ' + fcn);


        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!fcn) {
            res.json(getErrorMessage('\'fcn\''));
            return;
        }


        // args = args.replace(/'/g, '"');
        // args = JSON.parse(args);
        // logger.debug(args);
        let args = []
        args[0] = req.body.blockchainId
        console.log(channelName, chaincodeName, args, fcn, req.body.username, req.body.orgname)
        let message = await query.query(channelName, chaincodeName, args, fcn, req.body.username, req.body.orgname);

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }

        res.send(response_payload);
    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/verifyCircleRateRegistry', async function (req, res) {
    try {
        logger.debug('==================== QUERY BY CHAINCODE ==================');

        var channelName = req.body.channelName;
        var chaincodeName = req.body.chaincodeName;
        console.log(`chaincode name is :${chaincodeName}`)
        let fcn = req.body.fcn;

        logger.debug('channelName : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('fcn : ' + fcn);


        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!fcn) {
            res.json(getErrorMessage('\'fcn\''));
            return;
        }


        // args = args.replace(/'/g, '"');
        // args = JSON.parse(args);
        // logger.debug(args);
        var workbook = XLSX.readFile('./GoG__IGR__JantriRates_mismatch.xlsx');
        var sheet_name_list = workbook.SheetNames;
        let jsonData = XLSX.utils.sheet_to_json(
            workbook.Sheets[sheet_name_list[0]]
        );
        if (jsonData.length === 0) {
            return res.status(400).json({
                success: false,
                message: "xml sheet has no data",
            });
        }
        console.log("jsonData", jsonData)
        let args = jsonData
        console.log(channelName, chaincodeName, args, fcn, req.body.username, req.body.orgname)
        let message = await query.query(channelName, chaincodeName, args, fcn, req.body.username, req.body.orgname);
        console.log("message", message)
        let mismatchArray = []
        for (let i = 0; i < jsonData.length; i++) {
            for (let j = 0; j < message.length; j++) {
                if (jsonData[i].Survey_No == message[j].Survey_No) {
                    if (jsonData[i].Value != message[j].Value) {
                        mismatchArray.push(jsonData[i])
                    }
                }
            }
        }

        // console.log("findDuplicate",findDuplicate)
        const response_payload = {
            mismatch: mismatchArray,
            error: null,
            errorData: null
        }

        res.send(response_payload);
    } catch (error) {
        console.log("error", error)
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.get('/qscc/channels/:channelName/chaincodes/:chaincodeName', async function (req, res) {
    try {
        logger.debug('==================== QUERY BY CHAINCODE ==================');

        var channelName = req.params.channelName;
        var chaincodeName = req.params.chaincodeName;
        console.log(`chaincode name is :${chaincodeName}`)
        let args = req.query.args;
        let fcn = req.query.fcn;
        // let peer = req.query.peer;

        logger.debug('channelName : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('fcn : ' + fcn);
        logger.debug('args : ' + args);

        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!fcn) {
            res.json(getErrorMessage('\'fcn\''));
            return;
        }
        if (!args) {
            res.json(getErrorMessage('\'args\''));
            return;
        }
        console.log('args==========', args);
        args = args.replace(/'/g, '"');
        args = JSON.parse(args);
        logger.debug(args);

        let response_payload = await qscc.qscc(channelName, chaincodeName, args, fcn, req.username, req.orgname);

        // const response_payload = {
        //     result: message,
        //     error: null,
        //     errorData: null
        // }

        res.send(response_payload);
    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});
