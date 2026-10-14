import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

async function createDistZip() {
  const zip = new JSZip();
  const distDir = path.resolve(process.cwd(), 'dist');

  if (!fs.existsSync(distDir)) {
    console.error('dist folder not found! Run npm run build first.');
    process.exit(1);
  }

  function addFolderToZip(dir: string, zipFolder: JSZip) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const subZip = zipFolder.folder(file);
        if (subZip) {
          addFolderToZip(fullPath, subZip);
        }
      } else {
        const content = fs.readFileSync(fullPath);
        zipFolder.file(file, content);
      }
    }
  }

  addFolderToZip(distDir, zip);

  const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const outputPath = path.resolve(process.cwd(), 'aura-blue-ai-deploy.zip');
  fs.writeFileSync(outputPath, content);
  console.log('Successfully created aura-blue-ai-deploy.zip at:', outputPath);
}

createDistZip().catch(err => {
  console.error('Error generating zip:', err);
  process.exit(1);
});
