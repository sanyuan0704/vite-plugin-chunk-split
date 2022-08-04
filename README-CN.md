# vite-plugin-chunk-split

[English](./README.md) | 中文

Vite 代码拆包插件。支持多种拆包策略，可避免手动操作 manualChunks 潜在的循环依赖问题。

## 基本使用

首先安装依赖:
```js
// use npm
npm i vite-plugin-chunk-split -D
// use yarn
yarn add vite-plugin-chunk-split -D
// use pnpm
pnpm i vite-plugin-chunk-split -D
```

然后你可以在 Vite 配置文件中使用它:
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

## 参数类型
```ts
type packageInfo = string | RegExp;
type Strategy =
  // 默认拆包方式
  | 'default'
  // 所有文件打包到一起
  | 'all-in-one'
  // 实现不打包的效果，一个文件一个 chunk
  | 'unbundle';

export type CustomSplitting = Record<string, packageInfo[]>;

export interface ChunkSplitOptions {
  strategy?: Strategy;
  customSplitting?: CustomSplitting;
}
```
你也可以使用插件的配置来精细化地控制拆包策略:
```ts
// vite.config.ts
import { chunkSplitPlugin } from 'vite-plugin-chunk-split';

{
  plugins: [
    // ...
    chunkSplitPlugin({
      strategy: 'default',
      customSplitting: {
        // `react` and `react-dom` 会被打包到一个名为`render-vendor`的 chunk 里面(包括它们的一些依赖，如 object-assign)
        'react-vendor': ['react', 'react-dom'],
        // 源码中 utils 目录的代码都会打包进 `utils` 这个 chunk 中
        'utils': [/src\/utils/]
      }
    })
  ]
}
```

另外，你也可以实现一键实现不打包（Bundleless），同时通过`customSplitting`参数来指定文件合并的策略:

```ts
// vite.config.ts
import { chunkSplitPlugin } from 'vite-plugin-chunk-split';

{
  plugins: [
    // ...
    chunkSplitPlugin({
      strategy: 'unbundle',
      customSplitting: {
        // src/container 下的所有文件会被合并成一个 chunk
        'container': [/src\/container/]
      }
    })
  ]
}
```

## License

MIT
