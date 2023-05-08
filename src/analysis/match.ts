import { PitchSet, Score } from 'data/Score'
import { Note } from 'midi/MessageHandler'


interface Cell {
  points: number,
  source: 'start' | 'matchNewChord' | 'matchCurrentChord' | 'insertion' | 'deletion',
  // immutable Set, can share reference
  remainderScoreChord: PitchSet,
}

// array of cells: one at the start represents insertions, and after that
// there's one for every score chord
type Column = Cell[]

// array of columns: one at the start represents deletions, and after that
// there's one for every perf note
type Matrix = Column[]


export type Performance = number[] // pitches

interface State {
  matrix: Matrix,
  score: Score,
  perf: Note[],
}





const insertionPoints = -1
const deletionPoints = -1
const matchPoints = 1

const empty = new Set<number>()




function construct<T>(t: T) { return t }


// performance: mutable array of notes
export function beginRealtimeMatch(score: Score, performance: Note[]) {
  const state: State = {
    matrix: [],
    score: score,
    perf: performance,
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
      points: state.matrix[0][rowIdx - 1].points + (deletionPoints * sc.pitches.size)
    }
  })
  return state
}
/**
 * Match one new note that was played in real time
 */
export function matchRealtimePerfToScore(state: State/*, pitch: number*/) {
  // matrix.length should be 1 + perf.length
  // on new note, perf.length should be == matrix.length. check >= to be safe
  if (state.perf.length >= state.matrix.length) {
    const pitch = state.perf[state.perf.length - 1].pitch
    state.matrix.push(new Array(state.score.length + 1))
    const colIdx = state.matrix.length - 1
    
    const rowIdx = computeColumn(state, pitch, colIdx)
    tracePath(state, rowIdx)
    console.log(state.perf)
    return true
  }
  return false
}

/**
 * Match an entire performance consisting of all notes
 */
export function matchRecordedPerfToScore(
  score: Score,
  performance: Note[],
) {
  const state: State = {
    matrix: new Array(performance.length),
    score: score,
    perf: performance,
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
      points: state.matrix[0][rowIdx - 1].points + (deletionPoints * sc.pitches.size)
    }
  })
  
  for (let perfIdx = 0; perfIdx < performance.length; perfIdx++) {
    const colIdx = perfIdx + 1
    state.matrix[colIdx] = new Array(score.length + 1)
    computeColumn(state, performance[perfIdx].pitch, colIdx)
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
  
  // keep track of best points
  let bestRow = 0
  let bestPoints = column[0].points
  
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
        deletionPoints * (deletionSourceCell.remainderScoreChord.size + sc.pitches.size)
      ),
    }
    
    
    // check match new chord case
    if (sc.pitches.has(perfPitch)) {
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
        const remainder = new Set(sc.pitches)
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
    
    if (cell.points > bestPoints) {
      bestPoints = cell.points
      bestRow = rowIdx
    }
  })
  
  return bestRow
}



// set beatstamps on notes
function tracePath(state: State, row: number) {
  let col = state.matrix.length - 1
  while (!(col === 0 && row === 0)) {
    const note = state.perf[col - 1]
    const source = state.matrix[col][row].source
    
    // if deletion, don't modify any beatstamp
    
    if (source === 'insertion') {
      // if insertion, set beatstamp to null (could have been non-null in a past matching pass)
      note.startBeat = null
    } else if (source === 'matchCurrentChord' || source === 'matchNewChord') {
      // if match, set beatstamp to current chord (same for either match case)
      note.startBeat = state.score[row - 1].startBeat
    }
    
    if (source === 'deletion' || source === 'matchNewChord') {
      row--
    }
    if (source === 'insertion' || source === 'matchCurrentChord' || source === 'matchNewChord') {
      col--
    }
  }
}

