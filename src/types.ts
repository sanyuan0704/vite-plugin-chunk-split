type packageInfo = string | RegExp;

type Strategy =
  | 'default'
  | 'all-in-one'
  | 'single-vendor'
  | 'unbundle';

export type CustomSplitting = Record<string, packageInfo[]>;

export interface ChunkSplit {
  strategy?: Strategy;
  customSplitting?: CustomSplitting;
}