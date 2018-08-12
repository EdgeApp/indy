// save info on blocks that couldnt index from some reason
export class DropInfo {

  id: string
  // block info
  blockNumber: number
  // the drop description
  description: string

  constructor (block: any, description: string) {
    // block is the doc key
    this.id =  block.number.toString()
    this.blockNumber = block.number
    this.description = description
  }
}
