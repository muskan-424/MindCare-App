const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const domainsDir = path.join(srcDir, 'domains');

const mappings = {
  identity: {
    routes: ['auth.js', 'user.js', 'profile.js', 'institutions.js'],
    models: ['User.js', 'Profile.js', 'Institution.js', 'DeletionRequest.js'],
    services: []
  },
  therapy: {
    routes: ['therapists.js', 'appointments.js'],
    models: ['Therapist.js', 'Appointment.js', 'TherapistNote.js'],
    services: ['burnoutPredictionService.js']
  },
  assessment: {
    routes: ['aiIntake.js'],
    models: ['AssessmentSession.js', 'AssessmentFeatureVector.js', 'AssessmentFusionResult.js'],
    services: ['ai'] // Directory
  },
  wellness: {
    routes: ['goals.js', 'mood.js', 'journals.js', 'fitness.js', 'wellness.js'],
    models: ['Goal.js', 'MoodEntry.js', 'JournalEntry.js', 'WellnessPlan.js', 'FitnessCategory.js', 'FitnessContentItem.js', 'FitnessSubcategory.js'],
    services: []
  },
  community: {
    routes: ['groups.js', 'peers.js', 'blogs.js', 'chat.js'],
    models: ['GroupSession.js', 'PeerConnection.js', 'BlogPost.js'],
    services: []
  },
  content: {
    routes: ['home.js', 'content.js', 'quotes.js', 'resources.js'],
    models: ['HomeConfig.js', 'Quote.js', 'Resource.js'],
    services: []
  },
  admin: {
    routes: ['admin.js', 'issues.js', 'emergencyContact.js', 'analytics.js'],
    models: ['AdminAuditLog.js', 'IssueReport.js', 'EmergencyContact.js', 'ActivityLog.js', 'Notification.js'],
    services: ['slaMonitor.js']
  }
};

// Ensure src/domains exists
if (!fs.existsSync(domainsDir)) {
  fs.mkdirSync(domainsDir, { recursive: true });
}

// Track file movements: absolute old path -> absolute new path
const fileMoves = {};

for (const [domainName, domainFiles] of Object.entries(mappings)) {
  const domainPath = path.join(domainsDir, domainName);
  if (!fs.existsSync(domainPath)) fs.mkdirSync(domainPath, { recursive: true });
  
  for (const category of ['routes', 'models', 'services']) {
    const categoryPath = path.join(domainPath, category);
    if (!fs.existsSync(categoryPath)) fs.mkdirSync(categoryPath, { recursive: true });

    for (const file of domainFiles[category] || []) {
      const oldPath = path.join(rootDir, category, file);
      const newPath = path.join(categoryPath, file);
      if (fs.existsSync(oldPath)) {
        fileMoves[oldPath] = newPath;
      }
    }
  }

  // Create index.js for the domain
  const indexPath = path.join(domainPath, 'index.js');
  let indexContent = `const express = require('express');\nconst router = express.Router();\n\n`;
  for (const routeFile of domainFiles.routes || []) {
    const routeName = routeFile.replace('.js', '');
    indexContent += `router.use('/${routeName}', require('./routes/${routeName}'));\n`;
  }
  indexContent += `\nmodule.exports = router;\n`;
  fs.writeFileSync(indexPath, indexContent);
  execSync(`git add "${indexPath}"`);
}

// Move files
for (const [oldPath, newPath] of Object.entries(fileMoves)) {
  console.log(`Moving ${path.relative(rootDir, oldPath)} -> ${path.relative(rootDir, newPath)}`);
  try {
    execSync(`git mv "${oldPath}" "${newPath}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Failed to move ${oldPath}: ${err.message}`);
  }
}

// Function to recursively get all JS files
function getAllJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        getAllJsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allJsFiles = getAllJsFiles(rootDir);

// Build lookup map for require resolving
// Key: file basename without extension (e.g. 'User'), Value: absolute new path
const basenameMap = {};
for (const newPath of Object.values(fileMoves)) {
  const ext = path.extname(newPath);
  let base = path.basename(newPath, ext);
  basenameMap[base] = newPath;
}
// Add manually resolved files that weren't moved but might be referenced
const middlewareDir = path.join(rootDir, 'middleware');
const configDir = path.join(rootDir, 'config');
if (fs.existsSync(middlewareDir)) {
  fs.readdirSync(middlewareDir).forEach(f => basenameMap[path.basename(f, '.js')] = path.join(middlewareDir, f));
}
if (fs.existsSync(configDir)) {
  fs.readdirSync(configDir).forEach(f => basenameMap[path.basename(f, '.js')] = path.join(configDir, f));
}

// Update imports
for (const file of allJsFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Regex to match require statements: require('../src/domains/identity/models/User')
  const requireRegex = /require\(['"`]([^'"`]+)['"`]\)/g;
  
  content = content.replace(requireRegex, (match, importPath) => {
    // Only process relative imports
    if (!importPath.startsWith('.')) return match;

    // Determine absolute path of what it was trying to import originally
    // Since the file has moved, its current __dirname is different from before.
    // Wait, the content currently has paths relative to its OLD location.
    // So we should compute what it meant in the OLD location.
    
    // Find the old path of the current file
    let oldFileLocation = Object.keys(fileMoves).find(k => fileMoves[k] === file) || file;
    let oldDir = path.dirname(oldFileLocation);
    
    let absImportPath = path.resolve(oldDir, importPath);
    // Might not have .js extension
    if (!absImportPath.endsWith('.js')) absImportPath += '.js';

    // Check if the imported file moved
    let newImportLocation = fileMoves[absImportPath] || absImportPath;

    // Some requires don't have .js, or might be directories. 
    // Let's do a fallback: just look up the basename
    let importBasename = path.basename(importPath, '.js');
    if (!fs.existsSync(newImportLocation) && basenameMap[importBasename]) {
       newImportLocation = basenameMap[importBasename];
    }

    // Now compute the new relative path from the CURRENT location of the file
    let newRelativePath = path.relative(path.dirname(file), newImportLocation);
    // Fix Windows slashes
    newRelativePath = newRelativePath.replace(/\\/g, '/');
    if (!newRelativePath.startsWith('.')) {
      newRelativePath = './' + newRelativePath;
    }
    // Remove .js extension if it wasn't there originally
    if (!importPath.endsWith('.js') && newRelativePath.endsWith('.js')) {
      newRelativePath = newRelativePath.slice(0, -3);
    }

    if (importPath !== newRelativePath) {
      changed = true;
      return `require('${newRelativePath}')`;
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(file, content);
  }
}

console.log('Migration completed.');
