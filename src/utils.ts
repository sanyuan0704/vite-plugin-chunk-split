import os from "os";
import path from "path";
import type { InternalResolveOptions } from 'vite'

const dynamicImport = new Function("m", "return import(m)");

export function slash(p: string): string {
  return p.replace(/\\/g, "/");
}

export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id);
}
export const isWindows = os.platform() === "win32";

export async function resolveEntry(
  name: string,
  root?: string
): Promise<string> {
  const { resolvePackageEntry, resolvePackageData } = await dynamicImport('vite');
  return resolvePackageEntry(
    name,
    resolvePackageData(name, root || process.cwd(), true)!,
    true,
    {
      isBuild: true,
      isProduction: process.env.NODE_ENV === "production",
      isRequire: false,
      root: process.cwd(),
      preserveSymlinks: false,
      mainFields: [],
      conditions: [],
      // extensions: []
    } as unknown as InternalResolveOptions
  )!;
}
