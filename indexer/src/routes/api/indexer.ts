import * as logger from 'winston'
import * as express from 'express'

const router = express.Router()

router.get('/liveBlocks/:address/:fromto', async (req, res, next) => {
  try {
    let indexderLive = req.app.get('indexerTransactions')
    let liveTransactions = indexderLive.liveBlocksTransactionsMap
    let filterAddress = req.params.address
    
    let isAll = req.params.fromto == 'account'
    let isTo = req.params.fromto == 'to'
    let isFrom = req.params.fromto == 'from'    
    
    logger.info(`req.params.address ${req.params.address}`)
    logger.info(`filterAddress ${filterAddress}`)

    if (!liveTransactions || (liveTransactions && !liveTransactions.length)) {
      return res.json({
        'status': '0',
        'message': 'liveTransactions not availble yet',
        'result': 'not found'
      })
    }

    let resTransactions = []
    liveTransactions.forEach(function (value, key, mapObj) {
      if (filterAddress) {
        logger.info(`filterAddress not null`)

        if(isAll || isFrom) {
          let fromTransactions = value.transactions.filter((t) => t.from === filterAddress)
          resTransactions = resTransactions.concat(fromTransactions)
        }
        if(isAll || isTo) {
          let toTransactions = value.transactions.filter((t) => t.to === filterAddress)
          resTransactions = resTransactions.concat(toTransactions)
        }
      } else { // TODO, remove this
        logger.info(`filterAddress IS null, fetch all, for debug only, need to remove this`)
        resTransactions = resTransactions.concat(value.transactions)
      }
    })

    return res.json(
      {
        'status': 1,
        'message': 'OK',
        'result': resTransactions
      })
  } catch (error) {
    return res.json({
      'status': 0,
      'message': error,
      'result': 'not found'
    })
  }
})

module.exports = router
