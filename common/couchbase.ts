import * as couchbase from 'couchbase'
import { configuration } from './config' //TODO fix configuration

export const indyCluster = new couchbase.Cluster('couchbase://localhost')
export const transactionsBucket = indyCluster.openBucket('indy-transactions-bucket')
transactionsBucket.operationTimeout = 120 * 1000
