import * as nano from 'nano'
import { configuration } from './config' //TODO fix configuration

export var dbHandler = nano(configuration.DBUrl)
