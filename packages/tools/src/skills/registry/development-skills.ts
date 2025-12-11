/**
 * Development Skills - TypeScript and Python patterns
 */

import type { Skill } from "../types.js";

export const typescriptAdvanced: Skill = {
  id: "typescript-advanced",
  name: "TypeScript Advanced Patterns",
  description:
    "Advanced TypeScript patterns including generics, utility types, type guards, conditional types, and Node.js best practices.",
  category: "development",
  triggers: [
    "typescript",
    "types",
    "generics",
    "node",
    "type guard",
    "utility type",
    "conditional type",
    "mapped type",
    "infer",
    "satisfies",
  ],
  tier1TokenEstimate: 50,
  tier2TokenEstimate: 2500,
  instructions: `# TypeScript Advanced Patterns

## Generic Patterns

### Constrained Generics
\`\`\`typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Generic with default
type Container<T = string> = { value: T };

// Multiple constraints
function merge<T extends object, U extends object>(a: T, b: U): T & U {
  return { ...a, ...b };
}
\`\`\`

### Utility Types Deep Dive
\`\`\`typescript
// Partial but only for specific keys
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Required but only for specific keys
type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// Deep Partial
type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

// Extract function return type
type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : never;
\`\`\`

### Type Guards
\`\`\`typescript
// User-defined type guard
function isString(value: unknown): value is string {
  return typeof value === "string";
}

// Assertion function
function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new Error("Value must be defined");
  }
}

// Discriminated unions
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: Error };

function handleResult<T>(result: Result<T>) {
  if (result.success) {
    console.log(result.data); // TypeScript knows data exists
  } else {
    console.error(result.error); // TypeScript knows error exists
  }
}
\`\`\`

### Conditional Types
\`\`\`typescript
// Extract array element type
type ElementType<T> = T extends (infer E)[] ? E : never;

// Function parameter types
type FirstParameter<T extends (...args: any[]) => any> =
  T extends (first: infer F, ...rest: any[]) => any ? F : never;

// Recursive conditional types
type Flatten<T> = T extends Array<infer U> ? Flatten<U> : T;
\`\`\`

## Node.js Patterns

### Async/Await Best Practices
\`\`\`typescript
// Parallel execution
const [users, posts] = await Promise.all([
  fetchUsers(),
  fetchPosts()
]);

// Error handling with Result type
async function safeFetch<T>(url: string): Promise<Result<T>> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

// Retry with exponential backoff
async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
    }
  }
  throw new Error("Unreachable");
}
\`\`\`

### Module Patterns
\`\`\`typescript
// Re-export pattern
export { User, type UserConfig } from "./user.js";
export * as utils from "./utils.js";

// Barrel exports with explicit types
export type { ApiResponse, ApiError } from "./types.js";

// Dynamic imports with types
const module = await import("./module.js") as typeof import("./module.js");
\`\`\`

## ESM Best Practices

### File Extensions
- Always use \`.js\` extension in imports (even for .ts files)
- Use \`"type": "module"\` in package.json
- Use \`"moduleResolution": "NodeNext"\` in tsconfig.json

### Package.json Exports
\`\`\`json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./utils": {
      "types": "./dist/utils.d.ts",
      "import": "./dist/utils.js"
    }
  }
}
\`\`\`

## Zod Integration
\`\`\`typescript
import { z } from "zod";

// Schema definition
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number().min(0).max(150).optional(),
  role: z.enum(["admin", "user", "guest"]),
});

// Infer TypeScript type from schema
type User = z.infer<typeof UserSchema>;

// Parse with error handling
function parseUser(data: unknown): User {
  return UserSchema.parse(data);
}

// Safe parse (doesn't throw)
const result = UserSchema.safeParse(data);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error.issues);
}
\`\`\``,
  resources: [
    "https://www.typescriptlang.org/docs/handbook/2/types-from-types.html",
    "https://github.com/type-challenges/type-challenges",
  ],
};

