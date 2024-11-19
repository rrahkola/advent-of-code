import { ok } from 'assert'
// NOTE: Could import mathjs to get a more robust LCM implementation

/**
 * Given a set of [[i1, i2, ...], ...] representing iterations of multiple cyclical events,
 * predicts the iteration at which all cycles will be aligned.
 */
export function checkAlignment (...eventsToCycle) {
  const cycles = []
  eventsToCycle.forEach(([offset, ...events]) => {
    const period = events[0] - offset
    ok(events.length > 0, `Expecting at least two events per cycle: ${[offset, ...events]}`)
    ok(events.every(Number.isInteger), `Expecting all events to be integers: ${[offset, ...events]}`)
    ok(events.reduce((acc, e) => e - acc === period, offset), `Expecting all events have same period: ${[offset, ...events]}`)
    cycles.push({ offset, period })
  })
  const maxPeriod = lcm(...cycles.map(({ period }) => period))
  console.log(`LCM of periods: ${maxPeriod}`)
  return maxPeriod
}

export function lcm (...numbers) {
  const lcmPair = (a, b) => {
    const [lesser, greater] = [Math.min(a, b), Math.max(a, b)]
    for (let i = greater; i <= a * b; i += greater) {
      if (i % lesser === 0) return i
    }
  }
  return numbers.reduce(lcmPair, 1)
}