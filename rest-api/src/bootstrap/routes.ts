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

  let accountTxContoller = require('../routes/api/accountTx')
  app.use('/account', accountTxContoller)

  let fromTxContoller = require('../routes/api/accountTx')
  app.use('/from', fromTxContoller) 
  
  let toTxContoller = require('../routes/api/accountTx')
  app.use('/to', fromTxContoller)    

  let tokenTxContoller = require('../routes/api/tokenTx')
  app.use('/tokens', tokenTxContoller)
}
