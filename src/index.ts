import { ManualChunksOption } from 'rollup';
import { Plugin } from 'vite';
import assert from 'assert';
import path from 'path';
import { ChunkSplit, CustomSplitting } from './types';
import { staticImportedScan } from './staticImportScan';
import { isCSSIdentifier } from './helper';
import resolve from 'resolve';

const SPLIT_DEFAULT_MODULES: CustomSplitting = {
  react_vendor: ['react', 'react-dom'],
  lodash: ['lodash', 'lodash-es']
};

const cache = new Map<string, boolean>();

const wrapCustomSplitConfig = (
  manualChunks: ManualChunksOption,
  customOptions: CustomSplitting
): ManualChunksOption => {
  assert(typeof manualChunks === 'function');
  const groups = Object.keys(customOptions);
  // Create cache ahead of time to decrease the cost of resolve.sync!
  const depsInGroup: Record<string, string[]> = {};
  for (const group of groups) {
    const packageInfo = customOptions[group];
    depsInGroup[group] = packageInfo
      .filter((item): boolean => typeof item === 'string')
      .map((item): string => {
        try {
          return resolve.sync(item as string, { preserveSymlinks: false, basedir: process.cwd() });
        } catch (err) {
          return '';
        }
      })
      .filter((_: string): boolean => _.length > 0);
  }
  return (moduleId, { getModuleIds, getModuleInfo }): string | null | undefined => {
    const isDepInclude = (id: string, depPaths: string[], importChain: string[]): boolean | undefined => {
      const key = `${id}-${depPaths.join('|')}`;
  
      // circular dependency
      if (importChain.includes(id)) {
        cache.set(key, false);
        return false;
      }
      if (cache.has(key)) {
        return cache.get(key);
      }
      // hit
      if (depPaths.includes(id)) {
        importChain.forEach(item => cache.set(`${item}-${depPaths.join('|')}`, true));
        return true;
      }
      const moduleInfo = getModuleInfo(id);
      if (!moduleInfo || !moduleInfo.importers) {
        cache.set(key, false);
        return false;
      }
      const isInclude = moduleInfo.importers.some(
        importer => isDepInclude(importer, depPaths, importChain.concat(id))
      );
      // set cache, important!
      cache.set(key, isInclude);
      return isInclude;
    };
    for (const group of groups) {
      const deps = depsInGroup[group];
      const packageInfo = customOptions[group];
      if (
        moduleId.includes('node_modules') &&
        !isCSSIdentifier(moduleId)
      ) {
        if (deps.length && isDepInclude(moduleId, deps, [])) {
          return group;
        }
        for (const rule of packageInfo) {
          if (rule instanceof RegExp && rule.test(moduleId)) {
            return group;
          }
        }
      }
    }
    return manualChunks(moduleId, { getModuleIds, getModuleInfo });
  };
};
export function chunkSplitPlugin(splitOptions: ChunkSplit = {
  strategy: 'default'
}): Plugin {
  const { strategy = 'default', customSplitting = {} } = splitOptions;
  let manualChunks: ManualChunksOption; 

  if (strategy === 'all-in-one') {
    manualChunks = (): string => 'index';
  }

  if (strategy === 'default') {
    manualChunks = wrapCustomSplitConfig(
      (id, { getModuleInfo }): string | undefined => {
        if (
          id.includes('node_modules') &&
          !isCSSIdentifier(id)
        ) {
          if (staticImportedScan(id, getModuleInfo, new Map(), [])) {
            return 'vendor';
          } else {
            return 'async-vendor';
          }
        }
      },
      {
        ...SPLIT_DEFAULT_MODULES,
        ...customSplitting,
      }
    );
  }

  if (strategy === 'unbundle') {
    manualChunks = wrapCustomSplitConfig(
      (id, { getModuleInfo }): string | undefined => {
        if (
          id.includes('node_modules') &&
          !isCSSIdentifier(id)
        ) {
          if (staticImportedScan(id, getModuleInfo, new Map(), [])) {
            return 'vendor';
          } else {
            return 'async-vendor';
          }
        }
        const cwd = process.cwd();
        if (!id.includes('node_modules') && !isCSSIdentifier(id)) {
          const extname = path.extname(id);
          return path.relative(cwd, id).replace(extname, '');
        }
        return;
      },
      {
        ...SPLIT_DEFAULT_MODULES,
        ...customSplitting,
      }
    );
  }

  return {
    name: 'vite-plugin-chunk-split',
    config() {
      return {
        build: {
          rollupOptions: {
            output: {
              manualChunks
            }
          }
        }
      }
    }
  }
}

