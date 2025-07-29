// .eslintrc.json
module.exports = {
  extends: 'eslint:recommended',
  rules: {
    'require-jsdoc': 'warn'
  }
};

// Script to check for comments in JS files
const fs = require('fs');
const path = require('path');
function checkComments(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      checkComments(fullPath);
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (!/\/\*/.test(content) && !/\/\//.test(content)) {
        console.warn('No comments in', fullPath);
      }
    }
  });
}
checkComments(path.join(__dirname, '..')); 