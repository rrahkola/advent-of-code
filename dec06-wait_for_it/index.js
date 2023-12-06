import { strict as assert } from 'assert'
import { inspect } from 'util'

/* Given an array of races:
 *    [{ time: 7, record: 9 }, ...]
 * yields an array of scenarios for each race which beats the current record.
 * The length of scenarios is the number of ways the record can be beat.
 */
function* findWinners(races, config) {
  const { showIntermediate } = config
  const winning = new Array(races.length)
  let raceId = 0
  while (raceId < races.length) {
    const { time, record } = races[raceId]
    winning[raceId] = new Array(time).fill(0).map((_, idx) => idx * (time - idx)).filter(el => el > record)
    raceId++
  }
  yield winning
}

export default function* pickPart(input, config) {
  let result, races
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  if (config.part === 1) {
    // Find answer for part 1
    races = input.shift().replace(/Time:\s+/, '').split(/\s+/).map(num => ({ time: parseInt(num) }))
    input.shift().replace(/Distance:\s+/, '').split(/\s+/).forEach((num, idx) => races[idx]['record'] = parseInt(num))
  } else {
    // Find answer for part 2
    races = [{
      time: parseInt(input.shift().replace(/Time:\s+/, '').replace(/\s+/g, '')),
      record: parseInt(input.shift().replace(/Distance:\s+/, '').replace(/\s+/g, ''))
    }]
  }
  if (config.showIntermediate) yield inspect(races)
  for (const output of findWinners(races, config)) yield inspect(output), result = output
  const winningProduct = result.reduce((acc, arr) => acc * arr.length, 1)
  yield inspect({ winningProduct })
}
