import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const CYAN = '#3FB8E0';
const NAVY_LIGHT = '#2b4a7a';

function ParticleField({ count = 900 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 8 + Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.03;
      ref.current.rotation.x += dt * 0.01;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color={CYAN}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  );
}

function Wireframe() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, dt) => {
    if (groupRef.current) {
      groupRef.current.rotation.x += dt * 0.12;
      groupRef.current.rotation.y += dt * 0.16;
    }
    if (meshRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 1.1) * 0.04;
      meshRef.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[2.4, 1]} />
        <meshStandardMaterial
          color={NAVY_LIGHT}
          emissive={CYAN}
          emissiveIntensity={0.35}
          metalness={0.6}
          roughness={0.35}
          wireframe
        />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[2.38, 0]} />
        <meshBasicMaterial color="#0b1428" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function Parallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const { mouse } = useThree();
  useFrame((_, dt) => {
    if (!ref.current) return;
    const tx = mouse.y * 0.12;
    const ty = mouse.x * 0.2;
    ref.current.rotation.x += (tx - ref.current.rotation.x) * Math.min(1, dt * 2);
    ref.current.rotation.y += (ty - ref.current.rotation.y) * Math.min(1, dt * 2);
  });
  return <group ref={ref}>{children}</group>;
}

/** Fundo animado do login — versão branded (navy/cyan), sem bloom/neon. */
export default function ThreeBackground() {
  return (
    <Canvas
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0, 7], fov: 55 }}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[8, 6, 6]} intensity={1.1} color={CYAN} />
      <pointLight position={[-8, -4, -4]} intensity={0.6} color="#ffffff" />
      <Parallax>
        <Wireframe />
        <ParticleField />
      </Parallax>
    </Canvas>
  );
}
