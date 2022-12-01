import { strict as assert } from 'assert'
import { inspect } from 'util'
import sum from 'lodash/sum.js'
import { permutation, default as SevenSegment } from './seven-segment.js'

function * countReadoutAppearancesByLength (data, config) {
  const { showIntermediate } = config
  const validLengths = config.digits.map(
    digit => SevenSegment.properSegments[digit].length
  )
  const appearances = data.map(
    segment =>
      segment.readout.filter(el => validLengths.includes(el.length)).length
  )
  if (showIntermediate) yield inspect({ appearances })
  yield `Readout appearances by length: ${sum(appearances)}`
}

function * sumConvertedReadouts (data, config) {
  const { showIntermediate } = config
  const readouts = {}
  for (const segment of data) {
    readouts[segment.readout.join(' ')] = segment.convertReadout()
  }
  if (showIntermediate) yield inspect({ readouts })
  yield `Sum of converted readouts: ${sum(Object.values(readouts))}`
}

function interpret (input) {
  return input.map(SevenSegment.parseLine)
}

export default function * pickPart (input, config) {
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  const { part } = config
  assert(part <= 2, 'Valid parts are 1 or 2')
  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data)
  if (part === 2) {
    for (const result of sumConvertedReadouts(data, config)) yield result
  } else {
    config.digits = [1, 4, 7, 8]
    for (const result of countReadoutAppearancesByLength(data, config))
      yield result
  }
}
