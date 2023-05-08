import { EventChannel } from 'App'
import { Note } from 'midi/MessageHandler'
import { useCallback, useEffect, useMemo } from 'react'
import { nowTimeUniform } from 'render/three'
import { BufferGeometry, Group, Material, Mesh, MeshBasicMaterial, PlaneGeometry, Scene, ShaderMaterial, Uniform } from 'three'



/**
 * model space: -0.5 to 0.5
 * world space: time, pitch
 * screen space will have glow margins
 */


const planeGeo = new PlaneGeometry(1, 1)
const noteMat = new ShaderMaterial({
  vertexShader: `
  //varying vec2 uv;
  uniform bool playing;
  uniform float nowTime;
  varying vec2 fragWorldPosition;
  void main() {
    // world: time and pitch
    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
    if (uv.x > 0.5 && playing) {
      // this vertex is on the right edge, and note is currently playing
      // set right edge to now
      worldPosition.x = nowTime;
    }
    fragWorldPosition = worldPosition.xy;
    vec4 clipPos = projectionMatrix * viewMatrix * worldPosition;
    gl_Position = clipPos;
  }`,
  fragmentShader: `
  varying vec2 fragWorldPosition;
  uniform float startTime;
  uniform float velocity;
    void main() {
      float time = fragWorldPosition.x;
      float deltaT = time - startTime;
      float bright = (1.+velocity/127.)/2. * exp(-deltaT/2000.);
      gl_FragColor = vec4(vec3(1,1,1)*bright, 1);
    }
  `,
  uniforms: {
    // nowTime: nowTimeUniform,
    velocity: { value: 0 },
    startTime: { value: 0 },
    playing: { value: false },
  }
})

// const noteMap = new Map<Note, Mesh>()





export function NoteRenderer({
  noteUpdateEvents,
  scene,
}: {
  noteUpdateEvents: EventChannel<Note>,
  scene: Scene,
}) {
  const noteMap = useMemo(() => new Map<Note, Mesh<BufferGeometry, ShaderMaterial>>(), [])
  const noteGroup = useMemo(() => new Group(), [])
  useEffect(() => {
    scene.add(noteGroup)
    return () => void scene.remove(noteGroup)
  }, [noteGroup, scene])
  
  noteUpdateEvents.useSubscribe(useCallback(e => {
    const note = e.detail
    console.log(note)
    let mesh = noteMap.get(note)
    if (!mesh) {
      const mat = noteMat.clone()
      mat.uniforms.nowTime = nowTimeUniform
      mesh = new Mesh(planeGeo, mat)
      noteGroup.add(mesh)
      noteMap.set(note, mesh)
    }
    renderNoteMesh(note, mesh)
  }, [noteMap, noteGroup]))
  // useImperativeHandle(ref, () => {
  //   return {
  //     onNoteUpdate(note: Note) {
  //       console.log(note)
  //       let mesh = noteMap.get(note)
  //       if (!mesh) {
  //         const mat = noteMat.clone()
  //         mat.uniforms.nowTime = nowTimeUniform
  //         mesh = new Mesh(planeGeo, mat)
  //         noteGroup.add(mesh)
  //         noteMap.set(note, mesh)
  //       }
  //       renderNoteMesh(note, mesh)
  //     }
  //   }
  // }, [noteMap, noteGroup])
  return <></>
}


function renderNoteMesh(note: Note, mesh: Mesh<BufferGeometry, ShaderMaterial>) {
  // world space: just start and end time; center pitch +- width
  // if end time not known yet (realtime currently playing), set to start time;
  // it will be set in the shader
  const right = note.endTime ?? note.startTime
  const left = note.startTime
  const width = left - right
  const xCenter = (left + right) / 2
  mesh.position.set(xCenter, note.pitch, 0)
  mesh.scale.set(width, 1, 1)
  mesh.material.uniforms.velocity.value = note.velocity
  mesh.material.uniforms.startTime.value = note.startTime
  mesh.material.uniforms.playing.value = note.endTime === null
  // mesh.material = new MeshBasicMaterial({ color: new Color(0.9,1,1)})
}



