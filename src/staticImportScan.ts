import { GetModuleInfo } from 'rollup';

export function staticImportedScan(
  id: string,
  getModuleInfo: GetModuleInfo,
  cache: Map<string, boolean>,
  importChain: string[] = []
): boolean {
  if (cache.has(id)) {
    return cache.get(id) as boolean;
  }
  if (importChain.includes(id)) {
    // circular deps!
    cache.set(id, false);
    return false;
  }

  const mod = getModuleInfo(id);
  if (!mod) {
    cache.set(id, false);
    return false;
  }

  if (mod.isEntry) {
    cache.set(id, true);
    return true;
  }
  const staticImport = mod.importers.some((importer): boolean =>
    staticImportedScan(importer, getModuleInfo, cache, importChain.concat(id))
  );
  cache.set(id, staticImport);
  return staticImport;
}
