

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





/**
 * Parses binary midi into a MIDIMessage. Turns note on with velocity 0 into off
 */
export function parseMidiMessage(msg: WebMidi.MIDIMessageEvent): MIDIMessage | null {
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
