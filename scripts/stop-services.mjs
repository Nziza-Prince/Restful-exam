/**
 * Cross-platform helper: prints PowerShell command on Windows to free ports 3000-3007.
 * Usage: node scripts/stop-services.mjs
 */
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const psScript = path.join(scriptDir, 'stop-services.ps1');

if (process.platform === 'win32') {
  execSync(`powershell -ExecutionPolicy Bypass -File "${psScript}"`, {
    stdio: 'inherit',
  });
} else {
  console.log('On Linux/macOS, run:');
  console.log('  for p in 3000 3001 3002 3003 3004 3005 3006 3007; do');
  console.log('    fuser -k ${p}/tcp 2>/dev/null || lsof -ti :${p} | xargs kill -9 2>/dev/null');
  console.log('  done');
}
