const entry = process.env.production ? './app.js' : './dist/app.js';

console.log(entry);
console.log(process.env);

module.exports = {
  apps: [{
    name: 'clapping-game',
    script: entry,
    watch: '.'
  }],

  deploy: {
    production: {
      user: 'SSH_USERNAME',
      host: 'SSH_HOSTMACHINE',
      ref: 'origin/master',
      repo: 'GIT_REPOSITORY',
      path: 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
