import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.resolve(__dirname, "../public/rupee-3d.jpg");
const outputPath = path.resolve(__dirname, "../public/rupee-3d.png");

async function processImage() {
  const image = sharp(inputPath);
  const { width, height } = await image.metadata();
  if (!width || !height) throw new Error("Could not get image dimensions");

  // Get raw RGBA buffer
  const raw = await image.ensureAlpha().raw().toBuffer();

  // Background baseline
  const bgR = 20.0;
  const bgG = 19.7;
  const bgB = 18.5;

  // Let's analyze distance from background and saturation/brightness
  // The floor shadow has luminance < 75 and saturation < 0.15
  // The actual 3D model bevels and sides have either:
  // - distinct warmth/pink (r > g + 8 or r > 70)
  // - high specular highlights
  // - strong edge contrast
  
  // We can do an outer flood-fill from all 4 boundaries:
  const visited = new Uint8Array(width * height);
  const queue = [];

  // Seed boundary pixels
  for (let x = 0; x < width; x++) {
    queue.push(x, 0);
    queue.push(x, height - 1);
    visited[x] = 1;
    visited[(height - 1) * width + x] = 1;
  }
  for (let y = 1; y < height - 1; y++) {
    queue.push(0, y);
    queue.push(width - 1, y);
    visited[y * width] = 1;
    visited[y * width + (width - 1)] = 1;
  }

  // Flood fill background and shadow
  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];
    const cIdx = (cy * width + cx) * 4;

    // Check neighbors (4-way)
    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nPos = ny * width + nx;
        if (!visited[nPos]) {
          const nIdx = nPos * 4;
          const nr = raw[nIdx];
          const ng = raw[nIdx + 1];
          const nb = raw[nIdx + 2];

          // Check if this pixel is part of background or faint floor shadow
          // The rupee symbol's dark bevel has strong rose gold/copper edge:
          // nr > 90 || (nr - ng > 15) || (nb > 60 && nr > 65)
          const dr = nr - bgR;
          const dg = ng - bgG;
          const db = nb - bgB;
          const dist = Math.sqrt(dr * dr + dg * dg + db * db);

          // Floor shadow test: dist < 65 and color is neutral dark gray
          const isNeutralShadow = dist < 70 && (Math.abs(nr - ng) < 14 && Math.abs(ng - nb) < 14);

          if (dist < 32 || isNeutralShadow) {
            visited[nPos] = 1;
            queue.push(nx, ny);
          }
        }
      }
    }
  }

  // Now set alpha
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = y * width + x;
      const idx = pos * 4;
      if (visited[pos]) {
        raw[idx + 3] = 0; // Transparent background / shadow
      } else {
        // Keep smooth antialiased edge near boundary
        raw[idx + 3] = 255;
      }
    }
  }

  // Mild edge feathering/smoothing (3x3 blur on alpha channel only)
  const alphaCopy = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    alphaCopy[i] = raw[i * 4 + 3];
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pos = y * width + x;
      if (alphaCopy[pos] === 255) {
        // Check if adjacent to transparent
        let transparentNeighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (alphaCopy[(y + dy) * width + (x + dx)] === 0) {
              transparentNeighbors++;
            }
          }
        }
        if (transparentNeighbors > 0) {
          // Feather alpha slightly to prevent harsh stair-stepping
          raw[pos * 4 + 3] = Math.max(120, 255 - transparentNeighbors * 22);
        }
      }
    }
  }

  // Save refined PNG
  await sharp(raw, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(outputPath);

  console.log("Successfully generated clean transparent PNG:", outputPath);
}

processImage().catch(console.error);
