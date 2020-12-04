#!/usr/bin/env node

// .localhack/build/lib/testing.mjs
import {strict, AssertionError} from "assert";
import chalk2 from "chalk";
var dot = chalk2.green("\u2713");
var log = (x) => process.stdout.write(x);
var eq = (actual, expected, message) => {
  strict.deepEqual(actual, expected, message);
  log(dot);
};
var throws = (err, fn) => {
  try {
    fn();
  } catch (e) {
    if (!(e instanceof err))
      throw e;
    log(dot);
  }
  strict.fail(`Expected to throw ${err.name}`);
};
if (process.env.NODE_ENV === "test")
  log("\nRunning tests...\n\n");
var previousFilename = "";
var test = (subject, fn) => {
  if (process.env.NODE_ENV !== "test")
    return;
  const filename = callingFilename();
  if (filename !== previousFilename) {
    console.log("\n" + filename);
    previousFilename = filename;
  }
  log(`  ${chalk2.yellow(subject.name || subject)}: `);
  try {
    fn({eq, throws});
    log("\n");
  } catch (err) {
    log(chalk2.red("\u2717"));
    if (err instanceof AssertionError) {
      console.error(chalk2.red("\n\nAssertion failed:\n=================\n"));
      console.error(err.message.replace(/(- expected)/, "\n$1"));
      console.error("\nBacktrace:");
      console.error(backtrace(err));
      console.error("");
    } else {
      console.error(chalk2.red("\n\nError thrown:\n=============\n"));
      console.error(err);
      console.error("\n\n");
    }
  }
};
var backtrace = (err) => err.stack.split("\n").filter((line) => /^\s*at ./.test(line)).join("\n");
function* stackDetails(err) {
  const matches = err.stack.matchAll(/ +at.*[( ](?:\w+:\/\/)?(.+):(\d+):(\d+)/g);
  for (const [match, path3, line, col] of matches) {
    const name = path3.replace(/^.*\/(build|src)\//, "");
    yield {
      name,
      path: path3,
      line: Number(line),
      col: Number(col)
    };
  }
}
function callingFilename() {
  const err = new Error();
  let current2;
  for (const {name} of stackDetails(err)) {
    current2 != null ? current2 : current2 = name;
    if (name !== current2)
      return name;
  }
}

// .localhack/build/lib/sift/edit.mjs
import {
  produce,
  isDraft,
  current as currentIm,
  original as originalIm
} from "immer";

// .localhack/build/lib/sift/reify.mjs
var isObj = (obj) => obj != null && typeof obj === "object" && Object.getPrototypeOf(obj) === Object.prototype;
var T = {
  Number: (x) => Number(One(x)),
  String: (x) => String(One(x)),
  Boolean: (x) => Boolean(One(x)),
  Set: (x) => x instanceof Set ? x : new Set(T.Iterable(x)),
  Array: (x) => Array.isArray(x) ? x : [...T.Iterable(x)],
  Object: (x) => {
    if (x == null)
      return {};
    if (isObj(x))
      return x;
    return {};
  },
  Iterable: (x) => {
    if (x == null)
      return [];
    if (x instanceof Map)
      return x.keys();
    if (typeof x === "object" && Symbol.iterator in x)
      return x;
    return [x];
  },
  One: (x) => {
    for (const v of T.Iterable(x)) {
      return v;
    }
  }
};

// .localhack/build/lib/sift/edit.mjs
var isNil = (x) => x == null;
var exists = (x) => x != null;
var reify2 = (desc) => (state2) => {
  for (const [k, as] of entries(desc)) {
    state2[k] = as(state2[k]);
  }
  return state2;
};
test(reify2, ({eq: eq2}) => {
  const state2 = {
    number: 12,
    string: "something"
  };
  eq2(reify2({
    number: T.Array,
    string: T.Set
  })(state2), {
    number: [12],
    string: new Set(["something"])
  });
});
function* iter(x) {
  if (x == null)
    return;
  if (x instanceof Map)
    x = x.keys();
  if (typeof x === "object" && Symbol.iterator in x) {
    for (const xa of x)
      yield* iter(xa);
  } else {
    yield x;
  }
}
function* keys(obj) {
  if (isObj(obj))
    for (const k in obj)
      yield k;
}
function* entries(obj) {
  if (isObj(obj))
    for (const k in obj)
      yield [k, obj[k]];
}
test(iter, ({eq: eq2}) => {
  eq2([...iter()], []);
  eq2([...iter(null)], []);
  eq2([...iter(void 0)], []);
  eq2([...iter(1)], [1]);
  eq2([...iter([1])], [1]);
  eq2([...iter([1, [2, 3], 4])], [1, 2, 3, 4]);
});
var iterMap = (fn) => function* iterMap2(...xs) {
  for (const v of iter(xs))
    yield* iter(fn(v));
};
test(iterMap, ({eq: eq2}) => {
  const inc = (x) => x + 1;
  const evenOnly = (x) => x % 2 === 0 ? x : null;
  const incs = iterMap(inc);
  const evens = iterMap(evenOnly);
  eq2([...incs()], []);
  eq2([...incs([])], []);
  eq2([...incs(null)], []);
  eq2([...incs(void 0)], []);
  eq2([...incs(1, 2, [3, [4]], 5)], [2, 3, 4, 5, 6]);
  eq2([...incs(null, void 0, 1)], [2]);
  eq2([...evens(1, 2, [3, [4]], 5)], [2, 4]);
});
var DRAFT_STATE = Symbol.for("immer-state");
var draftState = (input) => input[DRAFT_STATE];
var isModified = (input) => {
  var _a;
  return (_a = draftState(input)) == null ? void 0 : _a.modified_;
};
var current = (input) => isDraft(input) ? currentIm(input) : input;
function deepAssign(target, ...sources) {
  for (const source of sources)
    for (const k of keys(source))
      if (typeof target[k] === "object" && typeof source[k] === "object") {
        deepAssign(target[k], source[k]);
      } else {
        target[k] = source[k];
      }
  return target;
}
test(deepAssign, ({eq: eq2}) => {
  const source = {a: {b: 2}};
  eq2(deepAssign({a: 1, c: 3}, source), {a: {b: 2}, c: 3});
});
test(isModified, ({eq: eq2}) => {
  produce({test: {a: 1}}, (obj) => {
    eq2(isModified(obj), false);
    eq2(isModified(obj.test), false);
    obj.test.a = 2;
    eq2(isModified(obj), true);
    eq2(isModified(obj.test), true);
  });
});

// .localhack/build/lib/sift/core.mjs
import {produce as produce2} from "immer";
var sift = (...inputs) => {
  const send2 = make(originalPlugin);
  send2(...inputs);
  return send2;
};
var make = (...metaPlugins) => root().meta(metaPlugins);
var root = () => {
  send2.send = send2;
  send2.next = () => {
  };
  send2.meta = (...fns3) => {
    for (const fn of iter(fns3))
      send2.next = fn(send2) || send2.next;
    return send2;
  };
  return send2;
  function send2(...inputs) {
    return send2.next(inputs);
  }
};
var originalPlugin = ({send: send2}) => (inputs) => {
  var _a, _b;
  if (send2.sending) {
    send2.queue || (send2.queue = []);
    send2.queue.push(...iter(inputs));
    return inputs;
  }
  send2.sending = true;
  (_a = send2.state) != null ? _a : send2.state = {};
  const result = produce2(inputs, (inputs2) => {
    send2.state = produce2(send2.state, (state2) => {
      var _a2;
      (_a2 = state2.plugins) != null ? _a2 : state2.plugins = [];
      for (const input of iter(inputs2)) {
        if (typeof input === "function")
          state2.plugins.push(input);
        runWith(state2.plugins, input, state2, send2);
      }
    });
  });
  send2.sending = false;
  const queued = (_b = send2.queue) == null ? void 0 : _b.shift();
  if (queued)
    send2(queued);
  return result;
};
var isFunction = (x) => typeof x === "function";
var apply = (fn, x) => [...iter(fn(x))].filter(isFunction);
var run = (fns3, x) => {
  const out = [];
  for (const fn of iter(fns3))
    out.push(...apply(fn, x));
  return out;
};
var runWith = (fns3, ...steps) => {
  for (const step of steps) {
    fns3 = run(fns3, step);
  }
};
test(make, ({eq: eq2}) => {
  const send2 = sift((input) => (state2) => {
    var _a;
    (_a = state2.count) != null ? _a : state2.count = 0;
    state2.count++;
  }, (input) => {
  }, (input) => input.testing = true, (input) => (state2) => (send22) => {
    if (state2.count === 4)
      send22({msg: "count is 4!"});
  });
  eq2(send2({}), [{testing: true}]);
  eq2(send2.state.count, 6);
});

// .localhack/build/lib/fns.mjs
var pre = (fn, ...parts) => (...args2) => fn(...parts, ...args2);

// .localhack/build/lib/sift/plugins/memory.mjs
import {v4 as uuid2} from "uuid";
var acceptIndexes = (input) => (state2) => {
  var _a, _b;
  (_a = state2.indexers) != null ? _a : state2.indexers = {};
  for (const [name, fn] of entries(input.indexers)) {
    state2.indexers[name] = fn;
    (_b = state2[name]) != null ? _b : state2[name] = state2[name];
  }
};
function findId(input) {
  if (input.id)
    return;
  return (state2) => {
    for (const [name, indexer] of entries(state2.indexers)) {
      const index = state2[name];
      if (!index)
        return;
      for (const key of iter(indexer(input))) {
        if (index[key]) {
          input.id = index[key];
          return;
        }
      }
    }
  };
}
var populateFromId = (input) => (state2) => {
  var _a;
  if (!input.id)
    return;
  (_a = state2.byId) != null ? _a : state2.byId = {};
  const cached = state2.byId[input.id];
  if (cached) {
    deepAssign(cached, current(input));
    deepAssign(input, current(cached));
  }
};
var writeIndexes = (input) => (state2) => {
  var _a, _b, _c;
  for (const [name, indexer] of entries(state2.indexers)) {
    (_a = state2[name]) != null ? _a : state2[name] = {};
    for (const key of iter(indexer(input))) {
      (_b = input.id) != null ? _b : input.id = uuid2();
      (_c = input.createdAt) != null ? _c : input.createdAt = new Date().toISOString();
      state2[name][key] = input.id;
    }
  }
};
function writeToCache(input) {
  var _a, _b, _c, _d;
  if (!input.id)
    return;
  (_a = state.byId) != null ? _a : state.byId = {};
  const cached = (_d = (_b = state.byId)[_c = input.id]) != null ? _d : _b[_c] = {};
  deepAssign(cached, current(input));
  deepAssign(input, current(cached));
}
var memory_default = [
  acceptIndexes,
  findId,
  populateFromId,
  writeIndexes,
  writeToCache
];

// .localhack/build/lib/sift/std.mjs
var alias = (input) => {
  if (typeof input.alias === "string")
    state[input.alias] = input;
};
var config = (input) => {
  if (typeof input.config !== "object")
    return;
  return (state2) => {
    state2.config || (state2.config = {});
    deepAssign(state2.config, input.config);
  };
};
var standard = [memory_default, config, alias];

// .localhack/build/lib/sift/plugins/build.mjs
import fg from "fast-glob";
import chalk22 from "chalk";
import {
  constants,
  watch
} from "fs";
import Esbuild from "esbuild";
import {copyFile, mkdir, readFile, writeFile, stat} from "fs/promises";
import {dirname, extname} from "path";

// .localhack/build/lib/project.mjs
import {resolve, relative} from "path";
var root2 = (...paths) => resolve(process.cwd(), ...paths);
var src = pre(root2, "src");
var entry = pre(src, "entries");
var local = pre(root2, ".localhack");
var build = pre(local, "build");
var dist = pre(root2, "dist");
var file = (path22) => relative(root2(), path22);

// .localhack/build/lib/sift/plugins/markdown.mjs
import MarkdownIt from "markdown-it";
var md = new MarkdownIt({});
function parseMarkdown(input) {
  const {path: path3, text} = input;
  if (!text)
    return;
  if (!path3.endsWith(".md"))
    return;
  input.markdown = md.parse(text);
}
var all = [parseMarkdown];

// .localhack/build/lib/sift/plugins/literate.mjs
function tangle(input) {
  const {path: path3, markdown: markdown2} = input;
  if (!path3)
    return;
  if (!markdown2)
    return;
  return (state2) => (send2) => {
    var _a, _b;
    const code = {};
    for (const node2 of iter(markdown2)) {
      if (node2.type !== "fence")
        continue;
      const blocks = (_b = code[_a = node2.info]) != null ? _b : code[_a] = [];
      blocks.push(node2.content);
    }
    for (const [ext, blocks] of entries(code)) {
      send2({
        virtual: true,
        path: path3.replace(/\.md$/, "." + ext),
        text: blocks.join("\n\n")
      });
    }
  };
}
var all2 = [tangle];

// .localhack/build/lib/sift/plugins/build.mjs
var {COPYFILE_FICLONE} = constants;
var isJsPath = (path22) => /\.(mjs|js)x?$/.test(path22);
function globbing(input) {
  const globs = input.glob;
  if (!globs)
    return;
  return (state2) => async (send2) => {
    for await (const path22 of fg.stream(root2(globs), {
      dot: true,
      absolute: true
    })) {
      send2({path: path22, name: file(path22), ext: extname(path22)});
    }
  };
}
function reading(input) {
  if (input.reading)
    return;
  if (!input.path)
    return;
  if (exists(input.text))
    return;
  const {path: path22} = input;
  input.reading = true;
  return (state2) => async (send2) => {
    const text = await readFile(path22).then(String);
    send2({path: path22, text, persisted: true, reading: false});
  };
}
function writing(input) {
  if (input.persisted)
    return;
  if (input.virtual)
    return;
  if (!input.path)
    return;
  if (isNil(input.text))
    return;
  const {path: path22, text} = input;
  const mode = text.startsWith("#!") ? 493 : 420;
  return (state2) => async (send2) => {
    await mkdir(dirname(path22), {recursive: true});
    await writeFile(path22, text, {
      mode
    });
    console.log(`${chalk22.green("Wrote")}: ${file(path22)}`);
    send2({path: path22, persisted: true});
  };
}
function transpiling(input) {
  const {name, path: path22, text} = input;
  if (!path22)
    return;
  if (!text)
    return;
  if (!/\/src\/.+\.(mjs|js)x?$/.test(path22))
    return;
  const outputPath = path22.replace(/\.(\w+)$/, ".mjs").replace("/src/", "/.localhack/build/");
  return (state2) => async (send2) => {
    const {code} = await Esbuild.transform(text, {
      sourcefile: name != null ? name : path22,
      target: "node12"
    });
    send2({
      path: outputPath,
      text: code,
      persisted: false
    });
  };
}
function bundling(input) {
  const {name, dist: dist2} = input;
  if (!dist2)
    return;
  const entryPoints = fg.sync(dist2).filter(isJsPath);
  return (state2) => async (send2) => {
    const {outputFiles, warnings} = await Esbuild.build({
      entryPoints,
      platform: "node",
      bundle: true,
      target: "node12",
      format: "esm",
      outExtension: {".js": ".mjs"},
      external: [
        "chalk",
        "electron",
        "esbuild",
        "fast-glob",
        "immer",
        "markdown-it",
        "react",
        "uuid",
        "yaml"
      ],
      outdir: dist(),
      write: false
    });
    for (const out of outputFiles) {
      send2({
        path: out.path,
        text: out.text,
        persisted: false
      });
    }
  };
}
function watching(input) {
  return (state2) => (send2) => {
    var _a;
    (_a = state2.watcher) != null ? _a : state2.watcher = watch(src(), {recursive: true}, async (event, relativePath) => {
      if (event !== "change")
        return;
      const path22 = src(relativePath);
      const stats = await stat(path22);
      send2({path: path22, watching: true, modifiedAt: stats.mtime.toISOString()});
    });
  };
}
var indexers = {
  byPath: (input) => input.path
};
var all3 = [
  {indexers},
  globbing,
  writing,
  reading,
  transpiling,
  all,
  all2
];

// .localhack/build/entries/cli.mjs
import electron2 from "electron";
import {execFile, spawn} from "child_process";
var cwd = process.cwd();
var [node, bin, cmd, ...args] = process.argv;
var send = sift();
send(standard, all3, cli);
send({
  cwd,
  cmd,
  args
});
function cli(input) {
  if (!("cmd" in input))
    return;
  return (state2) => {
    state2.cwd = input.cwd;
    state2.cmd = input.cmd;
    state2.args = current(input.args);
    return (send2) => {
      switch (input.cmd) {
        case void 0:
          return send2(usageCmd);
        case "build":
          return send2(buildCmd);
        case "dist":
          return send2(buildCmd, distCmd);
        case "test":
          return send2(testCmd);
        case "watch":
          return send2(buildCmd, watchCmd);
        case "ui":
          return send2(buildCmd, watchCmd, uiCmd);
      }
    };
  };
}
function usageCmd(input) {
  if (input !== usageCmd)
    return;
  return (state2) => {
    if (state2.cmd)
      return;
    console.log("Welcome to LocalHack");
  };
}
function buildCmd(input) {
  if (input !== buildCmd)
    return;
  const glob = "src/**/*.{html,ts,js,mjs,md}";
  return (state2) => (send2) => {
    if (state2.args.includes("--watch"))
      send2(watchCmd);
    if (state2.args.includes("--dist"))
      send2(distCmd);
    send2({glob});
  };
}
function distCmd(input) {
  if (input !== distCmd)
    return;
  const dist2 = build("entries/*.{html,ts,js,mjs}");
  return (state2) => (send2) => {
    if (state2.args.includes("--watch"))
      send2(watchCmd);
    send2(bundling, {dist: dist2});
  };
}
function testCmd(input) {
  if (input !== testCmd)
    return;
}
function uiCmd(input) {
  if (input !== uiCmd)
    return;
  return (state2) => async (send2) => {
    const child = execFile(electron2, [file(entry("electron.js")), "main.mjs"], (err) => {
      if (err)
        return console.error(err);
    });
  };
}
function watchCmd(input) {
  if (input !== watchCmd)
    return;
  console.log(`Watching for changes...`);
  send(watching);
}