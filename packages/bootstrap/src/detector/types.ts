/**
 * Environment detection types
 */

export interface EnvironmentInfo {
  os: {
    platform: NodeJS.Platform;
    arch: string;
    release: string;
    isWSL: boolean;
    isWSL2: boolean;
  };
  node: {
    installed: boolean;
    version: string | null;
    path: string | null;
    meetsMinimum: boolean;
  };
  python: {
    installed: boolean;
    version: string | null;
    path: string | null;
    meetsMinimum: boolean;
  };
  git: {
    installed: boolean;
    version: string | null;
    path: string | null;
  };
  packageManagers: {
    pnpm: { installed: boolean; version: string | null };
    uv: { installed: boolean; version: string | null };
    npm: { installed: boolean; version: string | null };
  };
  editors: {
    vscode: { installed: boolean; path: string | null };
    cursor: { installed: boolean; path: string | null };
  };
  claudeCode: {
    installed: boolean;
    version: string | null;
    configPath: string | null;
  };
}

export interface DetectorResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
}

export const MIN_NODE_VERSION = 20;
export const MIN_PYTHON_VERSION = "3.11";
