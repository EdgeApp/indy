export function parseHrtimeToSeconds (hrtime) {
  var seconds = (hrtime[0] + (hrtime[1] / 1e9)).toFixed(3)
  return seconds
}

export function timeout (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function normalizeAddress (address: string) {
  return address.toLowerCase().replace('0x', '')
}

export function unpadAddress (address: string): string {
  const normalizedAddress = normalizeAddress(address)
  const unpadded = normalizedAddress.slice(24)
  const out = '0x' + unpadded
  return out
}

export function padAddress (address: string): string {
  const normalizedAddress = normalizeAddress(address)
  const padding = 64 - normalizedAddress.length
  const zeroString = '0000000000000000000000000000000000000000000000000000000000000000'
  const out = '0x' + zeroString.slice(0, padding) + normalizedAddress
  return out
}


export function toLowerCaseSafe (str: string) {
  if(str) {
    return str.toLowerCase()
  } else {
    return str
  }
}

