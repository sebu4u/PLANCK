"use client"

import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import type * as THREE from "three"

function Planet({
  position,
  color,
  scale = 1,
  orbitRadius = 3,
}: {
  position: [number, number, number]
  color: string
  scale?: number
  orbitRadius?: number
}) {
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime
      meshRef.current.position.x = Math.cos(time * 0.5) * orbitRadius
      meshRef.current.position.z = Math.sin(time * 0.5) * orbitRadius
      meshRef.current.rotation.y += 0.01
    }
  })

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

function Asteroid({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01
      meshRef.current.rotation.y += 0.02
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.5
    }
  })

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <dodecahedronGeometry args={[0.3, 0]} />
      <meshBasicMaterial color="#8b5cf6" wireframe />
    </mesh>
  )
}

function SpaceElements() {
  const elements = [
    { position: [-4, 0, -2] as [number, number, number], type: "planet", color: "#3b82f6", scale: 0.8 },
    { position: [4, -1, -1] as [number, number, number], type: "planet", color: "#ef4444", scale: 1.2 },
    { position: [-2, -3, 1] as [number, number, number], type: "asteroid", scale: 0.6 },
    { position: [3, 3, 2] as [number, number, number], type: "asteroid", scale: 1.0 },
    { position: [0, -2, -3] as [number, number, number], type: "planet", color: "#10b981", scale: 0.9 },
  ]

  return (
    <>
      {elements.map((element, index) =>
        element.type === "planet" ? (
          <Planet
            key={index}
            position={element.position}
            color={element.color!}
            scale={element.scale}
            orbitRadius={3 + index}
          />
        ) : (
          <Asteroid key={index} position={element.position} scale={element.scale} />
        ),
      )}
    </>
  )
}

export function BlackHoleAnimation() {
  return (
    <div className="absolute inset-0 opacity-30">
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <SpaceElements />
      </Canvas>
    </div>
  )
}
