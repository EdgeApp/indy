import * as  express from 'express'
import * as  logger from 'winston'
import * as  dbUtils from '../../utils/dbUtils'
import * as  blockUtils from '../../utils/blockUtils'
import { configuration } from '../../config/config'
import { dbHandler } from '../../utils/couchdb'

var historyDb = dbHandler.use(configuration.DBName)

const router = express.Router()
const Web3 = require('web3')
const web3 = new Web3()

web3.setProvider(configuration.provider)

// return all transactions history for account address
router.get('/:address', async (req, res, next) => {
  try {
  let result = await dbUtils.getAccountAsync(req.params.address)
  return res.json(
    {
      'status': '1',
      'message': 'OK',      
      'result' : result
    })
} catch {
    return res.json(
    {
      'status': '0',
      'message': 'ERROR',      
      'result' : 'not found'
    })
  }
})

module.exports = router
