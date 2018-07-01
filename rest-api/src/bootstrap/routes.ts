import * as logger from 'winston'

export function load (app) {
  setApplicationRoutes(app)
  app.use(function (req, res, next) {
    res.status(404).send(`Opps! API not found, check your path: "${req.path}".`)
  })
}

function setApplicationRoutes (app) {
  logger.info('setApplicationRoutes')

  let pendingTxContoller = require('../routes/api/pendingTx')
  app.use('/mempool', pendingTxContoller)

  let latestBlockContoller = require('../routes/api/latestBlock')
  app.use('/mempool', latestBlockContoller)

  let blockContoller = require('../routes/api/block')
  app.use('/mempool', blockContoller)

  let transactionContoller = require('../routes/api/transaction')
  app.use('/mempool', transactionContoller)

  let sendTransactionContoller = require('../routes/api/sendTx')
  app.use('/mempool', sendTransactionContoller)

  let accountBalanceContoller = require('../routes/api/accountBalance')
  app.use('/account/balance', accountBalanceContoller)

  let accountTokenBalanceContoller = require('../routes/api/tokenBalance')
  app.use('/token/balance', accountTokenBalanceContoller)

  let accountTxContoller = require('../routes/api/accountTx')
  app.use('/account', accountTxContoller)

  let fromTxContoller = require('../routes/api/accountTx')
  app.use('/from', fromTxContoller)

  let toTxContoller = require('../routes/api/accountTx')
  app.use('/to', fromTxContoller)

  let tokenTxContoller = require('../routes/api/tokenTx')
  app.use('/tokens', tokenTxContoller)
}
