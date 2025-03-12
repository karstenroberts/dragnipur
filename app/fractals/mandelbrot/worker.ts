interface Point {
    x: number
    y: number
    iterations: number
}

interface WorkerParams {
    centerX: number
    centerY: number
    zoom: number
    resolution: 'low' | 'medium' | 'high'
    maxIterations: number
    escapeRadius: number
}

const CHUNK_SIZE = 100 // Calculate in 100x100 pixel chunks

function getResolutionMultiplier(resolution: 'low' | 'medium' | 'high'): number {
    switch (resolution) {
        case 'low': return 0.5
        case 'medium': return 1
        case 'high': return 2
        default: return 1
    }
}

function calculateMandelbrotPoint(cx: number, cy: number, maxIterations: number, escapeRadius: number): number {
    let x = 0
    let y = 0
    let iteration = 0

    while (x * x + y * y < escapeRadius * escapeRadius && iteration < maxIterations) {
        const temp = x * x - y * y + cx
        y = 2 * x * y + cy
        x = temp
        iteration++
    }

    return iteration
}

function calculateChunk(params: WorkerParams, chunkX: number, chunkY: number): Point[] {
    const points: Point[] = []
    const { resolution, maxIterations, escapeRadius, centerX, centerY, zoom } = params
    const multiplier = getResolutionMultiplier(resolution)
    const scale = 4 / zoom  // 4 is the width of the Mandelbrot set
    const step = scale / (400 * multiplier)  // 400 is the base resolution

    for (let y = 0; y < CHUNK_SIZE; y++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
            // Calculate complex coordinates
            const realX = centerX + (chunkX + x - 200 * multiplier) * step
            const realY = centerY + (chunkY + y - 200 * multiplier) * step

            const iterations = calculateMandelbrotPoint(realX, realY, maxIterations, escapeRadius)
            
            // Normalize coordinates to [0, 1] range
            points.push({
                x: (chunkX + x) / (400 * multiplier),
                y: (chunkY + y) / (400 * multiplier),
                iterations
            })
        }
    }

    return points
}

self.onmessage = (e: MessageEvent) => {
    const params: WorkerParams = e.data
    const { resolution } = params
    const multiplier = getResolutionMultiplier(resolution)
    const totalChunks = Math.ceil(400 * multiplier / CHUNK_SIZE)
    const totalPoints = totalChunks * totalChunks

    let completedChunks = 0

    // Calculate in chunks and stream results
    for (let y = 0; y < 400 * multiplier; y += CHUNK_SIZE) {
        for (let x = 0; x < 400 * multiplier; x += CHUNK_SIZE) {
            const points = calculateChunk(params, x, y)
            
            self.postMessage({
                type: 'chunk',
                points,
                progress: completedChunks / totalPoints
            })

            completedChunks++
        }
    }

    self.postMessage({ type: 'complete' })
} 