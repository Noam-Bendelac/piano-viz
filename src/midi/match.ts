

interface Cell {
  points: number,
  source: 'start' | 'matchNewChord' | 'matchCurrentChord' | 'insertion' | 'deletion',
  // immutable Set, can share reference
  remainderScoreChord: ScoreChord,
}

// array of cells: one at the start represents insertions, and after that
// there's one for every score chord
type Column = Cell[]

// array of columns: one at the start represents deletions, and after that
// there's one for every perf note
type Matrix = Column[]

// ScoreChord is immutable Set
export type ScoreChord = Set<number> // pitches
export type Score = ScoreChord[]
export type Performance = number[] // pitches

interface State {
  matrix: Matrix,
  score: Score,
  // perf: Performance,
}





const insertionPoints = -1
const deletionPoints = -1
const matchPoints = 1

const empty = new Set<number>()




function construct<T>(t: T) { return t }


export function beginRealtimeMatch(score: Score) {
  const state: State = {
    matrix: [],
    score: score,
    // perf: [],
  }
  // calculate first column; this represents the case that every score chord so
  // far has been a deletion
  state.matrix[0] = new Array(score.length + 1)
  state.matrix[0][0] = {
    source: 'start',
    remainderScoreChord: empty,
    points: 0,
  }
  state.score.forEach((sc, scoreIdx) => {
    const rowIdx = scoreIdx + 1
    state.matrix[0][rowIdx] = {
      source: 'deletion',
      remainderScoreChord: empty,
      // we know that the previous remainder chord is always empty
      points: state.matrix[0][rowIdx - 1].points + (deletionPoints * sc.size)
    }
  })
  return state
}
/**
 * Match one new note that was played in real time
 */
export function matchRealtimePerfToScore(state: State, pitch: number) {
  state.matrix.push(new Array(state.score.length + 1))
  const colIdx = state.matrix.length - 1
  computeColumn(state, pitch, colIdx)
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
    // perf: performance,
  }
  
  // calculate first column; this represents the case that every score chord so
  // far has been a deletion
  state.matrix[0] = new Array(score.length + 1)
  state.matrix[0][0] = {
    source: 'start',
    remainderScoreChord: empty,
    points: 0,
  }
  state.score.forEach((sc, scoreIdx) => {
    const rowIdx = scoreIdx + 1
    state.matrix[0][rowIdx] = {
      source: 'deletion',
      remainderScoreChord: empty,
      // we know that the previous remainder chord is always empty
      points: state.matrix[0][rowIdx - 1].points + (deletionPoints * sc.size)
    }
  })
  
  for (let perfIdx = 0; perfIdx < performance.length; perfIdx++) {
    const colIdx = perfIdx + 1
    state.matrix[colIdx] = new Array(score.length + 1)
    computeColumn(state, performance[perfIdx], colIdx)
  }
  
}



/**
 * @pre state.score
 * @pre state.matrix[colIdx] is a column with length score.length + 1
 * @pre state.matrix[colIdx - 1] has valid values
 */
function computeColumn(state: State, perfPitch: number, colIdx: number) {
  const column = state.matrix[colIdx]
  // calculate first row/cell; this represents the case that every perf note so
  // far has been an insertion
  column[0] = {
    source: 'insertion',
    remainderScoreChord: empty,
    points: state.matrix[colIdx - 1][0].points + insertionPoints
  }
  
  state.score.forEach((sc, scoreIdx) => {
    const rowIdx = scoreIdx + 1
    
    // we are reading the 3 cells to our left and above us
    const deletionSourceCell = column[rowIdx - 1]
    const existingChordSourceCell = state.matrix[colIdx - 1][rowIdx]
    const newChordSourceCell = state.matrix[colIdx - 1][rowIdx - 1]
    
    
    // check deletion case
    // it's always an option, so compare other points to this one
    const cell: Cell = {
      source: 'deletion',
      remainderScoreChord: empty,
      points: deletionSourceCell.points + (
        // we are skipping the remaining notes in current chord, and all notes in new chord
        deletionPoints * (deletionSourceCell.remainderScoreChord.size + sc.size)
      ),
    }
    
    
    // check match new chord case
    if (sc.has(perfPitch)) {
      // pitch is in chord; matching may or may not have highest points
      const points = newChordSourceCell.points + (
        // we're matching one new note, but also skipping remaining notes in current chord
        matchPoints + (deletionPoints * newChordSourceCell.remainderScoreChord.size)
      )
      // > or >= is an algorithm choice that can be tweaked
      if (points > cell.points) {
        // matching new chord is a better option than current value of cell
        cell.source = 'matchNewChord'
        cell.points = points
        const remainder = new Set(sc)
        remainder.delete(perfPitch)
        cell.remainderScoreChord = remainder
      }
    }
    
    
    // check match existing chord and insertion cases
    // these are mutually exclusive, but one or the other will always be possible
    if (existingChordSourceCell.remainderScoreChord.has(perfPitch)) {
      // note matches the remainder of the current chord we are in
      const points = existingChordSourceCell.points + matchPoints
      // > or >= is an algorithm choice that can be tweaked
      if (points > cell.points) {
        cell.source = 'matchCurrentChord'
        cell.points = points
        const remainder = new Set(existingChordSourceCell.remainderScoreChord)
        remainder.delete(perfPitch)
        cell.remainderScoreChord = remainder
      }
    } else {
      // note doesn't match, so this is the insertion case
      const points = existingChordSourceCell.points + insertionPoints
      // > or >= is an algorithm choice that can be tweaked
      if (points > cell.points) {
        cell.source = 'insertion'
        cell.points = points
        cell.remainderScoreChord = existingChordSourceCell.remainderScoreChord
      }
    }
    
    column[rowIdx] = cell
  })
  // don't return column bc column already existed (make sure caller allocated)
  // return column
}


