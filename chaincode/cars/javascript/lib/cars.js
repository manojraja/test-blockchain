/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class Cars extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const blockchainFrameworks = [
            {
                framework: 'Hyperledger Fabric',
                language: 'Javascript',
            },
            {
                framework: 'Hyperledger Fabric',
                language: 'Go',
            },
            {
                framework: 'Hyperledger Fabric',
                language: 'Java',
            },
            {
                framework: 'Ethereum',
                language: 'Solidity',
            },
        ];

        for (let i = 0; i < blockchainFrameworks.length; i++) {
            cars[i].docType = 'blockchainFrameworks';
            await ctx.stub.putState('blockchainFrameworks' + i, Buffer.from(JSON.stringify(blockchainFrameworks[i])));
            console.info('Added <--> ', blockchainFrameworks[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async queryblockchainFrameworks(ctx, frameworkid) {
        const blockchainFrameworks = await ctx.stub.getState(frameworkid); // get the car from chaincode state
        if (!blockchainFrameworks || blockchainFrameworks.length === 0) {
            throw new Error(`${blockchainFrameworks} does not exist`);
        }
        console.log(blockchainFrameworks.toString());
        return blockchainFrameworks.toString();
    }

    async createBlockchainFrameworks(ctx, frameworkid, framework, language) {
        console.info('============= START : Create Car ===========');

        const blockchainFramework = {
           frameworkid,
           framework,
           language
        };

        await ctx.stub.putState(frameworkid, Buffer.from(JSON.stringify(blockchainFramework)));
        console.info('============= END : Create Car ===========');
    }

 


}

module.exports = Cars;
