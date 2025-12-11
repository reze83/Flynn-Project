/**
 * Testing Skills - Unit, integration, and E2E testing patterns
 */

import type { Skill } from "../types.js";

export const testingStrategies: Skill = {
  id: "testing-strategies",
  name: "Testing Strategies",
  description:
    "Unit testing, integration testing, E2E testing, TDD patterns, mocking strategies, and test coverage.",
  category: "testing",
  triggers: [
    "test",
    "testing",
    "unit test",
    "integration",
    "e2e",
    "tdd",
    "mock",
    "coverage",
    "vitest",
    "jest",
    "cypress",
  ],
  tier1TokenEstimate: 50,
  tier2TokenEstimate: 2100,
  instructions: `# Testing Strategies

## Test Pyramid
\`\`\`
        /\\
       /  \\       E2E Tests (few, slow, expensive)
      /----\\
     /      \\     Integration Tests (some)
    /--------\\
   /          \\   Unit Tests (many, fast, cheap)
  --------------
\`\`\`

## Unit Testing

### Vitest (TypeScript)
\`\`\`typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('UserService', () => {
  let service: UserService;
  let mockRepo: MockUserRepository;

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      save: vi.fn(),
    };
    service = new UserService(mockRepo);
  });

  it('should find user by id', async () => {
    const user = { id: '1', name: 'John' };
    mockRepo.findById.mockResolvedValue(user);

    const result = await service.getUser('1');

    expect(result).toEqual(user);
    expect(mockRepo.findById).toHaveBeenCalledWith('1');
  });

  it('should throw when user not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(service.getUser('1')).rejects.toThrow('User not found');
  });
});
\`\`\`

### Pytest (Python)
\`\`\`python
import pytest
from unittest.mock import Mock, patch

class TestUserService:
    @pytest.fixture
    def mock_repo(self):
        return Mock()

    @pytest.fixture
    def service(self, mock_repo):
        return UserService(mock_repo)

    def test_find_user_by_id(self, service, mock_repo):
        user = User(id="1", name="John")
        mock_repo.find_by_id.return_value = user

        result = service.get_user("1")

        assert result == user
        mock_repo.find_by_id.assert_called_once_with("1")

    def test_raises_when_user_not_found(self, service, mock_repo):
        mock_repo.find_by_id.return_value = None

        with pytest.raises(UserNotFoundError):
            service.get_user("1")
\`\`\`

## Mocking Strategies

### Dependency Injection
\`\`\`typescript
// Production
const service = new UserService(new PostgresUserRepository());

// Test
const mockRepo = { findById: vi.fn() };
const service = new UserService(mockRepo);
\`\`\`

### Module Mocking
\`\`\`typescript
vi.mock('./database', () => ({
  query: vi.fn(),
}));

import { query } from './database';

it('should query database', async () => {
  vi.mocked(query).mockResolvedValue([{ id: 1 }]);

  const result = await fetchUsers();

  expect(query).toHaveBeenCalledWith('SELECT * FROM users');
});
\`\`\`

### Spies
\`\`\`typescript
const spy = vi.spyOn(console, 'log');

myFunction();

expect(spy).toHaveBeenCalledWith('expected message');
spy.mockRestore();
\`\`\`

## Integration Testing

### API Testing
\`\`\`typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('User API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('POST /users creates a user', async () => {
    const response = await request(app)
      .post('/users')
      .send({ name: 'John', email: 'john@example.com' })
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'John',
      email: 'john@example.com',
    });
  });

  it('GET /users/:id returns user', async () => {
    const user = await createTestUser();

    const response = await request(app)
      .get(\`/users/\${user.id}\`)
      .expect(200);

    expect(response.body.id).toBe(user.id);
  });
});
\`\`\`

## E2E Testing

### Playwright
\`\`\`typescript
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toHaveText('Welcome');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="email"]', 'invalid@example.com');
    await page.fill('[data-testid="password"]', 'wrong');
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="error"]')).toBeVisible();
  });
});
\`\`\`

## TDD Workflow

1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Improve code, keep tests green

\`\`\`typescript
// 1. Red - Write failing test
it('should calculate total with tax', () => {
  expect(calculateTotal(100, 0.1)).toBe(110);
});

// 2. Green - Minimal implementation
function calculateTotal(amount: number, taxRate: number): number {
  return amount + (amount * taxRate);
}

// 3. Refactor - Improve if needed
function calculateTotal(amount: number, taxRate: number): number {
  const tax = amount * taxRate;
  return amount + tax;
}
\`\`\`

## Coverage Goals
- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

Focus on meaningful coverage, not just numbers.`,
  resources: ["https://vitest.dev/", "https://docs.pytest.org/", "https://playwright.dev/"],
};

