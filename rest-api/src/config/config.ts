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
  _port : number

  constructor () {
    this._ipcPath = process.env['HOME'] + '/.local/share/io.parity.ethereum/jsonrpc.ipc'
    this._ipcProvider = new web3.providers.IpcProvider(this._ipcPath, net)
    this._provider = new web3.providers.HttpProvider('http://127.0.0.1:8545')
    this._port = 3000
    this._useIpc = true
    this._DBUrl = 'http://admin:123456@localhost:5984'
  }

  readCommandLineArgs (args: yargs.Arguments) : void {
    logger.info(`config readCommandLineArgs start`)
    try {
      if (args.port) {
        this._port = args.port
        logger.info(`configure port from command line: ${args.port}`)
      }

      if (args.useIpc !== undefined) {
        this._useIpc = args.useIpc
        logger.info(`configure useIpc from command line: ${args.useIpc}`)
      }

      if (args.httpProvider) {
        this._provider = new web3.providers.HttpProvider(args.httpProvider)
        logger.info(`configure httpProvider from command line: ${args.httpProvider}`)
      }

      if (args.DBUrl) {
        this._DBUrl = args.DBUrl
        logger.info(`configure DBUrl from command line: ${args.DBUrl}`)
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

  get DBName () : string { return 'supernodedb' }
  get DBUrl (): string { return this._DBUrl }
  get Port (): number { return this._port }
  get LogFileName (): string { return 'supernode-rest.log' }
}

export const configuration = new Config()
