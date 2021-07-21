import { Loader } from "esbuild";
import { get, set } from "idb-keyval";

const KEY = "fs";

export interface MemFile {
  contents: string;
  loader: Loader;
}

type Files = Record<string, MemFile>;

const EXTS = ["js", "jsx", "ts", "tsx", "css", "json"];
const OTHER = ["base64", "file", "dataurl", "binary"];

function getLoader(path: string): Loader {
  const ques = path.lastIndexOf("?");
  if (ques !== -1) {
    const query = path.slice(ques + 1);
    if (OTHER.includes(query) || EXTS.includes(query)) return query as Loader;
    path = path.slice(0, ques);
  }
  const dot = path.lastIndexOf(".");
  if (dot !== -1) {
    const ext = path.slice(dot + 1);
    if (EXTS.includes(ext)) return ext as Loader;
  }
  return "default";
}

class Mem {
  files: Files = {};
  readonly initialized: Promise<void>;

  constructor() {
    this.initialized = get<Files>(KEY).then(fs => {
      if (fs) this.files = fs;
    });
  }

  flush() {
    return set(KEY, this.files);
  }

  find(name: string) {
    let i: number, result: [string, MemFile];
    for (const path in this.files) {
      result = [path, this.files[path]];
      if (path === name) return result;
      if ((i = path.lastIndexOf(".")) !== -1) {
        if (path.slice(0, i) === name) return result;
      }
    }
    return [];
  }

  get(path: string) {
    return this.files[path];
  }

  set(path: string, contents: string) {
    this.files[path] = { contents, loader: getLoader(path) };
  }

  clear() {
    this.files = {};
  }

  delete(path: string) {
    delete this.files[path];
  }
}

export const mem = new Mem();