export const testDrivenDevelopment: Skill = {
  id: "test-driven-development",
  name: "Test-Driven Development",
  description:
    "Write tests before implementing code using the Red-Green-Refactor cycle for better design.",
  category: "testing",
  triggers: ["tdd", "test first", "red green refactor", "test driven", "write test"],
  tier1TokenEstimate: 50,
  tier2TokenEstimate: 2200,
  instructions: `# Test-Driven Development (TDD)

Write tests before code for better design and confidence.

## The TDD Cycle

\`\`\`
    ┌─────────────────────────────────────┐
    │                                     │
    ▼                                     │
  ┌─────┐     ┌───────┐     ┌──────────┐  │
  │ RED │────►│ GREEN │────►│ REFACTOR │──┘
  └─────┘     └───────┘     └──────────┘
   Write       Make it       Improve
  failing      pass          design
   test
\`\`\`

## Phase 1: RED (Write Failing Test)

### Rules
- Write ONE test at a time
- Test MUST fail initially
- Test should fail for the RIGHT reason
- Test the behavior, not implementation

### Example
\`\`\`typescript
// Before any production code exists
describe('ShoppingCart', () => {
  it('should add item to empty cart', () => {
    const cart = new ShoppingCart();

    cart.add({ id: '1', name: 'Widget', price: 10 });

    expect(cart.items).toHaveLength(1);
    expect(cart.total).toBe(10);
  });
});

// Run: ❌ FAIL - ShoppingCart is not defined
\`\`\`

## Phase 2: GREEN (Make It Pass)

### Rules
- Write MINIMUM code to pass
- Don't over-engineer
- It's OK to be ugly
- Just make the test green

### Example
\`\`\`typescript
// Simplest implementation that passes
class ShoppingCart {
  items: Item[] = [];

  get total(): number {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }

  add(item: Item): void {
    this.items.push(item);
  }
}

// Run: ✅ PASS
\`\`\`

## Phase 3: REFACTOR (Improve Design)

### Rules
- Tests MUST stay green
- Improve readability
- Remove duplication
- Apply design patterns

### Example
\`\`\`typescript
// Improved implementation
class ShoppingCart {
  private readonly _items: Item[] = [];

  get items(): ReadonlyArray<Item> {
    return [...this._items];
  }

  get total(): number {
    return this._items.reduce((sum, item) => sum + item.price, 0);
  }

  add(item: Item): void {
    this._items.push({ ...item }); // Defensive copy
  }
}

// Run: ✅ PASS (still green!)
\`\`\`

## TDD Patterns

### Test List
Start with a list of tests to write:
\`\`\`markdown
## ShoppingCart Tests
- [x] Add item to empty cart
- [ ] Add multiple items
- [ ] Calculate total with multiple items
- [ ] Remove item from cart
- [ ] Apply discount code
- [ ] Handle out-of-stock items
\`\`\`

### Triangulation
When unsure how to generalize:
\`\`\`typescript
// Test 1
it('calculates tax for $100 at 10%', () => {
  expect(calculateTax(100, 0.1)).toBe(10);
});

// Test 2 - forces generalization
it('calculates tax for $200 at 5%', () => {
  expect(calculateTax(200, 0.05)).toBe(10);
});
\`\`\`

### Fake It Till You Make It
Start with hardcoded values:
\`\`\`typescript
// Test
it('returns greeting', () => {
  expect(greet('World')).toBe('Hello, World!');
});

// First implementation (fake it)
function greet(name: string): string {
  return 'Hello, World!';
}

// Second test forces real implementation
it('returns personalized greeting', () => {
  expect(greet('Alice')).toBe('Hello, Alice!');
});

// Real implementation
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Writing too many tests at once | Overwhelming, lose focus | ONE test at a time |
| Making test pass with hack | Tech debt accumulates | Take time to refactor |
| Skipping refactor phase | Code quality degrades | Always refactor |
| Testing implementation | Brittle tests | Test behavior |
| Not running tests after each change | Lose feedback | Run after EVERY change |

## When to Use TDD

### Good For
- New features
- Bug fixes (write failing test first)
- Complex logic
- APIs and interfaces

### Less Suited For
- Exploratory/prototype code
- UI layouts (visual testing better)
- Integration with external systems

## TDD Checklist

Before writing code:
- [ ] Test list created
- [ ] First test identified

For each test:
- [ ] Test written and fails
- [ ] Minimal code makes it pass
- [ ] Code refactored
- [ ] All tests still pass
- [ ] Ready for next test`,
  resources: [
    "https://github.com/obra/superpowers/blob/main/skills/test-driven-development/SKILL.md",
  ],
};

