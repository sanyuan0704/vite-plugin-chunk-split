import { isCSSIdentifier } from '../src/helper';
import { chunkSplitPlugin } from '../src';

// is css identifier
test('isCssIdentifier', () => { 
  expect(isCSSIdentifier('a.css')).toBe(true);
  expect(isCSSIdentifier('a.less')).toBe(true);
  expect(isCSSIdentifier('a.scss')).toBe(true);
  expect(isCSSIdentifier('a.css?a&b#c&d&e')).toBe(true);
});


// test plugin config
test('chunkSplitPlugin', () => {
  const plugin = chunkSplitPlugin();
  expect(plugin.name).toBe('vite-plugin-chunk-split');
  const config = (plugin.config as () => any).call(plugin);
  expect(config.build.rollupOptions.output.manualChunks).toBeDefined();
  const manualChunks = config.build.rollupOptions.output.manualChunks;
  expect(typeof manualChunks).toBe('function');
});