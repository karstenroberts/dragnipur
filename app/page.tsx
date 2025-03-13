import Link from 'next/link'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to Dragnipur
        </h1>
        <div className={styles.grid}>
          <Link href="/fractals/mandelbrot" className={styles.card}>
            <h2>Mandelbrot Set &rarr;</h2>
            <p>
              Interactive visualization of the Mandelbrot set with dynamic zooming
              and real-time coordinate tracking.
            </p>
          </Link>

          <Link href="/fractals/logistic-bifurcation" className={styles.card}>
            <h2>Logistic Bifurcation &rarr;</h2>
            <p>
              Interactive visualization of the logistic map&apos;s bifurcation diagram,
              exploring chaos and complex systems.
            </p>
          </Link>

          <Link href="/playground/react-three-fiber" className={styles.card}>
            <h2>Three.js Playground &rarr;</h2>
            <p>
              Experiments with 3D graphics and interactive visualizations using
              React Three Fiber.
            </p>
          </Link>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>
          Built with Next.js and Three.js | Forged in Chaos
        </p>
      </footer>
    </div>
  )
} 