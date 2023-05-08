import { EventChannel } from 'App'
import MIDI from 'midi.js'
import { Note } from 'midi/MessageHandler'
// import { MIDIMessage } from 'midi/message'


export function setupOutput(notes: EventChannel<Note>) {
  // interface to download soundfont, then execute callback
  // MIDI.loadPlugin(onsuccess)
  // simple example to get started
  MIDI.loadPlugin({
    soundfontUrl: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/',
    instrument: "acoustic_grand_piano", // or the instrument code 1 (aka the default)
    onsuccess: function() {
      notes.addEventListener(e => {
        const n = e.detail
        if (n.endTime) {
          // note off
          MIDI.noteOff(0, n.pitch, 0)
        } else {
          // note on
          MIDI.noteOn(0, n.pitch, n.velocity, 0)
        }
      })
    }
  })
}