export const pythonPatterns: Skill = {
  id: "python-patterns",
  name: "Python Modern Patterns",
  description:
    "Modern Python patterns including async/await, type hints, testing with pytest, packaging with UV, and dataclasses.",
  category: "development",
  triggers: [
    "python",
    "async",
    "pytest",
    "uv",
    "dataclass",
    "pydantic",
    "typing",
    "fastapi",
    "ruff",
    "mypy",
  ],
  tier1TokenEstimate: 50,
  tier2TokenEstimate: 2800,
  instructions: `# Python Modern Patterns

## Type Hints

### Basic Typing
\`\`\`python
from typing import Optional, Union, List, Dict, Callable, TypeVar, Generic

# Basic annotations
def greet(name: str) -> str:
    return f"Hello, {name}"

# Optional (can be None)
def find_user(user_id: int) -> Optional[User]:
    return db.get(user_id)

# Union types (Python 3.10+)
def process(value: int | str) -> str:
    return str(value)

# Generic functions
T = TypeVar("T")
def first(items: List[T]) -> Optional[T]:
    return items[0] if items else None
\`\`\`

### Advanced Typing
\`\`\`python
from typing import Protocol, TypedDict, Literal, overload

# Protocol (structural typing)
class Readable(Protocol):
    def read(self) -> str: ...

def process_readable(r: Readable) -> None:
    content = r.read()

# TypedDict for structured dicts
class UserDict(TypedDict):
    name: str
    age: int
    email: Optional[str]

# Literal types
Mode = Literal["read", "write", "append"]

def open_file(path: str, mode: Mode) -> None: ...

# Function overloads
@overload
def get_item(index: int) -> str: ...
@overload
def get_item(index: slice) -> List[str]: ...
def get_item(index: int | slice) -> str | List[str]:
    ...
\`\`\`

## Async/Await

### Basics
\`\`\`python
import asyncio
from typing import AsyncIterator

async def fetch_data(url: str) -> dict:
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.json()

# Parallel execution
async def fetch_all(urls: List[str]) -> List[dict]:
    tasks = [fetch_data(url) for url in urls]
    return await asyncio.gather(*tasks)

# Async generators
async def stream_data() -> AsyncIterator[bytes]:
    async for chunk in response.content:
        yield chunk

# Context managers
async with asyncio.timeout(10):
    await long_operation()
\`\`\`

### Patterns
\`\`\`python
import asyncio
from contextlib import asynccontextmanager

# Semaphore for concurrency limiting
async def fetch_with_limit(urls: List[str], limit: int = 10):
    semaphore = asyncio.Semaphore(limit)

    async def bounded_fetch(url: str):
        async with semaphore:
            return await fetch_data(url)

    return await asyncio.gather(*[bounded_fetch(url) for url in urls])

# Async context manager
@asynccontextmanager
async def get_connection():
    conn = await create_connection()
    try:
        yield conn
    finally:
        await conn.close()
\`\`\`

## Dataclasses & Pydantic

### Dataclasses
\`\`\`python
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class User:
    id: int
    name: str
    email: str
    created_at: datetime = field(default_factory=datetime.now)
    tags: List[str] = field(default_factory=list)

    def __post_init__(self):
        self.email = self.email.lower()

# Frozen (immutable)
@dataclass(frozen=True)
class Point:
    x: float
    y: float
\`\`\`

### Pydantic v2
\`\`\`python
from pydantic import BaseModel, Field, field_validator, model_validator

class User(BaseModel):
    id: int
    name: str = Field(min_length=1, max_length=100)
    email: str
    age: int = Field(ge=0, le=150)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("Invalid email")
        return v.lower()

    @model_validator(mode="after")
    def validate_model(self) -> "User":
        # Cross-field validation
        return self

# Parse and validate
user = User.model_validate({"id": 1, "name": "John", "email": "john@example.com", "age": 30})

# JSON serialization
json_str = user.model_dump_json()
\`\`\`

## Testing with Pytest

### Basics
\`\`\`python
import pytest
from unittest.mock import Mock, patch, AsyncMock

def test_basic():
    assert add(1, 2) == 3

# Parametrized tests
@pytest.mark.parametrize("input,expected", [
    (1, 2),
    (2, 4),
    (3, 6),
])
def test_double(input: int, expected: int):
    assert double(input) == expected

# Fixtures
@pytest.fixture
def user() -> User:
    return User(id=1, name="Test")

def test_with_fixture(user: User):
    assert user.name == "Test"

# Async tests
@pytest.mark.asyncio
async def test_async_fetch():
    result = await fetch_data("http://example.com")
    assert result is not None
\`\`\`

### Mocking
\`\`\`python
# Mock objects
@patch("module.external_api")
def test_with_mock(mock_api: Mock):
    mock_api.return_value = {"data": "test"}
    result = my_function()
    mock_api.assert_called_once()

# Async mocking
@pytest.mark.asyncio
async def test_async_mock():
    with patch("module.fetch", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = {"status": "ok"}
        result = await process()
        assert result["status"] == "ok"
\`\`\`

## UV Package Manager

### Commands
\`\`\`bash
# Create new project
uv init my-project
cd my-project

# Add dependencies
uv add requests pydantic
uv add --dev pytest ruff mypy

# Install all dependencies
uv sync

# Run scripts
uv run python main.py
uv run pytest

# Lock dependencies
uv lock

# Build package
uv build
\`\`\`

### pyproject.toml
\`\`\`toml
[project]
name = "my-project"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "pydantic>=2.0",
    "httpx>=0.25",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "ruff>=0.4",
    "mypy>=1.10",
]

[tool.ruff]
line-length = 88
target-version = "py311"

[tool.mypy]
python_version = "3.11"
strict = true
\`\`\`

## Ruff Linting
\`\`\`bash
# Check code
ruff check .

# Fix auto-fixable issues
ruff check --fix .

# Format code
ruff format .
\`\`\``,
  resources: [
    "https://docs.python.org/3/library/typing.html",
    "https://docs.pydantic.dev/latest/",
    "https://docs.astral.sh/uv/",
  ],
};

