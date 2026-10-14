// ecosystem.config.js
const path = require('path');


module.exports = {
  apps: [{
    name: 'ifn636_A2',
    cwd: path.join(__dirname, 'backend'), // so dotenv finds backend/.env
    script: 'server.js',
    autorestart: true,
    max_memory_restart: '300M',
    env: { NODE_ENV: 'production' },
  }],
};