export const verificationBeforeCompletion: Skill = {
  id: "verification-before-completion",
  name: "Verification Before Completion",
  description:
    "Validate work thoroughly before marking tasks as complete to ensure quality and prevent rework.",
  category: "testing",
  triggers: [
    "verify",
    "validate",
    "check",
    "complete",
    "done",
    "finish",
    "quality",
    "review",
    "confirm",
  ],
  tier1TokenEstimate: 50,
  tier2TokenEstimate: 1800,
  instructions: `# Verification Before Completion

Validate work thoroughly before marking complete.

## Core Principle

**Never mark work "done" without verification.**

Prevents:
- Incomplete implementations
- Missed edge cases
- Integration issues
- Customer-facing bugs

## Verification Levels

### Level 1: Self-Review
\`\`\`
□ Code compiles/runs without errors
□ No obvious logic errors
□ Edge cases considered
□ Error handling in place
□ No hardcoded values that should be configurable
\`\`\`

### Level 2: Automated Checks
\`\`\`
□ All tests pass
□ No linting errors
□ Type checking passes
□ Build succeeds
□ Coverage not decreased
\`\`\`

### Level 3: Manual Testing
\`\`\`
□ Happy path works
□ Error cases handled gracefully
□ UI looks correct (if applicable)
□ Performance acceptable
□ Accessibility checked
\`\`\`

### Level 4: Integration Check
\`\`\`
□ Works with other components
□ Database operations correct
□ API contracts honored
□ No breaking changes
□ Environment-specific issues checked
\`\`\`

## Verification Checklist by Task Type

### Bug Fix
\`\`\`markdown
- [ ] Bug is reproducible before fix
- [ ] Fix addresses root cause
- [ ] Regression test added
- [ ] Original issue no longer occurs
- [ ] No new bugs introduced
- [ ] Related functionality still works
\`\`\`

### New Feature
\`\`\`markdown
- [ ] All acceptance criteria met
- [ ] Unit tests written
- [ ] Integration tested
- [ ] Documentation updated
- [ ] Edge cases handled
- [ ] Performance acceptable
- [ ] Security considerations addressed
\`\`\`

### Refactoring
\`\`\`markdown
- [ ] Behavior unchanged
- [ ] All existing tests pass
- [ ] No new dependencies added (unless intentional)
- [ ] Code is cleaner/simpler
- [ ] Performance not degraded
\`\`\`

## Verification Commands

### TypeScript/Node
\`\`\`bash
# Full verification suite
pnpm typecheck && pnpm lint && pnpm test && pnpm build

# Quick check
pnpm test --run
\`\`\`

### Python
\`\`\`bash
# Full verification suite
uv run mypy . && uv run ruff check . && uv run pytest

# Quick check
uv run pytest -x  # Stop on first failure
\`\`\`

## Pre-Completion Questions

Ask yourself:

1. **Does it work?**
   - Did I actually run it?
   - Did I test with real data?

2. **Is it complete?**
   - All requirements met?
   - Edge cases handled?

3. **Is it correct?**
   - Logic verified?
   - No off-by-one errors?

4. **Is it safe?**
   - Error handling?
   - Input validation?

5. **Is it maintainable?**
   - Code readable?
   - Tests adequate?

## Red Flags

| Red Flag | Risk | Action |
|----------|------|--------|
| "It should work" | Untested assumption | Actually test it |
| "I'll fix that later" | Tech debt | Fix now or document |
| "It worked on my machine" | Environment issue | Test in clean environment |
| "The test is flaky" | Unreliable test | Fix the test first |
| "Nobody will do that" | Edge case ignored | Handle it anyway |

## Completion Template

\`\`\`markdown
## Completion Verification

### Task: [Task Description]

### Verification Performed
- [x] Code compiles without errors
- [x] All tests pass (X tests)
- [x] Linting clean
- [x] Manual testing completed
- [x] Edge cases verified

### Test Results
\`\`\`
✓ test suite 1 (10 tests)
✓ test suite 2 (5 tests)
Total: 15 passed, 0 failed
\`\`\`

### Notes
Any observations or caveats

### Ready for Review: YES
\`\`\``,
  resources: [
    "https://github.com/obra/superpowers/blob/main/skills/verification-before-completion/SKILL.md",
  ],
};

export const TESTING_SKILLS: Record<string, Skill> = {
  "testing-strategies": testingStrategies,
  "test-driven-development": testDrivenDevelopment,
  "verification-before-completion": verificationBeforeCompletion,
};
