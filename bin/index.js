#!/usr/bin/env node
const program = require('commander');
const preMerge = require('../PreMerge');

program
    .command('start <Base> <Local> <Remote>')
    .description('start merge file')
    .action (function (base, local, remote) {
        preMerge.start(base, local, remote);
    });

program.parse(process.argv);