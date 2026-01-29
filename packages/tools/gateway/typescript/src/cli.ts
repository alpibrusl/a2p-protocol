#!/usr/bin/env node
/**
 * a2p-gateway CLI
 */

import { serve } from '@hono/node-server';
import { createGateway, MemoryStorageAdapter } from './index';

const args = process.argv.slice(2);
const command = args[0];

function printHelp() {
  console.log(`
a2p-gateway - Reference a2p gateway server

Usage:
  a2p-gateway <command> [options]

Commands:
  serve     Start the gateway server
  help      Show this help message

Options:
  --port, -p     Port to listen on (default: 3000)
  --host, -h     Host to bind to (default: 0.0.0.0)

Examples:
  a2p-gateway serve
  a2p-gateway serve --port 8080
  a2p-gateway serve -p 8080 -h localhost
`);
}

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--port' || arg === '-p') {
      result.port = args[++i];
    } else if (arg === '--host' || arg === '-h') {
      result.host = args[++i];
    }
  }
  return result;
}

async function main() {
  if (!command || command === 'help' || command === '--help') {
    printHelp();
    process.exit(0);
  }

  if (command === 'serve') {
    const options = parseArgs(args.slice(1));
    const port = parseInt(options.port || '3000', 10);
    const host = options.host || '0.0.0.0';

    const app = createGateway({
      storage: new MemoryStorageAdapter(),
      rateLimit: {
        requestsPerMinute: 60,
        burstSize: 10,
      },
    });

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ▄▀▄  ▀▀▀▀   █▀▀█   a2p Gateway Server                  ║
║   █▀█   ▄▄    █▄▄█   v0.1.0                              ║
║                      Reference Implementation             ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║   Endpoints:                                              ║
║   • GET  /health                    Health check          ║
║   • GET  /a2p/v1/profile/:did       Get profile          ║
║   • POST /a2p/v1/profile/:did/access Request access      ║
║   • GET  /a2p/v1/profile/:did/memories List memories     ║
║   • POST /a2p/v1/profile/:did/memories/propose Propose   ║
║   • GET  /a2p/v1/profile/:did/proposals List proposals   ║
║   • POST /a2p/v1/profile/:did/proposals/:id/review       ║
║   • GET  /a2p/v1/agents/:did        Get agent profile    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

    console.log(`🚀 Server starting on http://${host}:${port}`);
    console.log(`📖 API base: http://${host}:${port}/a2p/v1`);
    console.log(`💚 Health check: http://${host}:${port}/health`);
    console.log('');
    console.log('Press Ctrl+C to stop');
    console.log('');

    serve({
      fetch: app.fetch,
      port,
      hostname: host,
    });
  } else {
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
