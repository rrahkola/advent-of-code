import { strict as assert } from 'assert'
import { inspect } from 'util'

const recurse = (data, key) => {
  if (/^\d+$/.exec(data[key])) return parseInt(data[key])
  if (/^humn$/.exec(data[key])) return 'humn'
  const { first, op, second } = /^(?<first>\w+) (?<op>[-+/*=]+) (?<second>\w+)/.exec(data[key]).groups
  const expr = `(${recurse(data, first)} ${op} ${recurse(data, second)})`
  // console.log(`${data[key]} ==> ${result}`)
  return (expr.includes('humn')) ? expr : eval(expr)
}

// Given a mathematical expression containing 'humn', creates a function which unwraps 'humn'
const inverseRecurse = (expr, result) => {
  if (expr === 'humn') return result
  const termFirst = /^\((?<termStr>-?\d+) (?<op>[-+/*]) (?<pred>.*)\)$/.exec(expr)
  const termLast = /^\((?<pred>.*) (?<op>[-+/*]) (?<termStr>-?\d+)\)$/.exec(expr)
  const { termStr, op, pred } = (termFirst) ? termFirst.groups : termLast.groups
  const term = parseInt(termStr)
  const next = {
    '-': (term, result) => (termFirst) ? term - result : result + term,
    '+': (term, result) => result - term,
    '/': (term, result) => (termFirst) ? term / result : result * term,
    '*': (term, result) => result / term
  }[op](term, result)
  // console.log(`${pred} === ${next}`)
  return inverseRecurse(pred, next)
}

/* Given an object of monkeys: { root: 'pppw + sjmn', dbpl: '5', ... }
 * Recursively evaluate the expression for monkey 'root'
 */
function* part1(data, config) {
  const { showIntermediate } = config
  const root = recurse(data, 'root')
  if (showIntermediate) yield { root }
  yield { root: eval(root) }
}

/* Given an object of monkeys: { root: 'pppw + sjmn', dbpl: '5', ... }
 * Recursively check which  'root'
 */
function* part2(data, config) {
  const { showIntermediate } = config
  data.humn = 'humn'
  const rootExprs = data.root.split(/ [-+/=] /)
  const exprs = [recurse(data, rootExprs[0]), recurse(data, rootExprs[1])]
  yield { exprs }
  const humn = (Number.isFinite(exprs[0]))
    ? inverseRecurse(exprs[1], exprs[0])
    : inverseRecurse(exprs[0], exprs[1])
  yield { humn }
}

/* Given an arrray of input: ['root: pppw + sjmn', 'dbpl: 5', ...]
 * Yields an object of monkeys with values:
 * { root: 'pppw + sjmn', dbpl: '5', ... }
 */
function interpret(input) {
  const monkeys = Object.fromEntries(input.map(line => [line.split(':')[0], line.split(': ')[1]]))
  return monkeys
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
    for (const output of part1(data, config)) yield inspect(output), result = output
  } else {
    // Find answer for part 2
    config.maxRange = 10000000
    for (const output of part2(data, config)) yield inspect(output), result = output
  }
}
