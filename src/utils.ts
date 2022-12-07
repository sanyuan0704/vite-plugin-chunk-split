import os from "os";
import path from "path";
import { resolvePackageEntry, resolvePackageData, type InternalResolveOptions } from 'vite'

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
  try {
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
      } as InternalResolveOptions
    )!;
  } catch (error) {
    return "";
  }
}
