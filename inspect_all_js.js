const fs = require('fs');
const path = require('path');

const dirPath = 'F:\\工作区\\模块开发\\StoryOfTimeLauncher\\WebBackend\\demo页面源代码\\Sign Up _ Next Vision CMS_files';

try {
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js.下载') || f.endsWith('.js'));
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for "Sign In"
    if (content.includes('Sign In')) {
        console.log(`Found "Sign In" in ${file}`);
        const index = content.indexOf('Sign In');
        console.log('--- Context (Sign In) ---');
        console.log(content.substring(Math.max(0, index - 500), Math.min(content.length, index + 200)));
    }
    
    // Check for "Create an account"
    if (content.includes('Create an account')) {
        console.log(`Found "Create an account" in ${file}`);
         const index = content.indexOf('Create an account');
         // Print 500 chars before and 200 after
         console.log(content.substring(Math.max(0, index - 500), Math.min(content.length, index + 200)));
    }

     // Check for "Registration"
    if (content.includes('Registration')) {
        console.log(`Found "Registration" in ${file}`);
    }
  });
} catch (err) {
  console.error(err);
}
