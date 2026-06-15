---
description: Run the production build and report any errors as the correctness check
allowed-tools: Bash(npm install), Bash(npm ci), Bash(npm run build), Read
---

This project has no test suite or linter, so `npm run build` is the canonical
correctness check.

1. If `node_modules` is missing, run `npm install` first.
2. Run `npm run build`.
3. If it fails, read the error, open the offending file, and report the root
   cause (import path, syntax, missing export, etc.) with a concrete fix. Do not
   guess — trace it to the actual line.
4. If it passes, report success and the build output size.
