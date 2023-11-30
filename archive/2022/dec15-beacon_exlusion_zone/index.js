import { strict as assert } from 'assert'
import { inspect } from 'util'
import { default as plotGrid } from '../../../util/plotGrid.js'

/* Given { sensors, beacons },
 * Returns the list of coordinates which are not excluded by nearest beacons.
 */
function* checkExcluded(data, config) {
  const { showIntermediate, xMin, xMax, yMin, yMax } = config
  const { sensors, beacons } = data
  const uncovered = []
  let excluded = []
  let distances = []
  for (let y = yMin; y <= yMax; y++) {
    console.log(`y: ${y}`)
    for (let x = xMin; x <= xMax; x++) {
      distances = sensors.map(sensor => [Math.abs(y - sensor.y) + Math.abs(x - sensor.x), sensor.nearest])
      if (distances.some(([distance, nearest]) => distance <= nearest)) {
        if (showIntermediate) excluded.push({ x, y, char: '#' })
      } else {
        uncovered.push({ x, y, char: '.' })
      }
    }
    if (showIntermediate) yield { y }
  }
  // Remove points which include beacons, sensors
  excluded = excluded.filter(el => !beacons.some(beacon => beacon.x === el.x && beacon.y === el.y))
  excluded = excluded.filter(el => !sensors.some(sensor => sensor.x === el.x && sensor.y === el.y))

  yield { excluded, uncovered }
}

// Given a sensor: { x, y, nearest }, return a list of coords at distance nearest + 1
function locusRing(sensor) {
  const distance = sensor.nearest + 1
  const coords = []
  let y = sensor.y
  // left semicircle
  for (let x = sensor.x - distance; x < sensor.x; x++) coords.push({ x, y: 0 - y }, { x, y: y++ })
  assert(y === sensor.y + distance, `y (${y}) not at max distance (${sensor.y} + ${distance})`)
  // right semicircle
  for (let x = sensor.x; x <= sensor.x + distance; x++) coords.push({ x, y: 0 - y }, { x, y: y-- })
  // remove duplicates (at each end)
  coords.shift()
  coords.pop()
  return coords
}

// Given { sensors }, searches locii of (sensor.nearest + 1) for each sensor for uncovered area
function* searchRings({ sensors }, config) {
  const { showIntermediate, xMin, xMax, yMin, yMax } = config
  let uncovered = []
  for (const sensor of sensors) {
    let coords = locusRing(sensor)
    const ringSize = coords.length
    // exclude out-of-range coords
    coords = coords.filter(el => el.x >= xMin && el.x <= xMax && el.y >= yMin && el.y <= yMax)
    coords = coords.filter(el => !sensors.some(sensor => Math.abs(el.x - sensor.x) + Math.abs(el.y - sensor.y) <= sensor.nearest))
    if (showIntermediate) yield { ...sensor, ringSize, remainingCoords: coords }
    uncovered.push(...coords)
  }
  uncovered = uncovered.filter((el, idx, self) => idx === self.findIndex(coord => coord.x === el.x && coord.y === el.y))
  yield uncovered
}

/* Given an array of sensor descriptions, ['Sensor at x=2, y=18: closest beacon is at x=-2, y=15', ...]
 * Returns { sensors, beacons }, where
 *   sensors: [{ x: 2, y: 18, nearest: 7 }, ...]
 *   beacons: [{ x: -2, y: 15, }]
 */
function parseSensors(input) {
  const sensorRegex = /^Sensor at x=(?<sx>(-|)\d+), y=(?<sy>(-|)\d+): closest beacon is at x=(?<bx>(-|)\d+), y=(?<by>(-|)\d+)$/
  let sensors = [], beacons = []
  for (const line of input) {
    const match = (line.match(sensorRegex) || {}).groups
    if (match) {
      const { sx, sy, bx, by } = Object.entries(match).reduce((obj, [k, v]) => ({ ...obj, [k]: parseInt(v) }), {})
      const nearest = Math.abs(bx - sx) + Math.abs(by - sy)
      sensors.push({ x: sx, y: sy, nearest })
      beacons.push({ x: bx, y: by, nearest })
    }
  }
  // remove duplicate beacons
  beacons = beacons.filter((beacon, idx, self) => idx === self.findIndex(el => el.x === beacon.x && el.y === beacon.y))
  return { sensors, beacons }
}

function plotSensors({ sensors, beacons, labels }) {
  const coords = []
  // setup coords, labels
  for (const { x, y } of sensors) coords.push({ x, y, char: 'S' })
  for (const { x, y } of beacons) coords.push({ x, y, char: 'B' })
  // plotGrid
  plotGrid(coords, { labels })
}

export default function* pickPart(input, config) {
  // const labels = { xVals: [0, 5, 10, 15, 20, 25], yVals: [0, 5, 10, 15, 20] }
  const labels = false, example = false
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = parseSensors(input)
  if (labels) plotSensors({ ...data, labels })
  if (config.showIntermediate) yield inspect(data)
  if (config.part === 1) {
    // Find the number of positions which exclude a beacon at y = config.yCheck
    Object.assign(config, { xMin: -1000000, xMax: 8000000, yMin: 2000000, yMax: 2000000, showIntermediate: true })
    if (example) Object.assign(config, { xMin: -15, xMax: 30, yMin: 10, yMax: 10 })
    for (const output of checkExcluded(data, config)) yield inspect(output), result = output
    yield inspect({ totalExcluded: result.excluded.length })
  } else {
    // Find tuning frequency of distress beacon
    Object.assign(config, { xMin: 0, yMin: 0, xMax: 4000000, yMax: 4000000 })
    if (example) Object.assign(config, { xMax: 20, yMax: 20, })
    for (const output of searchRings(data, config)) yield inspect(output), result = output
    console.log(result)
    const tuningFrequencies = result.map(coord => coord.x * 4000000 + coord.y)
    yield inspect({ tuningFrequency: tuningFrequencies[0] })
  }
}
