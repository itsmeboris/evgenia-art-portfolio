#!/usr/bin/env node

// Pre-build Quality Pipeline
// Runs format:check -> lint -> lint:fix -> format:check -> format before build

const { execSync } = require('child_process');

// Simple color functions without chalk dependency
const colors = {
  green: text => `\x1b[32m${text}\x1b[0m`,
  red: text => `\x1b[31m${text}\x1b[0m`,
  yellow: text => `\x1b[33m${text}\x1b[0m`,
  blue: text => `\x1b[34m${text}\x1b[0m`,
  bold: text => `\x1b[1m${text}\x1b[0m`,
};

class PreBuildQuality {
  constructor() {
    this.steps = [
      {
        name: 'format:check',
        command: 'npm run format:check',
        description: 'Check code formatting',
      },
      { name: 'lint', command: 'npm run lint', description: 'Check code quality' },
      { name: 'lint:fix', command: 'npm run lint:fix', description: 'Fix linting issues' },
      {
        name: 'format:check',
        command: 'npm run format:check',
        description: 'Re-check formatting after lint fixes',
      },
      {
        name: 'format',
        command: 'npm run format',
        description: 'Fix any remaining formatting issues',
      },
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}]`;

    switch (type) {
      case 'success':
        console.log(colors.green(`${prefix} ✅ ${message}`));
        break;
      case 'warning':
        console.log(colors.yellow(`${prefix} ⚠️  ${message}`));
        break;
      case 'error':
        console.log(colors.red(`${prefix} ❌ ${message}`));
        break;
      case 'info':
        console.log(colors.blue(`${prefix} 🔄 ${message}`));
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  async runStep(step, isRequired = true) {
    this.log(`Running: ${step.description}`, 'info');

    try {
      const output = execSync(step.command, {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      this.log(`${step.name} completed successfully`, 'success');
      return { success: true, output };
    } catch (error) {
      if (isRequired) {
        this.log(`${step.name} failed: ${error.message}`, 'error');
        return { success: false, error: error.message, output: error.stdout || error.stderr };
      } else {
        this.log(`${step.name} had issues but continuing...`, 'warning');
        return {
          success: false,
          error: error.message,
          output: error.stdout || error.stderr,
          optional: true,
        };
      }
    }
  }

  async runQualityPipeline() {
    console.log(colors.bold(colors.blue('\n🔧 Starting Pre-Build Quality Pipeline\n')));

    let totalSteps = this.steps.length;
    let completedSteps = 0;
    let hasErrors = false;

    // Step 1: Initial format check
    this.log('Step 1/5: Initial format check');
    const formatCheck1 = await this.runStep(this.steps[0], false);
    completedSteps++;

    if (formatCheck1.success) {
      this.log('Code formatting looks good!', 'success');
    } else {
      this.log('Code formatting issues detected, will fix later', 'warning');
    }

    // Step 2: Lint check
    this.log('\nStep 2/5: Lint check');
    const lintCheck = await this.runStep(this.steps[1], false);
    completedSteps++;

    if (lintCheck.success) {
      this.log('No linting issues found!', 'success');
      // Skip lint:fix if lint passed
      this.log('Step 3/5: Skipping lint:fix (no issues found)', 'info');
      completedSteps++;
    } else {
      this.log('Linting issues detected, attempting to fix...', 'warning');

      // Step 3: Lint fix
      this.log('\nStep 3/5: Auto-fixing lint issues');
      const lintFix = await this.runStep(this.steps[2], false);
      completedSteps++;

      if (lintFix.success) {
        this.log('Lint issues fixed successfully!', 'success');
      } else {
        this.log('Some lint issues could not be auto-fixed', 'warning');
        hasErrors = true;
      }
    }

    // Step 4: Re-check format after lint fixes
    this.log('\nStep 4/5: Re-checking format after lint fixes');
    const formatCheck2 = await this.runStep(this.steps[3], false);
    completedSteps++;

    if (formatCheck2.success) {
      this.log('Code formatting still good after lint fixes!', 'success');
      // Skip format fix if formatting is good
      this.log('Step 5/5: Skipping format fix (no issues found)', 'info');
      completedSteps++;
    } else {
      this.log('Formatting issues after lint fixes, will fix now...', 'warning');

      // Step 5: Format fix
      this.log('\nStep 5/5: Fixing formatting issues');
      const formatFix = await this.runStep(this.steps[4], true);
      completedSteps++;

      if (formatFix.success) {
        this.log('All formatting issues fixed!', 'success');
      } else {
        this.log('Failed to fix formatting issues', 'error');
        hasErrors = true;
      }
    }

    // Final summary
    console.log(colors.bold(colors.blue('\n📊 Quality Pipeline Summary:')));
    console.log(`   Completed: ${completedSteps}/${totalSteps} steps`);

    if (hasErrors) {
      console.log(colors.red('   ❌ Some issues remain - check output above'));
      console.log(colors.yellow('   ⚠️  Build will continue but please review issues\n'));
      return false;
    } else {
      console.log(colors.green('   ✅ All quality checks passed!'));
      console.log(colors.green('   🎉 Code is clean and ready for build\n'));
      return true;
    }
  }
}

// Run the quality pipeline if called directly
if (require.main === module) {
  const pipeline = new PreBuildQuality();

  pipeline
    .runQualityPipeline()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error(colors.red('❌ Quality pipeline failed:'), error);
      process.exit(1);
    });
}

module.exports = PreBuildQuality;
