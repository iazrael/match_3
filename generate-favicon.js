import sharp from 'sharp';
import fs from 'fs';

const svg = fs.readFileSync('./logo.svg', 'utf-8');

// Generate favicon sizes
const sizes = [16, 32, 64, 128];

async function generateFavicons() {
  try {
    for (const size of sizes) {
      await sharp(Buffer.from(svg))
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(`./public/favicon-${size}.png`);
      console.log(`✓ Generated favicon-${size}.png`);
    }

    // Generate favicon.ico (using the 32x32 version)
    await sharp(Buffer.from(svg))
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile('./public/favicon.ico');
    console.log(`✓ Generated favicon.ico`);

    console.log('\n✅ All favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();
