// import { realtimeNoteUpdate } from 'render/note'






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




export interface Note {
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
 * Turns a sequence of note on, note off, and pedal messages into a sequence of
 * Note objects/Note update callbacks with start and end time.
 * Handles sustain and sostenuto pedals. Turns soft pedal into lower velocity.
 */
class MessageHandler {
  // mutable
  public readonly notes: Note[] = []
  
  // state
  // private t = 0
  private readonly currentKeys = new Array<{
    note: Note,
    held: boolean,
    // sustain: boolean,
    sostenuto: boolean,
  } | null>(128).fill(null)
  private sustain = false
  private soft = false
  
  // private onNoteChange: ((note: Note) => void) | null
  
  // constructor(onNoteChange?: (note: Note) => void) {
  //   this.onNoteChange = onNoteChange ?? null
  // }
  
  onMessage(message: MIDIMessage, t: number, onNoteChange?: (note: Note) => void) {
    // this.t += deltaT
    if (message.type === 'noteOn') {
      const note: Note = {
        pitch: message.pitch,
        velocity: Math.ceil(message.velocity * (this.soft ? 0.8 : 1)),
        startTime: t,
        endTime: null,
        startBeat: null,
      }
      this.notes.push(note)
      const existingKey = this.currentKeys[note.pitch]
      if (existingKey) {
        // same key is already playing due to sustain/sostenuto (or a glitch)
        // end existing note
        existingKey.note.endTime = t
        onNoteChange?.(existingKey.note)
      }
      this.currentKeys[note.pitch] = {
        note,
        held: true,
        sostenuto: existingKey?.sostenuto ?? false,
      }
      onNoteChange?.(note)
      
    } else if (message.type === 'noteOff') {
      const key = this.currentKeys[message.pitch]
      if (key) {
        key.held = false
        
        if (!(this.sustain || key.sostenuto)) {
          // nothing sustaining note, so end it
          key.note.endTime = t
          onNoteChange?.(key.note)
          this.currentKeys[message.pitch] = null
        }
      }
    } else {
      
      if (message.pedal === 'sustain') {
        this.sustain = message.value
        if (!this.sustain) {
          for (const key of this.currentKeys) {
            if (key && !(key.held || key.sostenuto)) {
              // end note
              key.note.endTime = t
              onNoteChange?.(key.note)
            }
          }
        }
        
      } else if (message.pedal === 'sostenuto') {
        // sostenuto = message.value
        if (message.value) {
          this.currentKeys.forEach(key => { if (key) key.sostenuto = key.held })
        } else {
          for (const key of this.currentKeys) {
            if (key) {
              key.sostenuto = false
              if (!(this.sustain || key.held)) {
                // nothing sustaining note, so end it
                key.note.endTime = t
                onNoteChange?.(key.note)
                this.currentKeys[key.note.pitch] = null
              }
            }
          }
        }
        
      } else if (message.pedal === 'soft') {
        this.soft = message.value
      }
    }
  }
}




// const realtimeNoteProcessor = buildNotes()
const realtimeMessageHandler = new MessageHandler()//realtimeNoteUpdate)
// realtimeNoteProcessor.next()
const start = Date.now()
export const onRealtimeMessage = (onNoteUpdate: (note:Note) => void) =>
(msg: MIDIMessageEvent) => {

// export function onRealtimeMessage(msg: MIDIMessageEvent) {
  // const msg = m as MIDIMessageEvent
  const message = parseMidiMessage(msg)
  console.log(message, msg)
  if (message === null) return;
  realtimeMessageHandler.onMessage(message, Date.now() - start, onNoteUpdate)
  // console.log(notes)
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



