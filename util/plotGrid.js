
// Given a set of labels and bounds, returns two arrays of strings: { xAxis, yAxis }
export function addAxes({ xVals, xMin, xMax, yVals, yMin, yMax, margin = 3 }) {
  const xTemplate = [...Array(xMax - xMin + 1 + margin).keys()].map((el, idx) => idx + xMin - margin)
  // x-axis labels, includes margin
  const xAxis = Array(margin)
  const xLabels = xVals.map(el => ({ arr: el.toString().padStart(margin).split(''), idx: xTemplate.indexOf(el) }))
  for (const row of xAxis.keys()) {
    xAxis[row] = xTemplate.map(el => ' ')
    for (const label of xLabels) {
      xAxis[row][label.idx] = label.arr.shift()
    }
  }
  // y-axis labels, does not include margin
  const yAxis = []
  for (let i = yMin; i <= yMax; i++) {
    const label = (yVals.includes(i)) ? i.toString().padStart(margin) : ''.padStart(margin)
    yAxis.push(label.split(''))
  }
  return { xAxis, yAxis }
}

/* Given an array of coords, [{ x, y, char }, ...] and optional config
 * prints a grid on the console, default '.'
* Returns an array of arrays of coordinates: [{ x, y, char: '#' }, { x, y, char: 'o' }, ...]
* Returned arrays are sorted by y, then x (suitable for plotting)
* Legend: (#) rock, (o) sand, (.) air, (v) abyss
*/
export default function plotGrid(coords, config = {}) {
  const { defaultChar = '.', labels = false, inverseY = false } = config
  const yValues = new Set(coords.map(el => el.y))
  const xValues = new Set(coords.map(el => el.x))
  const yMin = Math.min(...yValues)
  const yMax = Math.max(...yValues)
  const xMin = Math.min(...xValues)
  const xMax = Math.max(...xValues)
  const axes = (labels) ? addAxes({ ...labels, xMin, xMax, yMin, yMax }) : { xAxis: [], yAxis: [] }
  const plot = [...axes.xAxis]
  let yArr = [...Array(yMax - yMin + 1).keys()].map((_, idx) => idx + yMin)
  let xArr = [...Array(xMax - xMin + 1).keys()].map((_, idx) => idx + xMin)
  if (inverseY) yArr.reverse()
  for (const y of yArr) {
    const row = []
    if (labels) row.push(...axes.yAxis.shift())
    const existing = coords.filter(el => el.y === y).sort((a, b) => a.x - b.x)
    for (const x of xArr) row.push(existing.find(el => el.x === x) || { x, y, char: defaultChar })
    plot.push(row.map(el => el.char || el))
  }
  for (const row of plot) console.log(row.join(''))
  return plot
}