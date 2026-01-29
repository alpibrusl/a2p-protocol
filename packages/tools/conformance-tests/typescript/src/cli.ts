#!/usr/bin/env node
/**
 * a2p-test CLI - Conformance test runner
 */

import { runConformanceTests, runCategoryTests, getCategories, type TestContext, type TestSuiteResult } from './index';

const args = process.argv.slice(2);

function printHelp() {
  console.log(`
a2p-test - Conformance test suite for a2p implementations

Usage:
  a2p-test <command> [options]

Commands:
  run           Run conformance tests
  categories    List available test categories
  help          Show this help message

Options for 'run':
  --url, -u       Base URL of the a2p gateway (required)
  --agent, -a     Agent DID for authentication (required)
  --user, -U      User DID to test against (required)
  --category, -c  Run only tests in this category
  --verbose, -v   Show detailed output
  --json          Output results as JSON

Examples:
  a2p-test run -u http://localhost:3000 -a did:a2p:agent:test -U did:a2p:user:alice
  a2p-test run -u http://localhost:3000 -a did:a2p:agent:test -U did:a2p:user:alice -c authentication
  a2p-test run -u http://localhost:3000 -a did:a2p:agent:test -U did:a2p:user:alice --json
  a2p-test categories
`);
}

function parseArgs(args: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--url' || arg === '-u') {
      result.url = args[++i];
    } else if (arg === '--agent' || arg === '-a') {
      result.agent = args[++i];
    } else if (arg === '--user' || arg === '-U') {
      result.user = args[++i];
    } else if (arg === '--category' || arg === '-c') {
      result.category = args[++i];
    } else if (arg === '--verbose' || arg === '-v') {
      result.verbose = true;
    } else if (arg === '--json') {
      result.json = true;
    }
  }
  return result;
}

function printBanner() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ▄▀▄  ▀▀▀▀   █▀▀█   a2p Conformance Test Suite          ║
║   █▀█   ▄▄    █▄▄█   v1.0.0                              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
}

function printResults(results: TestSuiteResult, verbose: boolean) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                      TEST RESULTS                          ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // Group by category
  const byCategory = new Map<string, typeof results.results>();
  for (const result of results.results) {
    const list = byCategory.get(result.category) || [];
    list.push(result);
    byCategory.set(result.category, list);
  }

  for (const [category, categoryResults] of byCategory) {
    console.log(`▸ ${category.toUpperCase()}`);
    for (const result of categoryResults) {
      const icon = result.passed ? '✓' : '✗';
      const color = result.passed ? '\x1b[32m' : '\x1b[31m';
      console.log(`  ${color}${icon}\x1b[0m ${result.name}`);
      if (verbose || !result.passed) {
        console.log(`    ${result.message}`);
      }
    }
    console.log('');
  }

  console.log('───────────────────────────────────────────────────────────');
  console.log(`Total: ${results.totalTests} | Passed: ${results.passed} | Failed: ${results.failed}`);
  console.log(`Duration: ${results.duration}ms`);
  console.log('───────────────────────────────────────────────────────────');
  console.log('');

  if (results.failed === 0) {
    console.log('\x1b[32m✓ All tests passed!\x1b[0m');
  } else {
    console.log(`\x1b[31m✗ ${results.failed} test(s) failed\x1b[0m`);
  }
}

async function main() {
  const command = args[0];

  if (!command || command === 'help' || command === '--help') {
    printHelp();
    process.exit(0);
  }

  if (command === 'categories') {
    console.log('Available test categories:');
    for (const cat of getCategories()) {
      console.log(`  - ${cat}`);
    }
    process.exit(0);
  }

  if (command === 'run') {
    const options = parseArgs(args.slice(1));

    if (!options.url || !options.agent || !options.user) {
      console.error('Error: --url, --agent, and --user are required');
      console.log('');
      printHelp();
      process.exit(1);
    }

    const ctx: TestContext = {
      baseUrl: options.url as string,
      agentDid: options.agent as string,
      userDid: options.user as string,
      verbose: options.verbose as boolean,
    };

    if (!options.json) {
      printBanner();
      console.log(`Target: ${ctx.baseUrl}`);
      console.log(`Agent: ${ctx.agentDid}`);
      console.log(`User: ${ctx.userDid}`);
      if (options.category) {
        console.log(`Category: ${options.category}`);
      }
      console.log('');
      console.log('Running tests...');
      console.log('');
    }

    let results: TestSuiteResult;
    if (options.category) {
      results = await runCategoryTests(ctx, options.category as any);
    } else {
      results = await runConformanceTests(ctx);
    }

    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      printResults(results, options.verbose as boolean);
    }

    process.exit(results.failed > 0 ? 1 : 0);
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
