import * as logger from 'winston'
import { configuration } from '../config/config'
import { Account } from '../../../common/models/account'
import { Transaction } from '../../../common/models/transaction'

const Web3 = require('web3')
const web3 = new Web3()
web3.setProvider(configuration.provider)

// for every block, fetch all transactions.
// for every transaction, create account for every FROM / TO address
// collect the transactions for each account
export async function getAccountsAsync (startBlock: number, endBlock: number): Promise<Map<string, Account>> {
  let result = []
  let accountsMap = new Map()
  let startIndex = startBlock

  while (startIndex <= endBlock) {
    let blocksPromises = []
    for (let index = 0; index < configuration.BlockReqeusts && startIndex <= endBlock; index++) {
      blocksPromises.push(web3.eth.getBlock(startIndex++))
    }
    let resBlocks = await Promise.all(blocksPromises)
    for (let blockIndex = 0; blockIndex < resBlocks.length; blockIndex++) {
      let block = resBlocks[blockIndex]
      if (block) {
        try {
          let transactions = await getTransactionsAsync(block, null)
          transactions.forEach(element => {
            if (accountsMap.has(element.from)) {
              let account = accountsMap.get(element.from)
              account.transactions.push(element)
            } else {
              accountsMap.set(element.from, { address: element.from, transactions: [element] })
            }
            logger.info('from' + element.from)
          })
          result = result.concat(transactions)
        } catch (error) {
          logger.info(error)
        }
      }
    }
  }
  logger.info(`total transaction # ${result.length} from block # ${startBlock} to block #  ${endBlock}.`)
  return accountsMap
}

// fetch transactions body for each block
export async function getTransactionsAsync (block: any, address: string): Promise<Array<any>> {
  try {
    let result
    if (block && block.transactions) {
      logger.info(`block # ${block.number} transactions count: ${block.transactions.length}.`)
      let transactionPromises = []
      block.transactions.forEach((t) => transactionPromises.push(web3.eth.getTransaction(t)))
      let resTransactions = await Promise.all(transactionPromises)
      // filter
      resTransactions = address ? resTransactions.filter((transaction) => (transaction.from === address || transaction.to === address)) : resTransactions
      convertTransactionFormat(block, resTransactions) // use this - TODO
      result = (address && !resTransactions.length) ? `no pending transactions for address ${address}` : resTransactions
      //logger.info(`results: ${JSON.stringify(result)}.`)
    } else {
      result = 'no pending transactions'
      logger.info('no pending transactions')
    }
    return result
  } catch (error) {
    return null
  }
}

export async function convertTransactionFormat (block: any, web3transactions: any[]) {
  logger.info('convertTransactionFormat.')
  let transactions = []
  for (let index = 0; index < web3transactions.length; index++) {
    var receipt = web3.eth.getTransactionReceipt(web3transactions[index].hash)
    let transaction = new Transaction(web3transactions[index], block, receipt)
    logger.info(`receipt: ${JSON.stringify(receipt)}.`)
    logger.info(`transaction: ${JSON.stringify(transaction)}.`)
    transactions.push(transaction)
  }
  return transactions
}
