const { execSync } = require('child_process');
const path = require('path');

// Change to backend directory
process.chdir(path.join(__dirname, '../..'));

try {
  console.log('Running unit tests...\n');
  
  // Run Jest with configuration
  const testCommand = 'npx jest --config jest.config.js --verbose --coverage';
  console.log(`Executing: ${testCommand}`);
  
  const output = execSync(testCommand, { 
    encoding: 'utf8',
    stdio: 'inherit'
  });
  
  console.log('\n✅ Tests completed successfully!');
  console.log('📊 Coverage report generated in coverage/ directory');
  
} catch (error) {
  console.error('\n❌ Tests failed!');
  console.error('Exit code:', error.status);
  process.exit(error.status);
}
