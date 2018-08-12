import * as utils from './../../common/utils'
export class Transaction {

  // block info
  blockNumber: number
  timeStamp: string
  blockHash: string
  confirmations: number

  // transaction
  hash: string
  nonce: number
  transactionIndex: number
  from: string
  to: string
  destination: string
  data: string
  value: number
  gas: number
  gasPrice: number
  input: string
  logs: Array<any>


  // receipt
  contractAddress: string
  cumulativeGasUsed: number
  gasUsed: number
  isError: number

  constructor (web3Transaction: any, block: any, transactionReceipt: any) {
    // block
    this.blockNumber = block.number
    this.timeStamp = block.timestamp
    this.blockHash = block.hash
    this.confirmations = 0 // will need to calc when fetched, confirmations is latest block - transaction.blockNumber
    // transaction
    this.hash = web3Transaction.hash
    this.nonce = web3Transaction.nonce
    this.transactionIndex = web3Transaction.transactionIndex
    this.from = utils.toLowerCaseSafe(web3Transaction.from)
    this.to = utils.toLowerCaseSafe(web3Transaction.to)
    this.handleLogs(transactionReceipt)

    this.value = web3Transaction.value
    this.gas = web3Transaction.gas
    this.gasPrice = web3Transaction.gasPrice
    this.input = web3Transaction.input
    // receipt

    if (block.number >= 4370000) { // Byzantium fork add status indicator
      // status 1 means transaction is ok, no error
      this.isError = transactionReceipt.status === 1 ? 0 : 1
    } else {
      // if gas == gas used, there is transaction error
      this.isError = transactionReceipt.gas === transactionReceipt.gasUsed ? 1 : 0
    }

    this.gasUsed = transactionReceipt.gasUsed
    this.cumulativeGasUsed = transactionReceipt.cumulativeGasUsed
    this.contractAddress = transactionReceipt.contractAddress
  }

  private handleLogs (transactionReceipt: any) {

    this.destination = null
    this.data = null
    let logs = new Array<any>()

    for (let log of transactionReceipt.logs) {
      logs.push({
        'data': log.data,
        'id': log.id,
        'topics' : log.topics
      })
    }

    for (let log of logs) {
      if(log.topics.length == 3) {
        // this topic if token tranfer code
        if(log.topics[0] == '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
          // this is the address that the token was sent
          if(log.topics[2]) {
            const unpadAddress = utils.unpadAddress(log.topics[2].toLowerCase())
            this.destination = unpadAddress
            this.data = log.data
            break
          }
        }
      }
    }
    this.logs = logs
  }
}
