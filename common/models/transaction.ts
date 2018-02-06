


export class Transaction {
  constructor (web3Transaction: any, block: any, transactionReceipt: any) {
    // block
    this._id = web3Transaction.hash
    this.blockNumber = block.number
    this.timeStamp = block.timestamp
    this.blockHash = block.hash
    this.confirmations = 9999999 // will need to calc when fetched, confirmations is latest block - transaction.blockNumber
    // transaction
    this.hash = web3Transaction.hash
    this.nonce = web3Transaction.nonce
    this.transactionIndex = web3Transaction.transactionIndex
    this.from = web3Transaction.from
    this.to = web3Transaction.to
    this.value = web3Transaction.value
    this.gas = web3Transaction.gas
    this.gasPrice = web3Transaction.gasPrice
    this.input = web3Transaction.input
    // receipt

    if(block.number >= 4370000 ) // Byzantium fork add status indicator
      // status 1 means transaction is ok, no error  
      this.isError = transactionReceipt.status == 1 ? 0 : 1  
    else 
      // if gas == gas used, there is transaction error  
      this.isError = transactionReceipt.gas == transactionReceipt.gasUsed ? 1 : 0 

    this.gasUsed = transactionReceipt.gasUsed
    this.cumulativeGasUsed = transactionReceipt.cumulativeGasUsed
    this.contractAddress = transactionReceipt.contractAddress
  }

  _id: string 
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
  value: number
  gas: number
  gasPrice: number
  input: string

  // receipt
  contractAddress: string
  cumulativeGasUsed: number
  gasUsed: number
  isError: number
}
