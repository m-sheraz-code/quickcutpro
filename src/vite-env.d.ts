/// <reference types="vite/client" />


declare module 'env-paths' {
  interface Paths {
    config: string;
    data: string;
    cache: string;
    log: string;
    temp: string;
  }

  function envPaths(name: string, options?: { suffix?: string }): Paths;

  export = envPaths;
}
