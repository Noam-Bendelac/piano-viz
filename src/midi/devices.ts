import { onRealtimeMessage } from 'midi/midi'



let midiAccess: MIDIAccess | null = null

function onMidiReady(midiAccess: MIDIAccess) {
  console.log('success', midiAccess);
  // setInterval(() => listInputsAndOutputs(midiAccess), 1000)
  listInputsAndOutputs(midiAccess)
  // TODO may have to set up message listener on existing ports
  // this may or may not work on existing ports:
  midiAccess.onstatechange = (e) => {
    const evt = e as MIDIConnectionEvent
    console.log('port', evt.port)
    const port = evt.port
    if (port.type === 'input') {
      const input = port as MIDIInput
      if (input.state === 'connected') {
        input.onmidimessage = onRealtimeMessage
      } else {
        input.onmidimessage = null
      }
    } else {
      const output = port as MIDIOutput
      // TODO output music if playing prerecorded
    }
    
  }
}

export function setupMidi() {
  navigator.requestMIDIAccess().then(
    (m) => {
      if (!midiAccess) {
        midiAccess = m
        onMidiReady(midiAccess)
      }
    },
    (msg) => { alert(`failure, ${msg}`) });
}


function listInputsAndOutputs(midiAccess: MIDIAccess) {
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
