export {}

// all the views has this name
export const fixedViewName = 'view'

// DB design doc names
export const toDoc = 'toDoc'
export const fromDoc = 'fromDoc'
export const toDocBlocks = 'toDocBlocks'
export const fromDocBlocks = 'fromDocBlocks'
export const blockDoc = 'blockDoc'
export const contractDoc = 'contractDoc'


// coinfiguration consts
export const ipcPath = '/.local/share/io.parity.ethereum/jsonrpc.ipc'
export const httpProvider = 'http://127.0.0.1:8545'
export const dBUrl = 'http://admin:123456@localhost:5984'
export const indexerPort = 3001
export const restPort = 3000

export const  dropsDBName = 'supernodedropsdb' 
export const  settingDBName = 'supernodesettingsdb' 

export const blockViewsSupported = true
export const blockReqeusts = 100 // parity parallel block requests. can't be larger than blockstep.
export const blockStep = 1000 // number of items to save to db in one time . be carefull in non bulk mode. can't be larger than chunksize
export const blockChunkSize = 10000 // number of blocks that this indexer is taking to work on everytime
export const limitTransactionBlukSave = 5000 
export const indexerLogFileName = 'supernode-indexer.log' 
export const restLogFileName = 'supernode-rest.log' 
export const logTimeStampConsole = true
export const maxEphemeralForkBlocks = 12
export const filterInMemory = false


