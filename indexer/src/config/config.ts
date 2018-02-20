import * as yargs from 'yargs'
import * as logger from 'winston'
const web3 = require('web3')
const net = require('net')

export class Config {
  _provider: any
  _ipcProvider: any
  _ipcPath: string
  _useIpc: boolean
  _DBUrl: string

  constructor () {
    this._ipcPath = process.env['HOME'] + '/.local/share/io.parity.ethereum/jsonrpc.ipc'
    this._ipcProvider = new web3.providers.IpcProvider(this._ipcPath, net)
    this._provider = new web3.providers.HttpProvider('http://127.0.0.1:8545')
    this._port = 3001
    this._useIpc = true
    this._DBUrl = 'http://admin:123456@localhost:5984'
  }

  _port : number
  readCommandLineArgs (args: yargs.Arguments) : void {
    logger.info(`config readCommandLineArgs start`)   
    try {
      if (args.port) {
        this._port = args.port
        logger.info(`configure port from command line: ${args.port}`)
      }

      if (args.ipc !== undefined) {
        this._useIpc = args.ipc
        logger.info(`configure useIpc from command line: ${args.ipc}`)
      }

      if (args.httpprovider) {
        this._provider = new web3.providers.HttpProvider(args.httpprovider)
        logger.info(`configure httpProvider from command line: ${args.httpprovider}`)
      }

      if (args.dburl) {
        this._DBUrl = args.dburl
        logger.info(`configure DBUrl from command line: ${args.dburl}`)
      }
      logger.info(`config readCommandLineArgs end`)
    } catch (error) {
      logger.error(`config readCommandLineArgs error, exception message ${error.message}`)
    }
  }

  get useIpc () : boolean { return this._useIpc }
  get provider () {
    return this.useIpc ? this._ipcProvider : this._provider
  }

  get HistoryDBName (): string { return 'supernodedb' }
  get CacheDBName (): string { return 'supernodecachedb' }
  get SettingDBName (): string { return 'supernodesettingsdb' }
  get DBUrl (): string { return this._DBUrl }
  get Port (): number { return this._port }

  get BlockReqeusts (): number { return 100 }  // parity parallel block requests. can't be larger than blockstep.
  get BlockStep (): number { return 1000 } // number of items to save to db in one time . be carefull in non bulk mode. can't be larger than chunksize
  get BlockChunkSize (): number { return 10000 } // number of blocks that this indexer is taking to work on everytime
  get UseBulk (): boolean { return true }
  get LimitTransactionBlukSave (): number { return 1000 }
  get LogFileName (): string { return 'supernode-indexer.log' }
  get LogTimeStampConsole (): boolean { return true }
  get MaxEphemeralForkBlocks (): number { return 12 }
 }

export const configuration = new Config()
