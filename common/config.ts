import * as consts from './consts'

export class Config {
  _dBUrl: string
  _bucketName: string
  _bucketPassword: string
  constructor () {
    this._dBUrl = consts.dBUrl
    this._bucketName = consts.bucketName
    this._bucketPassword = consts.bucketPassword
  }

  get DBUrl (): string { return this._dBUrl }
  set DBUrl (dbUrl: string) { this._dBUrl = dbUrl }

  get BucketName (): string { return this._bucketName }
  set BucketName (bucketName: string) { this._bucketName = bucketName }

  get BucketPassword (): string { return this._bucketPassword }
  set BucketPassword (bucketPassword: string) { this._bucketPassword = bucketPassword }
}

export const configuration = new Config()
