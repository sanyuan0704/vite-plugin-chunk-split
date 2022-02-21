const cssLangs = '\\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\\?)';
const cssLangRE = new RegExp(cssLangs);

export const isCSSIdentifier = (request: string): boolean => cssLangRE.test(request);
