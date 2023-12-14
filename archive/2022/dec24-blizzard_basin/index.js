import { strict as assert } from 'node:assert'
// import { createInterface } from 'node:readline'
import { inspect } from 'util'
import { Blizzards } from './basin.js'
// const readline = createInterface({ input: process.stdin, output: process.stdout })
import getPrompt from 'prompt-sync'
const prompt = getPrompt()

function nextStates(states, { blizzards, basin }) {
  const occupied = blizzards.occupied()
  const moves = ['up', 'down', 'left', 'right', 'stay']
  const next = new Set()
  for (const key of states.keys()) {
    const node = basin[key]
    moves.map(dir => node[dir] || []).flat().forEach(dirKey => (occupied.includes(dirKey)) ? null : next.add(dirKey))
  }
  return next
}

/* Given collections of basin positions and blizzards,
 * performs a time evolution of possible board states,
 * returning when the possible states includes the end goal.
 */
function* shortestWalk({ basin, blizzards, board }, config) {
  const { showIntermediate } = config
  const { start, end } = board
  let time
  let possible = new Set([start])
  if (showIntermediate) console.log('Start:', possible)
  while(true) {
    time = blizzards.tick()
    let next_possible = nextStates(possible, { blizzards, basin })
    if (showIntermediate) yield { start, end, possible, next_possible, occupied: blizzards.occupied() }
    possible = next_possible
    if (next_possible.has(end)) break
    if (next_possible.size === 0) break
  }
  yield { time }
}

/* Given an array of input ['#S#########', '#....>....#', ...],
 * yields arrays of:
 *   borders -- original walls
 *   blizzards -- initial positions, directions, embedded height & width dims
 *   basin -- navigable positions, including 'start' and 'end'
 * Also yields board width and height
 */
function interpret(input) {
  const board = {}
  const borders = {}
  const basin = {}
  board.width = input[0].length
  board.height = input.length
  // Default start/end, see note below
  board.start = '1,0'
  board.end = `${board.width-2},${board.height-1}`
  const blizzards = new Blizzards({ width: board.width, height: board.height })
  const fillBasin = (char, col, row) => {
    const key = `${col},${row}` // JSON.stringify({ col, row })
    if (/[v^<>]/.exec(char)) blizzards.add(char, col, row)
    if (char !== '#') basin[key] = { key, char: '.', col, row }
    else borders[key] = { key, char, col, row }
    if (/[SE]/.exec(char)) basin[key] = { key, char, col, row }
    // Below is based on a modified input w/ 'S' and 'E'
    if (char === 'S') board.start = key
    if (char === 'E') board.end = key
  }
  input.forEach((line, row) => line.split('').forEach((char, col) => fillBasin(char, col, row)))
  // 2nd pass: connect basin nodes
  for (const node of Object.values(basin)) {
    const { row, col } = node
    const [up, down, left, right, stay] = [[row-1,col], [row+1,col], [row,col-1], [row,col+1], [row, col]].map(p => (basin[`${p[1]},${p[0]}`]) ? `${p[1]},${p[0]}` : undefined )
    Object.assign(node, { up, down, left, right, stay })
  }
  return { basin, blizzards, borders, board }
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
  // Find answer for part 1
  for (const output of shortestWalk(data, config)) yield inspect(output), result = output
  if (config.part === 1) return
  // Find answer for part 2
  let tmpGoal = data.board.start
  data.board.start = data.board.end
  data.board.end = tmpGoal
  for (const output of shortestWalk(data, config)) yield inspect(output), result = output
  tmpGoal = data.board.start
  data.board.start = data.board.end
  data.board.end = tmpGoal
  for (const output of shortestWalk(data, config)) yield inspect(output), result = output
  return
}
