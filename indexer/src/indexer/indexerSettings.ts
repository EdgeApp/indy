
export class IndexerSettings {
  constructor () {
    this.id = 'settingsid' // for now, only one indexer support
    this.lastBlockNumber = 0
    this.startBlockNumber = 0
    this.endBlockNumber = 0
  }
  id : string
  lastBlockNumber : number
  startBlockNumber : number
  endBlockNumber : number
}
