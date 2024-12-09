import { strict as assert } from 'assert'
import { inspect } from 'util'
inspect.defaultOptions.depth = null
inspect.defaultOptions.maxArrayLength = null

const coords = ([col, row]) => `${col},${row}`
// find coords twice as far from one antenna as the other
const findAntinodes = ([minCol, minRow, maxCol, maxRow], useHarmonics = false) => ([aCol, aRow], [bCol, bRow]) => {
  const [dx, dy] = [bCol - aCol, bRow - aRow]
  let resonances = [-1, 2] // default for part 1
  if (useHarmonics) {
    const maxHarmonics = Math.max(Math.ceil(maxCol / dx), Math.ceil(maxRow / dy))
    const lowerResonances = Array.from(Array(maxHarmonics).keys().map(n => -1 - n)).reverse()
    const upperResonances = Array(maxHarmonics).keys().map(n => 2 + n)
    resonances = [...lowerResonances, ...upperResonances]
  }
  return resonances.map(n => [aCol + n * dx, aRow + n *  dy]).filter(([col, row]) => {
    return col >= minCol && col <= maxCol && row >= minRow && row <= maxRow
  })
}
/*  Given antennas and boundingBox,
 *  yields a list of coordinates for the antinodes.
 */
function* collectAntinodes({ antennas }, config) {
  const { showIntermediate, getAntinodes, addAntennas = false } = config
  const antinodes = []
  for (const { freq, pos } of Object.values(antennas)) {
    if (addAntennas) antinodes.push(...pos)
    const combos = pos.flatMap((a, i) => pos.slice(i + 1).map(b => [a, b]))
    if (showIntermediate) yield { freq, pos, combos }
    combos.forEach(([a, b]) => antinodes.push(...getAntinodes(a, b)))
  }
  yield antinodes.map(coords)
}

/*  Given an array of input: ['............', '........0...', ...],
 *  yields a map of antennas with frequencies and coordinates.
 */
function interpret(input) {
  const antennas = {}
  const boundingBox = [0, 0, input[0].length - 1, input.length - 1]
  let row = 0
  for (const line of input) {
    line.split('').forEach((char, col) => {
      if (char === '.') return
      const { pos } = antennas[char] || { pos: [] }
      antennas[char] = { freq: char, pos: [...pos, [col, row]] }
    })
    row++
  }
  return { antennas, boundingBox }
}

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data)
  config.getAntinodes = (config.part === 1) ? findAntinodes(data.boundingBox) : findAntinodes(data.boundingBox, true)
  config.addAntennas = (config.part === 1) ? false : true
  for (const output of collectAntinodes(data, config)) yield inspect(output), result = output
  const antinodes = new Set(result)
  yield `Unique antinode locations: ${antinodes.size}`
}
