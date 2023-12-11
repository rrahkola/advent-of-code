import { strict as assert } from 'node:assert'
// import { createInterface } from 'node:readline'
import { inspect } from 'util'
import { Blizzard, PartyState, Walk } from './basin.js'
// const readline = createInterface({ input: process.stdin, output: process.stdout })
import getPrompt from 'prompt-sync'
const prompt = getPrompt()

/* Given collections of basin positions and blizzards,
 * performs a time evolution of possible board states,
 * returning when the possible states includes the end goal.
 */
function* shortestWalk({ basin, blizzards, board }, config) {
  const { showIntermediate } = config
  const { start, end } = board
  let possible = {[start]: JSON.parse(start)}
  if (showIntermediate) console.log({ possible })
  while(true) {
    let next_possible = PartyState.nextStates(config.time, possible, { blizzards, basin })
    if (showIntermediate) yield { time: config.time, possible, next_possible }
    possible = next_possible
    if (Object.keys(next_possible).includes(end)) break
    if (Object.keys(next_possible).length === 0) break
    config.time++
  }
  yield { time: config.time } //, path: possible[end].path }
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
  const blizzards = []
  board.width = input[0].length
  board.height = input.length
  const fillBasin = (char, col, row) => {
    const key = JSON.stringify({ col, row })
    if (/[v^<>]/.exec(char)) blizzards.push(new Blizzard(char, col, row, board.width, board.height))
    if (char !== '#') basin[key] = { char: '.', col, row }
    else borders[key] = { char, col, row }
    if (/[SE]/.exec(char)) basin[key] = { char, col, row }
    if (char === 'S') board.start = key
    if (char === 'E') board.end = key
  }
  input.forEach((line, row) => line.split('').forEach((char, col) => fillBasin(char, col, row)))
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
  config.time = 1
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
