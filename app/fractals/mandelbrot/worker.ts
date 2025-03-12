interface MandelbrotParams {
    maxIterations: number;
    resolution: 'low' | 'medium' | 'high' | 'custom';
    customResolution?: number;
    colorScheme: 'classic' | 'smooth' | 'psychedelic';
    escapeRadius: number;
    zoomRegion?: {
        centerX: number;
        centerY: number;
        width: number;
        height: number;
    };
}

const resolutionMap = {
    low: 2048,
    medium: 4096,
    high: 5120,
    custom: 0 // Will be overridden by customResolution
}

function mandelbrot(cx: number, cy: number, maxIter: number, escapeRadius: number): { iterations: number, smoothed: number } {
    let x = 0;
    let y = 0;
    let iter = 0;
    const maxRadius = escapeRadius * escapeRadius;

    while (x * x + y * y <= maxRadius && iter < maxIter) {
        const xtemp = x * x - y * y + cx;
        y = 2 * x * y + cy;
        x = xtemp;
        iter++;
    }

    // Smooth coloring using log escape time
    if (iter < maxIter) {
        const log_zn = Math.log(x * x + y * y) / 2;
        const nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
        return { iterations: iter, smoothed: iter + 1 - nu };
    }

    return { iterations: iter, smoothed: iter };
}

function getColor(value: number, maxIter: number, scheme: string): [number, number, number, number] {
    switch (scheme) {
        case 'classic': {
            if (value >= maxIter) return [0, 0, 0, 255];
            const hue = (value / maxIter) * 360;
            const saturation = 1;
            const lightness = value < maxIter ? 
            0.3 + 0.4 * Math.sin(Math.PI * value / maxIter) : 0;
            return hslToRgb(hue, saturation, lightness);
        }
        case 'smooth': {
            if (value >= maxIter) return [0, 0, 0, 255];
            const hue = (value / maxIter) * 360;
            const saturation = 0.9;
            const lightness = value < maxIter ? 
            0.3 + (0.4 * (1 - value / maxIter)) : 0;
            
            
            return hslToRgb(hue, saturation, lightness);
        }
        case 'psychedelic': {
            if (value >= maxIter) return [0, 0, 0, 255];
            const repeats = 5;  // Number of color cycles
            const cycleValue = ((value * repeats) % maxIter) / maxIter;
            const hue = cycleValue * 360;
            const saturation = 0.95;
            const lightness = value < maxIter ? 
                0.3 + 0.4 * Math.sin(Math.PI * cycleValue) : 0;
            return hslToRgb(hue, saturation, lightness);
        }
        default:
            return [0, 0, 0, 255];
    }
}

function hslToRgb(h: number, s: number, l: number): [number, number, number, number] {
    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, (h / 360 + 1/3));
        g = hue2rgb(p, q, h / 360);
        b = hue2rgb(p, q, (h / 360 - 1/3));
    }

    return [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255),
        255
    ];
}

self.onmessage = (e: MessageEvent) => {
    const params = e.data as MandelbrotParams;
    const width = params.resolution === 'custom' && params.customResolution ? 
        params.customResolution : 
        resolutionMap[params.resolution];
    const height = Math.round(width * (2/3));  // Maintain aspect ratio
    const buffer = new Uint8ClampedArray(width * height * 4);
    const CHUNK_SIZE = 50; // Process 50 rows at a time

    // Calculate coordinate ranges based on zoom region or default view
    const xMin = params.zoomRegion ? params.zoomRegion.centerX - params.zoomRegion.width / 2 : -2.5;
    const xMax = params.zoomRegion ? params.zoomRegion.centerX + params.zoomRegion.width / 2 : 1.5;
    const yMin = params.zoomRegion ? params.zoomRegion.centerY - params.zoomRegion.height / 2 : -2;
    const yMax = params.zoomRegion ? params.zoomRegion.centerY + params.zoomRegion.height / 2 : 2;

    for (let chunkStart = 0; chunkStart < height; chunkStart += CHUNK_SIZE) {
        const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, height);
        
        for (let y = chunkStart; y < chunkEnd; y++) {
            for (let x = 0; x < width; x++) {
                // Map pixel coordinates to complex plane using zoom region
                const cx = xMin + (x / width) * (xMax - xMin);
                const cy = yMin + (y / height) * (yMax - yMin);

                const result = mandelbrot(cx, cy, params.maxIterations, params.escapeRadius);
                const color = getColor(result.smoothed, params.maxIterations, params.colorScheme);

                const i = (y * width + x) * 4;
                buffer[i] = color[0];     // R
                buffer[i + 1] = color[1]; // G
                buffer[i + 2] = color[2]; // B
                buffer[i + 3] = color[3]; // A
            }
        }

        // Send the partial result after each chunk
        self.postMessage({
            type: 'chunk',
            buffer: buffer,
            width: width,
            height: height,
            progress: chunkEnd / height
        }, { transfer: [] }); // Don't transfer the buffer until complete
    }

    // Send the final complete message with the full buffer
    self.postMessage({
        type: 'complete',
        buffer: buffer,
        width: width,
        height: height
    }, { transfer: [buffer.buffer] });
}; 