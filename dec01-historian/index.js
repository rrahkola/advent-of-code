import { strict as assert } from 'assert'
import { inspect } from 'util'

/*  Given an array of input: ['3   4', '4   3', ...],
 *  yields two arrays of numbers: [[3, 4], [4, 3], ...]
 */
function interpret(input) {
  const freqCount = (eq) => (val) => eq === val
  const [left, right] = [[], []]
  for (const line of input) {
    const [a, b] = line.split(/\s+/).map(Number)
    left.push(a)
    right.push(b)
  }
  const freq = left.reduce((acc, val) => ({ ...acc, [val]: right.filter(freqCount(val)).length}) , {})
  return [left.sort(), right.sort(), freq]
}

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data, { depth: null, maxArrayLength: null })
  if (config.part === 1) {
    // Find answer for part 1
    const result = data[0].reduce((acc, val, idx) => acc + Math.abs(val - data[1][idx]), 0)
    yield result
  } else {
    // Find answer for part 2
    const freq = data[2]
    const result = data[0].reduce((acc, val) => acc + val * freq[val] || 0, 0)
    yield result
  }
}
