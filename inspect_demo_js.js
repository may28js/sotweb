const fs = require('fs');
const path = require('path');

const filePath = 'F:\\工作区\\模块开发\\StoryOfTimeLauncher\\WebBackend\\demo页面源代码\\Sign Up _ Next Vision CMS_files\\54085c9611bb2228.js.下载';

try {
  const content = fs.readFileSync(filePath, 'utf8');
  const searchStr = 'Account Registration';
  const index = content.indexOf(searchStr);

  if (index !== -1) {
    console.log(`Found "${searchStr}" at index ${index}`);
    const start = Math.max(0, index - 1000);
    const end = Math.min(content.length, index + 1000);
    console.log('--- Context ---');
    console.log(content.substring(start, end));
    console.log('--- End Context ---');
  } else {
    console.log(`"${searchStr}" not found in file.`);
    // Try "Registration" only
    const index2 = content.indexOf('Registration');
    if (index2 !== -1) {
        console.log(`Found "Registration" at index ${index2}`);
        const start = Math.max(0, index2 - 1000);
        const end = Math.min(content.length, index2 + 1000);
        console.log('--- Context (Registration) ---');
        console.log(content.substring(start, end));
        console.log('--- End Context ---');
    }
  }
} catch (err) {
  console.error('Error reading file:', err);
}
