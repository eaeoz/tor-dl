#!/usr/bin/env node
const { createParser } = require('../dist/cli/parser');

const program = createParser();
program.parse(process.argv);