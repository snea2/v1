const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_DIR = 'C:\\Users\\snaz\\Downloads\\v1';

async function main() {
  console.log('Scanning repo directory:', REPO_DIR);
  const files = fs.readdirSync(REPO_DIR);
  const mp4Files = files.filter(f => f.endsWith('.mp4'));
  console.log(`Found ${mp4Files.length} mp4 files.`);

  for (const file of mp4Files) {
    const filePath = path.join(REPO_DIR, file);
    const stats = fs.statSync(filePath);
    console.log(`Processing: ${file} (Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

    // Only compress if size is > 1MB
    if (stats.size > 1024 * 1024) {
      const tempPath = path.join(REPO_DIR, `temp_${file}`);
      console.log(`Compressing ${file} to 480p and removing audio...`);
      
      const cmd = `ffmpeg -y -i "${filePath}" -vf "scale=-2:480" -c:v libx264 -crf 28 -preset fast -an -movflags +faststart "${tempPath}"`;
      try {
        execSync(cmd, { stdio: 'inherit' });
        // Replace original with compressed version
        fs.unlinkSync(filePath);
        fs.renameSync(tempPath, filePath);
        const newStats = fs.statSync(filePath);
        console.log(`Successfully compressed ${file}! New size: ${(newStats.size / 1024).toFixed(2)} KB`);
      } catch (err) {
        console.error(`Error compressing ${file}:`, err);
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      }
    } else {
      console.log(`Skipping compression for ${file} (already small).`);
    }
  }

  // Stage, commit, and push
  console.log('Committing changes to Git...');
  try {
    execSync('git add .', { cwd: REPO_DIR, stdio: 'inherit' });
    execSync('git commit -m "perf: compress all videos to web-optimized 480p without audio"', { cwd: REPO_DIR, stdio: 'inherit' });
    console.log('Pushing changes to GitHub...');
    execSync('git push origin main', { cwd: REPO_DIR, stdio: 'inherit' });
    console.log('Successfully pushed compressed videos to snea2/v1 repository!');
  } catch (err) {
    console.error('Error during Git operations:', err);
  }
}

main().catch(console.error);
