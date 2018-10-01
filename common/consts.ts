export {}


// DB info
export const dBUrl = 'couchbase://localhost'

// take this bucket pass using this command:
// curl -u edgy:123456 http://localhost:8091/pools/default/buckets > info.txt
// search for saslPassword value - this is the bucket password
export const bucketPassword = '20fd6380e901f0ff03a6b65dec7d3447'
export const liveBucketPassword = '80cb2c538dd77d0c38e0d28ea215ca4f'


// coinfiguration consts
// export const ipcPath = '/datadrive/parity/data/io.parity.ethereum/jsonrpc.ipc'
export const ipcPath = '/home/adys/.ethereum/geth.ipc'

//export const ipcPath = process.env['HOME'] + '/.local/share/io.parity.ethereum/jsonrpc.ipc'
export const httpProvider = 'http://127.0.0.1:8545'
export const indexerPort = 3001
export const restPort = 3000

export const blockReqeusts = 100 // parity parallel block requests. can't be larger than blockstep.
export const blockStep = 1000 // number of BLOCKS to save to db in one time . be carefull in non bulk mode. can't be larger than chunksize
export const blockChunkSize = 10000 // number of blocks that this indexer is taking to work on everytime
export const limitTransactionBlukSave = 5000 // actuall db save bulck - db limit (trasactions)
export const indexerLogFileName = 'supernode-indexer.log'
export const restLogFileName = 'supernode-rest.log'
export const logTimeStampConsole = true
export const maxEphemeralForkBlocks = 12
export const liveRefreshDelta = 100
export const liveRefreshDeltaSec = 15

export const useSsl = false
export const sslKey = '/home/adys/Sources/ether-super-node/rest-api/src/encryption/supernode.key'
export const sslCert = '/home/adys/Sources/ether-super-node/rest-api/src/encryption/supernode.crt'
