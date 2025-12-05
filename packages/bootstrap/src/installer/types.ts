/**
 * Installer types
 */

export interface InstallResult {
  component: string;
  status: "installed" | "skipped" | "failed" | "already-installed";
  version?: string;
  message?: string;
  error?: string;
}

export interface InstallerOptions {
  force?: boolean;
  verbose?: boolean;
}

export interface Installer {
  name: string;
  check(): Promise<boolean>;
  install(options?: InstallerOptions): Promise<InstallResult>;
}
