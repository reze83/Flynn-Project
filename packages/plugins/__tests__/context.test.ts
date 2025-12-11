/**
 * Plugin Context Tests
 */

import { beforeEach, describe, expect, it } from "vitest";
import { type PluginRegistry, createPluginContext, createRegistry } from "../src/context.js";
import type { AgentDefinition, PluginContext, SkillDefinition } from "../src/types.js";

describe("createRegistry", () => {
  it("should create empty registry", () => {
    const registry = createRegistry();
    expect(registry.agents.size).toBe(0);
    expect(registry.skills.size).toBe(0);
    expect(registry.workflows.size).toBe(0);
    expect(registry.hooks.length).toBe(0);
  });
});

describe("createPluginContext", () => {
  let registry: PluginRegistry;
  let context: PluginContext;

  beforeEach(() => {
    registry = createRegistry();
    context = createPluginContext({
      pluginId: "test-plugin",
      flynnVersion: "1.0.0",
      dataDir: "/tmp/test-plugin",
      registry,
    });
  });

  describe("properties", () => {
    it("should have flynnVersion", () => {
      expect(context.flynnVersion).toBe("1.0.0");
    });

    it("should have dataDir", () => {
      expect(context.dataDir).toBe("/tmp/test-plugin");
    });

    it("should have log object", () => {
      expect(context.log).toBeDefined();
      expect(typeof context.log.debug).toBe("function");
      expect(typeof context.log.info).toBe("function");
      expect(typeof context.log.warn).toBe("function");
      expect(typeof context.log.error).toBe("function");
    });
  });

  describe("registerAgent", () => {
    it("should register an agent with prefixed id", () => {
      const agent: AgentDefinition = {
        id: "my-agent",
        name: "My Agent",
        description: "Test agent",
        instructions: "Do stuff",
        tools: [],
        workflow: [],
        constraints: [],
        outputFormat: "",
        triggers: [],
      };

      context.registerAgent(agent);

      expect(registry.agents.has("test-plugin:my-agent")).toBe(true);
      expect(registry.agents.get("test-plugin:my-agent")?.name).toBe("My Agent");
    });

    it("should overwrite existing agent with warning", () => {
      const agent1: AgentDefinition = {
        id: "my-agent",
        name: "Agent 1",
        description: "",
        instructions: "",
        tools: [],
        workflow: [],
        constraints: [],
        outputFormat: "",
        triggers: [],
      };

      const agent2: AgentDefinition = {
        ...agent1,
        name: "Agent 2",
      };

      context.registerAgent(agent1);
      context.registerAgent(agent2);

      expect(registry.agents.get("test-plugin:my-agent")?.name).toBe("Agent 2");
    });
  });

  describe("registerSkill", () => {
    it("should register a skill with prefixed id", () => {
      const skill: SkillDefinition = {
        id: "my-skill",
        name: "My Skill",
        description: "Test skill",
        instructions: "Instructions",
        triggers: [],
      };

      context.registerSkill(skill);

      expect(registry.skills.has("test-plugin:my-skill")).toBe(true);
    });
  });

  describe("registerWorkflow", () => {
    it("should register a workflow with prefixed id", () => {
      context.registerWorkflow({
        id: "my-workflow",
        name: "My Workflow",
        description: "Test workflow",
        agents: ["agent1", "agent2"],
        triggers: [],
      });

      expect(registry.workflows.has("test-plugin:my-workflow")).toBe(true);
    });
  });

  describe("registerHook", () => {
    it("should register a hook", () => {
      context.registerHook({
        event: "PreToolUse",
        type: "block",
        pattern: "dangerous-command",
        description: "Block dangerous commands",
      });

      expect(registry.hooks.length).toBe(1);
      expect(registry.hooks[0].event).toBe("PreToolUse");
    });
  });

  describe("config", () => {
    it("should get and set config", () => {
      context.setConfig("key1", "value1");
      expect(context.getConfig("key1")).toBe("value1");
    });

    it("should return undefined for missing config", () => {
      expect(context.getConfig("missing")).toBeUndefined();
    });

    it("should support typed config", () => {
      context.setConfig("count", 42);
      const count = context.getConfig<number>("count");
      expect(count).toBe(42);
    });
  });
});
