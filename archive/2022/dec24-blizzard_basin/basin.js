
export class Blizzards {
  constructor({ width, height }) {
    this.width = width
    this.height = height
    this.storms = { 'v': [], '^': [], '<': [], '>': [] }
    this.time = 0
  }

  add(dir, col, row) {
    this.storms[dir].push({ col, row })
  }

  tick() {
    const { height, width } = this
    this.storms['^'].forEach(el => (el.row === 1) ? el.row = height - 2 : el.row--)
    this.storms['v'].forEach(el => (el.row === height - 2) ? el.row = 1 : el.row++)
    this.storms['<'].forEach(el => (el.col === 1) ? el.col = width - 2 : el.col--)
    this.storms['>'].forEach(el => (el.col === width - 2) ? el.col = 1 : el.col++)
    return ++this.time
  }

  occupied() {
    return [].concat(...Object.values(this.storms)).map(el => `${el.col},${el.row}`)
  }
}