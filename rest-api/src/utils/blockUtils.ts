import * as logger from 'winston'
import { configuration } from '../config/config'
import { Transaction } from '../../../common/models/transaction'

const Web3 = require('web3')
const web3 = new Web3()

web3.setProvider(configuration.provider)

export async function getTransactions (block, address) : Promise<Array<Transaction>> {
  try {
    if (block && block.transactions) {
      logger.info(`block transactions count: ${block.transactions.length}.`)

      let transactionPromises = []
      block.transactions.forEach((t) => transactionPromises.push(web3.eth.getTransaction(t)))

      let resTransactions = await Promise.all(transactionPromises)
      resTransactions = address ? resTransactions.filter((transaction) => (transaction.from.toLowerCase() === address.toLowerCase() || transaction.to.toLowerCase() === address.toLowerCase())) : resTransactions

      let transactions = await convertTransactionFormat(block, resTransactions)
      return transactions
    }
  } catch (error) {
    return null
  }
}

export async function convertTransactionFormat (block: any, web3transactions: any[]) : Promise<Array<Transaction>> {
  logger.info('convertTransactionFormat.')
  let transactions = []

  for (let index = 0; index < web3transactions.length; index++) {
    var receipt = await web3.eth.getTransactionReceipt(web3transactions[index].hash)
    let transaction = new Transaction(web3transactions[index], block, receipt)
    logger.info(`receipt: ${JSON.stringify(receipt)}.`)
    logger.info(`transaction: ${JSON.stringify(transaction)}.`)
    transactions.push(transaction)
  }
  return transactions
}
