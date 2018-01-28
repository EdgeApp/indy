import * as logger from 'winston'
import * as blockchainUtils from '../utils/blockchainUtils'
import * as dbUtils from '../utils/dbUtils'
import {configuration} from '../config/config'


const Web3 = require('web3')
const web3 = new Web3()

web3.setProvider(configuration.provider)

export async function startIndex (startBlock: number, endBlock: number) {

    // TODO:
    // get range from db to work on
    // mark the range as 'onwork'
    // start index the range blocks

    while(startBlock <= endBlock)
    {
        let start = startBlock
        let end = (( startBlock + configuration.BlockStep) <= endBlock ) ? startBlock + configuration.BlockStep : endBlock
        await indexBlockRange(start, end)
        startBlock += configuration.BlockStep
    }
}


async function indexBlockRange (startBlock: number, endBlock: number) {

    let acccounts = await blockchainUtils.getAccountsAsync(startBlock, endBlock)
    logger.info(`total accounts # ${acccounts.size} from block # ${startBlock} to block #  ${endBlock}.`)
    await dbUtils.saveAccountsAsync(acccounts)

}