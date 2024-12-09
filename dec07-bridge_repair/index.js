import { strict as assert } from 'assert'
import { inspect } from 'util'
inspect.defaultOptions.depth = null
inspect.defaultOptions.maxArrayLength = null

const twoOps = (a, b) => [a + b, a * b]
const threeOps = (a, b) => [a + b, a * b, Number.parseInt('' + a + b, 0)]
function compute (start, ops, operands, goal) {
  if (operands.length === 0) return [start]
  const [term, ...remaining] = operands
  return ops(start, term).flatMap(el => (el <= goal) ? compute(el, ops, remaining, goal) : [])
}
/*  Given <output of interpret>,
 *  yields
 */
function* part1({ calibrations}, config) {
  const valid = []
  const { showIntermediate, ops } = config
  for (const { goal, operands: [start, ...remaining] } of calibrations) {
    const totals = compute(start, ops, remaining, goal) || []
    if (showIntermediate) console.log({ msg: `Checking ${goal}`, totals })
    if (totals.some(total => total === goal)) valid.push({ goal, operands: [start, ...remaining] })
  }
  yield { valid }
}

/*  Given an array of input: ['190: 10 19', '3267: 81 40 27', ...],
 *  yields an array of calibrations: [{ goal: 190, operands: [10, 19] }, ...]
 */
function interpret(input) {
  const calibrations = []
  for (const line of input) {
    const [goal, operands] = line.split(': ')
    calibrations.push({ goal: Number(goal), operands: operands.split(' ').map(el => Number.parseInt(el, 0)) })
  }
  return { calibrations }
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
  config.ops = (config.part === 1) ? twoOps : threeOps
  for (const output of part1(data, config)) yield inspect(output), result = output
  yield `Total calibration result: ${result.valid.reduce((acc, { goal }) => acc + goal, 0)}`
}
