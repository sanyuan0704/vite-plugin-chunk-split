type packageInfo = string | RegExp;

type Strategy =
  | 'default'
  | 'all-in-one'
  | 'single-vendor'
  | 'unbundle';

export type CustomSplitting = Record<string, packageInfo[]>;

export type CustomChunk = (context: {id:string, moduleId:string, file:string, root:string}) => string | undefined | null;

export interface ChunkSplit {
  strategy?: Strategy;
  customSplitting?: CustomSplitting;
  customChunk?: CustomChunk;
  useEntryName?: boolean;
}