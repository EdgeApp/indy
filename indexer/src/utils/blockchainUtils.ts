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

  while (startIndex < endBlock) {
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
          })
          result = result.concat(transactions)
        } catch (error) {
          logger.info(error)
          return null
        }
      }
    }
  }
  logger.info(`total transaction ${result.length} in block #${startBlock} to block #${endBlock}.`)
  return accountsMap
}

// fetch transactions body for each block
export async function getTransactionsAsync (block, address) : Promise<Array<Transaction>> {
  try {
    let transactionCount = 0
    if (block && block.transactions) {
      logger.info(`block #${block.number}, transactions count ${block.transactions.length}.`)
      let transactionPromises = []
      block.transactions.forEach((t) => transactionPromises.push(web3.eth.getTransaction(t)))
      let resTransactions = await Promise.all(transactionPromises)
      resTransactions = address ? resTransactions.filter((transaction) => (transaction.from === address || transaction.to === address)) : resTransactions
      let transactions = await convertTransactionFormatAsync(block, resTransactions)
      return transactions
    } 
  } catch (error) {
    logger.info(error)
    return null
  }
}

export async function convertTransactionFormatAsync (block: any, web3transactions: any[]) : Promise<Array<Transaction>> {
  try {
    let transactions = []
    let highestBlock = await web3.eth.getBlock('pending')
    let highestBlockNumber = highestBlock.number
    for (let index = 0; index < web3transactions.length; index++) {
      var receipt = await web3.eth.getTransactionReceipt(web3transactions[index].hash)
      let transaction = new Transaction(web3transactions[index], block, receipt, highestBlockNumber)
      transactions.push(transaction)
    }
    return transactions
  } catch (error) {
    logger.info(error)
    return null
  }
}


// for every block, fetch all transactions.
// for every transaction, create account for every FROM / TO address
// collect the transactions for each account
export async function getTransactionsRawAsync (startBlock: number, endBlock: number): Promise<Array<Transaction>> {
  let transactions = []
  let startIndex = startBlock

  while (startIndex < endBlock) {
    let blocksPromises = []
    for (let index = 0; index < configuration.BlockReqeusts && startIndex <= endBlock; index++) {
      blocksPromises.push(web3.eth.getBlock(startIndex++))
    }
    let resBlocks = await Promise.all(blocksPromises)
    for (let blockIndex = 0; blockIndex < resBlocks.length; blockIndex++) {
      let block = resBlocks[blockIndex]
      if (block) {
        try {
          let res = await getTransactionsAsync(block, null)
          transactions = transactions.concat(res)
        } catch (error) {
          logger.info(error)
          return null
        }
      }
    }
  }
  logger.info(`total transaction ${transactions.length} in block #${startBlock} to block #${endBlock}.`)
  return transactions
}