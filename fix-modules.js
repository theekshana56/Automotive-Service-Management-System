import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to recursively find all .js files
function findJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findJSFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to convert CommonJS to ES modules
function convertToESModules(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Convert require statements to import statements
    const requireRegex = /const\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\);/g;
    const requireMatches = [...content.matchAll(requireRegex)];
    
    if (requireMatches.length > 0) {
      const imports = [];
      const variables = [];
      
      requireMatches.forEach(match => {
        const [fullMatch, variable, module] = match;
        imports.push(`import ${variable} from '${module}';`);
        variables.push(variable);
        content = content.replace(fullMatch, '');
      });
      
      // Add imports at the top
      content = imports.join('\n') + '\n' + content;
      modified = true;
    }
    
    // Convert module.exports to export default
    if (content.includes('module.exports')) {
      content = content.replace(/module\.exports\s*=\s*/g, 'export default ');
      modified = true;
    }
    
    // Convert exports.xxx to export const xxx
    const exportRegex = /exports\.(\w+)\s*=\s*/g;
    if (exportRegex.test(content)) {
      content = content.replace(exportRegex, 'export const $1 = ');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Converted: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error converting ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('🔄 Starting CommonJS to ES modules conversion...');

const serverSrcPath = path.join(__dirname, 'server', 'src');
const jsFiles = findJSFiles(serverSrcPath);

console.log(`📁 Found ${jsFiles.length} JavaScript files`);

let convertedCount = 0;
jsFiles.forEach(file => {
  if (convertToESModules(file)) {
    convertedCount++;
  }
});

console.log(`✅ Conversion complete! ${convertedCount} files converted.`);
