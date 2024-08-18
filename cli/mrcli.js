#!/usr/bin/env node

/**
 * The wrapping CLI to engage all mediumroast.io CLIs
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file mrcli.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.2.0
 */

// Import required modules
import program from 'commander'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url';

// Function to update version from package.json
function updateVersionFromPackageJson() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const versionNumber = packageJson.version;

  program.version(versionNumber);
}

// Update the version from package.json
updateVersionFromPackageJson()

program
  .name('mrcli')
  .description('Mediumroast for GitHub command line interface')
  .command('setup', 'setup the mediumroast.io system via the command line').alias('f')
  .command('interaction', 'manage and report on mediumroast.io interaction objects').alias('i')
  .command('company', 'manage and report on mediumroast.io company objects').alias('c')
  .command('study', 'manage and report on mediumroast.io study objects').alias('s')
  .command('user', 'report on mediumroast.io users in GitHub').alias('u')
  .command('billing', 'DEPRECATED - report on GitHub actions and storage units consumed')
  .command('storage', 'report on GitHub storage units consumed').alias('t')
  .command('actions', 'report on and update GitHub actions').alias('a')

program.parse(process.argv)