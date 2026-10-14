import { build } from 'vite';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildAndZipAdmin() {
  console.log('Building Admin Panel standalone bundle...');
  
  // Build vite with admin.html input
  await build({
    root: process.cwd(),
    build: {
      outDir: 'dist-admin',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          admin: path.resolve(process.cwd(), 'admin.html')
        }
      }
    }
  });

  console.log('Packaging dist-admin into admin-panel-deploy.zip...');
  const zip = new JSZip();
  const distDir = path.resolve(process.cwd(), 'dist-admin');

  function addFilesToZip(dir: string, zipFolder: JSZip) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        const subFolder = zipFolder.folder(file);
        if (subFolder) addFilesToZip(filePath, subFolder);
      } else {
        const content = fs.readFileSync(filePath);
        // If file is index.html or admin.html in root, rename to index.html for deployment
        if (file === 'admin.html') {
          zipFolder.file('index.html', content);
        } else {
          zipFolder.file(file, content);
        }
      }
    }
  }

  addFilesToZip(distDir, zip);

  const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
  const outputPath = path.resolve(process.cwd(), 'admin-panel-deploy.zip');
  fs.writeFileSync(outputPath, zipContent);
  console.log(`Successfully created admin-panel-deploy.zip at: ${outputPath}`);
}

buildAndZipAdmin().catch(err => {
  console.error('Error building admin zip:', err);
  process.exit(1);
});
