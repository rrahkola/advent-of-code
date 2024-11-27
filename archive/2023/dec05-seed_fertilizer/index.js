import { strict as assert } from 'assert'
import { inspect } from 'util'

/* Given arrays of seeds and maps:
 *   seeds: [79, 14, 55, 13]
 *   maps: [{ source: seed, destination: soil, from: 98, to: 50, range: 2 }, ...]
 * calculates the subsequent location numbers for each seed number
 */
function* mapSeedsToLocation({ seeds, maps }, config) {
  const { showIntermediate, mappings } = config
  const environments = seeds.map(seed => ({ seed }))
  const fromSource = (source) => ({ from, to, range }) => (from[0] <= source && source < from[1]) ? to[0] + (source - from[0]) : undefined
  let source = 'seed'
  for (const destination of mappings) {
    for (const env of environments) {
      const values = maps.filter(el => el.source === source).map(fromSource(env[source]))
      env[destination] = values.find(Boolean) || env[source]
      if (showIntermediate) yield { source, destination, env }
    }
    source = destination
  }
  yield environments
}

/* Given arrays of seed ranges and maps:
 *   seeds: [79, 14, 55, 13]
 *   maps: [{ source: seed, destination: soil, from: [98, 100], to: [50, 52], range: 2 }, ...]
 * creates an array of mappings:
 *   [{ seed: [x, y], soil: [x, y], ..., humidity: [x, y], location: [x, y], range: (y-x) }, ...]
 * which is contiguous for all elements (seed, soil, etc.)
 */
function* plotSeeds({ seedRanges, maps }, config) {
  const { showIntermediate, mappings } = config
  const by = (field) => (a, b) => (a[field][0] < b[field][0]) ? -1 : 1
  let source = 'seed'
  let tree = seedRanges.map(arr => ({ seed: arr }))
  const limbWithUpdates = (limb, { range, ...updates }) => {
    const newLimb = ['seed', ...mappings].reduce((obj, source) =>
      (limb[source])
        ? Object.assign(obj, { [source]: [limb[source][0], limb[source][0]+range] })
        : obj
      , {})
    // modify the original limb to start +range
    mappings.concat(['seed']).forEach(source => (limb[source]) ? limb[source][0] += range : null)
    return { ...newLimb, ...updates, range }
  }
  for (const destination of mappings) {
    const sourceMap = maps.filter(el => el.source === source).sort(by('from'))
    const branches = []
    for (const limb of tree) {
      let [lMin, lMax] = limb[source]
      while (lMin < lMax) {
        const overlap = sourceMap.find(el => el.from[0] <= lMin && el.from[1] > lMin)
        const stagger = sourceMap.find(el => el.from[0] > lMin && el.from[0] < lMax)
        if (overlap) {
          const offset = lMin - overlap.from[0]
          const sharedMax = Math.min(lMax, overlap.from[1])
          const range = sharedMax - lMin
          const dest = [overlap.to[0]+offset, overlap.to[0]+offset+range]
          const updates = { [source]: [lMin, sharedMax], [destination]: dest, range }
          branches.push(limbWithUpdates(limb, updates))
          lMin = sharedMax
        } else {
          const newMax = (stagger) ? stagger.from[0] : lMax
          const range = newMax - lMin
          const updates = { [source]: [lMin, newMax], [destination]: [lMin, newMax], range }
          // source maps directly to destination
          branches.push(limbWithUpdates(limb, updates))
          lMin = newMax
        }
      }
    }
    if (showIntermediate) console.log('branches', branches)
    tree = branches
    source = destination
  }
  yield tree
}

/* "Brute-force" method: walk the domain of each seed-range [start, end] (not-inclusive) and compute the location.
 * Keep the lowest location when encountered.
 */
