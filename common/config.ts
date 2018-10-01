import * as consts from './consts'

export class Config {
  _dBUrl: string
  _bucketName: string
  _bucketPassword: string
  _liveBucketName: string
  _liveBucketPassword: string
  constructor () {
    this._dBUrl = consts.dBUrl
    this._bucketPassword = consts.bucketPassword
    this._liveBucketPassword = consts.liveBucketPassword
  }

  get DBUrl (): string { return this._dBUrl }
  set DBUrl (dbUrl: string) { this._dBUrl = dbUrl }

  get BucketPassword (): string { return this._bucketPassword }
  set BucketPassword (bucketPassword: string) { this._bucketPassword = bucketPassword }

  get LiveBucketPassword (): string { return this._liveBucketPassword }
  set LiveBucketPassword (bucketPassword: string) { this._liveBucketPassword = bucketPassword }
}

export const configuration = new Config()
