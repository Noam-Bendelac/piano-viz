import { EventChannel } from 'App';
import { MIDIMessage, parseMidiMessage } from 'midi/message';



let midiAccess: WebMidi.MIDIAccess | null = null

function onMidiReady(midiAccess: WebMidi.MIDIAccess, onRealtimeMessage: (msg: MIDIMessage) => void) {
  console.log('success', midiAccess);
  // setInterval(() => listInputsAndOutputs(midiAccess), 1000)
  listInputsAndOutputs(midiAccess)
  
  const messageHandler = (evt: Event) => {
    const m = evt as WebMidi.MIDIMessageEvent
    const msg = parseMidiMessage(m)
    // console.log(m, msg)
    if (msg) {
      onRealtimeMessage(msg)
    }
  }
  
  // TODO may have to set up message listener on existing ports
  // this may or may not work on existing ports:
  midiAccess.onstatechange = (e) => {
    const evt = e as WebMidi.MIDIConnectionEvent
    console.log('port', evt.port)
    const port = evt.port
    if (port.type === 'input') {
      const input = port as WebMidi.MIDIInput
      if (input.state === 'connected') {
        input.addEventListener('midimessage', messageHandler)
      } else {
        input.removeEventListener('midimessage', messageHandler)
      }
    } else {
      const output = port as WebMidi.MIDIOutput
      // TODO output music if playing prerecorded
    }
    
  }
}


let init = false

const keyboard = ['z', 's', 'x', 'd', 'c', 'v', 'g', 'b', 'h', 'n', 'j', 'm', ',']

// export function setupMidi(onRealtimeMessage: (msg: MIDIMessage) => void) {
export function setupMidi(onRealtimeMessage: EventChannel<MIDIMessage>) {
  if (init) return;
  init = true
  navigator.requestMIDIAccess().then(
    (m) => {
      if (!midiAccess) {
        midiAccess = m
        onMidiReady(midiAccess, msg => onRealtimeMessage.dispatchEvent(msg))
      }
    },
    (msg) => { alert(`failure, ${msg}`) }
  )
  document.addEventListener('keydown', e => {
    if (e.repeat) return;
    const n = keyboard.findIndex(k => k === e.key)
    if (n !== -1) {
      const pitch = n + 60
      onRealtimeMessage.dispatchEvent({
        type: 'noteOn',
        pitch,
        velocity: 96,
      })
    }
  })
  document.addEventListener('keyup', e => {
    const n = keyboard.findIndex(k => k === e.key)
    if (n !== -1) {
      const pitch = n + 60
      onRealtimeMessage.dispatchEvent({
        type: 'noteOff',
        pitch,
      })
    }
  })
}


function listInputsAndOutputs(midiAccess: WebMidi.MIDIAccess) {
  for (const entry of midiAccess.inputs.entries()) {
    const input = entry[1];
    console.log(
      `Input port [type:'${input.type}']` +
        ` id:'${input.id}'` +
        ` manufacturer:'${input.manufacturer}'` +
        ` name:'${input.name}'` +
        ` version:'${input.version}'`
    );
  }

  for (const entry of midiAccess.outputs.entries()) {
    const output = entry[1];
    console.log(
      `Output port [type:'${output.type}'] id:'${output.id}' manufacturer:'${output.manufacturer}' name:'${output.name}' version:'${output.version}'`
    );
  }
}
