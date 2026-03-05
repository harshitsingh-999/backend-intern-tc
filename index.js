import dotenv from 'dotenv';
dotenv.config(); 

import server from './src/app.js';

const PORT = process.env.PORT || 5000;

server.listen(PORT);
console.log(`🚀 Server running on port ${PORT}`);
console.log(`Internship Backend Booting..`);
console.log('🕒 Boot Time:', new Date().toISOString());
