import * as logger from 'winston'

export function load (app) {
  setApplicationRoutes(app)
  app.use(function (req, res, next) {
    res.status(404).send(`Opps! API not found, check your path: "${req.path}".`)
  })
}

function setApplicationRoutes (app) {
  logger.info('setApplicationRoutes')
  let indexContoller = require('../routes/api/indexer')
  app.use('/indexer', indexContoller)
}
