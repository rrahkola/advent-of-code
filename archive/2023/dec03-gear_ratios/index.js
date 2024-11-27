import { strict as assert } from 'assert'
import { inspect } from 'util'

/* Given an array of input: ['..........', '467..114..', '...*......', ...],
 * yields all part numbers, whost context includes a symbol
 */
function* partsWithContext(data, config) {
  const { showIntermediate, findGears } = config
  const parts = []
  const gears = {}
  const addContext = (row, idx) => {
    for (const match of row.matchAll(/(\d+)/g)) {
      const num = match[0]
      const width = num.length + 2
      const context = [idx-1, idx, idx+1].map(i => data[i].slice(match.index-1, match.index-1+width)).join('')
      const isPart = Boolean(context.match(/[^0-9.]/))
      if (findGears && context.includes('*')) {
        const gearIdx = context.indexOf('*')
        const gearRow = Math.floor(gearIdx / width) // 0, 1, or 2
        const gearCol = gearIdx % width
        const gearKey = `r${idx-1 + gearRow}c${match.index-1 + gearCol}`
        if (gears[gearKey]) gears[gearKey].push(parseInt(num))
        else gears[gearKey] = [parseInt(num)]
      }
      if (showIntermediate) console.log({ num, context, isPart })
      if (isPart) parts.push(parseInt(num))
    }
  }
  data.forEach(addContext)
  yield { parts, gears }
}

/* Given an array of input: ['..........', '467..114..', '...*......', ...],
 * yields all gears, whost context includes exactly two numbers
 */
function* gearsWithRatios(data, config) {
  const { showIntermediate, maxNumWidth } = config
  const gears = []
  const addContext = (row, idx) => {
    for (const match of row.matchAll(/\*/g)) {
      const start = match.index - maxNumWidth
      const end = match.index + maxNumWidth + 1
      const context = [idx-1, idx, idx+1].map(i => data[i].slice(start, end)).join('')
      const numbers = context.match(/(\d+)/g)
      if (showIntermediate) console.log({ numbers, context })
      if (numbers && numbers.length === 2) gears.push(numbers)
    }
  }
  data.forEach(addContext)
  yield gears
}

/* Given an array of input: ['467..114..', '...*......', ...]
 * adds borders to provide extra context for first and last lines
 */
function interpret(input) {
  const width = input[0].length
  input.unshift('')
  input.push('')
  return input.map(line => line.padStart(width+1, '.').padEnd(width+2, '.'))
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
  if (config.part === 1) {
    // Find answer for part 1
    for (const output of partsWithContext(data, config)) yield inspect(output), result = output
    const sum = result.parts.reduce((acc, num) => acc + num, 0)
    yield inspect({ sum })
  } else {
    // Find answer for part 2
    config.findGears = true
    for (const output of partsWithContext(data, config)) yield inspect(output), result = output
    const ratios = []
    for (const [key, numbers] of Object.entries(result.gears)) {
      if (numbers.length === 2) ratios.push(numbers[0] * numbers[1])
    }
    const sumRatios = ratios.reduce((acc, ratio) => acc + ratio, 0)
    yield inspect({ sumRatios })
  }
}
