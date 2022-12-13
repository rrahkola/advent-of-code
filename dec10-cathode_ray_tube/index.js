import { strict as assert } from 'assert'
import { inspect } from 'util'

// Given [{ cycle: 1, line: 'addx 15', addx: 0, register: 1 }, ...]
// Appends keys 'sprite' and 'pixel'
function* attachSprite(data, config) {
  const { showIntermediate, displayWidth } = config
  const result = data.map(({ cycle, line, addx, register}, idx) => {
    const sprite = [register - 1, register, register + 1]
    const pixel = (sprite.includes(idx % displayWidth)) ? '#' : '.'
    return { cycle, line, addx, register, sprite, pixel }
  })
  yield result
}

// Given instructions: ['noop', 'addx 3', ...]
// Convert to clock-based operations
// Returns [{ cycle: 1, line: 'addx 15', addx: 0, register: 1 }, ...]
function interpret(input) {
  let register = 1, cycle = 0
  const clock = []
  const addxRegex = /^addx (?<value>(-|)\d+)$/
  const pushClock = (line, addx) => {
    clock.push({ cycle: ++cycle, line, addx, register })
    register += addx
  }
  for (const line of input) {
    // both noop and addx have one noop operation
    pushClock(line, 0)
    const addx = line.match(addxRegex)
    if (addx) pushClock(line, parseInt(addx.groups.value))
  }
  return clock
}

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data, { maxArrayLength: null })
  if (config.part === 1) {
    // Find sum of signal strength for cycles 20, 60, 100, 140, 180, 220
    config.selectCycles = [20, 60, 100, 140, 180, 220]
    data.unshift(0) // fix indices to match cycles
    const selectedCycles = data.filter((_, idx) => config.selectCycles.includes(idx))
    const strengths = selectedCycles.map(cycle => cycle.cycle * cycle.register)
    if (config.showIntermediate) yield inspect({ selectedCycles, strengths })
    yield inspect({ sumStrength: strengths.reduce((acc, el) => acc + el, 0) })
  } else {
    // print the CRT display, one line at a time
    config.displayWidth = 40
    for (const output of attachSprite(data, config)) yield inspect(output), result = output
    const pixels = result.map(el => el.pixel)
    for (const idx of [200, 160, 120, 80, 40]) pixels.splice(idx, 0, '\n')
    yield pixels.join('')
  }
}
