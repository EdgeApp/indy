var web3 = require('web3')
var net = require('net')

export class Config {
  constructor () {
    this._ipcPath = process.env['HOME'] + '/.local/share/io.parity.ethereum/jsonrpc.ipc'
    this._ipcProvider = new web3.providers.IpcProvider(this._ipcPath, net)
    this._provider = new web3.providers.HttpProvider('http://127.0.0.1:8545')
  }

  get useIpc () : boolean { return true }
  get provider () {
    return this.useIpc ? this._ipcProvider : this._provider
  }

  get HistoryDBName (): string { return 'supernodedb' }
  get CacheDBName (): string { return 'supernodecachedb' }
  get SettingDBName (): string { return 'supernodesettingsdb' }
  get DBUrl (): string { return 'http://admin:123456@localhost:5984' }
  get Port (): string { return '3001' }

  get BlockReqeusts (): number { return 100 }  // parity parallel block requests. can't be larger than blockstep.
  get BlockStep (): number { return 1000 } // number of items to save to db in one time . be carefull in non bulk mode. can't be larger than chunksize
  get BlockChunkSize (): number { return 10000 } // number of blocks that this indexer is taking to work on everytime
  get UseBulk (): boolean { return true }
  get LimitTransactionBlukSave (): number { return 1000 }
  get LogFileName (): string { return 'supernode-indexer.log' }
  get LogTimeStampConsole (): boolean { return true }
  get MaxEphemeralForkBlocks (): number { return 12 }

  _provider: any
  _ipcProvider: any
  _ipcPath: string
 }

export const configuration = new Config()
