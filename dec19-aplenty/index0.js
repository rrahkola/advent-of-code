import { strict as assert } from 'assert'
import { inspect } from 'util'

/*  Given parts and flows,
 *  appends a path to each part based on the flow rules
 */
function* part1({ parts, flows }, config) {
  const { showIntermediate } = config
  for (const part of parts) {
    let flow = 'in'
    while (!['A', 'R'].includes(flow)) {
      const op = flows[flow].ops.find(el => el(part))
      flow = op(part)
      part.path.push(flow)
    }
    // if (showIntermediate) yield part
  }
  yield parts
}

/* Given flows with arrays of tokens: [{ dim: 'x', lt: '<', val: 2006, dest: 'qkq' }, ...]
 * yields all arrays of tokens ending with 'A'
 */
function* part2({ flows }, config) {
  const { showIntermediate } = config
  for (const flow of Object.values(flows)) {
    const tokens = flow.tokens
    let lastToken = tokens[tokens.length - 1]
    if (lastToken.dest === 'A') yield tokens
  }
}

/*  Given an array of input: ['px{a<2006:qkq,m>2090:A,rfg}', ..., '{x=787,m=2655,a=1222,s=2876}', ...],
 *  yields a workflow map and a set of parts w/ characteristics:
 *    - flows: { 'in': [fn1, fn2, ...], ... }
 *    - parts: { x: 787, m: 2655, a: 1222, s: 2876 }
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
    const ops = []
    const tokens = []
    for (const op of opsStr.split(',')) {
      const opParts = flowRegexs.map(regex => regex.exec(op)).filter(Boolean)[0].groups
      if (opParts?.val) opParts.val = parseInt(opParts.val)
      if (opParts?.lt) ops.push(part => (part[opParts.dim] < opParts.val) ? opParts.dest : false)
      if (opParts?.gt) ops.push(part => (part[opParts.dim] > opParts.val) ? opParts.dest : false)
      if (opParts?.default) ops.push(part => opParts.default)
      tokens.push({ ...opParts })
    }
    flows[title] = { title, ops, tokens }
  }
  return { parts, flows }
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
    for (const output of part1(data, config)) yield inspect(output), result = output
    result = result.filter(part => part.path.slice(-1)[0] === 'A').map(part => part.x + part.m + part.a + part.s)
    if (config.showIntermediate) yield inspect(result)
    yield result.reduce((acc, val) => acc + val, 0)
  } else {
    // Find answer for part 2
    for (const output of part1(data, config)) yield inspect(output), result = output
  }
}
