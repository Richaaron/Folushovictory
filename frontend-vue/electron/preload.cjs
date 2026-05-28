const { contextBridge } = require('electron');
const fs = require('fs');

const markerPath = 'C:\\Users\\PASTOR\\AppData\\Local\\Temp\\opencode\\electron-preload-started.txt';
try {
  fs.writeFileSync(markerPath, `preload loaded at ${Date.now()}\n`);
} catch(e) {}

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform
});
