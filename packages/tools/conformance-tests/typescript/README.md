# @a2p/conformance-tests

Conformance test suite for validating a2p protocol implementations. Use this package to verify that your a2p gateway or client implementation complies with the protocol specification.

## Installation

```bash
npm install @a2p/conformance-tests
# or
pnpm add @a2p/conformance-tests
```

## CLI Usage

### Run All Tests

```bash
npx a2p-test run \
  --url http://localhost:3000 \
  --agent did:a2p:agent:test-agent \
  --user did:a2p:user:test-user
```

### Run Specific Category

```bash
npx a2p-test run \
  --url http://localhost:3000 \
  --agent did:a2p:agent:test-agent \
  --user did:a2p:user:test-user \
  --category authentication
```

### JSON Output

```bash
npx a2p-test run \
  --url http://localhost:3000 \
  --agent did:a2p:agent:test-agent \
  --user did:a2p:user:test-user \
  --json > results.json
```

### List Categories

```bash
npx a2p-test categories
```

## Programmatic Usage

```typescript
import { runConformanceTests, runCategoryTests, type TestContext } from '@a2p/conformance-tests';

const ctx: TestContext = {
  baseUrl: 'http://localhost:3000',
  agentDid: 'did:a2p:agent:my-agent',
  userDid: 'did:a2p:user:alice',
  verbose: true,
};

// Run all tests
const results = await runConformanceTests(ctx);

console.log(`Passed: ${results.passed}/${results.totalTests}`);
console.log(`Duration: ${results.duration}ms`);

// Run specific category
const authResults = await runCategoryTests(ctx, 'authentication');
```

## Test Categories

| Category | Tests | Description |
|----------|-------|-------------|
| `schema` | 1 | JSON schema validation |
| `authentication` | 2 | Auth header and timestamp validation |
| `profiles` | 2 | Profile CRUD operations |
| `memories` | 0 | Memory operations |
| `proposals` | 2 | Proposal submission and validation |
| `consent` | 1 | Access request and consent receipts |
| `rate_limiting` | 1 | Rate limit header presence |
| `versioning` | 1 | Version negotiation |

## Test Results

```typescript
interface TestSuiteResult {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: TestResult[];
  timestamp: string;
  version: string;
}

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  message: string;
  duration: number;
  details?: Record<string, unknown>;
}
```

## CI Integration

### GitHub Actions

```yaml
name: a2p Conformance Tests

on: [push, pull_request]

jobs:
  conformance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Start a2p Gateway
        run: |
          npm install
          npm start &
          sleep 5
      
      - name: Run Conformance Tests
        run: |
          npx a2p-test run \
            --url http://localhost:3000 \
            --agent did:a2p:agent:ci \
            --user did:a2p:user:test \
            --json > conformance-results.json
      
      - name: Upload Results
        uses: actions/upload-artifact@v4
        with:
          name: conformance-results
          path: conformance-results.json
```

## Adding Custom Tests

```typescript
import { runConformanceTests, getTestDefinitions } from '@a2p/conformance-tests';

// Get existing tests
const tests = getTestDefinitions();

// Custom test runner with additional tests
async function runWithCustomTests(ctx: TestContext) {
  // Run standard tests
  const standardResults = await runConformanceTests(ctx);
  
  // Run custom tests
  const customResults = await myCustomTests(ctx);
  
  return {
    ...standardResults,
    results: [...standardResults.results, ...customResults],
  };
}
```

## License

EUPL-1.2
