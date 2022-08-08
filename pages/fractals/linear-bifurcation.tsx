import { Canvas } from '@react-three/fiber';
import Link from 'next/link';

export default function LinearBifurcation() {
	return (
		<Canvas>
			<group position="{[0,0.1,0.1]}">
				<mesh>
					<boxBufferGeometry attach="geometry" args={[0.047, 0.5, 0.29]} />
					<meshStandardMaterial attach="material" color="{0xf95b3c}" />
				</mesh>
			</group>
		</Canvas>
	)
}
