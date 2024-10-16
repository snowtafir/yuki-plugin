const cfg = require('yunzaijs/pm2');
const app = cfg.apps[0];
app.script = 'lib/main.js';
module.exports = {
  apps: [app]
};
