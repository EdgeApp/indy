// save info on blocks that couldnt index from some reason
export class DropInfo {

  _id: string
  // block info
  blockNumber: number
  // the drop description
  description: string

  constructor (block: any, description: string) {
    // block is the doc key
    this._id =  block.number.toString()
    this.blockNumber = block.number
    this.description = description
  }
}
