
const MIDIFile = require('midifile')

const fs = require('fs')


// const buffer = Buffer.alloc(10_000)
// const buffer = fs.readFileSync('../../Deux_Arabesques_Arabesque_No._1_in_E_-_Claude_Debussy.mid')
const buffer = fs.readFileSync('../../debussy2.mid')

const midiFile = new MIDIFile(buffer)

console.log(midiFile.header.getTimeDivision(), MIDIFile.Header.TICKS_PER_BEAT)

const events = midiFile.getMidiEvents()
const notes = events.filter(e => e.type === 8 && e.subtype === 9).map(e => {
  return {
    // type: e.subType === 9 ? 'on' : 'off',
    beat: e.playTime / 1000,
    pitch: e.param1,
    // velocity: e.param2,
  }
})

const chords = [{ startBeat: notes[0].beat, pitches: [] }]
let j = 0
for (const note of notes) {
  if (Math.abs(note.beat - chords[j].startBeat) < 0.01) {
    chords[j].pitches.push(note.pitch)
  } else {
    chords.push({ startBeat: note.beat, pitches: [note.pitch] })
    j++
  }
}

// console.log(notes.slice(0, 100))
// console.log(events[0])
console.log(JSON.stringify(chords, undefined, 2))

fs.writeFileSync('debussy.json', JSON.stringify(chords, undefined, 2))

