import { strict as assert } from 'assert'
import { inspect } from 'util'
import { sprites } from './sprites.js'

const PRINT_MODULUS = 500

// Determines contact directions between sprite and any object in the background (including edges)
function touching(sprite, bkg, direction) {
  assert(bkg.length > sprite.length, 'Background must be longer than sprite')
  const result = { left: false, right: false, down: false }
  result.left = result.left || sprite.map(line => line[0]).includes('#') // left edge
  result.right = result.right || sprite.map(line => line.slice(-1)).includes('#') // right edge
  for (let i = 0; i < sprite.length; i++) {
    const spriteLine = sprite[i].split('')
    spriteLine.forEach((char, j) => {
      if (char === '.') return
      result.left = result.left || bkg[i][j-1] === '#'
      result.right = result.right || bkg[i][j+1] === '#'
      result.down = result.down || bkg[i+1][j] === '#'
    })
  }
  return result
}
/** Overlaps the sprite with the chamber
 * returns true if sprite rests on the tower (one or more adjacent '#')
 */
function placeSprite(sprite, chamber, chamberIdx) {
  const overlapLines = (a, b) => a.split('').map((char, idx) => (char === '#' || b[idx] === '#') ? '#' : '.').join('')
  sprite.forEach((line, i) => chamber[chamberIdx + i] = overlapLines(line, chamber[chamberIdx + i]))
}

// Shifts a sprite w/o cycling past an edge
function shiftLeft(sprite, bkg) {
  return (touching(sprite, bkg).left) ? [...sprite] : sprite.map(line => line.slice(1) + '.')
}
function shiftRight(sprite, bkg) {
  return (touching(sprite, bkg).right) ? [...sprite] : sprite.map(line => '.' + line.slice(0, -1))
}

/* Given a chamber & sets of sprites and ops,
 * adjust the sprite until it comes to rest in the chamber.
 */
function dropSprite(data, state) {
  const { chamber, ops, sprites } = data
  let { spriteIdx, opsIdx } = state
  let sprite = [...sprites[spriteIdx++]]
  spriteIdx %= sprites.length
  // Start sprite with 3-row gap to top of tower
  let mask = new Array(sprite.length + 3).fill(0).map(_ => '.......')
  chamber.unshift(...mask)
  let window = [0, sprite.length + 1]
  while (true) {
    const bkg = chamber.slice(...window)
    const nextOps = ops[opsIdx++]
    opsIdx %= ops.length
    sprite = nextOps(sprite, bkg)
    if (touching(sprite, bkg).down) break
    window = window.map(el => el + 1)
  }
  placeSprite(sprite, chamber, window[0])
  // Remove empty lines from chamber
  while (chamber[0] === '.......') chamber.shift()
  const surface = `l0:${chamber[0].indexOf('#')}`
  return { spriteIdx, opsIdx, surface }
}

/* Given an array of input: ['<><>>><<<'],
 * returns a 7-column chamber, the sprites (as arrays of 7-char strings), and array of operations:
 * {
 *   chamber: ['#######'],
 *   sprites: [['..####.'], ...]
 *   ops: [shiftLeft, shiftRight, shiftLeft, ...]
 * }
 */
function interpret(input) {
  const chamber = ['#######'] // floor
  let ops = []
  for (const line of input) {
    ops = line.split('').map(el => (el === '<') ? shiftLeft : shiftRight)
  }
  return { chamber, sprites, ops }
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
  let state = { spriteIdx: 0, opsIdx: 0, surface: 'l0:-1' }
  if (config.part === 1) {
    // Find height of the tower after dropping 2022 sprites
    for (let i=1; i <= 2022; i++) {
      state = dropSprite(data, state)
      if (config.showIntermediate && i % PRINT_MODULUS === 0) yield data.chamber.join('\n')
    }
    yield inspect({ towerHeight: data.chamber.length - 1 })
  } else {
    // Find height of the tower after dropping 1000000000000 sprites; needs cycle detection
    config.numSprites = 1000000000000
    const serialize = (state) => `sp:${state.spriteIdx},op:${state.opsIdx},${state.surface}`
    const knownStates = [serialize(state)]
    const heights = [0]
    let i = 0
    let cycleStartIdx = 0
    // Determine cycle start
    while(true) {
      state = dropSprite(data, state)
      const stateString = serialize(state)
      cycleStartIdx = knownStates.indexOf(stateString)
      const height = data.chamber.length - 1
      knownStates.push(stateString)
      heights.push(height)
      if (i++ % PRINT_MODULUS === 0 && config.showIntermediate) yield inspect({ height, stateString })
      if (cycleStartIdx >= 0 && i > 2000) break // empirically caught a false cycle
    }
    const startHeight = heights[cycleStartIdx]
    const cycle = heights.map((height, idx) => ({ state: knownStates[idx], height: height - startHeight })).slice(cycleStartIdx + 1)
    const cycleHeight = cycle.slice(-1)[0].height
    const remainingSprites = config.numSprites - cycleStartIdx - 1
    const remainingHeight = Math.floor(remainingSprites / cycle.length) * cycleHeight + cycle[remainingSprites % cycle.length].height
    yield inspect({ towerHeight: startHeight + remainingHeight })
  }
}
