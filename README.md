# vite-plugin-chunk-split

English | [中文](./README-CN.md)

A vite plugin for better chunk splitting.

## Usage

```js
// use npm
npm i vite-plugin-chunk-split
// use yarn
yarn add vite-plugin-chunk-split
// use pnpm
pnpm i vite-plugin-chunk-split
```

Then you can use it in vite.config.ts:
```ts
// vite.config.ts
import { chunkSplitPlugin } from 'vite-plugin-chunk-split';

{
  plugins: [
    // ...
    chunkSplitPlugin()
  ]
}
```

## Options
```ts
type packageInfo = string | RegExp;
type Strategy =
  // split by default
  | 'default'
  // all files will be together
  | 'all-in-one'
  // unbundle for your source files，vite will generate one chunk for every file
  | 'unbundle';

export type CustomSplitting = Record<string, packageInfo[]>;

export interface ChunkSplitOptions {
  strategy?: Strategy;
  customSplitting?: CustomSplitting;
}
```
You can use the options to customize your splitting strategy, for example：
```ts
// vite.config.ts
import { chunkSplitPlugin } from 'vite-plugin-chunk-split';

{
  plugins: [
    // ...
    chunkSplitPlugin({
      strategy: 'single-vendor',
      customSplitting: {
        // `react` and `react-dom` will be bundled together in the `react-vendor` chunk (with their dependencies, such as object-assign)
        'react-vendor': ['react', 'react-dom'],
        // Any file that includes `utils` in src dir will be bundled in the `utils` chunk 
        'arco': [/src\/utils/]
      }
    })
  ]
}
```

By the way, you can achieve bundleless by the `unbundle` strategy:
```ts
// vite.config.ts
import { chunkSplitPlugin } from 'vite-plugin-chunk-split';

{
  plugins: [
    // ...
    chunkSplitPlugin({
      strategy: 'unbundle',
      customSplitting: {
        // All files in `src/container` will be merged together in `container` chunk
        'container': [/src\/container/]
      }
    })
  ]
}
```

## License

MIT
