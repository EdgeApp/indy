
export class IndexerSettings {
  constructor () {
    this.id = 'indexer' // for now, only one indexer support
    this.lastBlock = 0
    this.startBlock = 0
    this.endBlock = 0
    this.lastBlockToIndex = 0

  }
  // id to save in DB
  id : string
  // the last indexed block, we need to continue from here
  lastBlock : number
  // the first block of the CURRENT chunk we are indexing 
  startBlock : number
  // the LAST block of the CURRENT chunk we are indexing. do not confuse with the end of indexing, only the end of the current chunk
  endBlock : number
  // if this is not zero, then indexer will stop after reaching it.
  lastBlockToIndex : number
}

