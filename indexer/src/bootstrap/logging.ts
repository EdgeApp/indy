
import * as logger from 'winston'
import * as expressLogger from 'express-winston'
import { configuration } from '../config/config'

export function load (app) {
  initializeLogging(app)
}

function initializeLogging (app) {
  let logPath = './logs/'
    // *************************************
    // This is a temp fix for VS code & Node Inspect issue for writing logs to the console, should be removed when it will be fixed.
    // https://github.com/Microsoft/vscode/issues/19750
  const winstonCommon = require('winston/lib/winston/common')
  logger.transports.Console.prototype.log = function (level, message, meta, callback) {
    const output = winstonCommon.log(Object.assign({}, this, {level, message, meta}))
    console[level in console ? level : 'log'](output)
    setImmediate(callback, null, true)
  }

  // Clear the default transports
  logger.clear()

    // Add console transport
  logger.add(logger.transports.Console, {
    name: 'consoleLogger',
    level: 'debug',
    prettyPrint: true,
    colorize: true,
    silent: false,
    timestamp: configuration.LogTimeStampConsole,
    useConsole: true
  })

  // Add file transport
  logger.add(logger.transports.File, {
    name: 'fileLogger',
    level: 'debug',
    filename: configuration.LogFileName,
    dirname: logPath,
    handleExceptions: true,
    json: true,
    timestamp: true,
    maxsize: 5 * 1024 * 1024, // 5 MB
    // maxFiles: 10,  don't limit logs
    colorize: false
  })

  // Handling first time launch where the folder is missing
  logger.default.transports.fileLogger.on('error', function (err) {
    if (err.code === 'ENOENT') {
      var fs = require('fs')
      if (!fs.existsSync(logPath)) {
        fs.mkdirSync(logPath)
      }
    }
  })

  // Add 'user' object to the log if exists
  expressLogger.requestWhitelist.push('user')

  // Set winston as a middleware logger in express
  app.use(expressLogger.logger({ winstonInstance: logger }))

  module.exports = logger
}
