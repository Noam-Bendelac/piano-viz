





function construct<T>(t: T) { return t }


export interface MIDINoteOn {
  type: 'noteOn',
  pitch: number,
  velocity: number,
}
export interface MIDINoteOff {
  type: 'noteOff',
  pitch: number,
}
export interface MIDIPedal {
  type: 'pedal',
  pedal: 'sustain' | 'sostenuto' | 'soft',
  value: boolean,
}
export type MIDIMessage = MIDINoteOn | MIDINoteOff | MIDIPedal




interface Note {
  pitch: number,
  velocity: number,
  startTime: number,
  // null until the note has ended
  endTime: number | null,
  // TODO just make startbeat associated by a Path to score?
  // null if doesn't match a chord in the score
  startBeat: number | null,
}


/**
 * Turns a sequence of note on and off messages into a sequence of Note objects
 * with start and end time.
 * Takes sustain and sostenuto pedals into consideration. Turns soft pedal into
 * lower velocity.
 */
function* buildNotes(): Generator<Note[], never, [MIDIMessage, number]> {
  // initialize state
  let t = 0
  // sequence of performed notes
  const notes: Note[] = []
  // "map" of midi pitch (index 0 to 127) to that key's currently sounding Note
  // instance, whether it's held down, and whether it's in the sostenuto set
  const currentKeys = new Array<{
    note: Note,
    held: boolean,
    // sustain: boolean,
    sostenuto: boolean,
  } | null>(128).fill(null)
  
  let sustain = false
  // let sostenuto = false
  // const sostenutoSet = new Array<boolean>(128).fill(false)
  let soft = false
  
  // pull first message
  let [message, deltaT]: [MIDIMessage, number] = yield notes
  while (true) {
    t += deltaT
    if (message.type === 'noteOn') {
      const note: Note = {
        pitch: message.pitch,
        velocity: Math.ceil(message.velocity * (soft ? 0.8 : 1)),
        startTime: t,
        endTime: null,
        startBeat: null,
      }
      notes.push(note)
      const existingKey = currentKeys[note.pitch]
      if (existingKey) {
        // same key is already playing due to sustain/sostenuto (or a glitch)
        // end existing note
        existingKey.note.endTime = t
      }
      currentKeys[note.pitch] = {
        note,
        held: true,
        sostenuto: existingKey?.sostenuto ?? false,
      }
    } else if (message.type === 'noteOff') {
      const key = currentKeys[message.pitch]
      if (key) {
        key.held = false
        
        if (!(sustain || key.sostenuto)) {
          // nothing sustaining note, so end it
          key.note.endTime = t
          currentKeys[message.pitch] = null
        }
      }
    } else {
      if (message.pedal === 'sustain') {
        sustain = message.value
        if (!sustain) {
          for (const key of currentKeys) {
            if (key && !(key.held || key.sostenuto)) {
              // end note
              key.note.endTime = t
            }
          }
        }
      } else if (message.pedal === 'sostenuto') {
        // sostenuto = message.value
        if (message.value) {
          currentKeys.forEach(key => { if (key) key.sostenuto = key.held })
        } else {
          for (const key of currentKeys) {
            if (key) {
              key.sostenuto = false
              if (!(sustain || key.held)) {
                // nothing sustaining note, so end it
                key.note.endTime = t
                currentKeys[key.note.pitch] = null
              }
            }
          }
        }
      } else if (message.pedal === 'soft') {
        soft = message.value
      }
    }
    
    // push update and pull next message
    [message, deltaT] = yield notes
  }
}



const realtimeNoteProcessor = buildNotes()
realtimeNoteProcessor.next()
const start = Date.now()
export function onRealtimeMessage(m: Event) {
  const msg = m as MIDIMessageEvent
  const message = parseMidiMessage(msg)
  console.log(message, msg)
  if (message === null) return;
  const notes = realtimeNoteProcessor.next([message, Date.now() - start]).value
  console.log(notes)
  if (message.type === 'noteOn') {
    
  }
}

/**
 * Parses binary midi into a MIDIMessage. Turns note on with velocity 0 into off
 */
function parseMidiMessage(msg: MIDIMessageEvent): MIDIMessage | null {
  const status = msg.data[0]
  const code = status >> 4
  if (code === 0x8) {
    // note off
    const pitch = msg.data[1]
    return { type: 'noteOff', pitch }
  } else if (code === 0x9) {
    // note on
    const pitch = msg.data[1]
    const velocity = msg.data[2]
    if (velocity === 0) {
      // actually a note off
      return { type: 'noteOff', pitch }
    } else {
      // really a note on for real this time
      return { type: 'noteOn', pitch, velocity }
    }
  } else if (code === 0xB) {
    // control change (cc)
    const cc = msg.data[1]
    const value = msg.data[2] !== 0
    if (cc === 64) {
      // sustain/damper pedal
      return { type: 'pedal', pedal: 'sustain', value }
    } else if (cc === 66) {
      // sostenuto pedal
      return { type: 'pedal', pedal: 'sostenuto', value }
    } else if (cc === 67) {
      // una corda/soft pedal
      return { type: 'pedal', pedal: 'soft', value }
    }
  }
  return null
}



