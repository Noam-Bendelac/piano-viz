import { useCallback, useEffect, useMemo, useState } from 'react'
import { setupMidi } from 'midi/devices'
import { MessageHandler, Note } from 'midi/MessageHandler'
import { Three } from 'render/three'
import { MIDIMessage } from 'midi/message'
import { beginRealtimeMatch, matchRealtimePerfToScore } from 'analysis/match'
import { scores } from 'data/scores'
import { calcTempo } from 'analysis/tempo'
import { setupOutput } from 'midi/output'


// type Evt<D, T> = CustomEvent<D> & { type: T }
export class EventChannel<T> {
  
  private eventTarget: EventTarget = new EventTarget()
  
  addEventListener(
    // type: T,
    callback: ((evt: CustomEvent<T>) => void) | null,
    options?: boolean | AddEventListenerOptions | undefined
  ): void {
    this.eventTarget.addEventListener(
      'event',
      // (e) => { callback?.(e as CustomEvent<Note>) },
      callback as (evt: Event) => void,
      options
    )
  }
  
  removeEventListener(
    // type: T,
    callback: ((evt: CustomEvent<T>) => void) | null,
    options?: boolean | EventListenerOptions | undefined
  ): void {
    this.eventTarget.removeEventListener(
      'event', callback as (evt: Event) => void, options
    )
  }
  
  dispatchEvent(data: T): boolean {
    return this.eventTarget.dispatchEvent(
      new CustomEvent('event', { detail: data })
    )
  }
  
  useSubscribe(callback: (e: CustomEvent<T>) => void) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      this.addEventListener(callback)
      return () => this.removeEventListener(callback)
    }, [callback])
  }
}





function App() {
  
  const midiMessageEvents = useMemo(() => new EventChannel<MIDIMessage>(), [])
  
  // internally mutable
  const [notes, setNotes] = useState<Note[]>([])
  const noteUpdateEvents = useMemo(() => new EventChannel<Note>(), [])
  // const newNoteEvents = useMemo(())
  
  // const beatUpdateEvents = useMemo(() => new EventChannel<void>(), [])
  
  useEffect(() => {
    // console.log('setup')
    setupMidi(midiMessageEvents)
  }, [midiMessageEvents])
  
  const messageHandler = useMemo(() => (
    new MessageHandler(note => noteUpdateEvents.dispatchEvent(note))
  ), [noteUpdateEvents])
  useEffect(() => {
    messageHandler.notes = notes
  }, [messageHandler, notes])
  midiMessageEvents.useSubscribe(useCallback(e => {
    messageHandler.onMessage(e.detail, performance.now())
  }, [messageHandler]))
  
  const scoreIdx = Number.parseInt((new URLSearchParams(window.location.search)).get('score') ?? '0')
  const realtimeScoreMatcher = useMemo(() => beginRealtimeMatch(scores[scoreIdx], notes), [notes, scoreIdx])
  noteUpdateEvents.useSubscribe(useCallback(e => {
    // this will read the mutated notes array and assign new beatstamps if necessary
    if (matchRealtimePerfToScore(realtimeScoreMatcher)) {
      // true if updates
      calcTempo(notes)
    }
    
  }, [realtimeScoreMatcher, notes]))
  
  useEffect(() => {
    setupOutput(noteUpdateEvents)
  }, [noteUpdateEvents])
  
  
  
  return <>
    <Three noteUpdateEvents={noteUpdateEvents} />
    {/* <canvas ref={canvasRef}></canvas> */}
  </>
}

export default App;