export const systematicDebugging: Skill = {
  id: "systematic-debugging",
  name: "Systematic Debugging",
  description:
    "Four-phase debugging framework: Root cause investigation, pattern analysis, hypothesis testing, and implementation.",
  category: "development",
  triggers: [
    "debug",
    "debugging",
    "bug",
    "error",
    "fix",
    "issue",
    "problem",
    "troubleshoot",
    "investigate",
    "broken",
  ],
  tier1TokenEstimate: 50,
  tier2TokenEstimate: 2800,
  instructions: `# Systematic Debugging

**CORE PRINCIPLE: NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST**

Prevents symptom-masking and cascading failures.

## Phase 1: Root Cause Investigation

### Error Analysis
\`\`\`
1. Read COMPLETE error message
   - Stack trace (every line)
   - Line numbers
   - Error codes
   - Variable values

2. Reproduce the issue
   - Document exact steps
   - Identify minimal reproduction case
   - Note environment differences

3. Check recent changes
   - git log --oneline -20
   - git diff HEAD~5
   - Configuration changes
\`\`\`

### Data Flow Tracing
\`\`\`
Trace BACKWARD from error:
  Error Location
       ↑
  Function that called it
       ↑
  Data source
       ↑
  User input / External system
\`\`\`

## Phase 2: Pattern Analysis

### Find Working Reference
1. Locate SIMILAR working code
2. Read it COMPLETELY (no skimming)
3. Document ALL differences:
   - Code structure
   - Dependencies
   - Configuration
   - Environment

### Comparison Table
| Aspect | Working | Broken | Difference |
|--------|---------|--------|------------|
| Code   |         |        |            |
| Config |         |        |            |
| Deps   |         |        |            |
| Env    |         |        |            |

## Phase 3: Hypothesis and Testing

### Scientific Method
\`\`\`
1. Form ONE hypothesis
   "The error occurs because X causes Y"

2. Predict outcome
   "If I change X, then Y should change"

3. Test SINGLE variable
   - Make minimal change
   - Observe result
   - Document outcome

4. Binary verification
   ✓ Hypothesis confirmed → Proceed
   ✗ Hypothesis rejected → New hypothesis
\`\`\`

### Testing Rules
- ONE change at a time
- NEVER bundle changes
- ALWAYS verify before moving on
- Acknowledge knowledge gaps

## Phase 4: Implementation

### Fix Workflow
\`\`\`
1. Create failing test FIRST
   - Automated preferred
   - Manual acceptable

2. Apply SINGLE fix
   - Root cause only
   - No "improvements"
   - No refactoring

3. Verify fix
   - Test passes
   - No regressions
   - Clean build

4. Document
   - What was wrong
   - Why it happened
   - How it was fixed
\`\`\`

## Red Flags (Reset Process)

| Red Flag | Action |
|----------|--------|
| Proposing fix before investigation | STOP. Go to Phase 1 |
| Multiple simultaneous changes | STOP. Revert. Single change |
| "Just trying" solutions | STOP. Form hypothesis first |
| 3+ failed fixes | STOP. Question design |

## Debugging Checklist

- [ ] Error message fully read
- [ ] Issue reproduced
- [ ] Recent changes reviewed
- [ ] Working reference found
- [ ] Differences documented
- [ ] Single hypothesis formed
- [ ] Minimal change made
- [ ] Fix verified
- [ ] No regressions

## Metrics
- Target: 15-30 minute resolutions
- Baseline: 2-3 hours unguided
- Quality: Near-zero new defect introduction`,
  resources: ["https://github.com/obra/superpowers/blob/main/skills/systematic-debugging/SKILL.md"],
};

