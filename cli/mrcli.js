#!/usr/bin/env node

/**
 * The wrapping CLI to engage all mediumroast.io CLIs
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file mrcli.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.0.0
 */

// Import required modules
import program from 'commander'

program
  .name('mrcli')
  .version('0.6.0')
  .description('mediumroast.io command line interface')
  .command('setup', 'setup the mediumroast.io system via the command line').alias('f')
  .command('interaction', 'manage and report on mediumroast.io interaction objects').alias('i')
  .command('company', 'manage and report on mediumroast.io company objects').alias('c')
  .command('study', 'manage and report on mediumroast.io study objects').alias('s')
  .command('user', 'report on mediumroast.io users in GitHub').alias('u')
  .command('billing', 'report on GitHub actions and storage units consumed').alias('b')

program.parse(process.argv)