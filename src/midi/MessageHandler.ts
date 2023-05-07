// import { realtimeNoteUpdate } from 'render/note'

import { EventChannel } from 'App'
import { MIDIMessage } from 'midi/message'






function construct<T>(t: T) { return t }





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
export class MessageHandler {
  // owned by parent, reassignable if array ref needs to change.
  // we will mutate this to update parent state
  public notes: Note[] = []
  
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
  
  private onNoteChange: ((note: Note) => void) | null
  
  constructor(onNoteChange?: (note: Note) => void) {
    this.onNoteChange = onNoteChange ?? null
  }
  
  onMessage(message: MIDIMessage, t: number/*, onNoteChange?: (note: Note) => void*/) {
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
        this.onNoteChange?.(existingKey.note)
      }
      this.currentKeys[note.pitch] = {
        note,
        held: true,
        sostenuto: existingKey?.sostenuto ?? false,
      }
      this.onNoteChange?.(note)
      
    } else if (message.type === 'noteOff') {
      const key = this.currentKeys[message.pitch]
      if (key) {
        key.held = false
        
        if (!(this.sustain || key.sostenuto)) {
          // nothing sustaining note, so end it
          key.note.endTime = t
          this.onNoteChange?.(key.note)
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
              this.onNoteChange?.(key.note)
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
                this.onNoteChange?.(key.note)
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




// const realtimeMessageHandler = new MessageHandler()//realtimeNoteUpdate)
// export const onRealtimeMessage =
//   (onNoteUpdate: EventChannel<Note>) =>
//   (message: MIDIMessage) =>
// {

//   realtimeMessageHandler.onMessage(
//     message,
//     performance.now(),
//     note => onNoteUpdate.dispatchEvent(note)
//   )
//   // console.log(notes)
//   if (message.type === 'noteOn') {
    
//   }
// }



