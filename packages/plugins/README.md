# @flynn/plugins

Extensible plugin architecture for the Flynn Expert System.

## Features

- **Plugin Discovery**: Auto-discover plugins from multiple directories
- **Lifecycle Management**: Initialize and destroy plugins properly
- **Type-Safe Extensions**: Register agents, skills, workflows, and hooks
- **Version Compatibility**: Validate plugin compatibility with Flynn version
- **Event System**: Subscribe to plugin lifecycle events

## Installation

```bash
pnpm add @flynn/plugins
```

## Quick Start

### Using the Plugin Manager

```typescript
import { createPluginManager } from '@flynn/plugins';

// Create a plugin manager
const manager = createPluginManager({
  flynnVersion: '1.0.0',
  autoLoad: true, // Auto-discover and load plugins
});

// List loaded plugins
const plugins = manager.listPlugins();
console.log(plugins);

// Load a specific plugin
await manager.loadPlugin('./my-plugin');

// Get registered agents from all plugins
const agents = manager.getAgents();

// Subscribe to events
manager.on('plugin:loaded', (event) => {
  console.log(`Plugin loaded: ${event.pluginId}`);
});
```

### Creating a Plugin

Create a `plugin.json` manifest:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "A custom Flynn plugin",
  "main": "./dist/index.js",
  "flynn": {
    "minVersion": "1.0.0",
    "agents": ["custom-agent"],
    "skills": ["custom-skill"]
  }
}
```

Implement the plugin:

```typescript
import type { FlynnPlugin, PluginContext } from '@flynn/plugins';

const plugin: FlynnPlugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  description: 'A custom Flynn plugin',

  async initialize(context: PluginContext) {
    // Register a custom agent
    context.registerAgent({
      id: 'custom-agent',
      name: 'Custom Agent',
      description: 'A custom agent from my plugin',
      instructions: 'You are a custom agent...',
      tools: ['shell', 'file-ops'],
      workflow: ['Step 1', 'Step 2'],
      constraints: ['Be careful'],
      outputFormat: 'Markdown',
      triggers: ['custom task', 'my workflow'],
    });

    // Register a custom skill
    context.registerSkill({
      id: 'custom-skill',
      name: 'Custom Skill',
      description: 'A custom skill',
      instructions: 'Detailed instructions...',
      triggers: ['custom', 'specialized'],
    });

    context.log.info('Plugin initialized');
  },

  async destroy() {
    // Cleanup resources
  },
};

export default plugin;
```

## Plugin Directories

Plugins are discovered from these directories (in order):

1. `~/.flynn/plugins/` - User plugins
2. `./.flynn/plugins/` - Project plugins
3. `node_modules/@flynn-plugin/*` - NPM plugins

## Security

The plugin installer validates all inputs before shell execution:

- **NPM Package Names**: Must match valid npm identifier pattern, blocks shell metacharacters (`; & | \` $ ()` etc.), path traversal (`..`), and flag injection (`-`)
- **Git URLs**: Must be valid HTTPS, SSH, or shorthand URLs (github:user/repo), blocks shell metacharacters

Invalid inputs are rejected with an error message before any shell command is executed.

## API Reference

### PluginManager

```typescript
class PluginManager {
  // Discover and load all plugins
  discoverAndLoad(): Promise<PluginInfo[]>;

  // Load a specific plugin
  loadPlugin(path: string): Promise<PluginInfo | null>;

  // Unload a plugin
  unloadPlugin(id: string): Promise<boolean>;

  // Get a plugin by ID
  getPlugin(id: string): FlynnPlugin | undefined;

  // List all loaded plugins
  listPlugins(): PluginInfo[];

  // Get all registered agents
  getAgents(): AgentDefinition[];

  // Get all registered skills
  getSkills(): SkillDefinition[];

  // Get all registered workflows
  getWorkflows(): WorkflowDefinition[];

  // Get all registered hooks
  getHooks(): HookDefinition[];

  // Subscribe to events
  on(event: PluginEventType, handler: PluginEventHandler): void;

  // Unsubscribe from events
  off(event: PluginEventType, handler: PluginEventHandler): void;
}
```

### PluginContext

```typescript
interface PluginContext {
  // Register extensions
  registerAgent(agent: AgentDefinition): void;
  registerSkill(skill: SkillDefinition): void;
  registerWorkflow(workflow: WorkflowDefinition): void;
  registerHook(hook: HookDefinition): void;

  // Configuration
  getConfig<T>(key: string): T | undefined;
  setConfig<T>(key: string, value: T): void;

  // Logging
  log: Logger;

  // Environment
  flynnVersion: string;
  dataDir: string;
}
```

### Plugin Manifest Schema

```typescript
interface PluginManifest {
  id: string;           // Unique identifier (lowercase, hyphens)
  name: string;         // Display name
  version: string;      // Semver version
  description?: string; // Short description
  author?: string;      // Author name
  license?: string;     // License (e.g., "MIT")
  main: string;         // Entry point (default: "./dist/index.js")
  flynn: {
    minVersion: string; // Minimum Flynn version
    agents?: string[];  // Agent IDs provided
    skills?: string[];  // Skill IDs provided
    workflows?: string[]; // Workflow IDs provided
    hooks?: string[];   // Hook descriptions
  };
  dependencies?: Record<string, string>;
}
```

## Events

| Event | Description |
|-------|-------------|
| `plugin:loaded` | Plugin successfully loaded and initialized |
| `plugin:unloaded` | Plugin unloaded |
| `plugin:error` | Error during plugin lifecycle |
| `agent:registered` | Agent registered by plugin |
| `skill:registered` | Skill registered by plugin |
| `workflow:registered` | Workflow registered by plugin |
| `hook:registered` | Hook registered by plugin |

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint
```

## License

MIT
