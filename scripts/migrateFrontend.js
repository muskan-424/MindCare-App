const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

// Map of relative path from root -> new relative path from root
const mappings = {
  // Navigation stack files -> move to src/navigation
  'src/components/TabNavigation.js': 'src/navigation/TabNavigation.js',
  'src/components/HomeStackNavigation.js': 'src/navigation/HomeStackNavigation.js',
  'src/components/LoginStackNavigation.js': 'src/navigation/LoginStackNavigation.js',
  'src/components/AdminStackNavigation.js': 'src/navigation/AdminStackNavigation.js',
  'src/components/TherapistStackNavigation.js': 'src/navigation/TherapistStackNavigation.js',
  'src/components/FitnessStackNavigation.js': 'src/navigation/FitnessStackNavigation.js',

  // Identity domain screens
  'src/screens/Login.js': 'src/domains/identity/screens/Login.js',
  'src/screens/Signup.js': 'src/domains/identity/screens/Signup.js',
  'src/screens/ForgotPasswordScreen.js': 'src/domains/identity/screens/ForgotPasswordScreen.js',
  'src/screens/ResetPasswordScreen.js': 'src/domains/identity/screens/ResetPasswordScreen.js',
  'src/screens/ProfileScreen.js': 'src/domains/identity/screens/ProfileScreen.js',
  'src/screens/EditProfileScreen.js': 'src/domains/identity/screens/EditProfileScreen.js',
  'src/screens/InstitutionDashboardScreen.js': 'src/domains/identity/screens/InstitutionDashboardScreen.js',

  // Therapy domain screens & components
  'src/screens/TherapistHomeScreen.js': 'src/domains/therapy/screens/TherapistHomeScreen.js',
  'src/screens/TherapistProfileScreen.js': 'src/domains/therapy/screens/TherapistProfileScreen.js',
  'src/screens/TherapistPatientHistoryScreen.js': 'src/domains/therapy/screens/TherapistPatientHistoryScreen.js',
  'src/screens/TherapistScreen.js': 'src/domains/therapy/screens/TherapistScreen.js',
  'src/screens/AppointmentsScreen.js': 'src/domains/therapy/screens/AppointmentsScreen.js',
  'src/screens/BookAppointmentScreen.js': 'src/domains/therapy/screens/BookAppointmentScreen.js',
  'src/screens/AddSessionNoteScreen.js': 'src/domains/therapy/screens/AddSessionNoteScreen.js',
  'src/components/TherapistCard.js': 'src/domains/therapy/components/TherapistCard.js',
  'src/components/Appointments.js': 'src/domains/therapy/components/Appointments.js',

  // Assessment domain screens & hooks
  'src/screens/MultidimensionalIntakeScreen.js': 'src/domains/assessment/screens/MultidimensionalIntakeScreen.js',
  'src/screens/EmotionalFingerprintScreen.js': 'src/domains/assessment/screens/EmotionalFingerprintScreen.js',
  'src/hooks/useSpeechToText.js': 'src/domains/assessment/hooks/useSpeechToText.js',

  // Wellness domain screens & components
  'src/screens/MoodTrackerScreen.js': 'src/domains/wellness/screens/MoodTrackerScreen.js',
  'src/screens/MoodCheckScreen.js': 'src/domains/wellness/screens/MoodCheckScreen.js',
  'src/screens/JournalScreen.js': 'src/domains/wellness/screens/JournalScreen.js',
  'src/screens/AddJournal.js': 'src/domains/wellness/screens/AddJournal.js',
  'src/screens/DisplayJournal.js': 'src/domains/wellness/screens/DisplayJournal.js',
  'src/screens/GoalTrackingScreen.js': 'src/domains/wellness/screens/GoalTrackingScreen.js',
  'src/screens/WellnessPlanScreen.js': 'src/domains/wellness/screens/WellnessPlanScreen.js',
  'src/screens/FitnessScreen.js': 'src/domains/wellness/screens/FitnessScreen.js',
  'src/screens/FitnessSubScreen.js': 'src/domains/wellness/screens/FitnessSubScreen.js',
  'src/screens/FitnessContent.js': 'src/domains/wellness/screens/FitnessContent.js',
  'src/screens/FitnessCoachScreen.js': 'src/domains/wellness/screens/FitnessCoachScreen.js',
  'src/screens/IndividualFitnessContent.js': 'src/domains/wellness/screens/IndividualFitnessContent.js',
  'src/components/FitnessCategoryCard.js': 'src/domains/wellness/components/FitnessCategoryCard.js',
  'src/components/FitnessContentCard.js': 'src/domains/wellness/components/FitnessContentCard.js',
  'src/components/FitnessSubScreenCard.js': 'src/domains/wellness/components/FitnessSubScreenCard.js',

  // Community domain screens
  'src/screens/GroupSessionsScreen.js': 'src/domains/community/screens/GroupSessionsScreen.js',
  'src/screens/PeerMatchingScreen.js': 'src/domains/community/screens/PeerMatchingScreen.js',
  'src/screens/BlogMainScreen.js': 'src/domains/community/screens/BlogMainScreen.js',
  'src/screens/OpenBlogScreen.js': 'src/domains/community/screens/OpenBlogScreen.js',
  'src/screens/AddBlog.js': 'src/domains/community/screens/AddBlog.js',
  'src/screens/ChatWithTink.js': 'src/domains/community/screens/ChatWithTink.js',

  // Content domain screens
  'src/screens/HomeScreen.js': 'src/domains/content/screens/HomeScreen.js',
  'src/screens/AffirmationsScreen.js': 'src/domains/content/screens/AffirmationsScreen.js',
  'src/screens/BreathingScreen.js': 'src/domains/content/screens/BreathingScreen.js',
  'src/screens/CreateMeme.js': 'src/domains/content/screens/CreateMeme.js',
  'src/screens/GratitudeScreen.js': 'src/domains/content/screens/GratitudeScreen.js',
  'src/screens/GroundingScreen.js': 'src/domains/content/screens/GroundingScreen.js',
  'src/screens/StoryScreen.js': 'src/domains/content/screens/StoryScreen.js',
  'src/screens/TrackList.js': 'src/domains/content/screens/TrackList.js',
  'src/screens/TrackPlayer.js': 'src/domains/content/screens/TrackPlayer.js',
  'src/screens/AssignedResourcesScreen.js': 'src/domains/content/screens/AssignedResourcesScreen.js',

  // Admin domain screens
  'src/screens/AdminDashboardScreen.js': 'src/domains/admin/screens/AdminDashboardScreen.js',
  'src/screens/ReportIssueScreen.js': 'src/domains/admin/screens/ReportIssueScreen.js',
  'src/screens/CrisisResourcesScreen.js': 'src/domains/admin/screens/CrisisResourcesScreen.js',
  'src/screens/EmergencyContactScreen.js': 'src/domains/admin/screens/EmergencyContactScreen.js',
  'src/screens/SafetyScreen.js': 'src/domains/admin/screens/SafetyScreen.js',
};

