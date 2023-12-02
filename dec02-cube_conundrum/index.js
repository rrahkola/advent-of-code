import { strict as assert } from 'assert'
import { inspect } from 'util'

/* Given an array of input: ['', ...]
 */
function* filterGames(games, config) {
  const { showIntermediate, maxCubes } = config
  const possible = []
  for (const { id, samples, maxCubes: maxShown } of games) {
    const isPossible = ['red', 'blue', 'green'].reduce((acc, color) => acc && maxCubes[color] >= maxShown[color], true)
    if (showIntermediate) yield { id, samples, isPossible }
    if (isPossible) possible.push({ id, samples })
  }
  yield possible
}

function* computePower(games, config) {
  const power = ({ red, blue, green }) => red * blue * green
  const gamePowers = games.map(({ id, maxCubes }) => ({ id, power: power(maxCubes) }))
  yield gamePowers
}

/* Given an array of input: ['Game 1: 3 blue, 4 red; 1 red, 2 green, 6 blue; 2 green', ...]
 * yields an array of games with samples of red, blue, and green cubes
 */
function interpret(input) {
  const games = []
  for (const line of input) {
    const { id } = /Game (?<id>\d+):/.exec(line).groups
    const batches = line.replace(/Game \d+: /).split('; ')
    const samples = []
    for (const batch of batches) {
      const { r } = (batch.includes('red')) ? /(?<r>\d+) red/.exec(batch).groups : { r: 0 }
      const { b } = (batch.includes('blue')) ? /(?<b>\d+) blue/.exec(batch).groups : { b: 0 }
      const { g } = (batch.includes('green')) ? /(?<g>\d+) green/.exec(batch).groups : { g: 0 }
      const [red, blue, green] = [r, b, g].map(num => parseInt(num))
      samples.push({ red, blue, green })
    }
    const maxCubes = {
      red: Math.max(...samples.map(({ red }) => red)),
      blue: Math.max(...samples.map(({ blue }) => blue)),
      green: Math.max(...samples.map(({ green }) => green))
    }
    games.push({ id: parseInt(id), samples, maxCubes })
  }
  return games
}

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data, { depth: 3 })
  if (config.part === 1) {
    // Find answer for part 1
    config.maxCubes = { red: 12, blue: 14, green: 13 }
    for (const output of filterGames(data, config)) yield inspect(output), result = output
    const gameSums = result.reduce((acc, { id }) => acc + id, 0)
    yield inspect({ gameSums })
  } else {
    // Find answer for part 2
    for (const output of computePower(data, config)) yield inspect(output), result = output
    const powerSums = result.reduce((acc, { power }) => acc + power, 0)
    yield inspect({ powerSums })
  }
}
