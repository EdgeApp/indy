import * as express from 'express'
import * as logger from 'winston'
import * as dbUtils from '../../utils/dbUtils'

const router = express.Router()
// return all transactions history for account address
router.get('/:address/:limit?', async (req, res, next) => {
  try {
    //let result = await dbUtils.getAccountAsync(req.params.address)
    let limit = req.params.limit ? req.params.limit : 50
    let result = await dbUtils.getAccountTransactionsAsync(req.params.address, req.params.limit)
    return res.json(
      {
        'status': '1',
        'message': 'OK',
        'result': result
      })
  } catch (error) {
    return res.json(
      {
        'status': '0',
        'message': 'ERROR',
        'result': 'not found'
      })
  }
})

module.exports = router
