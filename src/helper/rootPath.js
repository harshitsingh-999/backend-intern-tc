// src/helper/rootPath.js

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the current file URL
const currentFileURL = import.meta.url;

// Convert the file URL to a file path
const currentFilePath = fileURLToPath(currentFileURL);

// Get the directory name (equivalent to __dirname)
const currentDir = dirname(currentFilePath);

// Set up the root path of the project directory
const rootPath = join(currentDir, '..'); // Adjust as needed based on your project structure

export default rootPath;