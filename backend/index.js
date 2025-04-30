// This file is a simple entry point for running the backend
// It loads the TypeScript configuration and runs the server.ts file

require('dotenv').config({ path: './.env.local' });
require('ts-node/register');
require('./server');

console.log('Backend server starting...');
