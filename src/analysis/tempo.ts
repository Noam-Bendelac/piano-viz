import { Note } from 'midi/MessageHandler';



interface GPUNoteData {
  time: number,
  pitch: number,
  dTempo: number,
}

const dataLen = 100
export const tempoGpuData = Array.from<void, GPUNoteData>({ length: dataLen }, () => ({
  time: 0,
  pitch: 0,
  dTempo: 0,
}))



/**
 * @pre notes have valid or null beatstamps
 */
export function calcTempo(notes: Note[]) {
  // indices in notes array read backwards in order, to prioritize most recent notes
  
  // reads ahead to group notes by beatstamp
  // should always point to next note to be consumed, not consumed yet
  let noteGroupingIdx = notes.length - 1
  
  // average timestamp of note group (all same beat) 2 prior in time/array (2 ahead in loop exec)
  let tAve2 = 0
  // beatstamp
  let b2 = -1
  // average timestamp of note group (all same beat) 1 prior in time/array (1 ahead in loop exec)
  let tAve1 = 0
  let b1 = -1
  // average timestamp of current note group (all same beat)
  // let tAve0 = 0
  let b0 = -1
  
  
  // move noteGroupingIdx to next note with valid beatstamp
  // if already valid, don't move
  const getMatchedNote = () => {
    if (noteGroupingIdx < 0) return null
    while (notes[noteGroupingIdx].startBeat === null) {
      // if not valid beatstamp, keep decrementing idx
      noteGroupingIdx--
      if (noteGroupingIdx < 0) return null
    }
    // not null
    return notes[noteGroupingIdx] as Note & { startBeat: number }
  }
  
  const getNextGroup = () => {
    // shift into next group so tAve2 and b2 can get new values
    b0 = b1
    b1 = b2
    // tAve0 = tAve1
    tAve1 = tAve2
    
    let sumT = 0
    let numNotes = 0
    
    // if (noteGroupingIdx < 0) return
    let note = getMatchedNote()
    if (!note) return;
    b2 = note.startBeat
    sumT += notes[noteGroupingIdx].startTime
    numNotes++
    noteGroupingIdx--
    note = getMatchedNote()
    if (!note) return;
    while (note.startBeat === b2) {
      sumT += notes[noteGroupingIdx].startTime
      numNotes++
      noteGroupingIdx--
      note = getMatchedNote()
      if (!note) return;
    }
    tAve2 = sumT / numNotes
  }
  
  // fill up tAve values to be ready for main loop
  getNextGroup()
  getNextGroup()
  
  let noteIdx = notes.length - 1
  // // counts up from 0; notes and gpuData arrays index at length - 1 - noteIdx
  // // let noteIdx = 0
  
  loop:
  for (let writeIdx = tempoGpuData.length - 1; writeIdx >= 0; writeIdx--) {
    // getNextGroup()
    
    let note = notes[noteIdx--]
    if (!note) break loop;
    while (!note.startBeat) {
      note = notes[noteIdx--]
      if (!note) break loop;
    }
    if (note.startBeat !== b0) {
      getNextGroup()
    }
    const cell = tempoGpuData[writeIdx]
    cell.pitch = note.pitch
    cell.time = note.startTime
    cell.dTempo = noteTempoData(
      note.startTime,
      b0,
      tAve1,
      b1,
      tAve2,
      b2,
    )
    if (!Number.isFinite(cell.dTempo)) {
      cell.dTempo = 0
    }
  }
  console.log(tempoGpuData.map(d => d.dTempo))
  
}




function noteTempoData(
  t: number,
  b0: number,
  tAve1: number,
  b1: number,
  tAve2: number,
  b2: number,
) {
  // t is in ms, convert to s
  const deltaT0 = t/1000 - tAve1/1000
  const deltaT1 = tAve1/1000 - tAve2/1000
  const deltaB0 = b0 - b1
  const deltaB1 = b1 - b2
  
  const tempo0 = deltaB0 / deltaT0
  const tempo1 = deltaB1 / deltaT1
  
  // TODO which one of these to use
  const deltaTempo = tempo0 - tempo1
  const derivTempo0 = deltaTempo / deltaT0
  const derivTempo1 = deltaTempo / deltaT1
  // return derivTempo0
  return deltaTempo
}


