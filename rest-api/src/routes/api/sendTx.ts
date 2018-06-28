import * as express from 'express'
import * as logger from 'winston'
import * as blockUtils from '../../utils/blockUtils'
import { configuration } from '../../config/config'
import { Transaction } from '../../../../common/models/transaction'

const router = express.Router()

const Web3 = require('web3')
const web3 = new Web3()

web3.setProvider(configuration.provider)

router.get('/sendTx/:signedTransaction', async (req, res, next) => {

  // TODO: need to finish this
  let signedTransaction = req.params.signedTransaction
  var evt = await web3.eth.sendSignedTransaction(signedTransaction)

  let result
  let status = 0
  let message = 'FAIL'

  return res.json(
    {
      'status': status,
      'message': message,
      'result': result
    })
})

module.exports = router
