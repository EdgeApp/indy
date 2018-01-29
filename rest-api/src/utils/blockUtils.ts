import * as logger from 'winston'
import { configuration } from '../config/config'

const Web3 = require('web3')
const web3 = new Web3()

web3.setProvider(configuration.provider)

export async function getTransactions (block, address) {
  try {
    let result
    let transactionCount = 0
    if (block && block.transactions) {
      logger.info(`block transactions count: ${block.transactions.length}.`)

      let transactionPromises = []
      block.transactions.forEach((t) => transactionPromises.push(web3.eth.getTransaction(t)))

      let resTransactions = await Promise.all(transactionPromises)
      resTransactions = address ? resTransactions.filter((transaction) => (transaction.from === address || transaction.to === address)) : resTransactions

      result = (address && !resTransactions.length) ? `no pending transactions for address ${address}` : resTransactions
      logger.info(`results: ${JSON.stringify(result)}.`)
      transactionCount = result.length
    } else {
      result = 'no pending transactions'
      logger.info('no pending transactions')
    }
    return new Promise((resolve, reject) => {
      resolve({
        status: '1',
        message: 'OK',
        count: transactionCount,
        result: result
      })
    })
  } catch (error) {
    return (
    {
      status: '0',
      message: 'FAIL',
      result: error.message
    })
  }
}

export async function getTransactionsRaw (block, address) {
  try {
    let result
    if (block && block.transactions) {
      logger.info(`block transactions count: ${block.transactions.length}.`)

      let transactionPromises = []
      block.transactions.forEach((t) => transactionPromises.push(web3.eth.getTransaction(t)))

      let resTransactions = await Promise.all(transactionPromises)
      resTransactions = address ? resTransactions.filter((transaction) => (transaction.from === address || transaction.to === address)) : resTransactions

      result = (address && !resTransactions.length) ? `no pending transactions for address ${address}` : resTransactions
      logger.info(`results: ${JSON.stringify(result)}.`)
    } else {
      result = 'no pending transactions'
      logger.info('no pending transactions')
    }
    return new Promise((resolve, reject) => {
      resolve(result)
    })
  } catch (error) {
    logger.info(error)
    return null
  }
}