function* walkSeeds({ seedRanges, maps }, config) {
  const { showIntermediate, mappings } = config
  const by = (field) => (a, b) => (a[field][0] < b[field][0]) ? -1 : 1
  let minLocation = 10**10
  let source = 'seed'
  let sourceMaps = mappings.reduce((obj, dest) => Object.assign(obj, { [dest]:  maps.filter(el => el.destination === dest).sort(by('from')) }), {})
  let soil, fert, wat, lit, temp, hum, loc
  for (const { seed: [start, end] } of seedRanges.sort(by('seed'))) {
    for (let i = start; i < end; i++) {
      const soilMap = sourceMaps.soil.find(({ from }) => from[0] <= i && i < from[1])
      if (soilMap) soil = soilMap.to[0] + (i - soilMap.from[0])
      else soil = i

      const fertMap = sourceMaps.fertilizer.find(({ from }) => from[0] <= soil && soil < from[1])
      if (fertMap) fert = fertMap.to[0] + (soil - fertMap.from[0])
      else fert = soil

      const watMap = sourceMaps.water.find(({ from }) => from[0] <= fert && fert < from[1])
      if (watMap) wat = watMap.to[0] + (fert - watMap.from[0])
      else wat = fert

      const litMap = sourceMaps.light.find(({ from }) => from[0] <= wat && wat < from[1])
      if (litMap) lit = litMap.to[0] + (wat - litMap.from[0])
      else lit = wat

      const tempMap = sourceMaps.temperature.find(({ from }) => from[0] <= lit && lit < from[1])
      if (tempMap) temp = tempMap.to[0] + (lit - tempMap.from[0])
      else temp = lit

      const humMap = sourceMaps.humidity.find(({ from }) => from[0] <= temp && temp < from[1])
      if (humMap) hum = humMap.to[0] + (temp - humMap.from[0])
      else hum = temp

      const locMap = sourceMaps.location.find(({ from }) => from[0] <= hum && hum < from[1])
      if (locMap) loc = locMap.to[0] + (hum - locMap.from[0])
      else loc = hum

      // console.log({ seed: i, soil, fert, wat, lit, temp, hum, loc })
      if (loc < minLocation) minLocation = loc
    }
    console.log('finished range', { start, end })
  }
  yield minLocation
}

/* Given an array of input: ['seeds: 79 14 55 13', ...],
 * yields arrays of seeds and maps:
 *   seeds: [79, 14, 55, 13]
 *   maps: [{ source: seed, destination: soil, from: [98, 100], to: [50, 52], range: 2 }, ...]
 */
function interpret(input) {
  const maps = []
  let seeds
  let mapType = null
  const addMap = (line, source, destination) => {
    const { dStr, sStr, rStr } = /^(?<dStr>\d+)\s+(?<sStr>\d+)\s+(?<rStr>\d+)$/.exec(line).groups
    const [from, to, range] = [sStr, dStr, rStr].map(num => parseInt(num))
    maps.push({ source, destination, from: [from, from+range], to: [to, to+range], range }) // end is not-inclusive
  }
  for (const line of input) {
    if (/^seeds/.exec(line)) seeds = line.match(/(\d+)/g).map(num => parseInt(num))
    if (/ map:/.exec(line)) mapType = /(?<source>\w+)-to-(?<destination>\w+) map/.exec(line).groups
    if (/^\d+/.exec(line)) addMap(line, mapType.source, mapType.destination)
  }
  // For part 2, interpret seeds as [aMin, aRange, bMin, bRange, ...]
  const seedRanges = []
  const makeSeedMap = (_, idx) => seedRanges.push([seeds[2*idx], seeds[2*idx] + seeds[2*idx+1]])
  new Array(seeds.length / 2).fill(0).forEach(makeSeedMap)

  return { maps, seeds, seedRanges }
}

export default function* pickPart(input, config) {
  let result
  assert(
    Array.isArray(input) && input.length > 0,
    'Must provide data as array of strings, use options "-t lines"'
  )
  assert([1, 2].includes(config.part), 'Valid parts are 1 or 2')

  const data = interpret(input)
  if (config.showIntermediate) yield inspect(data, { depth: 3 })
  config.mappings = ['soil', 'fertilizer', 'water', 'light', 'temperature', 'humidity', 'location']
  if (config.part === 1) {
    // Find answer for part 1
    for (const output of mapSeedsToLocation(data, config)) yield inspect(output), result = output
    yield inspect(result.sort((a, b) => (a.location <= b.location) ? -1 : 1)[0])
  } else {
    // Find answer for part 2
    // // 'brute force' method
    // for (const output of walkSeeds(data, config)) yield inspect(output), result = output
    // 'smart' method
    for (const output of plotSeeds(data, config)) yield inspect(output), result = output
    result.sort((a, b) => a.location[0] - b.location[0])
    yield inspect({ smallestLocation: result[0] })
  }
}

// Note: correct answers: 403695602 (part 1), 219529182 (part 2)