export {}


// DB info
export const dBUrl = 'couchbase://localhost'
export const bucketName = 'indy-transactions-bucket'
export const liveBucketName = 'indy-live-bucket'

// take this bucket pass using this command:
// curl -u edgy:123456 http://localhost:8091/pools/default/buckets > info.txt
// look into saslPassword value - this is the bucket password 
export const bucketPassword = 'a9760b0a857c554a52b79a7565132a7a'

export const liveBucketPassword = '715e3233e7a6ded14b492494f6ddd6cc'




// coinfiguration consts
// export const ipcPath = '/datadrive/parity/data/io.parity.ethereum/jsonrpc.ipc'
export const ipcPath = '/home/adys/.ethereum/geth.ipc'

//export const ipcPath = process.env['HOME'] + '/.local/share/io.parity.ethereum/jsonrpc.ipc'
export const httpProvider = 'http://127.0.0.1:8545'
export const indexerPort = 3001
export const restPort = 3000

export const blockReqeusts = 100 // parity parallel block requests. can't be larger than blockstep.
export const blockStep = 1000 // number of items to save to db in one time . be carefull in non bulk mode. can't be larger than chunksize
export const blockChunkSize = 10000 // number of blocks that this indexer is taking to work on everytime
export const limitTransactionBlukSave = 5000
export const indexerLogFileName = 'supernode-indexer.log'
export const restLogFileName = 'supernode-rest.log'
export const logTimeStampConsole = true
export const maxEphemeralForkBlocks = 12
export const liveRefreshDelta = 100
export const liveRefreshDeltaSec = 15

export const useSsl = false
export const sslKey = '/home/adys/Sources/ether-super-node/rest-api/src/encryption/supernode.key'
export const sslCert = '/home/adys/Sources/ether-super-node/rest-api/src/encryption/supernode.crt'
