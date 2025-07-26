import chokidar from 'chokidar';
import path from 'path';

const projectDir = process.cwd(); // or absolute path

const watcher = chokidar.watch(path.join(projectDir, '**/*.js'), {
  ignoreInitial: true,
  ignored: ['**/node_modules/**'],
  awaitWriteFinish: {
    stabilityThreshold: 300,
    pollInterval: 100
  }
});

watcher.on('all', (event, filePath) => {
  console.log(`[${event}] ${filePath}`);
});