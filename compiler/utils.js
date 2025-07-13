// compiler/utils.js

const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
    fs.writeFileSync(filePath, content, 'utf-8');
}

function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf-8');
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}

function log(msg) {
    console.log(`🔹 ${msg}`);
}

module.exports = { writeFile, readFile, ensureDir, log };
