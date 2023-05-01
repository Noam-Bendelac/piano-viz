import { EventChannel } from 'App'
import { Note } from 'midi/midi'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { NoteRenderer } from 'render/note'
import { Camera, OrthographicCamera, Scene, Uniform, WebGLRenderer } from 'three'




export const nowTimeUniform = new Uniform(0)




export function useFrame(callback: FrameCallback) {
  const ctx = useContext(RendererContext)
  useEffect(() => {
    ctx.add(callback)
    return () => void ctx.delete(callback)
  }, [ctx, callback])
}


// const RendererContext = createContext<Map<>>()
type FrameCallback = (t: number) => void
const RendererContext = createContext<Set<FrameCallback>>(new Set())

function Renderer({
  scene,
  camera
}: {
  scene: Scene,
  camera: Camera
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  
  const frameCallbacks = useContext(RendererContext)
  
  const gl = useMemo(() => {
    const gl = new WebGLRenderer({
      canvas: document.createElement('canvas')
    })
    // TODO css container
    gl.setSize(window.innerWidth, window.innerHeight)
    const render = (t: number) => {
      requestAnimationFrame(render)
      
      // camera.position.setX(t)
      // nowTimeUniform.value = t
      frameCallbacks.forEach(cb => cb(t))
      
      gl.render(scene, camera)
    }
    requestAnimationFrame(render)
    return gl
  }, [camera, scene, frameCallbacks])
  useEffect(() => {
    wrapperRef.current?.append(gl.domElement)
  }, [gl])
  return <div ref={wrapperRef}></div>
}


export function Three({
  onNoteUpdate,
}: {
  onNoteUpdate: EventChannel<Note>,
}) {
  const frameCallbacks = useMemo(() => new Set<FrameCallback>(), [])
  
  
  
  return <RendererContext.Provider value={frameCallbacks}>
    {/* <Renderer scene={scene} camera={camera} /> */}
    <SceneContents onNoteUpdate={onNoteUpdate} />
  </RendererContext.Provider>
}






export function SceneContents({
  onNoteUpdate,
}: {
  onNoteUpdate: EventChannel<Note>,
}) {
  
  // const canvasRef = useRef<HTMLCanvasElement>(null)
  const scene = useMemo(() => new Scene(), [])
  const camera = useMemo(() => {
    const cam = new OrthographicCamera(-10_000, 10_000, 109, 20)
    cam.position.setZ(10)
    return cam
  }, [])
  
  useFrame(useCallback((t) => {
    camera.position.setX(t)
  }, [camera]))
  
  useFrame(useCallback((t) => {
    nowTimeUniform.value = t
  }, []))
  
  return <>
    <Renderer scene={scene} camera={camera} />
    <NoteRenderer onNoteUpdate={onNoteUpdate} scene={scene} />
  </>
}

