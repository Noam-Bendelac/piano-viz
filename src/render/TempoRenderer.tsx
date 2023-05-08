import { tempoGpuData } from 'analysis/tempo';
import { useCallback, useEffect, useMemo } from 'react';
import { useFrame } from 'render/three';
import { Color, Mesh, MeshBasicMaterial, PlaneGeometry, Scene, ShaderMaterial } from 'three';



const tempoMat = new ShaderMaterial({
  vertexShader: `
    // varying vec2 fUv;
    varying vec2 worldPos;
    void main() {
      // fUv = uv;
      // gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1);
      vec4 clip = vec4(2.*uv-vec2(1), 0, 1);
      worldPos = (inverse(projectionMatrix * viewMatrix) * clip).xy;
      gl_Position = clip;
    }
  `,
  fragmentShader: `
    struct Note {
      float time;
      float pitch;
      float dTempo;
    };
    uniform Note notes[${tempoGpuData.length}];
    // varying vec2 fUv;
    varying vec2 worldPos;
    void main() {
      // gl_FragColor = vec4(fUv, 0, 1);
      float sum = 0.;
      for (int i = 0; i < ${tempoGpuData.length}; i++) {
        float t = worldPos.x - notes[i].time;
        float p = worldPos.y - notes[i].pitch;
        sum += notes[i].dTempo * ((t < 0.) ? 0.5*exp(10.*t/1000.) : exp(-2.*t/1000.)) * exp(-0.005*p*p);
      }
      // sum = notes[95].dTempo;
      // sum = worldPos.x/1000.;
      vec3 hue = sum < 0. ? vec3(0.1,0,1) : vec3(1,0.1,0);
      gl_FragColor = vec4(hue*min(1.3*abs(sum), 1.0), 1);
    }
  `,
  uniforms: {
    notes: { value: tempoGpuData },
  },
  
})


export function TempoRenderer({
  scene,
}: {
  scene: Scene,
}) {
  const geo = useMemo(() => new PlaneGeometry(100, 100), [])
  // const mesh = useMemo(() => new Mesh(geo, new MeshBasicMaterial({color:new Color(1,1,1)})), [geo])
  const mesh = useMemo(() => new Mesh(geo, tempoMat), [geo])
  
  useEffect(() => {
    scene.add(mesh)
    return () => void scene.remove(mesh)
  }, [scene, mesh])
  
  useFrame(useCallback((t) => { mesh.position.setX(t) }, [mesh]))
  // useFrame(useCallback(() => { tempoMat.needsUpdate = true }, []))
  
  return <></>
}
