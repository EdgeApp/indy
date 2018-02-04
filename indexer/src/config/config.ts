var web3 = require('web3')

export class Config {
  constructor () {}
  
  get provider () { return new web3.providers.HttpProvider('http://127.0.0.1:8545') }
  get HistoryDBName () { return 'supernodedb' }
  get CacheDBName () { return 'supernodecachedb' }
  get SettingDBName () { return 'supernodesettingsdb' }
  get DBUrl () : string { return 'http://admin:123456@localhost:5984' }
  get Port () : string { return '3001' }

  get BlockReqeusts (): number { return 100 }  // parity parallel block requests. can't be larger than blockstep.
  get BlockStep (): number { return 1000 } // number of items to save to db in one time . be carefull in non bulk mode. can't be larger than chunksize
  get BlockChunkSize (): number { return 10000 } // number of blocks that this indexer is taking to work on everytime
  get UseBulk(): boolean { return true } 
  get LimitTransactionBlukSave(): number { return 1000 } 
  
  
  get LogFileName (): string { return 'supernode-indexer.log' }
  get LogTimeStampConsole (): boolean { return true }
  get MaxEphemeralForkBlocks (): number { return 12 }
 
 }

 export const configuration = new Config()
