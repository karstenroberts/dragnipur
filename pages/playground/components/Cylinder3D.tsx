import React, { useRef, useState } from "react";
import { ThreeElements, Vector3, useFrame } from "@react-three/fiber";
import { Mesh } from "three";

interface Cylinder3DProps {
	wireframe?: boolean;
	position: Vector3;
	setIsZoom?: (boolean: boolean) => void;
	isZoom?: boolean;
}

export const Cylinder3D = ({ ...props }: Cylinder3DProps) => {
	const ref = useRef<Mesh>(null);

	const [isHovered, setIsHovered] = useState(false);
	const [isClicked, setIsClicked] = useState(false);

	useFrame((state, delta) => ref.current && (ref.current.rotation.x += 0.01));

	const { isZoom, setIsZoom } = props;

	return (
		<mesh
			{...props}
			ref={ref}
			scale={isClicked ? 1.5 : 1}
				onClick={(event => {
					setIsClicked(!isClicked);
					setIsZoom && setIsZoom(!isZoom);
				})}
			onPointerOver={(event) => setIsHovered(true)}
			onPointerOut={(event => setIsHovered(false))}
		>
			<cylinderGeometry args={[1, 1, 1]} />
			<meshStandardMaterial
				wireframe={props.wireframe}
				color={isHovered ? "hotpink" : "orange"}
			/>
		</mesh>
	)
}
