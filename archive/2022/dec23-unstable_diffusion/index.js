import { strict as assert } from 'assert'
import { inspect } from 'util'
import { Elf, choice } from './elf.js'

const printBoard = (elves, printId = false) => {
  const elfX = elves.map(elf => elf.xPos)
  const elfY = elves.map(elf => elf.yPos)
  const xRange = []
  for (let x = Math.min(...elfX); x <= Math.max(...elfX); x++) xRange.push(x)
  const yRange = []
  for (let y = Math.min(...elfY); y <= Math.max(...elfY); y++) yRange.push(y)
  const board = []
  for (const y of yRange) {
    const line = []
    for (const x of xRange) {
      let elf = elves.find(elf => elf.xPos === x && elf.yPos === y)
      const char = (!elf) ? ' .' : (printId) ? String(elf.id).padStart(2) : ' #'
      line.push(char)
    }
    board.push(line.join(' '))
  }
  return board
}
/* Given an array of elves w/ positions: [{ xPos, yPos }, ...]
 * runs a
 */
function* runSimulation(elves, config) {
  const { showIntermediate, numRounds, detectMovement } = config
  const checkUnique = (coord, idx, arr) => {
    const first = arr.findIndex(el => el.xPos === coord.xPos && el.yPos === coord.yPos)
    const last = arr.findLastIndex(el => el.xPos === coord.xPos && el.yPos === coord.yPos)
    return idx === first && idx === last
  }
  let round = choice
  let i = 1
  while(true) {
    if (numRounds && i > numRounds) break
    // first half -- decide where to move to
    const newCoords = elves.map(elf => elf.decide(round))
    // second half -- actually attempt to move (no conflicts)
    const shouldMove = newCoords.map(checkUnique)
    if (detectMovement) {
      const willStay = newCoords.map((coord, idx) => coord.xPos === elves[idx].xPos && coord.yPos === elves[idx].yPos)
      if (willStay.reduce((acc, tf) => acc && tf, true)) {
        yield { round: i }
        break
      }
    }
    newCoords.forEach((coord, idx) => (shouldMove[idx]) ? elves[idx].moveTo(coord) : false)
    if (showIntermediate) yield printBoard(elves, config.printId)
    round = round.next
    i++
  }
}

/* Given an array of input: ['....#..', ...],
 * yields an array of elves with their coordinate positions (centered at 250, 250)
 */
function interpret(input) {
  const width = Math.max(...input.map(str => str.length))
  let y = 250 - Math.floor(input.length / 2)
  const minX = 250 - Math.floor(width / 2)
  const elves = []
  for (const line of input) {
    let x = minX
    for (const char of line.split('')) {
      if (char === '#') elves.push(new Elf(x, y, elves))
      x++
    }
    y++
  }
  return elves
}

export default function* pickPart(input, config) {
  let result
  // config.printId = true
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = interpret(input)
  if (config.showIntermediate) console.log(printBoard(data, config.printId).join('\n'))
  if (config.part === 1) {
    // Find answer for part 1
    config.numRounds = 10
    for (const output of runSimulation(data, config)) yield inspect(output), result = output
    const board = printBoard(data).join('\n')
    if (config.showIntermediate) console.log(board)
    const numSpaces = [...board.matchAll(/\./g)]
    yield `{ numSpaces: ${numSpaces.length} }`
  } else {
    // Find answer for part 2
    config.detectMovement = true
    for (const output of runSimulation(data, config)) yield inspect(output), result = output
  }
}