export const rootCauseTracing: Skill = {
  id: "root-cause-tracing",
  name: "Root Cause Tracing",
  description:
    "Investigate and identify fundamental problems by tracing symptoms back to their origin.",
  category: "development",
  triggers: [
    "root cause",
    "why",
    "origin",
    "source",
    "underlying",
    "fundamental",
    "trace",
    "analyze",
  ],
  tier1TokenEstimate: 50,
  tier2TokenEstimate: 2000,
  instructions: `# Root Cause Tracing

Identify fundamental problems by tracing symptoms to origin.

## The 5 Whys Technique

### Process
\`\`\`
Symptom: Application crashes on login

Why 1: Why does it crash?
→ Null pointer exception in auth module

Why 2: Why is there a null pointer?
→ User object not initialized

Why 3: Why isn't user initialized?
→ Database query returns null

Why 4: Why does query return null?
→ User record doesn't exist

Why 5: Why doesn't record exist?
→ Registration didn't complete due to timeout

ROOT CAUSE: Database timeout during registration
\`\`\`

### Rules
- Ask "why" until you reach actionable cause
- 5 is guideline, not limit
- Stop when you can prevent, not just fix

## Fault Tree Analysis

### Structure
\`\`\`
                 [TOP EVENT]
                 App Crashes
                      │
          ┌──────────┴──────────┐
          │                     │
     [OR Gate]             [OR Gate]
    Auth Failure          DB Failure
          │                     │
    ┌─────┴─────┐         ┌────┴────┐
    │           │         │         │
 Invalid    Session    Timeout   Connection
 Creds      Expired              Lost
\`\`\`

### Gates
- **OR**: Any child causes parent
- **AND**: All children required for parent

## Timeline Analysis

### Event Log
\`\`\`markdown
| Time | Event | System | Details |
|------|-------|--------|---------|
| 10:00:00 | Request received | API | POST /login |
| 10:00:01 | Auth started | Auth | user: john |
| 10:00:02 | DB query | DB | SELECT * FROM users |
| 10:00:05 | Timeout | DB | 3000ms exceeded |
| 10:00:05 | Error thrown | Auth | NullPointer |
| 10:00:05 | Crash | API | Unhandled exception |
\`\`\`

### Key Questions
- What changed before the issue started?
- What was the last successful operation?
- What correlates with failures?

## Fishbone Diagram (Ishikawa)

### Categories
\`\`\`
        People      Process     Technology
           \\          |          /
            \\         |         /
             \\        |        /
              \\       |       /
               \\      |      /
                \\     |     /
                 ▼    ▼    ▼
              ──────────────── PROBLEM
                 ▲    ▲    ▲
                /     |     \\
               /      |      \\
              /       |       \\
             /        |        \\
            /         |         \\
           /          |          \\
     Environment   Materials    Measurement
\`\`\`

### Example Causes
| Category | Potential Causes |
|----------|-----------------|
| People | Training, Communication |
| Process | Procedures, Workflows |
| Technology | Hardware, Software |
| Environment | Infrastructure, External |

## Root Cause Categories

| Type | Example | Fix Strategy |
|------|---------|--------------|
| Code Bug | Logic error | Patch + Test |
| Design Flaw | Wrong architecture | Redesign |
| Config Error | Wrong settings | Update config |
| Dependency | Library bug | Update/Replace |
| Environment | Resource limits | Scale/Optimize |
| Human Error | Typo, mistake | Automation |

## Output Template

\`\`\`markdown
# Root Cause Analysis: [Issue Title]

## Symptom
What was observed

## Impact
Who/what was affected

## Timeline
When it started, key events

## Root Cause
The fundamental issue

## Contributing Factors
Secondary causes

## Corrective Actions
1. Immediate fix
2. Preventive measures

## Lessons Learned
What to do differently
\`\`\``,
  resources: ["https://github.com/obra/superpowers/blob/main/skills/root-cause-tracing/SKILL.md"],
};

