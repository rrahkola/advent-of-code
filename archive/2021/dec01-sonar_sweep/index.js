import { strict as assert } from 'assert'

function * countIncreases (data, config) {
  const { showIntermediate } = config
  const increases = []
  data.reduce((prev, cur) => {
    if (cur - prev > 0) {
      increases.push([cur, 'increases'])
    } else {
    }
    return cur
  }, NaN)
  if (showIntermediate) yield increases.join('\n')
  yield `Number of increases: ${increases.length}`
}

function window (data) {
  const total = data.length
  return data.flatMap((el, idx) => {
    if (idx + 3 > total) return []
    return el + data[idx + 1] + data[idx + 2]
  })
}

export default function * pickPart (data, config) {
  assert(
    Array.isArray(data) && data.length > 0 && Number.isInteger(data[0]),
    'Must provide data as array of integers, use options "-t lines -t integer"'
  )
  const { part } = config
  assert(part <= 2, 'Valid parts are 1 or 2')
  const windowed = part === 2 ? window(data) : data
  if (config.showIntermediate) yield windowed.join('\n')
  for (const result of countIncreases(windowed, config)) yield result
}
