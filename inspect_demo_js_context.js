const fs = require('fs');
const path = require('path');

const filePath = 'F:\\工作区\\模块开发\\StoryOfTimeLauncher\\WebBackend\\demo页面源代码\\Sign Up _ Next Vision CMS_files\\54085c9611bb2228.js.下载';

try {
  const content = fs.readFileSync(filePath, 'utf8');
  const index = content.indexOf('Account Registration');
  if (index !== -1) {
    const start = Math.max(0, index - 500);
    const end = Math.min(content.length, index + 200);
    console.log(content.substring(start, end));
  }
} catch (err) {
  console.error(err);
}
