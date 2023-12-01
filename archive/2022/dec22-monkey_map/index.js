import { strict as assert } from 'assert'
import { inspect } from 'util'
import { GridPoint } from './grid.js'
import { foldExample, foldInput, walkFolds } from './folding.js'

const printBoard = (rawGrid) => {
  const board = [...rawGrid]
  let row = [board.shift()]
  while (true) {
    const next = board.shift()
    if (!next || next.xPos === 0) {
      const line = row.map(el => (el.isWall) ? '#' : (el.isEmpty) ? ' ' : '.').join('')
      // const line = row.map(el => String(el.yPrev.yPos).padEnd(3)).join('')
      console.log(line)
      row = [next]
      if (!next) break
    } else {
      row.push(next)
    }
  }
}

/* Given an array of grid points:
 *   [{ wall: t/f, empty: t/f, xPos, xPrev, yPrev, xNext, yNext }, ...]
 */
function* walkFlatMap({ grid, instructions }, config) {
  const { showIntermediate } = config
  let node = grid[0]
  for (const step of instructions) {
    if (showIntermediate) yield { ...node.status(), step }
    if (/[RL]/.exec(step)) node.turn(step)
    else node = node.walk(parseInt(step))
  }
  yield node.status()
}

function* walkCube({ grid, instructions }, config) {
  const { showIntermediate, folds } = config
  walkFolds(grid, folds)
  let node = grid[0]
  node.direction = 'moveRight'
  for (const step of instructions) {
    if (showIntermediate) yield { ...node.status(), step }
    if (/[RL]/.exec(step)) node.turn(step)
    else node = node.walk(parseInt(step))
  }
  yield node.status()
}

/* Given a raw string of input,
 * yields a 1-d array of linked GridPoints:
 *   [{ wall: t/f, empty: t/f, xPos, xPrev, yPrev, xNext, yNext }, ...]
 * representing the board of tiles.
 */
function interpret(rawInput, showIntermediate) {
  // split by lines, remove blanks
  const input = rawInput.split('\n').reduce((arr, line) => (line.length === 0) ? arr : arr.concat([line]), [])
  const instructions = input.pop().replaceAll('R', '*R*').replaceAll('L', '*L*').split('*')
  const width = Math.max(...input.map(line => line.length))
  const rawGrid = []
  let prevRow = []
  let rowNum = 0
  for (const line of input) {
    let xPrev = null
    const currRow = String(line)
      .padEnd(width, ' ')
      .split('')
      .map((char, idx) => xPrev = new GridPoint(char, idx, rowNum, xPrev))
    for (const point of currRow) point.link(...prevRow)
    rawGrid.push(...currRow)
    prevRow = currRow
    rowNum++
  }
  if (showIntermediate) printBoard(rawGrid)
  const grid = rawGrid.filter(el => el.clean())
  grid[0].direction = 'moveRight'
  return { grid, instructions }
}

export default function* pickPart(input, config) {
  let result
  assert(
    typeof input === 'string' || input instanceof String,
    'Must provide input as raw, use options "-t raw"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = interpret(input, config.showIntermediate)
  if (config.part === 1) {
    // Find answer for part 1
    for (const output of walkFlatMap(data, config)) yield inspect(output), result = output
  } else {
    // Find answer for part 2
    config.folds = (input.length < 200) ? foldExample : foldInput
    for (const output of walkCube(data, config)) yield inspect(output), result = output
  }
  yield inspect({ password: 1000 * result.y + 4 * result.x + result.facing })
}
