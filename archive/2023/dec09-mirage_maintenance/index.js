import { strict as assert } from 'assert'
import { inspect } from 'util'

const diff = (el, idx, arr) => (idx === 0) ? [] : el - arr[idx-1]

/* Given an array of OASIS history: [[0, 3, 6, 9, 12, 15], ...],
 * extrapolate the prediction for each data point (array)
 */
function* predictOasis(data, config) {
  const { showIntermediate } = config
  for (const history of data) {
    const diffs = [history]
    let tmp = [...history]
    // 1st pass -- construct the sequence of differences
    while (!tmp.every(el => el === 0)) {
      tmp = tmp.map(diff).flat()
      diffs.push(tmp)
    }
    const initLength = diffs.reverse().shift().length
    // 2nd pass -- construct extrapolation/prediction
    const prediction = diffs.reduce((diff, seq, idx) => diff + seq[initLength + idx], 0)
    history.push(prediction)
    if (showIntermediate) yield { diffs }
  }
  yield data
}

/* Given an array of input: ['0 3 6 9 12 15', ...]
 * convert each line to an array of integers (OASIS history)
 *    [[0, 3, 6, 9, 12, 15], ...]
 */
const interpret = (input) => input.map(line => line.split(/\s+/).map(num => parseInt(num)))

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  let data = interpret(input)
  if (config.showIntermediate) yield inspect(data)
  // Find answer for part 2
  if (config.part === 2) data = data.map(history => history.reverse())

  for (const output of predictOasis(data, config)) yield inspect(output), result = output
  const sumPredictions = result.reduce((acc, arr) => acc + arr.slice(-1)[0], 0)
  yield inspect({ sumPredictions })
}
