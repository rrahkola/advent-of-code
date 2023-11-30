import { strict as assert } from 'assert'
import { inspect } from 'util'

// Given a datastream, find the index after the first four unique characters
function * findNextIndex (data, config) {
  const { showIntermediate, numUnique } = config
  let window = data.slice(0, numUnique)
  for (let i = numUnique; i <= data.length; i++) {
    // check for duplicates
    if (window.reduce((acc, char, idx) => acc || window.indexOf(char) < idx, false)) {
      // slide the window
      window.shift()
      window.push(data[i])
      if (showIntermediate) yield { window, index: i }
    } else {
      yield { window, nextIndex: i }
      return
    }
  }
  yield 'ERROR: never found start-of-packet marker'
}

function * part1 (data, config) {
  const { showIntermediate } = config
  yield 'Howdy'
}

// ['mjqjpqmgbl', ...] => [['m', 'j', 'q', 'j', 'p', 'q', 'm', 'g', 'b', 'l'], ...]
function interpret (input) { return input.map(line => line.split('')) }

export default function * pickPart (input, config) {
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  const { part } = config
  assert([1, 2].includes(part), 'Valid parts are 1 or 2')
  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data)
  if (part === 1) {
    // Find next index after start-of-packet marker for each line
    config.numUnique = 4
  } else {
    // Find next index after start-of-message marker for each line
    config.numUnique = 14
  }
  for (const line of data) {
    for (const result of findNextIndex(line, config)) yield inspect(result)
  }
}
