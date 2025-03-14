'use client'

import { MapControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useState } from 'react';
import { Vector3 } from 'three';
import { Cylinder3D } from '../../../components';

interface CameraDollyProps {
    isZoom: boolean;
}

const CameraDolly = ({ isZoom }: CameraDollyProps) => {
    const vec = new Vector3();
    useFrame((state) => {
        const step = .1;
        const x = isZoom ? 5 : 0;
        const y = isZoom ? 5 : 10;
        const z = isZoom ? 5 : 10;
        state.camera.position.lerp(vec.set(x, y, z), step);
        state.camera.lookAt(0, 0, 0);
        state.camera.updateProjectionMatrix();
    })
    return null;
}

export default function Playground() {
    const [isZoom, setIsZoom] = useState(false);
    return (
        <>
            <section style={{ height: "100vh", width: "100vw" }}>
                <Canvas orthographic camera={{ position: [0, 0, 50], zoom: 10, up: [0, 0, 1], far: 10000 }} >
                    <pointLight position={[10, 10, 10]} />
                    <ambientLight />
                    <Cylinder3D position={[-1.2, 0, 0]} />
                    <Cylinder3D position={[1.2, 0, 0]} setIsZoom={setIsZoom} isZoom={isZoom} />
                    <MapControls />
                </Canvas>
            </section>
        </>
    )
} 