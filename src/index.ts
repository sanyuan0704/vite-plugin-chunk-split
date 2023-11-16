import assert from "assert";
import { init, parse } from "es-module-lexer";
import MagicString from "magic-string";
import path from "path";
import { ManualChunksOption, NullValue } from "rollup";
import { Plugin } from "vite";
import { isCSSIdentifier } from "./helper";
import { staticImportedScan } from "./staticImportScan";
import { ChunkSplit, CustomChunk, CustomSplitting } from "./types";
import { normalizePath, resolveEntry } from "./utils";

const SPLIT_DEFAULT_MODULES: CustomSplitting = {
  __commonjsHelpers__: [/commonjsHelpers/],
};

const cache = new Map<string, boolean>();

const wrapCustomSplitConfig = async (
  manualChunks: ManualChunksOption,
  customOptions: CustomSplitting,
  customChunk: CustomChunk,
  root: string
): Promise<ManualChunksOption> => {
  assert(typeof manualChunks === "function");
  const groups = Object.keys(customOptions);
  // Create cache ahead of time to decrease the cost of resolve.sync!
  const depsInGroup: Record<string, string[]> = {};
  for (const group of groups) {
    const packageInfo = customOptions[group];
    depsInGroup[group] = await Promise.all(
      packageInfo
        .filter((item): boolean => typeof item === "string")
        .map((item) => resolveEntry(item as string, root))
    );
    depsInGroup[group] = depsInGroup[group].filter((item) => item.length > 0);
  }
  return (
    moduleId,
    { getModuleIds, getModuleInfo }
  ): string | NullValue => {
    const isDepInclude = (
      id: string,
      depPaths: string[],
      importChain: string[]
    ): boolean | null | undefined => {
      // compat windows
      id = normalizePath(id);
      const key = `${id}-${depPaths.join("|")}`;

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
        importChain.forEach((item) =>
          cache.set(`${item}-${depPaths.join("|")}`, true)
        );
        return true;
      }
      const moduleInfo = getModuleInfo(id);
      if (!moduleInfo || !moduleInfo.importers) {
        cache.set(key, false);
        return false;
      }
      const isInclude = moduleInfo.importers.some((importer) =>
        isDepInclude(importer, depPaths, importChain.concat(id))
      );
      // set cache, important!
      cache.set(key, isInclude);
      return isInclude;
    };

    const id = normalizePath(moduleId);    
    const chunk = customChunk({
      id,
      moduleId,
      root,
      file: normalizePath(path.relative(root, id)),
    });
    if(chunk){
      return chunk;
    }

    for (const group of groups) {
      const deps = depsInGroup[group];
      const packageInfo = customOptions[group];
      if (!isCSSIdentifier(moduleId)) {
        if (
          moduleId.includes("node_modules") &&
          deps.length &&
          isDepInclude(moduleId, deps, [])
        ) {
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

const generateManualChunks = async (
  splitOptions: ChunkSplit,
  root: string
) => {
  const { strategy = "default", customSplitting = {}, customChunk = () => null, useEntryName = true} = splitOptions;

  if (strategy === "all-in-one") {
    return wrapCustomSplitConfig(() => null, customSplitting, customChunk, root);
  }

  if (strategy === "unbundle") {
    return wrapCustomSplitConfig(
      (id, { getModuleInfo }): string | undefined => {
        if (id.includes("node_modules") && !isCSSIdentifier(id)) {
          if (staticImportedScan(id, getModuleInfo, new Map(), [])) {
            return "vendor";
          } else {
            return "async-vendor";
          }
        }
        const cwd = process.cwd();
        if (!id.includes("node_modules") && !isCSSIdentifier(id)) {
          const extname = path.extname(id);
          return normalizePath(path.relative(cwd, id).replace(extname, ""));
        }
      },
      {
        ...SPLIT_DEFAULT_MODULES,
        ...customSplitting,
      },
      customChunk,
      root
    );
  }

  return wrapCustomSplitConfig(
    (id, { getModuleInfo }): string | undefined => {
      if (id.includes("node_modules") && !isCSSIdentifier(id)) {
        if (staticImportedScan(id, getModuleInfo, new Map(), [])) {
          return useEntryName ? undefined : "vendor";
        }
      }
    },
    {
      ...SPLIT_DEFAULT_MODULES,
      ...customSplitting,
    },
    customChunk,
    root
  );
};

export function chunkSplitPlugin(
  splitOptions: ChunkSplit = {
    strategy: "default",
    useEntryName: true,
  }
): Plugin {
  return {
    name: "vite-plugin-chunk-split",
    async config(c) {
      await init;
      const root = normalizePath( c.root || process.cwd() );
      const manualChunks = await generateManualChunks(splitOptions, root);
      return {
        build: {
          rollupOptions: {
            output: {
              manualChunks,
            },
          },
        },
      };
    },
    // Delete useless import in commonjsHelpers.js, which is generated by @rollup/plugin-commonjs
    // https://github.com/sanyuan0704/vite-plugin-chunk-split/issues/8
    async renderChunk(code, chunk) {
      const s = new MagicString(code);
      if (chunk.fileName.includes("__commonjsHelpers__")) {
        const [imports] = parse(code);
        for (const { ss: start, se: end } of imports) {
          s.remove(start, end);
        }
        return {
          code: s.toString(),
          map: s.generateMap({ hires: true }),
        };
      }
      return {
        code: code,
        map: s.generateMap({ hires: true }),
      };
    },
  };
}
