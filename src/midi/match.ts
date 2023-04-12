

interface Cell {
  scorePoints: number,
  source: 'match' | 'insertion' | 'deletion',
}

// array of cells, one for every score chord
type Column = Cell[]

// array of columns, one for every perf note
type Matrix = Column[]

export type ScoreChord = Set<number> // pitches
export type Score = ScoreChord[]
export type Performance = number[] // pitches

interface State {
  matrix: Matrix,
  score: Score,
  perf: Performance,
}



function construct<T>(t: T) { return t }


export function beginRealtimeMatch(score: Score) {
  const state: State = {
    matrix: [],
    score: score,
    perf: [],
  }
  return state
}
/**
 * Match one new note that was played in real time
 */
export function matchRealtimePerfToScore(pitch: number) {
  
}

/**
 * Match an entire performance consisting of all notes
 */
export function matchRecordedPerfToScore(
  score: Score,
  performance: Performance,
) {
  const state: State = {
    matrix: new Array(performance.length),
    score: score,
    perf: performance,
  }
  
  for (let perfIdx = 0; perfIdx < state.perf.length; perfIdx++) {
    
    state.matrix[perfIdx] = new Array(score.length)
    computeColumn(state, perfIdx)
  }
  // state.matrix = state.perf.map(perf => {
  //   const column: Column = []
  //   for (const sc of state.score) {
  //     column.push({scorePoints: 0, source: 'match'})
  //   }
  //   return column
  // })
  
}



/**
 * @pre state.score
 * @pre state.perf[perfIdx] has a pitch
 * @pre state.matrix[perfIdx] is a column with same length as score
 */
function computeColumn(state: State, perfIdx: number) {
  const perfPitch = state.perf[perfIdx]
  // const column: Column = []
  const column = state.matrix[perfIdx]
  // for (const sc of state.score) {
  state.score.forEach((sc, scoreIdx) => {
    // column[] = {scorePoints: 0, source: 'match'}
    column[scoreIdx].scorePoints = 0;//...
  })
  // don't return column bc column already existed (make sure caller allocated)
  // return column
}


