import { strict as assert } from 'assert'
import { inspect } from 'util'

const reverse = (str) => str.split('').reverse().join('')

/* Given an array of input: ['', ...]
 */
function* part1(data, config) {
  const { showIntermediate } = config
  const values = []
  for (const line of data) {
    const first = line.replace(/[a-z]/g, '')[0]
    const last = reverse(line).replace(/[a-z]/g, '')[0]
    if (showIntermediate) yield { line, twoDigits: first + last }
    values.push(parseInt(first + last))
  }
  yield values
}

const digits = {
  one: '1', 1: '1',
  two: '2', 2: '2',
  three: '3', 3: '3',
  four: '4', 4: '4',
  five: '5', 5: '5',
  six: '6', 6: '6',
  seven: '7', 7: '7',
  eight: '8', 8: '8',
  nine: '9', 9: '9'
}
const digitRegex = /(one|two|three|four|five|six|seven|eight|nine|1|2|3|4|5|6|7|8|9)/
const tigidRegex = /(eno|owt|eerht|ruof|evif|xis|neves|thgie|enin|1|2|3|4|5|6|7|8|9)/
function* part2(data, config) {
  const { showIntermediate } = config
  let values = []
  for (const line of data) {
    const first = digits[digitRegex.exec(line)[0]]
    const last = digits[reverse(tigidRegex.exec(reverse(line))[0])]
    if (showIntermediate) yield { line, twoDigits: first + last }
    values.push(parseInt(first + last))
  }
  yield values
}

/* Given an array of input: ['', ...]
 */
function interpret(input) { return input }

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
    for (const output of part1(data, config)) yield inspect(output), result = output
  } else {
    // Find answer for part 2
    for (const output of part2(data, config)) yield inspect(output), result = output
  }
  const sum = result.reduce((acc, n) => acc + n, 0)
  yield inspect({ sum })
}
