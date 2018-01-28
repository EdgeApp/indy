var web3 = require('web3')


export class config {
  
  config(){}

  get provider() { return  new web3.providers.HttpProvider('http://127.0.0.1:8545')}
  get DBName() { return 'supernodedb'}
  get CacheDBName() { return 'supernodecachedb'}
  get DBUrl() : string { return 'http://admin:123456@localhost:5984'}
  get Port() : string {  return '3001'}
  get BlockReqeusts(): number  {  return 50}
  get BlockStep(): number  {  return 100}
  get LogFileName(): string {  return 'supernode-indexer.log'}
 
}


export const configuration = new config()