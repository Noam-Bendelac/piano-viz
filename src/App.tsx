import { useEffect, useMemo } from 'react'
import { setupMidi } from 'midi/devices'
import { Note, onRealtimeMessage } from 'midi/midi'
import { Three } from 'render/three'


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
}





function App() {
  
  const onNoteUpdate = useMemo(() => new EventChannel<Note>(), [])
  
  // onNoteUpdate.dispatchEvent({} as Note)
  // const noteRenderer = useRef<{onNoteUpdate(note: Note):void}>(null)
  
  useEffect(() => {
    // console.log('setup')
    setupMidi(onRealtimeMessage(onNoteUpdate.dispatchEvent))
  }, [])
  
  
  
  
  return <>
    <Three onNoteUpdate={onNoteUpdate} />
    {/* <canvas ref={canvasRef}></canvas> */}
  </>
}

export default App;
