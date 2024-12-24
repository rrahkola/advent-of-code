import { strict as assert } from 'assert'
import { inspect } from 'util'
inspect.defaultOptions.depth = null
inspect.defaultOptions.maxArrayLength = null
const MAX_STEPS = 100
const CONVERSION = 10000000000000

const getSteps = (button, prize, dir = 'up') => {
  const [x, y] = button
  const mv = (dir === 'up')
    ? step => `${step * x}, ${step * y}`
    : step => `${prize[0] - step * x}, ${prize[1] - step * y}`
  const steps = []
  let step = 0
  while (step <= MAX_STEPS) {
    const nextStep = mv(step)
    if (nextStep.includes('-')) break
    steps.push(nextStep)
    step += 1
  }
  return steps
}

/*  Given a list of machines with prize locations and buttons,
 *  yields a list of solutions for each machine:
 *   [[{ a: 80, b: 40 }], [], ...]
 */
function* stepSolution({ machines }, config) {
  const { showIntermediate } = config
  const results = []
  for (const { a, b, prize } of machines) {
    const stepsA = getSteps(a, prize, 'up')
    const stepsB = getSteps(b, prize, 'down')
    const solutions = stepsA.filter(step => stepsB.includes(step))
    .map(step => ({ a: stepsA.indexOf(step), b: stepsB.indexOf(step) }))
    if (showIntermediate) console.log({ a, b, prize, solutions })
    results.push(...solutions)
  }
  yield results
}


/* Solves linear equations using Cramer's rule for buttons A and B, prize (x0, y0):
 *  A: y = (a[1] / a[0]) * x ==> -a[1] * x + a[0] * y = 0 (= k1)
 *  B: (y - y0) = (b[1] / b[0]) * (x - x0) ==> -b[1] * x + b[0] * y = b[0] * y0 - b[1] * x0 (= k2)
 */
const solveLinearEqns = (a, b, prize) => {
  const [x0, y0] = prize
  const k2 = b[1] * x0 - b[0] * y0
  const det = a[0] * b[1] - a[1] * b[0]
  const detMod = k2 // leave out *a[0] since we divide by a[0] later to get steps
  return (detMod % det !== 0) ? 0 : detMod / det
}

/*  Given a list of machines with prize locations and buttons,
 *  yields a list of solutions for each machine:
 *   [[{ a: 80, b: 40 }], [], ...]
 */
function* cramerSolution({ machines }, config) {
  const { showIntermediate } = config
  const results = []
  for (const { a, b, prize } of machines) {
    const aSteps = solveLinearEqns(a, b, prize)
    if (aSteps === 0) continue
    const solution = { a: aSteps, b: (prize[0] - aSteps * a[0]) / b[0] }
    if (Math.abs(solution.b - Math.floor(solution.b)) < 1E-6) {
      if (showIntermediate) console.log({ a, b, prize, solution })
      results.push(solution)
    }
  }
  yield results
}

/*  Given an string of input: 'Button A: X+94, Y+34\nButton B: X+22, Y+67\nPrize: X=8400, Y=5400\n\n...',
 *  yields an array of claw machines with prizes:
 *    [{ A: [94, 34], B: [22, 67], prize: [8400, 5400] }, ...]
 */
function interpret(input) {
  const buttonRegex = /Button [A-Z]: X\+(\d+), Y\+(\d+)/
  const prizeRegex = /Prize: X=(\d+), Y=(\d+)/
  const inputRegex = [buttonRegex, buttonRegex, prizeRegex]
  const machines = []
  for (const group of input.split('\n\n')) {
    const machine = {}
    const [a, b, prize] = group.split('\n').map((el, idx) =>
      el.trim().match(inputRegex[idx]).slice(1).map(el => Number.parseInt(el, 0))
    )
    machines.push({ a, b, prize })
  }
  return { machines }
}

export default function* pickPart(input, config) {
  let result
  assert(
    typeof input === 'string' || input instanceof String,
    'Must provide data as a string, use options "-t raw"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data)
  if (config.part === 1) {
    // Find answer for part 1
    for (const output of stepSolution(data, config)) yield inspect(output), result = output
  } else {
    // Find answer for part 2
    data.machines = data.machines.map(({ a, b, prize: [x0, y0] }) => ({ a, b, prize: [x0 + CONVERSION, y0 + CONVERSION] }))
    for (const output of cramerSolution(data, config)) yield inspect(output), result = output
  }
  const cost = result.map(({ a, b }) => 3 * a + b).reduce((acc, el) => acc + el, 0)
  yield `Total cost: ${cost}`
}
