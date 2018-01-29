var web3 = require('web3')

export class Config {
  Config () {}
  get provider () : any { return new web3.providers.HttpProvider('http://127.0.0.1:8545') }
  get DBName () : string { return 'supernodedb' }
  get CacheDBName () : string { return 'supernodecachedb' }
  get DBUrl () : string { return 'http://admin:123456@localhost:5984' }
  get Port () : string { return '3000' }
  get BlockReqeusts (): number { return 50 }
  get LogFileName (): string { return 'supernode-rest.log' }
}

export const configuration = new Config()
