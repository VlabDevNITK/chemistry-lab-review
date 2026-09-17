const fs = require('fs');
const path = require('path');

const assets = {
  beaker: '../src/beaker.glb',
  hot_plate: '../src/hot_plate.glb',
  burette_stand: '../src/burette_stand.glb',
  conical_flask: '../src/conical_flask.glb',
  volumetric_flask: '../src/volumetric_flask.glb',
  wash_bottle: '../src/wash_bottle.glb',
  measuring_cylinder: '../src/measuring_cylinder.glb',
  funnel: '../src/a_funnel.glb'
};

console.log('--------------------------------------------------');
console.log('Bundling 3D GLB models into js/models_data.js...');
console.log('--------------------------------------------------');

let output = '// Auto-generated 3D GLB Models Data Storage\nwindow.GLB_ASSETS = {\n';

for (const [key, relativePath] of Object.entries(assets)) {
  const absolutePath = path.join(__dirname, relativePath);
  if (fs.existsSync(absolutePath)) {
    console.log(`[+] Encoding ${key} (${relativePath})...`);
    const fileBuffer = fs.readFileSync(absolutePath);
    const base64Data = fileBuffer.toString('base64');
    output += `  "${key}": "data:application/octet-stream;base64,${base64Data}",\n`;
  } else {
    console.warn(`[-] Warning: File not found at ${relativePath}`);
  }
}

output += '};\n';

const outputPath = path.join(__dirname, 'models_data.js');
fs.writeFileSync(outputPath, output);

console.log('--------------------------------------------------');
console.log(`SUCCESS! 3D models bundled into ${outputPath}`);
console.log('You can now open index.html directly in any browser!');
console.log('--------------------------------------------------');
