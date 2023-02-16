#!/usr/bin/env node

/**
 * The wrapping CLI to engage all mediumroast.io CLIs
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file mrcli.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.0.0
 */

// Import required modules
import program from 'commander'

program
  .name('mrcli')
  .version('0.6.0')
  .description('mediumroast.io top level command line interface')
  .command('setup', 'setup the mediumroast.io system via the command line').alias('f')
  .command('backup', 'backup mediumroast.io objects to the your .mediumroast/backups directory').alias('b')
  .command('s3', 'archive interaction objects to the your preferred location').alias('a')
  .command('interaction', 'manage and report on mediumroast.io interaction objects').alias('i')
  .command('company', 'manage and report on mediumroast.io company objects').alias('c')
  .command('study', 'manage and report on mediumroast.io study objects').alias('s')
  .command('users', 'manage and report on mediumroast.io users').alias('u')

program.parse(process.argv)