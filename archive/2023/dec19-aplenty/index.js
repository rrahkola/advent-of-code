import { strict as assert } from 'assert'
import { inspect } from 'util'

/*  Given parts and flows,
 *  appends a path to each part based on the flow rules
 */
function* addPathsToParts({ parts, flows }, config) {
  const { showIntermediate } = config
  for (const part of parts) {
    let flow = 'in'
    let op, ifTrue, ifFalse
    while (!['A', 'R'].includes(flow)) {
      const [op, ifTrue, ifFalse] = flows[flow]
      flow = (op(part)) ? ifTrue : ifFalse
      part.path.push(flow)
    }
    if (showIntermediate) yield part
  }
  yield parts
}

function walkRanges (ranges) {
  const walk = (range) => {
    const [ifTrue, ifFalse] = ranges[range[2]]
    const withTrue = (['A', 'R'].includes(ifTrue[2])) ? [[ifTrue]] : walk(ifTrue)
    const withFalse = (!ranges[ifFalse[2]]) ? [] : walk(ifFalse)
    return [...withTrue, ...withFalse].map(arr => [range, ...arr])
  }
  return walk
}

/* Given flows with arrays of tokens: [{ dim: 'x', lt: '<', val: 2006, dest: 'qkq' }, ...]
 * yields all arrays of tokens ending with 'A'
 */
function* part2({ ranges }, config) {
  const { showIntermediate } = config
  const paths = []
  const acceptedPaths = walkRanges(ranges)(['x', [1, 4000], 'in'])
    .filter(path => path.slice(-1)[0][2] === 'A')
  if (showIntermediate) yield acceptedPaths
  const acceptedRanges = acceptedPaths.map(path => {
    const part = { x: [1, 4000], m: [1, 4000], a: [1, 4000], s: [1, 4000] }
    path.forEach(([dim, range, ..._]) => {
      const [min, max] = part[dim]
      part[dim] = [Math.max(min, range[0]), Math.min(max, range[1])]
    })
    return { ...part }
  })
  yield acceptedRanges
}

/*  Given an array of input: ['px{a<2006:qkq,m>2090:A,rfg}', ..., '{x=787,m=2655,a=1222,s=2876}', ...],
 *  yields a workflow map and a set of parts w/ characteristics:
 *    - flows: { 'in0': [fn, dest0, dest1], ... }
 *    - parts: { x: 787, m: 2655, a: 1222, s: 2876 }
 *  where 'dest0' and 'dest1' are the next destinations based on the evaluation of function 'fn'
 */
function interpret(input) {
  const partRegex = /^\{x=(?<x>\d+),m=(?<m>\d+),a=(?<a>\d+),s=(?<s>\d+)\}/
  const flowRegexs = [
    /^(?<dim>[xmas])(?<lt><)(?<val>\d+):(?<dest>\w+)$/,
    /^(?<dim>[xmas])(?<gt>>)(?<val>\d+):(?<dest>\w+)$/,
    /^(?<default>\w+)$/
  ]
  const parts = []
  const flows = {}
  const ranges = {}
  for (const line of input) {
    const xmas = partRegex.exec(line)
    // Handle parts list
    if (xmas) {
      const part = 'xmas'.split('').reduce((obj, dim) => Object.assign(obj, { [dim]: parseInt(xmas.groups[dim]) }), {})
      part.path = ['in']
      parts.push(part)
      continue
    }
    // Handle flow list
    const [title, opsStr] = line.split(/\{|\}/).filter(el => el !== '')
    opsStr.split(',').forEach((op, idx) => {
      const flowThis = (idx) ? `${title}${idx}` : title
      const flowNext = `${title}${idx + 1}`
      const opParts = flowRegexs.map(regex => regex.exec(op)).filter(Boolean)[0].groups
      if (opParts?.val) opParts.val = parseInt(opParts.val)
      if (opParts?.lt) {
        flows[flowThis] = [part => part[opParts.dim] < opParts.val, opParts.dest, flowNext]
        const ifTrue = [opParts.dim, [1, opParts.val - 1], opParts.dest]
        const ifFalse = [opParts.dim, [opParts.val, 4000], flowNext]
        ranges[flowThis] = [ifTrue, ifFalse]
      } else if (opParts?.gt) {
        flows[flowThis] = [part => part[opParts.dim] > opParts.val, opParts.dest, flowNext]
        const ifTrue = [opParts.dim, [opParts.val + 1, 4000], opParts.dest]
        const ifFalse = [opParts.dim, [1, opParts.val], flowNext]
        ranges[flowThis] = [ifTrue, ifFalse]
      } else if (opParts?.default) {
        flows[flowThis] = [part => true, opParts.default, flowNext]
        ranges[flowThis] = [['x', [1, 4000], opParts.default], ['x', [0, 0], flowNext]]
      }
    })
  }
  return { parts, flows, ranges }
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
    for (const output of addPathsToParts(data, config)) yield inspect(output), result = output
    result = result.filter(part => part.path.slice(-1)[0] === 'A').map(part => part.x + part.m + part.a + part.s)
    if (config.showIntermediate) yield inspect(result)
    yield result.reduce((acc, val) => acc + val, 0)
  } else {
    // Find answer for part 2
    const ev = ([min, max]) => max - min + 1
    for (const output of part2(data, config)) yield inspect(output, {compact: true}), result = output
    result = result.map(({ x, m, a, s }) => ev(x) * ev(m) * ev(a) * ev(s))
    if (config.showIntermediate) yield inspect(result)
    yield result.reduce((acc, val) => acc + val, 0)
  }
}