export const mcpBuilder: Skill = {
  id: "mcp-builder",
  name: "MCP Builder",
  description:
    "Create Model Context Protocol (MCP) servers to integrate external APIs and services with Claude.",
  category: "development",
  triggers: ["mcp", "model context protocol", "server", "integration", "api", "tool", "claude"],
  tier1TokenEstimate: 50,
  tier2TokenEstimate: 3000,
  instructions: `# MCP Builder

Create MCP servers to integrate external APIs with Claude.

## What is MCP?

Model Context Protocol - an open standard for Claude to connect to external data sources and tools.

### Benefits
- **Standardization**: One protocol for all integrations
- **Security**: Built-in auth and permissions
- **Modularity**: Reusable across projects

## MCP Components

### 1. Tools
Functions Claude can invoke:
\`\`\`typescript
{
  name: "search_database",
  description: "Search for records in database",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string" },
      limit: { type: "number", default: 10 }
    },
    required: ["query"]
  }
}
\`\`\`

### 2. Resources
Data Claude can access:
\`\`\`typescript
{
  uri: "file:///path/to/data.json",
  name: "Configuration",
  mimeType: "application/json"
}
\`\`\`

### 3. Prompts
Pre-defined templates:
\`\`\`typescript
{
  name: "analyze_code",
  description: "Analyze code for issues",
  arguments: [
    { name: "language", required: true }
  ]
}
\`\`\`

## Project Setup

### Initialize
\`\`\`bash
uv init mcp-server
cd mcp-server
uv add mcp
\`\`\`

### Basic Structure
\`\`\`python
# server.py
from mcp.server import Server
from mcp.types import Tool, TextContent

app = Server("my-server")

@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="my_tool",
            description="Does something useful",
            inputSchema={
                "type": "object",
                "properties": {
                    "param": {"type": "string"}
                },
                "required": ["param"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "my_tool":
        result = do_something(arguments["param"])
        return [TextContent(type="text", text=result)]
    raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(app.run())
\`\`\`

## Adding Resources

\`\`\`python
from mcp.types import Resource

@app.list_resources()
async def list_resources() -> list[Resource]:
    return [
        Resource(
            uri="config://settings",
            name="Settings",
            mimeType="application/json"
        )
    ]

@app.read_resource()
async def read_resource(uri: str) -> str:
    if uri == "config://settings":
        return json.dumps(load_settings())
    raise ValueError(f"Unknown resource: {uri}")
\`\`\`

## Error Handling

\`\`\`python
@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    try:
        # Validate input
        if "required_param" not in arguments:
            return [TextContent(
                type="text",
                text="Error: required_param is missing",
                isError=True
            )]

        result = await do_work(arguments)
        return [TextContent(type="text", text=result)]

    except Exception as e:
        return [TextContent(
            type="text",
            text=f"Error: {str(e)}",
            isError=True
        )]
\`\`\`

## Claude Desktop Integration

\`\`\`json
// claude_desktop_config.json
{
  "mcpServers": {
    "my-server": {
      "command": "uv",
      "args": ["run", "/absolute/path/to/server.py"],
      "env": {
        "API_KEY": "from-environment"
      }
    }
  }
}
\`\`\`

## Best Practices

| Practice | Reason |
|----------|--------|
| Validate all inputs | Prevent errors |
| Use environment vars for secrets | Security |
| Return specific error messages | Debugging |
| Use absolute paths | Reliability |
| Implement timeouts | Prevent hangs |
| Log operations | Observability |

## Common Patterns

### Database Tool
\`\`\`python
@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "query_db":
        conn = await get_connection()
        result = await conn.fetch(arguments["sql"])
        return [TextContent(type="text", text=json.dumps(result))]
\`\`\`

### API Integration
\`\`\`python
@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "api_request":
        async with httpx.AsyncClient() as client:
            resp = await client.get(arguments["url"])
            return [TextContent(type="text", text=resp.text)]
\`\`\`

## Testing

\`\`\`python
import pytest
from server import app

@pytest.mark.asyncio
async def test_list_tools():
    tools = await app.list_tools()
    assert len(tools) > 0
    assert tools[0].name == "my_tool"

@pytest.mark.asyncio
async def test_call_tool():
    result = await app.call_tool("my_tool", {"param": "test"})
    assert result[0].type == "text"
\`\`\``,
  resources: [
    "https://modelcontextprotocol.io/",
    "https://github.com/anthropics/skills/tree/main/mcp-builder",
  ],
};

export const DEVELOPMENT_SKILLS: Record<string, Skill> = {
  "typescript-advanced": typescriptAdvanced,
  "python-patterns": pythonPatterns,
  "systematic-debugging": systematicDebugging,
  "root-cause-tracing": rootCauseTracing,
  "mcp-builder": mcpBuilder,
};