// 1. Ensure target directories exist and perform moves using git mv
console.log('--- MOVING FILES ---');
for (const [oldRel, newRel] of Object.entries(mappings)) {
  const oldPath = path.join(rootDir, oldRel);
  const newPath = path.join(rootDir, newRel);

  if (fs.existsSync(oldPath)) {
    const newDir = path.dirname(newPath);
    if (!fs.existsSync(newDir)) {
      fs.mkdirSync(newDir, { recursive: true });
    }
    console.log(`git mv ${oldRel} -> ${newRel}`);
    try {
      execSync(`git mv "${oldPath}" "${newPath}"`, { stdio: 'inherit' });
    } catch (err) {
      console.warn(`Failed to git mv ${oldRel}: ${err.message}. Trying direct rename.`);
      fs.renameSync(oldPath, newPath);
    }
  } else {
    console.log(`Skipping: ${oldRel} (file does not exist)`);
  }
}

// 2. Scan all JS and TSX files in the project to rewrite relative imports
console.log('\n--- SCANNING AND REWRITING IMPORTS ---');

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'backend') {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const filesToScan = [
  ...getAllFiles(path.join(rootDir, 'src')),
  ...getAllFiles(path.join(rootDir, '__tests__')),
  path.join(rootDir, 'AuthFlow.js'),
  path.join(rootDir, 'App.js'),
].filter(f => fs.existsSync(f));

const replaceImports = (content, fileOldPath, fileNewPath) => {
  // Regex for ES6 import/export
  const es6Regex = /((?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"`])([^'"`]+)(['"`])/g;
  // Regex for CommonJS require
  const cjsRegex = /(require\(['"`])([^'"`]+)(['"`]\))/g;

  let changed = false;

  const replacePath = (match, prefix, importPath, suffix) => {
    if (!importPath.startsWith('.')) return match;

    // Resolve old absolute path of the import target
    const oldDir = path.dirname(fileOldPath);
    let absImportPath = path.resolve(oldDir, importPath);

    let targetResolvedPath = null;
    const extensions = ['.js', '.tsx', '.ts', ''];
    for (const ext of extensions) {
      const candidate = absImportPath + ext;
      const key = path.relative(rootDir, candidate).replace(/\\/g, '/');
      if (mappings[key]) {
        targetResolvedPath = path.join(rootDir, mappings[key]);
        break;
      }
    }

    if (!targetResolvedPath) {
      if (fileOldPath !== fileNewPath) {
        let resolvedOriginalTarget = null;
        for (const ext of ['.js', '.tsx', '.ts', '', '/index.js']) {
          const candidate = absImportPath + ext;
          if (fs.existsSync(candidate)) {
            resolvedOriginalTarget = candidate;
            break;
          }
        }
        if (resolvedOriginalTarget) {
          targetResolvedPath = resolvedOriginalTarget;
        } else {
          targetResolvedPath = absImportPath;
        }
      } else {
        return match;
      }
    }

    let newRelativePath = path.relative(path.dirname(fileNewPath), targetResolvedPath);
    newRelativePath = newRelativePath.replace(/\\/g, '/');
    if (!newRelativePath.startsWith('.')) {
      newRelativePath = './' + newRelativePath;
    }

    const originalExt = path.extname(importPath);
    if (!originalExt) {
      if (newRelativePath.endsWith('.js')) {
        newRelativePath = newRelativePath.slice(0, -3);
      } else if (newRelativePath.endsWith('.tsx')) {
        newRelativePath = newRelativePath.slice(0, -4);
      } else if (newRelativePath.endsWith('.ts')) {
        newRelativePath = newRelativePath.slice(0, -3);
      }
    }

    if (importPath !== newRelativePath) {
      changed = true;
      return prefix + newRelativePath + suffix;
    }

    return match;
  };

  let newContent = content.replace(es6Regex, replacePath);
  newContent = newContent.replace(cjsRegex, replacePath);

  return { newContent, changed };
};

let filesUpdatedCount = 0;

for (const file of filesToScan) {
  // Determine if this file was moved
  let oldPath = file;
  let relPath = path.relative(rootDir, file).replace(/\\/g, '/');
  
  // Find key in mappings if this is a moved file
  const oldRelPath = Object.keys(mappings).find(k => path.join(rootDir, mappings[k]) === file);
  if (oldRelPath) {
    oldPath = path.join(rootDir, oldRelPath);
  }

  const content = fs.readFileSync(file, 'utf8');
  const { newContent, changed } = replaceImports(content, oldPath, file);

  if (changed) {
    fs.writeFileSync(file, newContent);
    filesUpdatedCount++;
    console.log(`Updated imports in: ${path.relative(rootDir, file)}`);
  }
}

console.log(`\nImport updates complete. Total files updated: ${filesUpdatedCount}`);

// 3. Clean up empty directories under src/screens and src/components
console.log('\n--- CLEANING UP EMPTY DIRECTORIES ---');
const cleanDirs = [
  path.join(rootDir, 'src', 'screens'),
  path.join(rootDir, 'src', 'components'),
];

function deleteEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      deleteEmptyDirs(filePath);
    }
  }
  // Check again after subdirs might have been deleted
  const remaining = fs.readdirSync(dir);
  if (remaining.length === 0 && dir !== path.join(rootDir, 'src')) {
    console.log(`Removing empty directory: ${path.relative(rootDir, dir)}`);
    fs.rmdirSync(dir);
  }
}

for (const dir of cleanDirs) {
  deleteEmptyDirs(dir);
}

console.log('Migration finished successfully!');
