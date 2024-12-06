#!/usr/bin/env node --no-deprecation

/**
 * @fileoverview The wrapping CLI for Mediumroast for GitHub
 * @license Apache-2.0
 * @version 1.2.1
 * 
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file mrcli-user.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * 
 */

// Import required modules
import program from 'commander'
import CLIUtilities from '../src/cli/common.js'

// Construct the CLIUtilities object & set the version
const cliUtils = new CLIUtilities()
program.version(cliUtils.getVersionFromPackageJson())

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