import { resolve } from "import-meta-resolve";
import os from "os";
import path from "path";
// const dynamicImport = new Function("m", "return import(m)");
export function slash(p: string): string {
  return p.replace(/\\/g, "/");
}

export function normalizePath(id: string): string {
  let key = path.posix.normalize(isWindows ? slash(id) : id);
  if(key.charCodeAt(0) === 0){
    key = key.substring(1);
  }
  return key;
}
export const isWindows = os.platform() === "win32";


// const basedir = process.cwd();

export async function resolveEntry(
  name: string,
  root: string
): Promise<string> {
  // const { resolvePackageEntry, resolvePackageData } = await dynamicImport('vite');
  try {
    import.meta.url
  } catch (e) {
    // CJS
    return require.resolve(name, { paths: [root] });
  }
  const fullPath = root.endsWith("/") ? root : root + "/";
  return resolve(name, "file://" + fullPath).replace("file://", "");
}
