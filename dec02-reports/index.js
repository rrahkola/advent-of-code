import { strict as assert } from 'assert'
import { inspect } from 'util'

const checkSafety = (report) => {
  const safety = report.reduce((acc, val) => {
    if (acc === -1) return acc
    if (val > acc && val - acc <= 3) return val
    return -1
  }, report[0] - 1)
  return (safety !== -1)
}

/*  Given a list of reports,
 *  bins into safe (monotonically increasing) and unsafe reports
 */
function* safeReports1(reports, config) {
  const safe = []
  const unsafe = []
  const { showIntermediate } = config
  for (const report of reports) {
    const safety = checkSafety(report)
    if (showIntermediate) yield { report, safety }
    const latest = (safety) ? safe.push(report) : unsafe.push(report)
  }
  yield { safe, unsafe }
}

/*  Given a list of reports,
 *  bins into safe (after dampening) and unsafe reports
 */
function* dampenedSafeReports(reports, config) {
  const safe = []
  const unsafe = []
  const { showIntermediate } = config
  for (const report of reports) {
    const safety = report.some((_, idx) => checkSafety(report.toSpliced(idx, 1)))
    if (showIntermediate) yield { report, safety }
    const latest = (safety) ? safe.push(report) : unsafe.push(report)
  }
  yield { safe, unsafe }
}

/*  Given an array of input: ['7 6 4 2 1', ...],
 *  yields an array of reports in ascending order: [[1, 2, 4, 6, 7], ...]
 */
function interpret(input) {
  const reports = []
  for (const line of input) {
    const report = line.split(' ').map(val => Number.parseInt(val, 0))
    const diffs = report.map((val, idx, arr) => val - (report[idx - 1] || report[0]))
    const avgDiff = diffs.reduce((acc, val) => acc + val, 0) / diffs.length
    const ascendingOrder = (avgDiff < 0) ? reports.push(report.reverse()) : reports.push(report)
  }
  return reports
}

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data, { depth: null, maxArrayLength: null })
  if (config.part === 1) {
    // Find answer for part 1
    for (const output of safeReports1(data, config)) yield inspect(output), result = output
    yield `Safe reports: ${result.safe.length}`
  } else {
    // Find answer for part 2
    for (const output of dampenedSafeReports(data, config)) yield inspect(output), result = output
    yield `Safe reports: ${result.safe.length}`
  }
}
