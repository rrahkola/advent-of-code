import { strict as assert } from 'assert'
import { inspect } from 'util'
import { Link } from './link.js'

/* Given an array of 1-d encrypted coords,
 * iterates through each coord and modifies the current position of each element in the array based on the movement described by the coord
 */
function* mixData(data, config) {
  const { showIntermediate } = config
  const size = data[0].size()
  const start = data.find(el => el.value === 0)
  for (const el of data) el.value *= config.decryption
  if (showIntermediate) yield data[0].toArray()
  for (const _ of new Array(config.loop).fill(0)) {
    for (const el of data) {
      if (el.value > 0) el.shiftForward(el.value % (size - 1))
      if (el.value < 0) el.shiftBackward(Math.abs(el.value) % (size - 1))
      // if (showIntermediate) console.log(data[0].toArray())
    }
    if (showIntermediate) yield start.toArray()
  }
  yield { coords: [start.peek(1000), start.peek(2000), start.peek(3000)] }
}

/* Given an array of input: [1, 2, -3, 3, -2, 0, 4],
 * returns an array of coords as linked list:
 * [{ value: 1, prev: <el>, next: <el> }, ...]
 */
function interpret(input) {
  let current = null
  const arr = input.map(value => current = new Link(value, current))
  return arr
}

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0 && Number.isInteger(input[0]),
    'Must provide data as array of integers, use options "-t lines -t integer"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data)
  if (config.part === 1) {
    // Find answer for part 1
    config.decryption = 1
    config.loop = 1
    for (const output of mixData(data, config)) yield inspect(output), result = output
  } else {
    // Find answer for part 2
    config.decryption = 811589153
    config.loop = 10
    for (const output of mixData(data, config)) yield inspect(output), result = output
  }
  const sum = result.coords.reduce((acc, el) => acc + el, 0)
  yield inspect({ sum })
}
