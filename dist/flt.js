// @bun
// node_modules/citty/dist/_chunks/libs/scule.mjs
var NUMBER_CHAR_RE = /\d/;
var STR_SPLITTERS = [
  "-",
  "_",
  "/",
  "."
];
function isUppercase(char = "") {
  if (NUMBER_CHAR_RE.test(char))
    return;
  return char !== char.toLowerCase();
}
function splitByCase(str, separators) {
  const splitters = separators ?? STR_SPLITTERS;
  const parts = [];
  if (!str || typeof str !== "string")
    return parts;
  let buff = "";
  let previousUpper;
  let previousSplitter;
  for (const char of str) {
    const isSplitter = splitters.includes(char);
    if (isSplitter === true) {
      parts.push(buff);
      buff = "";
      previousUpper = undefined;
      continue;
    }
    const isUpper = isUppercase(char);
    if (previousSplitter === false) {
      if (previousUpper === false && isUpper === true) {
        parts.push(buff);
        buff = char;
        previousUpper = isUpper;
        continue;
      }
      if (previousUpper === true && isUpper === false && buff.length > 1) {
        const lastChar = buff.at(-1);
        parts.push(buff.slice(0, Math.max(0, buff.length - 1)));
        buff = lastChar + char;
        previousUpper = isUpper;
        continue;
      }
    }
    buff += char;
    previousUpper = isUpper;
    previousSplitter = isSplitter;
  }
  parts.push(buff);
  return parts;
}
function upperFirst(str) {
  return str ? str[0].toUpperCase() + str.slice(1) : "";
}
function lowerFirst(str) {
  return str ? str[0].toLowerCase() + str.slice(1) : "";
}
function pascalCase(str, opts) {
  return str ? (Array.isArray(str) ? str : splitByCase(str)).map((p) => upperFirst(opts?.normalize ? p.toLowerCase() : p)).join("") : "";
}
function camelCase(str, opts) {
  return lowerFirst(pascalCase(str || "", opts));
}
function kebabCase(str, joiner) {
  return str ? (Array.isArray(str) ? str : splitByCase(str)).map((p) => p.toLowerCase()).join(joiner ?? "-") : "";
}

// node_modules/citty/dist/index.mjs
import { parseArgs as parseArgs$1 } from "util";
function toArray(val) {
  if (Array.isArray(val))
    return val;
  return val === undefined ? [] : [val];
}
function formatLineColumns(lines, linePrefix = "") {
  const maxLength = [];
  for (const line of lines)
    for (const [i, element] of line.entries())
      maxLength[i] = Math.max(maxLength[i] || 0, element.length);
  return lines.map((l) => l.map((c, i) => linePrefix + c[i === 0 ? "padStart" : "padEnd"](maxLength[i])).join("  ")).join(`
`);
}
function resolveValue(input) {
  return typeof input === "function" ? input() : input;
}
var CLIError = class extends Error {
  code;
  constructor(message, code) {
    super(message);
    this.name = "CLIError";
    this.code = code;
  }
};
function parseRawArgs(args = [], opts = {}) {
  const booleans = new Set(opts.boolean || []);
  const strings = new Set(opts.string || []);
  const aliasMap = opts.alias || {};
  const defaults = opts.default || {};
  const aliasToMain = /* @__PURE__ */ new Map;
  const mainToAliases = /* @__PURE__ */ new Map;
  for (const [key, value] of Object.entries(aliasMap)) {
    const targets = value;
    for (const target of targets) {
      aliasToMain.set(key, target);
      if (!mainToAliases.has(target))
        mainToAliases.set(target, []);
      mainToAliases.get(target).push(key);
      aliasToMain.set(target, key);
      if (!mainToAliases.has(key))
        mainToAliases.set(key, []);
      mainToAliases.get(key).push(target);
    }
  }
  const options = {};
  function getType(name) {
    if (booleans.has(name))
      return "boolean";
    const aliases = mainToAliases.get(name) || [];
    for (const alias of aliases)
      if (booleans.has(alias))
        return "boolean";
    return "string";
  }
  const allOptions = new Set([
    ...booleans,
    ...strings,
    ...Object.keys(aliasMap),
    ...Object.values(aliasMap).flat(),
    ...Object.keys(defaults)
  ]);
  for (const name of allOptions)
    if (!options[name])
      options[name] = {
        type: getType(name),
        default: defaults[name]
      };
  for (const [alias, main] of aliasToMain.entries())
    if (alias.length === 1 && options[main] && !options[main].short)
      options[main].short = alias;
  const processedArgs = [];
  const negatedFlags = {};
  for (let i = 0;i < args.length; i++) {
    const arg = args[i];
    if (arg === "--") {
      processedArgs.push(...args.slice(i));
      break;
    }
    if (arg.startsWith("--no-")) {
      const flagName = arg.slice(5);
      negatedFlags[flagName] = true;
      continue;
    }
    processedArgs.push(arg);
  }
  let parsed;
  try {
    parsed = parseArgs$1({
      args: processedArgs,
      options: Object.keys(options).length > 0 ? options : undefined,
      allowPositionals: true,
      strict: false
    });
  } catch {
    parsed = {
      values: {},
      positionals: processedArgs
    };
  }
  const out = { _: [] };
  out._ = parsed.positionals;
  for (const [key, value] of Object.entries(parsed.values))
    out[key] = value;
  for (const [name] of Object.entries(negatedFlags)) {
    out[name] = false;
    const mainName = aliasToMain.get(name);
    if (mainName)
      out[mainName] = false;
    const aliases = mainToAliases.get(name);
    if (aliases)
      for (const alias of aliases)
        out[alias] = false;
  }
  for (const [alias, main] of aliasToMain.entries()) {
    if (out[alias] !== undefined && out[main] === undefined)
      out[main] = out[alias];
    if (out[main] !== undefined && out[alias] === undefined)
      out[alias] = out[main];
  }
  return out;
}
var noColor = /* @__PURE__ */ (() => {
  const env = globalThis.process?.env ?? {};
  return env.NO_COLOR === "1" || env.TERM === "dumb" || env.TEST || env.CI;
})();
var _c = (c, r = 39) => (t) => noColor ? t : `\x1B[${c}m${t}\x1B[${r}m`;
var bold = /* @__PURE__ */ _c(1, 22);
var cyan = /* @__PURE__ */ _c(36);
var gray = /* @__PURE__ */ _c(90);
var underline = /* @__PURE__ */ _c(4, 24);
function parseArgs(rawArgs, argsDef) {
  const parseOptions = {
    boolean: [],
    string: [],
    alias: {},
    default: {}
  };
  const args = resolveArgs(argsDef);
  for (const arg of args) {
    if (arg.type === "positional")
      continue;
    if (arg.type === "string" || arg.type === "enum")
      parseOptions.string.push(arg.name);
    else if (arg.type === "boolean")
      parseOptions.boolean.push(arg.name);
    if (arg.default !== undefined)
      parseOptions.default[arg.name] = arg.default;
    if (arg.alias)
      parseOptions.alias[arg.name] = arg.alias;
    const camelName = camelCase(arg.name);
    const kebabName = kebabCase(arg.name);
    if (camelName !== arg.name || kebabName !== arg.name) {
      const existingAliases = toArray(parseOptions.alias[arg.name] || []);
      if (camelName !== arg.name && !existingAliases.includes(camelName))
        existingAliases.push(camelName);
      if (kebabName !== arg.name && !existingAliases.includes(kebabName))
        existingAliases.push(kebabName);
      if (existingAliases.length > 0)
        parseOptions.alias[arg.name] = existingAliases;
    }
  }
  const parsed = parseRawArgs(rawArgs, parseOptions);
  const [...positionalArguments] = parsed._;
  const parsedArgsProxy = new Proxy(parsed, { get(target, prop) {
    return target[prop] ?? target[camelCase(prop)] ?? target[kebabCase(prop)];
  } });
  for (const [, arg] of args.entries())
    if (arg.type === "positional") {
      const nextPositionalArgument = positionalArguments.shift();
      if (nextPositionalArgument !== undefined)
        parsedArgsProxy[arg.name] = nextPositionalArgument;
      else if (arg.default === undefined && arg.required !== false)
        throw new CLIError(`Missing required positional argument: ${arg.name.toUpperCase()}`, "EARG");
      else
        parsedArgsProxy[arg.name] = arg.default;
    } else if (arg.type === "enum") {
      const argument = parsedArgsProxy[arg.name];
      const options = arg.options || [];
      if (argument !== undefined && options.length > 0 && !options.includes(argument))
        throw new CLIError(`Invalid value for argument: ${cyan(`--${arg.name}`)} (${cyan(argument)}). Expected one of: ${options.map((o) => cyan(o)).join(", ")}.`, "EARG");
    } else if (arg.required && parsedArgsProxy[arg.name] === undefined)
      throw new CLIError(`Missing required argument: --${arg.name}`, "EARG");
  return parsedArgsProxy;
}
function resolveArgs(argsDef) {
  const args = [];
  for (const [name, argDef] of Object.entries(argsDef || {}))
    args.push({
      ...argDef,
      name,
      alias: toArray(argDef.alias)
    });
  return args;
}
function defineCommand(def) {
  return def;
}
async function runCommand(cmd, opts) {
  const cmdArgs = await resolveValue(cmd.args || {});
  const parsedArgs = parseArgs(opts.rawArgs, cmdArgs);
  const context = {
    rawArgs: opts.rawArgs,
    args: parsedArgs,
    data: opts.data,
    cmd
  };
  if (typeof cmd.setup === "function")
    await cmd.setup(context);
  let result;
  try {
    const subCommands = await resolveValue(cmd.subCommands);
    if (subCommands && Object.keys(subCommands).length > 0) {
      const subCommandArgIndex = opts.rawArgs.findIndex((arg) => !arg.startsWith("-"));
      const subCommandName = opts.rawArgs[subCommandArgIndex];
      if (subCommandName) {
        if (!subCommands[subCommandName])
          throw new CLIError(`Unknown command ${cyan(subCommandName)}`, "E_UNKNOWN_COMMAND");
        const subCommand = await resolveValue(subCommands[subCommandName]);
        if (subCommand)
          await runCommand(subCommand, { rawArgs: opts.rawArgs.slice(subCommandArgIndex + 1) });
      } else if (!cmd.run)
        throw new CLIError(`No command specified.`, "E_NO_COMMAND");
    }
    if (typeof cmd.run === "function")
      result = await cmd.run(context);
  } finally {
    if (typeof cmd.cleanup === "function")
      await cmd.cleanup(context);
  }
  return { result };
}
async function resolveSubCommand(cmd, rawArgs, parent) {
  const subCommands = await resolveValue(cmd.subCommands);
  if (subCommands && Object.keys(subCommands).length > 0) {
    const subCommandArgIndex = rawArgs.findIndex((arg) => !arg.startsWith("-"));
    const subCommandName = rawArgs[subCommandArgIndex];
    const subCommand = await resolveValue(subCommands[subCommandName]);
    if (subCommand)
      return resolveSubCommand(subCommand, rawArgs.slice(subCommandArgIndex + 1), cmd);
  }
  return [cmd, parent];
}
async function showUsage(cmd, parent) {
  try {
    console.log(await renderUsage(cmd, parent) + `
`);
  } catch (error) {
    console.error(error);
  }
}
var negativePrefixRe = /^no[-A-Z]/;
async function renderUsage(cmd, parent) {
  const cmdMeta = await resolveValue(cmd.meta || {});
  const cmdArgs = resolveArgs(await resolveValue(cmd.args || {}));
  const parentMeta = await resolveValue(parent?.meta || {});
  const commandName = `${parentMeta.name ? `${parentMeta.name} ` : ""}` + (cmdMeta.name || process.argv[1]);
  const argLines = [];
  const posLines = [];
  const commandsLines = [];
  const usageLine = [];
  for (const arg of cmdArgs)
    if (arg.type === "positional") {
      const name = arg.name.toUpperCase();
      const isRequired = arg.required !== false && arg.default === undefined;
      const defaultHint = arg.default ? `="${arg.default}"` : "";
      posLines.push([
        cyan(name + defaultHint),
        arg.description || "",
        arg.valueHint ? `<${arg.valueHint}>` : ""
      ]);
      usageLine.push(isRequired ? `<${name}>` : `[${name}]`);
    } else {
      const isRequired = arg.required === true && arg.default === undefined;
      const argStr = [...(arg.alias || []).map((a) => `-${a}`), `--${arg.name}`].join(", ") + (arg.type === "string" && (arg.valueHint || arg.default) ? `=${arg.valueHint ? `<${arg.valueHint}>` : `"${arg.default || ""}"`}` : "") + (arg.type === "enum" && arg.options ? `=<${arg.options.join("|")}>` : "");
      argLines.push([cyan(argStr + (isRequired ? " (required)" : "")), arg.description || ""]);
      if (arg.type === "boolean" && (arg.default === true || arg.negativeDescription) && !negativePrefixRe.test(arg.name)) {
        const negativeArgStr = [...(arg.alias || []).map((a) => `--no-${a}`), `--no-${arg.name}`].join(", ");
        argLines.push([cyan(negativeArgStr + (isRequired ? " (required)" : "")), arg.negativeDescription || ""]);
      }
      if (isRequired)
        usageLine.push(argStr);
    }
  if (cmd.subCommands) {
    const commandNames = [];
    const subCommands = await resolveValue(cmd.subCommands);
    for (const [name, sub] of Object.entries(subCommands)) {
      const meta = await resolveValue((await resolveValue(sub))?.meta);
      if (meta?.hidden)
        continue;
      commandsLines.push([cyan(name), meta?.description || ""]);
      commandNames.push(name);
    }
    usageLine.push(commandNames.join("|"));
  }
  const usageLines = [];
  const version = cmdMeta.version || parentMeta.version;
  usageLines.push(gray(`${cmdMeta.description} (${commandName + (version ? ` v${version}` : "")})`), "");
  const hasOptions = argLines.length > 0 || posLines.length > 0;
  usageLines.push(`${underline(bold("USAGE"))} ${cyan(`${commandName}${hasOptions ? " [OPTIONS]" : ""} ${usageLine.join(" ")}`)}`, "");
  if (posLines.length > 0) {
    usageLines.push(underline(bold("ARGUMENTS")), "");
    usageLines.push(formatLineColumns(posLines, "  "));
    usageLines.push("");
  }
  if (argLines.length > 0) {
    usageLines.push(underline(bold("OPTIONS")), "");
    usageLines.push(formatLineColumns(argLines, "  "));
    usageLines.push("");
  }
  if (commandsLines.length > 0) {
    usageLines.push(underline(bold("COMMANDS")), "");
    usageLines.push(formatLineColumns(commandsLines, "  "));
    usageLines.push("", `Use ${cyan(`${commandName} <command> --help`)} for more information about a command.`);
  }
  return usageLines.filter((l) => typeof l === "string").join(`
`);
}
async function runMain(cmd, opts = {}) {
  const rawArgs = opts.rawArgs || process.argv.slice(2);
  const showUsage$1 = opts.showUsage || showUsage;
  try {
    if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
      await showUsage$1(...await resolveSubCommand(cmd, rawArgs));
      process.exit(0);
    } else if (rawArgs.length === 1 && rawArgs[0] === "--version") {
      const meta = typeof cmd.meta === "function" ? await cmd.meta() : await cmd.meta;
      if (!meta?.version)
        throw new CLIError("No version specified", "E_NO_VERSION");
      console.log(meta.version);
    } else
      await runCommand(cmd, { rawArgs });
  } catch (error) {
    if (error instanceof CLIError) {
      await showUsage$1(...await resolveSubCommand(cmd, rawArgs));
      console.error(error.message);
    } else
      console.error(error, `
`);
    process.exit(1);
  }
}
// src/lib/server/airports.json
var airports_default = {
  OCA: { name: "Ocean Reef Club Airport", city: "Key Largo", country: "US" },
  CYT: { name: "Yakataga Airport", city: "Yakataga", country: "US" },
  FWL: { name: "Farewell Airport", city: "Farewell", country: "US" },
  CSE: { name: "Crested Butte Airpark", city: "Crested Butte", country: "US" },
  CUS: { name: "Columbus Municipal Airport", city: "Columbus", country: "US" },
  JCY: { name: "Lbj Ranch Airport", city: "Johnson City", country: "US" },
  ICY: { name: "Icy Bay Airport", city: "Icy Bay", country: "US" },
  HGZ: { name: "Hog River Airport", city: "Hogatza", country: "US" },
  GWV: { name: "Fokker Field", city: "Bush", country: "US" },
  BZT: { name: "Eagle Air Park", city: "Brazoria", country: "US" },
  BYW: { name: "Blakely Island Airport", city: "Blakely Island", country: "US" },
  DRF: { name: "Drift River Airport", city: "Kenai", country: "US" },
  BDF: { name: "Rinkenberger Airport", city: "Bradford", country: "US" },
  CTO: { name: "Calverton Executive Airpark", city: "Calverton", country: "US" },
  RFK: { name: "Rollang Field", city: "Rolling Fork", country: "US" },
  BCS: { name: "Southern Seaplane Airport", city: "Belle Chasse", country: "US" },
  CWS: { name: "Center Island Airport", city: "Center Island", country: "US" },
  DUF: { name: "Pine Island Airport", city: "Corolla", country: "US" },
  SSW: { name: "Stuart Island Airpark", city: "Stuart Island", country: "US" },
  FOB: { name: "Fort Bragg Airport", city: "Fort Bragg", country: "US" },
  MHN: { name: "Hooker County Airport", city: "Mullen", country: "US" },
  AXB: { name: "Maxson Airfield", city: "Alexandria Bay", country: "US" },
  REE: { name: "Reese Airpark", city: "Lubbock", country: "US" },
  WDN: { name: "Waldron Airstrip", city: "East Sound", country: "US" },
  AFT: { name: "Afutara Aerodrome", city: "Bila", country: "SB" },
  RNA: { name: "Ulawa Airport", city: "Arona", country: "SB" },
  ATD: { name: "Uru Harbour Airport", city: "Atoifi", country: "SB" },
  VEV: { name: "Barakoma Airport", city: "Barakoma", country: "SB" },
  BPF: { name: "Batuna Aerodrome", city: "Batuna Mission Station", country: "SB" },
  GEF: { name: "Geva Airport", city: "Liangia", country: "SB" },
  AKS: { name: "Auki Airport", city: "Auki", country: "SB" },
  BNY: { name: "Bellona/Anua Airport", city: "Anua", country: "SB" },
  CHY: { name: "Choiseul Bay Airport", city: "", country: "SB" },
  BAS: { name: "Ballalae Airport", city: "Ballalae", country: "SB" },
  FRE: { name: "Fera/Maringe Airport", city: "Fera Island", country: "SB" },
  HIR: { name: "Honiara International Airport", city: "Honiara", country: "SB" },
  MBU: { name: "Babanakira Airport", city: "Mbambanakira", country: "SB" },
  AVU: { name: "Avu Avu Airport", city: "", country: "SB" },
  IRA: { name: "Ngorangora Airport", city: "Kirakira", country: "SB" },
  SCZ: {
    name: "Santa Cruz/Graciosa Bay/Luova Airport",
    city: "Santa Cruz/Graciosa Bay/Luova",
    country: "SB"
  },
  MUA: { name: "Munda Airport", city: "", country: "SB" },
  GZO: { name: "Nusatupe Airport", city: "Gizo", country: "SB" },
  MNY: { name: "Mono Airport", city: "Stirling Island", country: "SB" },
  PRS: { name: "Parasi Airport", city: "Parasi", country: "SB" },
  RNL: { name: "Rennell/Tingoa Airport", city: "Rennell Island", country: "SB" },
  EGM: { name: "Sege Airport", city: "Sege", country: "SB" },
  NNB: { name: "Santa Ana Airport", city: "Santa Ana Island", country: "SB" },
  RUS: { name: "Marau Airport", city: "Marau", country: "SB" },
  VAO: { name: "Suavanao Airport", city: "Suavanao", country: "SB" },
  XYA: { name: "Yandina Airport", city: "Yandina", country: "SB" },
  KGE: { name: "Kagau Island Airport", city: "Kagau Island", country: "SB" },
  GTA: { name: "Gatokae Airport", city: "Gatokae", country: "SB" },
  RIN: { name: "Ringi Cove Airport", city: "Ringi Cove", country: "SB" },
  RBV: { name: "Ramata Airport", city: "Ramata", country: "SB" },
  CEX: { name: "Chena Hot Springs Airport", city: "Chena Hot Springs", country: "US" },
  SOL: { name: "Solomon State Field", city: "Solomon", country: "US" },
  HED: { name: "Herendeen Bay Airport", city: "Herendeen Bay", country: "US" },
  TWE: { name: "Taylor Airport", city: "Taylor", country: "US" },
  LNI: { name: "Lonely Air Station", city: "Lonely", country: "US" },
  CDL: { name: "Candle 2 Airport", city: "Candle", country: "US" },
  BSW: { name: "Boswell Bay Airport", city: "Boswell Bay", country: "US" },
  INU: { name: "Nauru International Airport", city: "Yaren District", country: "NR" },
  AFR: { name: "Afore Airstrip", city: "Afore", country: "PG" },
  ATP: { name: "Aitape Airport", city: "Aitape", country: "PG" },
  AMU: { name: "Amanab Airport", city: "Amanab", country: "PG" },
  ADC: { name: "Andakombe Airport", city: "Andekombe", country: "PG" },
  AIE: { name: "Aiome Airport", city: "Aiome", country: "PG" },
  KPM: { name: "Kompiam Airport", city: "", country: "PG" },
  AUJ: { name: "Ambunti Airport", city: "Ambunti", country: "PG" },
  AWB: { name: "Awaba Airport", city: "Awaba", country: "PG" },
  AYU: { name: "Aiyura Airport", city: "Aiyura Valley", country: "PG" },
  VMU: { name: "Baimuru Airport", city: "Baimuru", country: "PG" },
  BDZ: { name: "Baindoung Airport", city: "", country: "PG" },
  BUA: { name: "Buka Airport", city: "Buka Island", country: "PG" },
  BAA: { name: "Bialla Airport", city: "Bialla", country: "PG" },
  OPU: { name: "Balimo Airport", city: "Balimo", country: "PG" },
  BUL: { name: "Bulolo Airport", city: "Bulolo", country: "PG" },
  CGC: { name: "Cape Gloucester Airport", city: "Cape Gloucester", country: "PG" },
  CMU: { name: "Chimbu Airport", city: "Kundiawa", country: "PG" },
  DAO: { name: "Dahamo Airstrip", city: "Dabo", country: "PG" },
  DBP: { name: "Debepare Airport", city: "Debepare", country: "PG" },
  DER: { name: "Derim Airport", city: "Derim", country: "PG" },
  DAU: { name: "Daru Airport", city: "Daru", country: "PG" },
  XYR: { name: "Edwaki Airport", city: "Yellow River Mission", country: "PG" },
  FNE: { name: "Fane Airport", city: "Fane Mission", country: "PG" },
  FIN: { name: "Finschhafen Airport", city: "Buki", country: "PG" },
  FAQ: { name: "Frieda River Airport", city: "Frieda River", country: "PG" },
  GKA: { name: "Goroka Airport", city: "Goronka", country: "PG" },
  GRL: { name: "Garasa Airport", city: "Au", country: "PG" },
  GAR: { name: "Garaina Airport", city: "Garaina", country: "PG" },
  GUR: { name: "Gurney Airport", city: "Gurney", country: "PG" },
  GAP: { name: "Gusap Airport", city: "Gusap", country: "PG" },
  PNP: { name: "Girua Airport", city: "Popondetta", country: "PG" },
  GMI: { name: "Gasmata Island Airport", city: "Gasmata Island", country: "PG" },
  GVI: { name: "Green River Airport", city: "Green River", country: "PG" },
  HKN: { name: "Kimbe Airport", city: "Hoskins", country: "PG" },
  KIE: { name: "Aropa Airport", city: "Kieta", country: "PG" },
  LSA: { name: "Losuia Airport", city: "Losuia", country: "PG" },
  KBM: { name: "Kabwum", city: "", country: "PG" },
  KDR: { name: "Kandrian Airport", city: "Kandrian", country: "PG" },
  UNG: { name: "Kiunga Airport", city: "Kiunga", country: "PG" },
  KRI: { name: "Kikori Airport", city: "Kikori", country: "PG" },
  KMA: { name: "Kerema Airport", city: "Kerema", country: "PG" },
  KKD: { name: "Kokoda Airport", city: "Kokoda", country: "PG" },
  KZF: { name: "Kaintiba Airport", city: "Kaintiba", country: "PG" },
  KUQ: { name: "Kuri Airport", city: "Kuri", country: "PG" },
  KVG: { name: "Kavieng Airport", city: "Kavieng", country: "PG" },
  KWO: { name: "Kawito Airport", city: "Kawito", country: "PG" },
  LNV: { name: "Londolovit Airport", city: "Londolovit", country: "PG" },
  LMY: { name: "Lake Murray Airport", city: "Lake Murray", country: "PG" },
  LWI: { name: "Lowai Airstrip", city: "Lowai", country: "PG" },
  LMI: { name: "Lumi Airport", city: "Lumi", country: "PG" },
  MYX: { name: "Menyamya Airport", city: "Menyamya", country: "PG" },
  MAG: { name: "Madang Airport", city: "Madang", country: "PG" },
  HGU: { name: "Mount Hagen Kagamuga Airport", city: "Mount Hagen", country: "PG" },
  MXK: { name: "Mindik Airport", city: "Mindik", country: "PG" },
  GUV: { name: "Mougulu Airport", city: "Mougulu", country: "PG" },
  MDU: { name: "Mendi Airport", city: "", country: "PG" },
  MAS: { name: "Momote Airport", city: "", country: "PG" },
  MXH: { name: "Moro Airport", city: "Moro", country: "PG" },
  MIS: { name: "Misima Island Airport", city: "Misima Island", country: "PG" },
  GBF: { name: "Negarbo(Negabo) Airport", city: "Negarbo", country: "PG" },
  MFO: { name: "Manguna Airport", city: "Manguna", country: "PG" },
  UKU: { name: "Nuku Airport", city: "Nuku", country: "PG" },
  LAE: { name: "Lae Nadzab Airport", city: "Nadzab", country: "PG" },
  OGE: { name: "Ogeranang Airport", city: "", country: "PG" },
  OSE: { name: "Omora Airport", city: "Omora", country: "PG" },
  PDI: { name: "Pindiu Airport", city: "Pindiu", country: "PG" },
  POM: {
    name: "Port Moresby Jacksons International Airport",
    city: "Port Moresby",
    country: "PG"
  },
  KRJ: { name: "Karawari Airstrip", city: "", country: "PG" },
  RMN: { name: "Rumginae Airport", city: "", country: "PG" },
  KMR: { name: "Karimui Airport", city: "Karimui", country: "PG" },
  SBE: { name: "Suabi Airport", city: "", country: "PG" },
  NIS: { name: "Simberi Airport", city: "Simberi Island", country: "PG" },
  SIL: { name: "Sila Airport", city: "Sila Mission", country: "PG" },
  SIM: { name: "Simbai Airport", city: "Simbai", country: "PG" },
  TDS: { name: "Sasereme Airport", city: "Sasereme", country: "PG" },
  SKC: { name: "Suki Airport", city: "Suki", country: "PG" },
  TIZ: { name: "Tari Airport", city: "Tari", country: "PG" },
  TBG: { name: "Tabubil Airport", city: "Tabubil", country: "PG" },
  TFM: { name: "Telefomin Airport", city: "Telefomin", country: "PG" },
  TPI: { name: "Tapini Airport", city: "Tapini", country: "PG" },
  TAJ: { name: "Tadji Airport", city: "Aitape", country: "PG" },
  RAB: { name: "Tokua Airport", city: "Tokua", country: "PG" },
  TKW: { name: "Tekin Airport", city: "Tekin", country: "PG" },
  TFI: { name: "Tufi Airport", city: "Tufi", country: "PG" },
  VAI: { name: "Vanimo Airport", city: "", country: "PG" },
  WAO: { name: "Wabo Airport", city: "Wabo", country: "PG" },
  WBM: { name: "Wapenamanda Airport", city: "", country: "PG" },
  AGL: { name: "Wanigela Airport", city: "", country: "PG" },
  WWK: { name: "Wewak International Airport", city: "Wewak", country: "PG" },
  WOA: { name: "Wonenara Airport", city: "Wonenara", country: "PG" },
  WSU: { name: "Wasu Airport", city: "Wasu", country: "PG" },
  WTP: { name: "Woitape Airport", city: "Fatima Mission", country: "PG" },
  WUG: { name: "Wau Airport", city: "Wau", country: "PG" },
  JEG: { name: "Aasiaat Airport", city: "Aasiaat", country: "GL" },
  UAK: { name: "Narsarsuaq Airport", city: "Narsarsuaq", country: "GL" },
  CNP: { name: "Neerlerit Inaat Airport", city: "Neerlerit Inaat", country: "GL" },
  GOH: { name: "Nuuk Airport", city: "Nuuk", country: "GL" },
  JAV: { name: "Ilulissat Airport", city: "Ilulissat", country: "GL" },
  KUS: { name: "Kulusuk Airport", city: "Kulusuk", country: "GL" },
  JSU: { name: "Maniitsoq Airport", city: "Maniitsoq", country: "GL" },
  JFR: { name: "Paamiut Airport", city: "Paamiut", country: "GL" },
  NAQ: { name: "Qaanaaq Airport", city: "Qaanaaq", country: "GL" },
  SFJ: { name: "Kangerlussuaq Airport", city: "Kangerlussuaq", country: "GL" },
  JHS: { name: "Sisimiut Airport", city: "Sisimiut", country: "GL" },
  THU: { name: "Thule Air Base", city: "Thule", country: "GL" },
  JUV: { name: "Upernavik Airport", city: "Upernavik", country: "GL" },
  JQA: { name: "Qaarsut Airport", city: "Uummannaq", country: "GL" },
  AEY: { name: "Akureyri Airport", city: "Akureyri", country: "IS" },
  BIU: { name: "B\xEDldudalur Airport", city: "B\xEDldudalur", country: "IS" },
  BGJ: {
    name: "Borgarfjordur eystri Airport",
    city: "Borgarfjordur eystri",
    country: "IS"
  },
  BJD: { name: "Bakkafjordur Airport", city: "Bakkafjordur", country: "IS" },
  BLO: { name: "Hjaltabakki Airport", city: "Bl\xF6ndu\xF3s", country: "IS" },
  BXV: {
    name: "Brei\xF0dalsv\xEDk Airport",
    city: "Brei\xF0dalsv\xEDk",
    country: "IS"
  },
  DJU: { name: "Dj\xFApivogur Airport", city: "Dj\xFApivogur", country: "IS" },
  EGS: { name: "Egilssta\xF0ir Airport", city: "Egilssta\xF0ir", country: "IS" },
  FAG: {
    name: "Fagurh\xF3lsm\xFDri Airport",
    city: "Fagurh\xF3lsm\xFDri",
    country: "IS"
  },
  GUU: {
    name: "Grundarfj\xF6r\xF0ur Airport",
    city: "Grundarfj\xF6r\xF0ur",
    country: "IS"
  },
  GJR: { name: "Gj\xF6gur Airport", city: "Gj\xF6gur", country: "IS" },
  GRY: { name: "Gr\xEDmsey Airport", city: "Gr\xEDmsey", country: "IS" },
  HVK: { name: "H\xF3lmav\xEDk Airport", city: "H\xF3lmav\xEDk", country: "IS" },
  HFN: { name: "Hornafj\xF6r\xF0u Airport", city: "H\xF6fn", country: "IS" },
  FLI: { name: "Holt Airport", city: "Flateyri", country: "IS" },
  HZK: { name: "H\xFAsav\xEDk Airport", city: "H\xFAsav\xEDk", country: "IS" },
  IFJ: {
    name: "\xCDsafj\xF6r\xF0ur Airport",
    city: "\xCDsafj\xF6r\xF0ur",
    country: "IS"
  },
  KEF: { name: "Keflavik International Airport", city: "Reykjavik", country: "IS" },
  OPA: { name: "K\xF3pasker Airport", city: "K\xF3pasker", country: "IS" },
  SAK: {
    name: "Sau\xF0\xE1rkr\xF3kur Airport",
    city: "Sau\xF0\xE1rkr\xF3kur",
    country: "IS"
  },
  NOR: {
    name: "Nor\xF0fj\xF6r\xF0ur Airport",
    city: "Nor\xF0fj\xF6r\xF0ur",
    country: "IS"
  },
  OFJ: {
    name: "\xD3lafsfj\xF6r\xF0ur Airport",
    city: "\xD3lafsfj\xF6r\xF0ur",
    country: "IS"
  },
  RHA: { name: "Reykholar Airport", city: "Reykholar", country: "IS" },
  OLI: { name: "Rif Airport", city: "Rif", country: "IS" },
  RFN: { name: "Raufarh\xF6fn Airport", city: "Raufarh\xF6fn", country: "IS" },
  RKV: { name: "Reykjavik Airport", city: "Reykjavik", country: "IS" },
  MVA: { name: "M\xFDvatn Airport", city: "Reykjahl\xED\xF0", country: "IS" },
  SIJ: {
    name: "Siglufj\xF6r\xF0ur Airport",
    city: "Siglufj\xF6r\xF0ur",
    country: "IS"
  },
  SYK: { name: "Stykkish\xF3lmur Airport", city: "Stykkish\xF3lmur", country: "IS" },
  TEY: { name: "\xDEingeyri (Thingeyri) Airport", city: "\xDEingeyri", country: "IS" },
  THO: {
    name: "\xDE\xF3rsh\xF6fn (Thorshofn) Airport",
    city: "\xDE\xF3rsh\xF6fn",
    country: "IS"
  },
  VEY: { name: "Vestmannaeyjar Airport", city: "Vestmannaeyjar", country: "IS" },
  VPN: {
    name: "Vopnafj\xF6r\xF0ur Airport",
    city: "Vopnafj\xF6r\xF0ur",
    country: "IS"
  },
  PRN: { name: "Pristina International Airport", city: "Lipjan", country: "XK" },
  SRF: { name: "San Rafael Airport", city: "San Rafael", country: "US" },
  PYS: { name: "Paradise Skypark Airport", city: "Paradise", country: "US" },
  YZZ: { name: "Trail Airport", city: "Trail", country: "CA" },
  YMB: { name: "Merritt Airport", city: "Merritt", country: "CA" },
  YCA: { name: "Courtenay Airpark", city: "Courtenay", country: "CA" },
  CFQ: { name: "Art Sutcliffe Field", city: "Creston", country: "CA" },
  YAA: { name: "Anahim Lake Airport", city: "Anahim Lake", country: "CA" },
  DGF: { name: "Douglas Lake Airport", city: "Douglas Lake", country: "CA" },
  JHL: { name: "Fort MacKay/Albian Aerodrome", city: "Albian Village", country: "CA" },
  DUQ: { name: "Duncan Airport", city: "Duncan", country: "CA" },
  YHS: { name: "Sechelt-Gibsons Airport", city: "Sechelt-Gibsons", country: "CA" },
  YAD: { name: "Moose Lake (Lodge) Airport", city: "Moose Lake", country: "CA" },
  XQU: { name: "Qualicum Beach Airport", city: "Qualicum Beach", country: "CA" },
  ZEL: {
    name: "Bella Bella (Campbell Island) Airport",
    city: "Bella Bella",
    country: "CA"
  },
  YTX: { name: "Telegraph Creek Airport", city: "Telegraph Creek", country: "CA" },
  YPB: { name: "Port Alberni Airport", city: "Port Alberni", country: "CA" },
  YBO: { name: "Bob Quinn Lake Airport", city: "Bob Quinn Lake", country: "CA" },
  YWM: { name: "Williams Harbour Airport", city: "Williams Harbour", country: "CA" },
  YSO: { name: "Postville Airport", city: "Postville", country: "CA" },
  YBI: { name: "Black Tickle Airport", city: "Black Tickle", country: "CA" },
  YHG: { name: "Charlottetown Airport", city: "Charlottetown", country: "CA" },
  YFX: { name: "St. Lewis (Fox Harbour) Airport", city: "St. Lewis", country: "CA" },
  YHA: { name: "Port Hope Simpson Airport", city: "Port Hope Simpson", country: "CA" },
  YRG: { name: "Rigolet Airport", city: "Rigolet", country: "CA" },
  DVK: { name: "Diavik Airport", city: "Diavik", country: "CA" },
  YCK: { name: "Colville Lake Airport", city: "Colville Lake", country: "CA" },
  ZFW: { name: "Fairview Airport", city: "Fairview", country: "CA" },
  YJP: { name: "Hinton / Jasper-Hinton Airport", city: "Hinton", country: "CA" },
  YLE: { name: "Whati Airport", city: "Whati", country: "CA" },
  YGC: { name: "Grande Cache Airport", city: "Grande Cache", country: "CA" },
  YDC: { name: "Drayton Valley Industrial Airport", city: "Drayton Valley", country: "CA" },
  NML: {
    name: "Fort McMurray / Mildred Lake Airport",
    city: "Fort McMurray",
    country: "CA"
  },
  XMP: { name: "Macmillan Pass Airport", city: "Macmillan Pass", country: "CA" },
  DAS: { name: "Great Bear Lake Airport", city: "Great Bear Lake", country: "CA" },
  YFI: { name: "Fort Mackay / Firebag", city: "Suncor Energy Site", country: "CA" },
  YOE: { name: "Donnelly Airport", city: "Donnelly", country: "CA" },
  YDJ: { name: "Hatchet Lake Airport", city: "Hatchet Lake", country: "CA" },
  YDU: { name: "Kasba Lake Airport", city: "Kasba Lake", country: "CA" },
  XCL: { name: "Cluff Lake Airport", city: "Cluff Lake", country: "CA" },
  YKE: { name: "Knee Lake Airport", city: "Knee Lake", country: "CA" },
  SUR: { name: "Summer Beaver Airport", city: "Summer Beaver", country: "CA" },
  YTT: { name: "Tisdale Airport", city: "Tisdale", country: "CA" },
  YAX: { name: "Wapekeka Airport", city: "Angling Lake", country: "CA" },
  WNN: { name: "Wunnumin Lake Airport", city: "Wunnumin Lake", country: "CA" },
  YNO: { name: "North Spirit Lake Airport", city: "North Spirit Lake", country: "CA" },
  YDW: { name: "North of Sixty Airport", city: "Obre Lake", country: "CA" },
  XBE: { name: "Bearskin Lake Airport", city: "Bearskin Lake", country: "CA" },
  YNP: { name: "Natuashish Airport", city: "Natuashish", country: "CA" },
  YPD: { name: "Parry Sound Area Municipal Airport", city: "Parry Sound", country: "CA" },
  XBR: {
    name: "Brockville - Thousand Islands Regional Tackaberry Airport",
    city: "Brockville",
    country: "CA"
  },
  KIF: { name: "Kingfisher Lake Airport", city: "Kingfisher Lake", country: "CA" },
  YKD: { name: "Kincardine Airport", city: "Kincardine", country: "CA" },
  YOG: { name: "Ogoki Post Airport", city: "Ogoki Post", country: "CA" },
  YEB: { name: "Bar River Airport", city: "Bar River", country: "CA" },
  YHP: { name: "Poplar Hill Airport", city: "Poplar Hill", country: "CA" },
  YSA: { name: "Sable Island Landing Strip", city: "Sable Island", country: "CA" },
  YLS: { name: "Lebel-sur-Quevillon Airport", city: "Lebel-sur-Quevillon", country: "CA" },
  YNX: { name: "Snap Lake Airport", city: "Snap Lake", country: "CA" },
  YKU: { name: "Chisasibi Airport", city: "Chisasibi", country: "CA" },
  ZTB: { name: "Tete-a-la-Baleine Airport", city: "Tete-a-la-Baleine", country: "CA" },
  YAU: { name: "Donaldson Airport", city: "Kattiniq", country: "CA" },
  YFG: { name: "Fontanges Airport", city: "Fontanges", country: "CA" },
  ZLT: { name: "La Tabatiere Airport", city: "La Tabatiere", country: "CA" },
  YAB: { name: "Arctic Bay Airport", city: "", country: "CA" },
  YAC: { name: "Cat Lake Airport", city: "Cat Lake", country: "CA" },
  YAR: { name: "La Grande-3 Airport", city: "La Grande-3", country: "CA" },
  YAG: { name: "Fort Frances Municipal Airport", city: "Fort Frances", country: "CA" },
  YAH: { name: "La Grande-4 Airport", city: "La Grande-4", country: "CA" },
  YAL: { name: "Alert Bay Airport", city: "Alert Bay", country: "CA" },
  YAM: { name: "Sault Ste Marie Airport", city: "Sault Sainte Marie", country: "CA" },
  XKS: { name: "Kasabonika Airport", city: "Kasabonika", country: "CA" },
  YKG: { name: "Kangirsuk Airport", city: "Kangirsuk", country: "CA" },
  YAT: { name: "Attawapiskat Airport", city: "Attawapiskat", country: "CA" },
  YAY: { name: "St. Anthony Airport", city: "St. Anthony", country: "CA" },
  YAZ: { name: "Tofino / Long Beach Airport", city: "Tofino", country: "CA" },
  YBA: { name: "Banff Airport", city: "Banff", country: "CA" },
  YBB: { name: "Kugaaruk Airport", city: "Kugaaruk", country: "CA" },
  YBC: { name: "Baie Comeau Airport", city: "Baie-Comeau", country: "CA" },
  QBC: { name: "Bella Coola Airport", city: "Bella Coola", country: "CA" },
  YBE: { name: "Uranium City Airport", city: "Uranium City", country: "CA" },
  YBY: { name: "Bonnyville Airport", city: "Bonnyville", country: "CA" },
  YBG: { name: "CFB Bagotville", city: "Bagotville", country: "CA" },
  YBK: { name: "Baker Lake Airport", city: "Baker Lake", country: "CA" },
  YBL: { name: "Campbell River Airport", city: "Campbell River", country: "CA" },
  XTL: { name: "Tadoule Lake Airport", city: "Tadoule Lake", country: "CA" },
  YBR: { name: "Brandon Municipal Airport", city: "Brandon", country: "CA" },
  YBT: { name: "Brochet Airport", city: "Brochet", country: "CA" },
  YBV: { name: "Berens River Airport", city: "Berens River", country: "CA" },
  YBX: {
    name: "Lourdes de Blanc Sablon Airport",
    city: "Lourdes-De-Blanc-Sablon",
    country: "CA"
  },
  YRF: { name: "Cartwright Airport", city: "Cartwright", country: "CA" },
  YCB: { name: "Cambridge Bay Airport", city: "Cambridge Bay", country: "CA" },
  YCC: { name: "Cornwall Regional Airport", city: "Cornwall", country: "CA" },
  YCD: { name: "Nanaimo Airport", city: "Nanaimo", country: "CA" },
  YCE: { name: "James T. Field Memorial Aerodrome", city: "Centralia", country: "CA" },
  YCG: { name: "Castlegar Airport", city: "Castlegar", country: "CA" },
  YCH: { name: "Miramichi Airport", city: "Miramichi", country: "CA" },
  XCM: { name: "Chatham Kent Airport", city: "Chatham-Kent", country: "CA" },
  YCL: { name: "Charlo Airport", city: "Charlo", country: "CA" },
  YCN: { name: "Cochrane Airport", city: "Cochrane", country: "CA" },
  YCO: { name: "Kugluktuk Airport", city: "Kugluktuk", country: "CA" },
  YCQ: { name: "Chetwynd Airport", city: "Chetwynd", country: "CA" },
  YCR: {
    name: "Cross Lake (Charlie Sinclair Memorial) Airport",
    city: "Cross Lake",
    country: "CA"
  },
  YCS: { name: "Chesterfield Inlet Airport", city: "Chesterfield Inlet", country: "CA" },
  YCT: { name: "Coronation Airport", city: "Coronation", country: "CA" },
  YCW: { name: "Chilliwack Airport", city: "Chilliwack", country: "CA" },
  YCY: { name: "Clyde River Airport", city: "Clyde River", country: "CA" },
  YCZ: {
    name: "Fairmont Hot Springs Airport",
    city: "Fairmont Hot Springs",
    country: "CA"
  },
  YDA: { name: "Dawson City Airport", city: "Dawson City", country: "CA" },
  YDB: { name: "Burwash Airport", city: "Burwash", country: "CA" },
  YDF: { name: "Deer Lake Airport", city: "Deer Lake", country: "CA" },
  YDL: { name: "Dease Lake Airport", city: "Dease Lake", country: "CA" },
  XRR: { name: "Ross River Airport", city: "Ross River", country: "CA" },
  YDN: { name: "Dauphin Barker Airport", city: "Dauphin", country: "CA" },
  YDO: {
    name: "Dolbeau Lac-Saint-Jean Airport",
    city: "Saint-F\xE9licien",
    country: "CA"
  },
  YDP: { name: "Nain Airport", city: "Nain", country: "CA" },
  YDQ: { name: "Dawson Creek Airport", city: "Dawson Creek", country: "CA" },
  YEG: { name: "Edmonton International Airport", city: "Edmonton", country: "CA" },
  YEK: { name: "Arviat Airport", city: "Arviat", country: "CA" },
  YEL: { name: "Elliot Lake Municipal Airport", city: "Elliot Lake", country: "CA" },
  YEM: { name: "Manitoulin East Municipal Airport", city: "Manitowaning", country: "CA" },
  YEN: { name: "Estevan Airport", city: "Estevan", country: "CA" },
  YER: { name: "Fort Severn Airport", city: "Fort Severn", country: "CA" },
  YET: { name: "Edson Airport", city: "Edson", country: "CA" },
  YEU: { name: "Eureka Airport", city: "Eureka", country: "CA" },
  YEV: { name: "Inuvik (Mike Zubko) Airport", city: "Inuvik", country: "CA" },
  YEY: { name: "Amos Magny Airport", city: "Amos", country: "CA" },
  YFA: { name: "Fort Albany Airport", city: "Fort Albany", country: "CA" },
  YFB: { name: "Iqaluit Airport", city: "Iqaluit", country: "CA" },
  YFC: { name: "Fredericton International Airport", city: "Fredericton", country: "CA" },
  YFE: { name: "Forestville Airport", city: "Forestville", country: "CA" },
  YFH: { name: "Fort Hope Airport", city: "Fort Hope", country: "CA" },
  YTM: {
    name: "La Macaza / Mont-Tremblant International Inc Airport",
    city: "Riviere Rouge",
    country: "CA"
  },
  YFO: { name: "Flin Flon Airport", city: "Flin Flon", country: "CA" },
  YFR: { name: "Fort Resolution Airport", city: "Fort Resolution", country: "CA" },
  YFS: { name: "Fort Simpson Airport", city: "Fort Simpson", country: "CA" },
  YMN: { name: "Makkovik Airport", city: "Makkovik", country: "CA" },
  YGB: { name: "Texada Gillies Bay Airport", city: "Texada", country: "CA" },
  YGH: { name: "Fort Good Hope Airport", city: "Fort Good Hope", country: "CA" },
  YGK: { name: "Kingston Airport", city: "Kingston", country: "CA" },
  YGL: { name: "La Grande Riviere Airport", city: "Radisson", country: "CA" },
  YGM: { name: "Gimli Industrial Park Airport", city: "Gimli", country: "CA" },
  YGO: { name: "Gods Lake Narrows Airport", city: "Gods Lake Narrows", country: "CA" },
  YGP: { name: "Gaspe (Michel-Pouliot) Airport", city: "Gaspe", country: "CA" },
  YGQ: { name: "Geraldton Greenstone Regional Airport", city: "Geraldton", country: "CA" },
  YGR: {
    name: "Iles-de-la-Madeleine Airport",
    city: "Iles-de-la-Madeleine",
    country: "CA"
  },
  YGT: { name: "Igloolik Airport", city: "Igloolik", country: "CA" },
  YGV: { name: "Havre St Pierre Airport", city: "Havre St-Pierre", country: "CA" },
  YGW: { name: "Kuujjuarapik Airport", city: "Kuujjuarapik", country: "CA" },
  YGX: { name: "Gillam Airport", city: "Gillam", country: "CA" },
  YGZ: { name: "Grise Fiord Airport", city: "Grise Fiord", country: "CA" },
  YQC: { name: "Quaqtaq Airport", city: "Quaqtaq", country: "CA" },
  YHB: { name: "Hudson Bay Airport", city: "Hudson Bay", country: "CA" },
  CXH: { name: "Vancouver Harbour Airport", city: "Vancouver", country: "CA" },
  YHD: { name: "Dryden Regional Airport", city: "Dryden", country: "CA" },
  YHE: { name: "Hope Airport", city: "Hope", country: "CA" },
  YHF: { name: "Hearst Rene Fontaine Municipal Airport", city: "Hearst", country: "CA" },
  YNS: { name: "Nemiscau Airport", city: "Nemiscau", country: "CA" },
  YHI: { name: "Ulukhaktok Holman Airport", city: "Ulukhaktok", country: "CA" },
  YHK: { name: "Gjoa Haven Airport", city: "Gjoa Haven", country: "CA" },
  YHM: {
    name: "John C. Munro Hamilton International Airport",
    city: "Hamilton",
    country: "CA"
  },
  YHN: { name: "Hornepayne Municipal Airport", city: "Hornepayne", country: "CA" },
  YHO: { name: "Hopedale Airport", city: "Hopedale", country: "CA" },
  YHR: { name: "Chevery Airport", city: "Chevery", country: "CA" },
  YHT: { name: "Haines Junction Airport", city: "Haines Junction", country: "CA" },
  YHU: { name: "Montr\xE9al / St-Hubert Airport", city: "Longueuil", country: "CA" },
  YHY: { name: "Hay River / Merlyn Carter Airport", city: "Hay River", country: "CA" },
  YHZ: {
    name: "Halifax Robert L. Stanfield International Airport",
    city: "Halifax",
    country: "CA"
  },
  YIB: { name: "Atikokan Municipal Airport", city: "Atikokan", country: "CA" },
  YDG: { name: "Digby / Annapolis Regional Airport", city: "Digby", country: "CA" },
  YIF: { name: "St Augustin Airport", city: "St-Augustin", country: "CA" },
  YIK: { name: "Ivujivik Airport", city: "Ivujivik", country: "CA" },
  YIO: { name: "Pond Inlet Airport", city: "Pond Inlet", country: "CA" },
  YIV: { name: "Island Lake Airport", city: "Island Lake", country: "CA" },
  YJA: { name: "Jasper Airport", city: "Jasper", country: "CA" },
  YJF: { name: "Fort Liard Airport", city: "Fort Liard", country: "CA" },
  YJN: { name: "St-Jean Airport", city: "Saint Jean", country: "CA" },
  YJT: { name: "Stephenville Airport", city: "Stephenville", country: "CA" },
  YKA: { name: "Kamloops Airport", city: "Kamloops", country: "CA" },
  YKC: { name: "Collins Bay Airport", city: "Collins Bay", country: "CA" },
  LAK: { name: "Aklavik Airport", city: "Aklavik", country: "CA" },
  YKF: { name: "Kitchener / Waterloo Airport", city: "Waterloo", country: "CA" },
  YWB: { name: "Kangiqsujuaq (Wakeham Bay) Airport", city: "Kangiqsujuaq", country: "CA" },
  YKJ: { name: "Key Lake Airport", city: "Key Lake", country: "CA" },
  YKL: { name: "Schefferville Airport", city: "Schefferville", country: "CA" },
  AKV: { name: "Akulivik Airport", city: "Akulivik", country: "CA" },
  YKQ: { name: "Waskaganish Airport", city: "Waskaganish", country: "CA" },
  YKX: { name: "Kirkland Lake Airport", city: "Kirkland Lake", country: "CA" },
  YKY: { name: "Kindersley Airport", city: "Kindersley", country: "CA" },
  YPJ: { name: "Aupaluk Airport", city: "Aupaluk", country: "CA" },
  YLB: { name: "Lac La Biche Airport", city: "Lac La Biche", country: "CA" },
  YLC: { name: "Kimmirut Airport", city: "Kimmirut", country: "CA" },
  YLD: { name: "Chapleau Airport", city: "Chapleau", country: "CA" },
  YLH: { name: "Lansdowne House Airport", city: "Lansdowne House", country: "CA" },
  YLJ: { name: "Meadow Lake Airport", city: "Meadow Lake", country: "CA" },
  YSG: { name: "Lutselk'e Airport", city: "Lutselk'e", country: "CA" },
  YLL: { name: "Lloydminster Airport", city: "Lloydminster", country: "CA" },
  YLQ: { name: "La Tuque Airport", city: "La Tuque", country: "CA" },
  YLR: { name: "Leaf Rapids Airport", city: "Leaf Rapids", country: "CA" },
  YLK: {
    name: "Barrie-Orillia (Lake Simcoe Regional Airport)",
    city: "Barrie-Orillia",
    country: "CA"
  },
  YLT: { name: "Alert Airport", city: "Alert", country: "CA" },
  XGR: {
    name: "Kangiqsualujjuaq (Georges River) Airport",
    city: "Kangiqsualujjuaq",
    country: "CA"
  },
  YLW: { name: "Kelowna Airport", city: "Kelowna", country: "CA" },
  YMA: { name: "Mayo Airport", city: "Mayo", country: "CA" },
  YME: { name: "Matane Airport", city: "Matane", country: "CA" },
  YMG: { name: "Manitouwadge Airport", city: "Manitouwadge", country: "CA" },
  YMH: { name: "Mary's Harbour Airport", city: "Mary's Harbour", country: "CA" },
  YMJ: {
    name: "Moose Jaw Air Vice Marshal C. M. McEwen Airport",
    city: "Moose Jaw",
    country: "CA"
  },
  YML: { name: "Charlevoix Airport", city: "Charlevoix", country: "CA" },
  YMM: { name: "Fort McMurray Airport", city: "Fort McMurray", country: "CA" },
  YMO: { name: "Moosonee Airport", city: "Moosonee", country: "CA" },
  YMT: { name: "Chapais Airport", city: "Chibougamau", country: "CA" },
  YUD: { name: "Umiujaq Airport", city: "Umiujaq", country: "CA" },
  YMW: { name: "Maniwaki Airport", city: "Maniwaki", country: "CA" },
  YMX: { name: "Montr\xE9al (Mirabel) Airport", city: "Mirabel", country: "CA" },
  YNA: { name: "Natashquan Airport", city: "Natashquan", country: "CA" },
  YNC: { name: "Wemindji Airport", city: "Wemindji", country: "CA" },
  YND: { name: "Ottawa / Gatineau Airport", city: "Gatineau", country: "CA" },
  YNE: { name: "Norway House Airport", city: "Norway House", country: "CA" },
  YNH: { name: "Hudsons Hope Airport", city: "Hudson's Hope", country: "CA" },
  YLY: { name: "Langley Airport", city: "Langley", country: "CA" },
  YNL: {
    name: "Points North Landing Airport",
    city: "Points North Landing",
    country: "CA"
  },
  YNM: { name: "Matagami Airport", city: "Matagami", country: "CA" },
  YNN: { name: "Nejanilini Lake Airport", city: "Nejanilini Lake", country: "CA" },
  HZP: { name: "Fort Mackay / Horizon Airport", city: "Fort Mackay", country: "CA" },
  YOA: { name: "Ekati Airport", city: "Ekati", country: "CA" },
  YOC: { name: "Old Crow Airport", city: "Old Crow", country: "CA" },
  YOD: { name: "CFB Cold Lake", city: "Cold Lake", country: "CA" },
  YOH: { name: "Oxford House Airport", city: "Oxford House", country: "CA" },
  YOJ: { name: "High Level Airport", city: "High Level", country: "CA" },
  YOO: { name: "Oshawa Airport", city: "Oshawa", country: "CA" },
  YOP: { name: "Rainbow Lake Airport", city: "Rainbow Lake", country: "CA" },
  YOS: {
    name: "Owen Sound / Billy Bishop Regional Airport",
    city: "Owen Sound",
    country: "CA"
  },
  YOW: {
    name: "Ottawa / Macdonald-Cartier International Airport",
    city: "Ottawa",
    country: "CA"
  },
  YPA: {
    name: "Prince Albert (Glass Field) Airport",
    city: "Prince Albert",
    country: "CA"
  },
  YPC: {
    name: "Paulatuk (Nora Aliqatchialuk Ruben) Airport",
    city: "Paulatuk",
    country: "CA"
  },
  YPS: { name: "Port Hawkesbury Airport", city: "Port Hawkesbury", country: "CA" },
  YPE: { name: "Peace River Airport", city: "Peace River", country: "CA" },
  YPG: { name: "Southport Airport", city: "Portage", country: "CA" },
  YPH: { name: "Inukjuak Airport", city: "Inukjuak", country: "CA" },
  YPK: { name: "Pitt Meadows Airport", city: "Pitt Meadows", country: "CA" },
  YPL: { name: "Pickle Lake Airport", city: "Pickle Lake", country: "CA" },
  YPM: { name: "Pikangikum Airport", city: "Pikangikum", country: "CA" },
  YPN: { name: "Port Menier Airport", city: "Port-Menier", country: "CA" },
  YPO: { name: "Peawanuck Airport", city: "Peawanuck", country: "CA" },
  YPQ: { name: "Peterborough Airport", city: "Peterborough", country: "CA" },
  YPR: { name: "Prince Rupert Airport", city: "Prince Rupert", country: "CA" },
  YPW: { name: "Powell River Airport", city: "Powell River", country: "CA" },
  YPX: { name: "Puvirnituq Airport", city: "Puvirnituq", country: "CA" },
  YPY: { name: "Fort Chipewyan Airport", city: "Fort Chipewyan", country: "CA" },
  YPZ: { name: "Burns Lake Airport", city: "Burns Lake", country: "CA" },
  YQA: { name: "Muskoka Airport", city: "Muskoka", country: "CA" },
  YQB: {
    name: "Qu\xE9bec City Jean Lesage International Airport",
    city: "Quebec City",
    country: "CA"
  },
  YQD: { name: "The Pas Airport", city: "The Pas", country: "CA" },
  YQF: { name: "Red Deer Regional Airport", city: "Red Deer", country: "CA" },
  YQG: { name: "Windsor Airport", city: "Windsor", country: "CA" },
  YQH: { name: "Watson Lake Airport", city: "Watson Lake", country: "CA" },
  YQI: { name: "Yarmouth Airport", city: "Yarmouth", country: "CA" },
  YQK: { name: "Kenora Airport", city: "Kenora", country: "CA" },
  YQL: { name: "Lethbridge Airport", city: "Lethbridge", country: "CA" },
  YQM: {
    name: "Moncton / Greater Moncton International Airport",
    city: "Moncton",
    country: "CA"
  },
  YQN: { name: "Nakina Airport", city: "Nakina", country: "CA" },
  YQQ: { name: "Comox Airport", city: "Comox", country: "CA" },
  YQR: { name: "Regina International Airport", city: "Regina", country: "CA" },
  YQS: { name: "St Thomas Municipal Airport", city: "St Thomas", country: "CA" },
  YQT: { name: "Thunder Bay Airport", city: "Thunder Bay", country: "CA" },
  YQU: { name: "Grande Prairie Airport", city: "Grande Prairie", country: "CA" },
  YQV: { name: "Yorkton Municipal Airport", city: "Yorkton", country: "CA" },
  YQW: { name: "North Battleford Airport", city: "North Battleford", country: "CA" },
  YQX: { name: "Gander International Airport", city: "Gander", country: "CA" },
  YQY: { name: "Sydney / J.A. Douglas McCurdy Airport", city: "Sydney", country: "CA" },
  YQZ: { name: "Quesnel Airport", city: "Quesnel", country: "CA" },
  YRA: { name: "Rae Lakes Airport", city: "Gameti", country: "CA" },
  YRB: { name: "Resolute Bay Airport", city: "Resolute Bay", country: "CA" },
  YRI: { name: "Riviere-du-Loup Airport", city: "Riviere-du-Loup", country: "CA" },
  YRJ: { name: "Roberval Airport", city: "Roberval", country: "CA" },
  YRL: { name: "Red Lake Airport", city: "Red Lake", country: "CA" },
  YRM: {
    name: "Rocky Mountain House Airport",
    city: "Rocky Mountain House",
    country: "CA"
  },
  YRO: { name: "Ottawa / Rockcliffe Airport", city: "Ottawa", country: "CA" },
  YRQ: { name: "Trois-Rivieres Airport", city: "Trois-Rivieres", country: "CA" },
  YRS: { name: "Red Sucker Lake Airport", city: "Red Sucker Lake", country: "CA" },
  YRT: { name: "Rankin Inlet Airport", city: "Rankin Inlet", country: "CA" },
  YRV: { name: "Revelstoke Airport", city: "Revelstoke", country: "CA" },
  YSB: { name: "Sudbury Airport", city: "Falconbridge", country: "CA" },
  YSC: { name: "Sherbrooke Airport", city: "Sherbrooke", country: "CA" },
  YSE: { name: "Squamish Airport", city: "Squamish", country: "CA" },
  YSF: { name: "Stony Rapids Airport", city: "Stony Rapids", country: "CA" },
  YSH: {
    name: "Smiths Falls-Montague (Russ Beach) Airport",
    city: "Smiths Falls",
    country: "CA"
  },
  YSJ: { name: "Saint John Airport", city: "Saint John", country: "CA" },
  YSK: { name: "Sanikiluaq Airport", city: "Sanikiluaq", country: "CA" },
  YSL: { name: "St Leonard Airport", city: "St Leonard", country: "CA" },
  YSM: { name: "Fort Smith Airport", city: "Fort Smith", country: "CA" },
  YCM: {
    name: "St. Catharines Niagara District Airport",
    city: "Niagara-on-the-lake",
    country: "CA"
  },
  YSP: { name: "Marathon Airport", city: "Marathon", country: "CA" },
  YST: { name: "St. Theresa Point Airport", city: "St. Theresa Point", country: "CA" },
  YSU: { name: "Summerside Airport", city: "Summerside", country: "CA" },
  YSY: {
    name: "Sachs Harbour (David Nasogaluak Jr. Saaryuaq) Airport",
    city: "Sachs Harbour",
    country: "CA"
  },
  YTA: { name: "Pembroke Airport", city: "Pembroke", country: "CA" },
  YTE: { name: "Cape Dorset Airport", city: "Cape Dorset", country: "CA" },
  YTF: { name: "Alma Airport", city: "Alma", country: "CA" },
  YTH: { name: "Thompson Airport", city: "Thompson", country: "CA" },
  YTL: { name: "Big Trout Lake Airport", city: "Big Trout Lake", country: "CA" },
  YTQ: { name: "Tasiujaq Airport", city: "Tasiujaq", country: "CA" },
  YTR: { name: "CFB Trenton", city: "Trenton", country: "CA" },
  YTS: { name: "Timmins Victor M. Power Airport", city: "Timmins", country: "CA" },
  YTZ: { name: "Billy Bishop Toronto City Airport", city: "Toronto", country: "CA" },
  YUB: { name: "Tuktoyaktuk Airport", city: "Tuktoyaktuk", country: "CA" },
  YUL: {
    name: "Montr\xE9al-Pierre Elliott Trudeau International Airport",
    city: "Dorval",
    country: "CA"
  },
  YUT: { name: "Repulse Bay Airport", city: "Repulse Bay", country: "CA" },
  YUX: { name: "Hall Beach Airport", city: "Hall Beach", country: "CA" },
  YUY: { name: "Rouyn-Noranda Airport", city: "McWatters", country: "CA" },
  YVB: { name: "Bonaventure Airport", city: "Bonaventure", country: "CA" },
  YVC: { name: "La Ronge (Barber Field) Airport", city: "La Ronge", country: "CA" },
  YVG: { name: "Vermilion Airport", city: "Vermilion", country: "CA" },
  YVE: { name: "Vernon Airport", city: "Vernon", country: "CA" },
  YVM: { name: "Qikiqtarjuaq Airport", city: "Qikiqtarjuaq", country: "CA" },
  YVO: { name: "Val-d'Or Airport", city: "Bourlamaque", country: "CA" },
  YVP: { name: "Kuujjuaq Airport", city: "Kuujjuaq", country: "CA" },
  YVQ: { name: "Norman Wells Airport", city: "Norman Wells", country: "CA" },
  YVR: { name: "Vancouver International Airport", city: "Richmond", country: "CA" },
  YVT: { name: "Buffalo Narrows Airport", city: "Buffalo Narrows", country: "CA" },
  YVV: { name: "Wiarton Airport", city: "Wiarton", country: "CA" },
  YVZ: { name: "Deer Lake Airport", city: "Deer Lake", country: "CA" },
  YWA: { name: "Petawawa Airport", city: "Petawawa", country: "CA" },
  YFJ: { name: "Wekweeti Airport", city: "Wekweeti", country: "CA" },
  YWG: {
    name: "Winnipeg James Armstrong Richardson International Airport",
    city: "Winnipeg",
    country: "CA"
  },
  YWH: { name: "Victoria Harbour Airport", city: "Victoria", country: "CA" },
  YWJ: { name: "Deline Airport", city: "Deline", country: "CA" },
  YWK: { name: "Wabush Airport", city: "Wabush", country: "CA" },
  YWL: { name: "Williams Lake Airport", city: "Williams Lake", country: "CA" },
  YWP: { name: "Webequie Airport", city: "Webequie", country: "CA" },
  YWY: { name: "Wrigley Airport", city: "Wrigley", country: "CA" },
  YXC: { name: "Cranbrook / Canadian Rockies Airport", city: "Cranbrook", country: "CA" },
  YXE: {
    name: "Saskatoon John G. Diefenbaker International Airport",
    city: "Saskatoon",
    country: "CA"
  },
  YXH: { name: "Medicine Hat Airport", city: "Medicine Hat", country: "CA" },
  YXJ: { name: "Fort St. John Airport", city: "Fort Saint John", country: "CA" },
  YXK: { name: "Rimouski Airport", city: "Rimouski", country: "CA" },
  YXL: { name: "Sioux Lookout Airport", city: "Sioux Lookout", country: "CA" },
  YXN: { name: "Whale Cove Airport", city: "Whale Cove", country: "CA" },
  YXP: { name: "Pangnirtung Airport", city: "Pangnirtung", country: "CA" },
  YXQ: { name: "Beaver Creek Airport", city: "Beaver Creek", country: "CA" },
  YXR: { name: "Earlton (Timiskaming Regional) Airport", city: "Earlton", country: "CA" },
  YXS: { name: "Prince George Airport", city: "Prince George", country: "CA" },
  YXT: { name: "Terrace Airport", city: "Terrace", country: "CA" },
  YXU: { name: "London Airport", city: "London", country: "CA" },
  YXX: { name: "Abbotsford Airport", city: "Abbotsford", country: "CA" },
  YXY: {
    name: "Erik Nielsen Whitehorse International Airport",
    city: "Whitehorse",
    country: "CA"
  },
  YXZ: { name: "Wawa Airport", city: "Wawa", country: "CA" },
  YYB: { name: "North Bay Airport", city: "North Bay", country: "CA" },
  YYC: { name: "Calgary International Airport", city: "Calgary", country: "CA" },
  YYD: { name: "Smithers Airport", city: "Smithers", country: "CA" },
  YYE: { name: "Fort Nelson Airport", city: "Fort Nelson", country: "CA" },
  YYF: { name: "Penticton Airport", city: "Penticton", country: "CA" },
  YYG: { name: "Charlottetown Airport", city: "Charlottetown", country: "CA" },
  YYH: { name: "Taloyoak Airport", city: "Taloyoak", country: "CA" },
  YYJ: { name: "Victoria International Airport", city: "Victoria", country: "CA" },
  YYL: { name: "Lynn Lake Airport", city: "Lynn Lake", country: "CA" },
  YYM: { name: "Cowley Airport", city: "Cowley", country: "CA" },
  YYN: { name: "Swift Current Airport", city: "Swift Current", country: "CA" },
  YYQ: { name: "Churchill Airport", city: "Churchill", country: "CA" },
  YYR: { name: "Goose Bay Airport", city: "Goose Bay", country: "CA" },
  YYT: { name: "St. John's International Airport", city: "Saint John", country: "CA" },
  YYU: { name: "Kapuskasing Airport", city: "Kapuskasing", country: "CA" },
  YYW: { name: "Armstrong Airport", city: "Armstrong", country: "CA" },
  YYY: { name: "Mont-Joli Airport", city: "Mont Jolie", country: "CA" },
  YYZ: {
    name: "Toronto Pearson International Airport",
    city: "Mississauga",
    country: "CA"
  },
  YZE: { name: "Gore Bay Manitoulin Airport", city: "Gore Bay", country: "CA" },
  YZF: { name: "Yellowknife Airport", city: "Yellowknife", country: "CA" },
  YZG: { name: "Salluit Airport", city: "Salluit", country: "CA" },
  YZH: { name: "Slave Lake Airport", city: "Slave Lake", country: "CA" },
  YZP: { name: "Sandspit Airport", city: "Sandspit", country: "CA" },
  YZR: { name: "Chris Hadfield Airport", city: "Sarnia", country: "CA" },
  YZS: { name: "Coral Harbour Airport", city: "Coral Harbour", country: "CA" },
  YZT: { name: "Port Hardy Airport", city: "Port Hardy", country: "CA" },
  YZU: { name: "Whitecourt Airport", city: "Whitecourt", country: "CA" },
  YZV: { name: "Sept-Iles Airport", city: "Sept-Iles", country: "CA" },
  YZW: { name: "Teslin Airport", city: "Teslin", country: "CA" },
  YZX: { name: "CFB Greenwood", city: "Greenwood", country: "CA" },
  ZAC: { name: "York Landing Airport", city: "York Landing", country: "CA" },
  YSN: { name: "Salmon Arm Airport", city: "Salmon Arm", country: "CA" },
  YDT: { name: "Boundary Bay Airport", city: "Ladner", country: "CA" },
  ILF: { name: "Ilford Airport", city: "Ilford", country: "CA" },
  ZBF: { name: "Bathurst Airport", city: "Bathurst", country: "CA" },
  ZBM: { name: "Bromont (Roland Desourdy) Airport", city: "Bromont", country: "CA" },
  KES: { name: "Kelsey Airport", city: "Kelsey", country: "CA" },
  ZEM: { name: "Eastmain River Airport", city: "Eastmain River", country: "CA" },
  ZFA: { name: "Faro Airport", city: "Faro", country: "CA" },
  ZFD: { name: "Fond-Du-Lac Airport", city: "Fond-Du-Lac", country: "CA" },
  XPK: { name: "Pukatawagan Airport", city: "Pukatawagan", country: "CA" },
  ZFM: { name: "Fort Mcpherson Airport", city: "Fort Mcpherson", country: "CA" },
  ZFN: { name: "Tulita Airport", city: "Tulita", country: "CA" },
  ZGF: { name: "Grand Forks Airport", city: "Grand Forks", country: "CA" },
  ZGI: { name: "Gods River Airport", city: "Gods River", country: "CA" },
  ZGR: { name: "Little Grand Rapids Airport", city: "Little Grand Rapids", country: "CA" },
  ZHP: { name: "High Prairie Airport", city: "High Prairie", country: "CA" },
  ZJG: { name: "Jenpeg Airport", city: "Jenpeg", country: "CA" },
  ZJN: { name: "Swan River Airport", city: "Swan River", country: "CA" },
  ZKE: { name: "Kashechewan Airport", city: "Kashechewan", country: "CA" },
  YTD: { name: "Thicket Portage Airport", city: "Thicket Portage", country: "CA" },
  MSA: { name: "Muskrat Dam Airport", city: "Muskrat Dam", country: "CA" },
  ZMH: { name: "South Cariboo Region / 108 Mile Airport", city: "108 Mile", country: "CA" },
  PIW: { name: "Pikwitonei Airport", city: "Pikwitonei", country: "CA" },
  ZMT: { name: "Masset Airport", city: "Masset", country: "CA" },
  XPP: { name: "Poplar River Airport", city: "Poplar River", country: "CA" },
  ZPB: { name: "Sachigo Lake Airport", city: "Sachigo Lake", country: "CA" },
  WPC: { name: "Pincher Creek Airport", city: "Pincher Creek", country: "CA" },
  ZPO: { name: "Pinehouse Lake Airport", city: "Pinehouse Lake", country: "CA" },
  ZRJ: { name: "Round Lake (Weagamow Lake) Airport", city: "Round Lake", country: "CA" },
  ZSJ: { name: "Sandy Lake Airport", city: "Sandy Lake", country: "CA" },
  XSI: { name: "South Indian Lake Airport", city: "South Indian Lake", country: "CA" },
  ZST: { name: "Stewart Airport", city: "Stewart", country: "CA" },
  YDV: { name: "Bloodvein River Airport", city: "Bloodvein River", country: "CA" },
  ZTM: { name: "Shamattawa Airport", city: "Shamattawa", country: "CA" },
  ZUC: { name: "Ignace Municipal Airport", city: "Ignace", country: "CA" },
  ZUM: { name: "Churchill Falls Airport", city: "Churchill Falls", country: "CA" },
  XLB: { name: "Lac Brochet Airport", city: "Lac Brochet", country: "CA" },
  ZWL: { name: "Wollaston Lake Airport", city: "Wollaston Lake", country: "CA" },
  BUJ: { name: "Bou Saada Airport", city: "", country: "DZ" },
  BJA: { name: "Soummam Airport", city: "Bejaia", country: "DZ" },
  ALG: { name: "Houari Boumediene Airport", city: "Algiers", country: "DZ" },
  DJG: { name: "Djanet Inedbirene Airport", city: "Djanet", country: "DZ" },
  VVZ: { name: "Illizi Takhamalt Airport", city: "Illizi", country: "DZ" },
  QSF: { name: "Ain Arnat Airport", city: "Setif", country: "DZ" },
  TMR: {
    name: "Aguenar \u2013 Hadj Bey Akhamok Airport",
    city: "Tamanrasset",
    country: "DZ"
  },
  GJL: { name: "Jijel Ferhat Abbas Airport", city: "Jijel", country: "DZ" },
  MZW: { name: "Mecheria Airport", city: "Mecheria", country: "DZ" },
  AAE: { name: "Annaba Airport", city: "Annabah", country: "DZ" },
  CZL: {
    name: "Mohamed Boudiaf International Airport",
    city: "Constantine",
    country: "DZ"
  },
  TEE: { name: "Cheikh Larbi Tebessi Airport", city: "Tebessi", country: "DZ" },
  BLJ: { name: "Batna Airport", city: "Batna", country: "DZ" },
  HRM: { name: "Hassi R'Mel Airport", city: "", country: "DZ" },
  TID: { name: "Bou Chekif Airport", city: "Tiaret", country: "DZ" },
  TIN: { name: "Tindouf Airport", city: "Tindouf", country: "DZ" },
  CFK: { name: "Chlef Aboubakr Belkaid Airport", city: "Chlef", country: "DZ" },
  TAF: { name: "Tafaraoui Airport", city: "", country: "DZ" },
  TLM: { name: "Zenata \u2013 Messali El Hadj Airport", city: "Tlemcen", country: "DZ" },
  ORN: { name: "Es Senia Airport", city: "Oran", country: "DZ" },
  CBH: { name: "Bechar Boudghene Ben Ali Lotfi Airport", city: "Bechar", country: "DZ" },
  BFW: { name: "Sidi Bel Abbes Airport", city: "", country: "DZ" },
  MUW: { name: "Ghriss Airport", city: "", country: "DZ" },
  EBH: { name: "El Bayadh Airport", city: "El Bayadh", country: "DZ" },
  INF: { name: "In Guezzam Airport", city: "In Guezzam", country: "DZ" },
  BMW: { name: "Bordj Badji Mokhtar Airport", city: "Bordj Badji Mokhtar", country: "DZ" },
  AZR: { name: "Touat Cheikh Sidi Mohamed Belkebir Airport", city: "", country: "DZ" },
  BSK: { name: "Biskra Airport", city: "Biskra", country: "DZ" },
  ELG: { name: "El Golea Airport", city: "", country: "DZ" },
  GHA: { name: "Noumerat - Moufdi Zakaria Airport", city: "Ghardaia", country: "DZ" },
  HME: { name: "Oued Irara Airport", city: "Hassi Messaoud", country: "DZ" },
  INZ: { name: "In Salah Airport", city: "In Salah", country: "DZ" },
  TGR: { name: "Touggourt Sidi Madhi Airport", city: "Touggourt", country: "DZ" },
  LOO: { name: "Laghouat Airport", city: "Laghouat", country: "DZ" },
  ELU: { name: "Guemar Airport", city: "Guemar", country: "DZ" },
  TMX: { name: "Timimoun Airport", city: "Timimoun", country: "DZ" },
  OGX: { name: "Ain el Beida Airport", city: "Ouargla", country: "DZ" },
  IAM: { name: "In Amenas Airport", city: "Amenas", country: "DZ" },
  COO: { name: "Cadjehoun Airport", city: "Cotonou", country: "BJ" },
  DJA: { name: "Djougou Airport", city: "Djougou", country: "BJ" },
  KDC: { name: "Kandi Airport", city: "Kandi", country: "BJ" },
  NAE: { name: "Natitingou Airport", city: "Natitingou", country: "BJ" },
  PKO: { name: "Parakou Airport", city: "Parakou", country: "BJ" },
  SVF: { name: "Save Airport", city: "Save", country: "BJ" },
  XKY: { name: "Kaya Airport", city: "Kaya", country: "BF" },
  OUG: { name: "Ouahigouya Airport", city: "Ouahigouya", country: "BF" },
  XDJ: { name: "Djibo Airport", city: "Djibo", country: "BF" },
  XLU: { name: "Leo Airport", city: "Leo", country: "BF" },
  PUP: { name: "Po Airport", city: "Po", country: "BF" },
  XBO: { name: "Boulsa Airport", city: "Boulsa", country: "BF" },
  XBG: { name: "Bogande Airport", city: "Bogande", country: "BF" },
  DIP: { name: "Diapaga Airport", city: "Diapaga", country: "BF" },
  DOR: { name: "Dori Airport", city: "Dori", country: "BF" },
  FNG: { name: "Fada N'gourma Airport", city: "Fada N'gourma", country: "BF" },
  XGG: { name: "Gorom-Gorom Airport", city: "Gorom-Gorom", country: "BF" },
  XKA: { name: "Kantchari Airport", city: "Kantchari", country: "BF" },
  TMQ: { name: "Tambao Airport", city: "Tambao", country: "BF" },
  XPA: { name: "Pama Airport", city: "Pama", country: "BF" },
  ARL: { name: "Arly Airport", city: "Arly", country: "BF" },
  XSE: { name: "Sebba Airport", city: "Sebba", country: "BF" },
  TEG: { name: "Tenkodogo Airport", city: "Tenkodogo", country: "BF" },
  XZA: { name: "Zabre Airport", city: "Zabre", country: "BF" },
  OUA: { name: "Ouagadougou Airport", city: "Ouagadougou", country: "BF" },
  BNR: { name: "Banfora Airport", city: "Banfora", country: "BF" },
  DGU: { name: "Dedougou Airport", city: "Dedougou", country: "BF" },
  XGA: { name: "Gaoua Airport", city: "Gaoua", country: "BF" },
  XNU: { name: "Nouna Airport", city: "Nouna", country: "BF" },
  BOY: { name: "Bobo Dioulasso Airport", city: "Bobo Dioulasso", country: "BF" },
  TUQ: { name: "Tougan Airport", city: "Tougan", country: "BF" },
  XDE: { name: "Diebougou Airport", city: "Diebougou", country: "BF" },
  XAR: { name: "Aribinda Airport", city: "Aribinda", country: "BF" },
  ACC: { name: "Kotoka International Airport", city: "Accra", country: "GH" },
  TML: { name: "Tamale Airport", city: "Tamale", country: "GH" },
  WZA: { name: "Wa Airport", city: "Wa", country: "GH" },
  KMS: { name: "Kumasi Airport", city: "Kumasi", country: "GH" },
  NYI: { name: "Sunyani Airport", city: "Sunyani", country: "GH" },
  TKD: { name: "Takoradi Airport", city: "Sekondi-Takoradi", country: "GH" },
  ABO: { name: "Aboisso Airport", city: "Aboisso", country: "CI" },
  ABJ: { name: "Port Bouet Airport", city: "Abidjan", country: "CI" },
  OGO: { name: "Abengourou Airport", city: "Abengourou", country: "CI" },
  BXI: { name: "Boundiali Airport", city: "Boundiali", country: "CI" },
  BYK: { name: "Bouake Airport", city: "", country: "CI" },
  BQO: { name: "Bouna Airport", city: "Bouna", country: "CI" },
  BDK: { name: "Soko Airport", city: "Bondoukou", country: "CI" },
  DIM: { name: "Dimbokro Airport", city: "Dimbokro", country: "CI" },
  DJO: { name: "Daloa Airport", city: "", country: "CI" },
  FEK: { name: "Ferkessedougou Airport", city: "Ferkessedougou", country: "CI" },
  GGN: { name: "Gagnoa Airport", city: "Gagnoa", country: "CI" },
  GGO: { name: "Guiglo Airport", city: "Guiglo", country: "CI" },
  BBV: { name: "Nero-Mer Airport", city: "Grand-Bereby", country: "CI" },
  HGO: { name: "Korhogo Airport", city: "", country: "CI" },
  MJC: { name: "Man Airport", city: "", country: "CI" },
  KEO: { name: "Odienne Airport", city: "Odienne", country: "CI" },
  OFI: { name: "Ouango Fitini Airport", city: "Ouango Fitini", country: "CI" },
  SEO: { name: "Seguela Airport", city: "Seguela", country: "CI" },
  SPY: { name: "San Pedro Airport", city: "", country: "CI" },
  ZSS: { name: "Sassandra Airport", city: "Sassandra", country: "CI" },
  TXU: { name: "Tabou Airport", city: "Tabou", country: "CI" },
  ASK: { name: "Yamoussoukro Airport", city: "Yamoussoukro", country: "CI" },
  ABV: { name: "Nnamdi Azikiwe International Airport", city: "Abuja", country: "NG" },
  ABB: { name: "Asaba International Airport", city: "Asaba", country: "NG" },
  BNI: { name: "Benin Airport", city: "Benin", country: "NG" },
  CBQ: { name: "Margaret Ekpo International Airport", city: "Calabar", country: "NG" },
  ENU: { name: "Akanu Ibiam International Airport", city: "Enegu", country: "NG" },
  GMO: { name: "Gombe Lawanti International Airport", city: "Gombe", country: "NG" },
  IBA: { name: "Ibadan Airport", city: "Ibadan", country: "NG" },
  ILR: { name: "Ilorin International Airport", city: "Ilorin", country: "NG" },
  QOW: { name: "Sam Mbakwe International Airport", city: "Owerri", country: "NG" },
  JOS: { name: "Yakubu Gowon Airport", city: "Jos", country: "NG" },
  KAD: { name: "Kaduna Airport", city: "Kaduna", country: "NG" },
  KAN: { name: "Mallam Aminu International Airport", city: "Kano", country: "NG" },
  MIU: { name: "Maiduguri International Airport", city: "Maiduguri", country: "NG" },
  MDI: { name: "Makurdi Airport", city: "Makurdi", country: "NG" },
  LOS: { name: "Murtala Muhammed International Airport", city: "Lagos", country: "NG" },
  MXJ: { name: "Minna Airport", city: "Minna", country: "NG" },
  PHC: {
    name: "Port Harcourt International Airport",
    city: "Port Harcourt",
    country: "NG"
  },
  SKO: { name: "Sadiq Abubakar III International Airport", city: "Sokoto", country: "NG" },
  YOL: { name: "Yola Airport", city: "Yola", country: "NG" },
  ZAR: { name: "Zaria Airport", city: "Zaria", country: "NG" },
  MFQ: { name: "Maradi Airport", city: "Maradi", country: "NE" },
  NIM: { name: "Diori Hamani International Airport", city: "Niamey", country: "NE" },
  THZ: { name: "Tahoua Airport", city: "Tahoua", country: "NE" },
  AJY: { name: "Mano Dayak International Airport", city: "Agadez", country: "NE" },
  RLT: { name: "Arlit Airport", city: "Arlit", country: "NE" },
  ZND: { name: "Zinder Airport", city: "Zinder", country: "NE" },
  TBJ: { name: "Tabarka 7 Novembre Airport", city: "Tabarka", country: "TN" },
  MIR: {
    name: "Monastir Habib Bourguiba International Airport",
    city: "Monastir",
    country: "TN"
  },
  NBE: { name: "Enfidha-Hammamet International Airport", city: "Enfidha", country: "TN" },
  TUN: { name: "Tunis Carthage International Airport", city: "Tunis", country: "TN" },
  GAF: { name: "Gafsa Ksar International Airport", city: "Gafsa", country: "TN" },
  GAE: { name: "Gabes Matmata International Airport", city: "Gab\xE8s", country: "TN" },
  DJE: { name: "Djerba Zarzis International Airport", city: "Djerba", country: "TN" },
  EBM: { name: "El Borma Airport", city: "El Borma", country: "TN" },
  SFA: { name: "Sfax Thyna International Airport", city: "Sfax", country: "TN" },
  TOE: { name: "Tozeur Nefta International Airport", city: "Tozeur", country: "TN" },
  LRL: { name: "Niamtougou International Airport", city: "Niamtougou", country: "TG" },
  LFW: { name: "Lome-Tokoin Airport", city: "Lome", country: "TG" },
  ANR: { name: "Antwerp International Airport (Deurne)", city: "Antwerp", country: "BE" },
  BRU: { name: "Brussels Airport", city: "Brussels", country: "BE" },
  CRL: { name: "Brussels South Charleroi Airport", city: "Brussels", country: "BE" },
  KJK: { name: "Wevelgem Airport", city: "Wevelgem", country: "BE" },
  LGG: { name: "Liege Airport", city: "Liege", country: "BE" },
  OST: { name: "Ostend-Bruges International Airport", city: "Ostend", country: "BE" },
  OBL: { name: "Oostmalle Air Base", city: "Zoersel", country: "BE" },
  AOC: { name: "Altenburg-Nobitz Airport", city: "Altenburg", country: "DE" },
  HDF: { name: "Heringsdorf Airport", city: "Heringsdorf", country: "DE" },
  ZHZ: { name: "Halle-Oppin Airport", city: "Oppin", country: "DE" },
  IES: { name: "Riesa-Gohlis Airport", city: "Riesa", country: "DE" },
  REB: { name: "Rechlin-Larz Airport", city: "Larz", country: "DE" },
  CSO: { name: "Cochstedt Airport", city: "Magdeburg", country: "DE" },
  BBH: { name: "Barth Airport", city: "", country: "DE" },
  CBU: { name: "Cottbus-Drewitz Airport", city: "Cottbus", country: "DE" },
  GTI: { name: "Rugen Airport", city: "Rugen", country: "DE" },
  KOQ: { name: "Kothen Airport", city: "Kothen", country: "DE" },
  PEF: { name: "Peenemunde Airport", city: "Peenemunde", country: "DE" },
  BER: { name: "Berlin Brandenburg Airport", city: "Berlin", country: "DE" },
  DRS: { name: "Dresden Airport", city: "Dresden", country: "DE" },
  ERF: { name: "Erfurt Airport", city: "Erfurt", country: "DE" },
  FRA: {
    name: "Frankfurt am Main International Airport",
    city: "Frankfurt am Main",
    country: "DE"
  },
  FMO: { name: "Munster Osnabruck Airport", city: "Munster", country: "DE" },
  HAM: { name: "Hamburg Airport", city: "Hamburg", country: "DE" },
  CGN: { name: "Cologne Bonn Airport", city: "Cologne", country: "DE" },
  DUS: { name: "Dusseldorf International Airport", city: "Dusseldorf", country: "DE" },
  MUC: { name: "Munich International Airport", city: "Munich", country: "DE" },
  NUE: { name: "Nuremberg Airport", city: "Nuremberg", country: "DE" },
  LEJ: { name: "Leipzig Halle Airport", city: "Leipzig", country: "DE" },
  SCN: { name: "Saarbrucken Airport", city: "Saarbrucken", country: "DE" },
  STR: { name: "Stuttgart Airport", city: "Stuttgart", country: "DE" },
  TXL: { name: "Berlin-Tegel International Airport", city: "Berlin", country: "DE" },
  HAJ: { name: "Hannover Airport", city: "Hannover", country: "DE" },
  BRE: { name: "Bremen Airport", city: "Bremen", country: "DE" },
  HHN: { name: "Frankfurt-Hahn Airport", city: "Hahn", country: "DE" },
  MHG: { name: "Mannheim-City Airport", city: "Mannheim", country: "DE" },
  EIB: { name: "Eisenach-Kindel Airport", city: "Eisenach", country: "DE" },
  SGE: { name: "Siegerland Airport", city: "", country: "DE" },
  KZG: { name: "Kitzingen Airport", city: "Kitzingen", country: "DE" },
  XFW: { name: "Hamburg-Finkenwerder Airport", city: "Hamburg", country: "DE" },
  KEL: { name: "Kiel-Holtenau Airport", city: "Kiel", country: "DE" },
  LBC: { name: "Lubeck Blankensee Airport", city: "Lubeck", country: "DE" },
  EUM: { name: "Neumunster Airport", city: "Neumunster", country: "DE" },
  FMM: { name: "Memmingen Allgau Airport", city: "Memmingen", country: "DE" },
  AAH: { name: "Aachen-Merzbruck Airport", city: "Aachen", country: "DE" },
  BNJ: { name: "Bonn-Hangelar Airport", city: "Bonn", country: "DE" },
  ESS: { name: "Essen Mulheim Airport", city: "", country: "DE" },
  BFE: { name: "Bielefeld Airport", city: "Bielefeld", country: "DE" },
  MGL: { name: "Monchengladbach Airport", city: "Monchengladbach", country: "DE" },
  PAD: { name: "Paderborn Lippstadt Airport", city: "Paderborn", country: "DE" },
  NRN: { name: "Niederrhein Airport", city: "Weeze", country: "DE" },
  DTM: { name: "Dortmund Airport", city: "Dortmund", country: "DE" },
  AGB: { name: "Augsburg Airport", city: "Augsburg", country: "DE" },
  OBF: { name: "Oberpfaffenhofen Airport", city: "", country: "DE" },
  RBM: { name: "Straubing Airport", city: "Straubing", country: "DE" },
  FDH: { name: "Friedrichshafen Airport", city: "Friedrichshafen", country: "DE" },
  SZW: { name: "Schwerin Parchim Airport", city: "", country: "DE" },
  QCB: { name: "Bamberg-Breitenau Airfield", city: "Bamberg", country: "DE" },
  BYU: { name: "Bayreuth Airport", city: "Bayreuth", country: "DE" },
  URD: { name: "Burg Feuerstein Airport", city: "Ebermannstadt", country: "DE" },
  HOQ: { name: "Hof-Plauen Airport", city: "Hof", country: "DE" },
  BBJ: { name: "Bitburg Airport", city: "Bitburg", country: "DE" },
  FKB: { name: "Karlsruhe Baden-Baden Airport", city: "Baden-Baden", country: "DE" },
  LHA: { name: "Lahr Airport", city: "", country: "DE" },
  BWE: { name: "Braunschweig Wolfsburg Airport", city: "", country: "DE" },
  KSF: { name: "Kassel-Calden Airport", city: "Kassel", country: "DE" },
  EME: { name: "Emden Airport", city: "Emden", country: "DE" },
  AGE: { name: "Wangerooge Airport", city: "Wangerooge", country: "DE" },
  WVN: { name: "Wilhelmshaven-Mariensiel Airport", city: "Wilhelmshaven", country: "DE" },
  JUI: { name: "Juist Airport", city: "Juist", country: "DE" },
  LGO: { name: "Langeoog Airport", city: "Langeoog", country: "DE" },
  BMK: { name: "Borkum Airport", city: "Borkum", country: "DE" },
  NOD: { name: "Norden-Norddeich Airport", city: "Norddeich", country: "DE" },
  VAC: { name: "Varrelbusch Airport", city: "Cloppenburg", country: "DE" },
  NRD: { name: "Norderney Airport", city: "Norderney", country: "DE" },
  BMR: { name: "Baltrum Airport", city: "Baltrum", country: "DE" },
  HEI: { name: "Heide-Busum Airport", city: "Busum", country: "DE" },
  FLF: { name: "Flensburg-Sch\xE4ferhaus Airport", city: "Flensburg", country: "DE" },
  HGL: { name: "Helgoland-Dune Airport", city: "Helgoland", country: "DE" },
  QHU: { name: "Husum-Schwesing Airport", city: "Husum", country: "DE" },
  PSH: { name: "St. Peter-Ording Airport", city: "Sankt Peter-Ording", country: "DE" },
  GWT: { name: "Westerland Sylt Airport", city: "Westerland", country: "DE" },
  OHR: { name: "Wyk auf Fohr Airport", city: "Wyk auf Fohr", country: "DE" },
  KDL: { name: "Kardla Airport", city: "Kardla", country: "EE" },
  URE: { name: "Kuressaare Airport", city: "Kuressaare", country: "EE" },
  EPU: { name: "Parnu Airport", city: "Parnu", country: "EE" },
  TLL: { name: "Tallinn Airport", city: "Tallinn", country: "EE" },
  TAY: { name: "Tartu Airport", city: "Tartu", country: "EE" },
  ENF: { name: "Enontekio Airport", city: "Enontekio", country: "FI" },
  KEV: { name: "Halli Airport", city: "Halli / Kuorevesi", country: "FI" },
  HEL: { name: "Helsinki Vantaa Airport", city: "Helsinki", country: "FI" },
  HYV: { name: "Hyvinkaa Airport", city: "", country: "FI" },
  KTQ: { name: "Kitee Airport", city: "", country: "FI" },
  IVL: { name: "Ivalo Airport", city: "Ivalo", country: "FI" },
  JOE: { name: "Joensuu Airport", city: "Joensuu / Liperi", country: "FI" },
  JYV: { name: "Jyvaskyla Airport", city: "Jyvaskylan Maalaiskunta", country: "FI" },
  KAU: { name: "Kauhava Airport", city: "Kauhava", country: "FI" },
  KEM: { name: "Kemi-Tornio Airport", city: "Kemi / Tornio", country: "FI" },
  KAJ: { name: "Kajaani Airport", city: "Kajaani", country: "FI" },
  KHJ: { name: "Kauhajoki Airport", city: "", country: "FI" },
  KOK: { name: "Kruunupyy Airport", city: "Kokkola / Kruunupyy", country: "FI" },
  KAO: { name: "Kuusamo Airport", city: "Kuusamo", country: "FI" },
  KTT: { name: "Kittila Airport", city: "Kittila", country: "FI" },
  KUO: { name: "Kuopio Airport", city: "Kuopio / Siilinjarvi", country: "FI" },
  LPP: { name: "Lappeenranta Airport", city: "Lappeenranta", country: "FI" },
  MHQ: { name: "Mariehamn Airport", city: "", country: "FI" },
  MIK: { name: "Mikkeli Airport", city: "Mikkeli", country: "FI" },
  OUL: { name: "Oulu Airport", city: "Oulu / Oulunsalo", country: "FI" },
  POR: { name: "Pori Airport", city: "Pori", country: "FI" },
  RVN: { name: "Rovaniemi Airport", city: "Rovaniemi", country: "FI" },
  SVL: { name: "Savonlinna Airport", city: "Savonlinna", country: "FI" },
  SJY: { name: "Seinajoki Airport", city: "Seinajoki / Ilmajoki", country: "FI" },
  SOT: { name: "Sodankyla Airport", city: "Sodankyla", country: "FI" },
  TMP: { name: "Tampere-Pirkkala Airport", city: "Tampere / Pirkkala", country: "FI" },
  TKU: { name: "Turku Airport", city: "Turku", country: "FI" },
  UTI: { name: "Utti Air Base", city: "Utti / Valkeala", country: "FI" },
  VAA: { name: "Vaasa Airport", city: "Vaasa", country: "FI" },
  VRK: { name: "Varkaus Airport", city: "Varkaus / Joroinen", country: "FI" },
  YLI: { name: "Ylivieska Airport", city: "", country: "FI" },
  LHB: { name: "Bruntingthorpe Airport", city: "Bruntingthorpe", country: "GB" },
  BFS: { name: "Belfast International Airport", city: "Belfast", country: "GB" },
  ENK: { name: "St Angelo Airport", city: "Enniskillen", country: "GB" },
  BHD: { name: "George Best Belfast City Airport", city: "Belfast", country: "GB" },
  LDY: { name: "City of Derry Airport", city: "Derry", country: "GB" },
  BHX: { name: "Birmingham International Airport", city: "Birmingham", country: "GB" },
  CVT: { name: "Coventry Airport", city: "Coventry", country: "GB" },
  GLO: { name: "Gloucestershire Airport", city: "Staverton", country: "GB" },
  ORM: { name: "Sywell Aerodrome", city: "Northampton", country: "GB" },
  NQT: { name: "Nottingham Airport", city: "Nottingham", country: "GB" },
  GBA: { name: "Kemble Airport", city: "Kemble", country: "GB" },
  MAN: { name: "Manchester Airport", city: "Manchester", country: "GB" },
  WFD: { name: "Manchester Woodford Airport", city: "Manchester", country: "GB" },
  UPV: { name: "Upavon Aerodrome", city: "Upavon", country: "GB" },
  YEO: { name: "RNAS Yeovilton", city: "Yeovil", country: "GB" },
  CAL: { name: "Campbeltown Airport", city: "Campbeltown", country: "GB" },
  EOI: { name: "Eday Airport", city: "Eday", country: "GB" },
  FIE: { name: "Fair Isle Airport", city: "Fair Isle", country: "GB" },
  WHS: { name: "Whalsay Airport", city: "Whalsay", country: "GB" },
  COL: { name: "Coll Airport", city: "Coll Island", country: "GB" },
  NRL: { name: "North Ronaldsay Airport", city: "North Ronaldsay", country: "GB" },
  OBN: { name: "Oban Airport", city: "North Connel", country: "GB" },
  PPW: { name: "Papa Westray Airport", city: "Papa Westray", country: "GB" },
  SOY: { name: "Stronsay Airport", city: "Stronsay", country: "GB" },
  NDY: { name: "Sanday Airport", city: "Sanday", country: "GB" },
  LWK: { name: "Lerwick / Tingwall Airport", city: "Lerwick", country: "GB" },
  WRY: { name: "Westray Airport", city: "Westray", country: "GB" },
  CSA: { name: "Colonsay Airstrip", city: "Colonsay", country: "GB" },
  HAW: { name: "Haverfordwest Airport", city: "Haverfordwest", country: "GB" },
  CWL: { name: "Cardiff International Airport", city: "Cardiff", country: "GB" },
  SWS: { name: "Swansea Airport", city: "Swansea", country: "GB" },
  BRS: { name: "Bristol International Airport", city: "Bristol", country: "GB" },
  LPL: { name: "Liverpool John Lennon Airport", city: "Liverpool", country: "GB" },
  LTN: { name: "London Luton Airport", city: "London", country: "GB" },
  LEQ: { name: "Land's End Airport", city: "Land's End", country: "GB" },
  ISC: { name: "St. Mary's Airport", city: "St. Mary's", country: "GB" },
  BOH: { name: "Bournemouth Airport", city: "Bournemouth", country: "GB" },
  SOU: { name: "Southampton Airport", city: "Southampton", country: "GB" },
  BBP: { name: "Bembridge Airport", city: "Bembridge", country: "GB" },
  NQY: { name: "Newquay Cornwall Airport", city: "Newquay", country: "GB" },
  QUG: { name: "Chichester/Goodwood Airport", city: "Chichester", country: "GB" },
  ACI: { name: "Alderney Airport", city: "Saint Anne", country: "GG" },
  GCI: { name: "Guernsey Airport", city: "Saint Peter Port", country: "GG" },
  JER: { name: "Jersey Airport", city: "Saint Helier", country: "JE" },
  ESH: { name: "Shoreham Airport", city: "Brighton", country: "GB" },
  BQH: { name: "London Biggin Hill Airport", city: "London", country: "GB" },
  LGW: { name: "London Gatwick Airport", city: "London", country: "GB" },
  LCY: { name: "London City Airport", city: "London", country: "GB" },
  FAB: { name: "Farnborough Airport", city: "Farnborough", country: "GB" },
  BBS: { name: "Blackbushe Airport", city: "Yateley", country: "GB" },
  LHR: { name: "London Heathrow Airport", city: "London", country: "GB" },
  SEN: { name: "Southend Airport", city: "Southend", country: "GB" },
  LYX: { name: "Lydd Airport", city: "Lydd", country: "GB" },
  CAX: { name: "Carlisle Airport", city: "Carlisle", country: "GB" },
  BLK: { name: "Blackpool International Airport", city: "Blackpool", country: "GB" },
  HUY: { name: "Humberside Airport", city: "Grimsby", country: "GB" },
  BWF: { name: "Barrow Walney Island Airport", city: "Barrow-in-Furness", country: "GB" },
  LBA: { name: "Leeds Bradford Airport", city: "Leeds", country: "GB" },
  WRT: { name: "Warton Airport", city: "Warton", country: "GB" },
  CEG: { name: "Hawarden Airport", city: "Hawarden", country: "GB" },
  IOM: { name: "Isle of Man Airport", city: "Castletown", country: "IM" },
  NCL: { name: "Newcastle Airport", city: "Newcastle", country: "GB" },
  MME: { name: "Durham Tees Valley Airport", city: "Durham", country: "GB" },
  EMA: { name: "East Midlands Airport", city: "Nottingham", country: "GB" },
  KOI: { name: "Kirkwall Airport", city: "Orkney Islands", country: "GB" },
  LSI: { name: "Sumburgh Airport", city: "Lerwick", country: "GB" },
  WIC: { name: "Wick Airport", city: "Wick", country: "GB" },
  ABZ: { name: "Aberdeen Dyce Airport", city: "Aberdeen", country: "GB" },
  INV: { name: "Inverness Airport", city: "Inverness", country: "GB" },
  GLA: { name: "Glasgow International Airport", city: "Glasgow", country: "GB" },
  EDI: { name: "Edinburgh Airport", city: "Edinburgh", country: "GB" },
  ILY: { name: "Islay Airport", city: "Port Ellen", country: "GB" },
  PIK: { name: "Glasgow Prestwick Airport", city: "Glasgow", country: "GB" },
  BEB: { name: "Benbecula Airport", city: "Balivanich", country: "GB" },
  DND: { name: "Dundee Airport", city: "Dundee", country: "GB" },
  SYY: { name: "Stornoway Airport", city: "Stornoway", country: "GB" },
  BRR: { name: "Barra Airport", city: "Eoligarry", country: "GB" },
  PSL: { name: "Perth/Scone Airport", city: "Perth", country: "GB" },
  TRE: { name: "Tiree Airport", city: "Balemartine", country: "GB" },
  UNT: { name: "Unst Airport", city: "Shetland Islands", country: "GB" },
  BOL: { name: "Ballykelly Airport", city: "Ballykelly", country: "GB" },
  FSS: { name: "RAF Kinloss", city: "Kinloss", country: "GB" },
  ADX: { name: "RAF Leuchars", city: "St. Andrews", country: "GB" },
  LMO: { name: "RAF Lossiemouth", city: "Lossiemouth", country: "GB" },
  CBG: { name: "Cambridge Airport", city: "Cambridge", country: "GB" },
  NWI: { name: "Norwich International Airport", city: "Norwich", country: "GB" },
  STN: { name: "London Stansted Airport", city: "London", country: "GB" },
  HYC: { name: "Wycombe Air Park", city: "High Wycombe", country: "GB" },
  EXT: { name: "Exeter International Airport", city: "Exeter", country: "GB" },
  OXF: { name: "Oxford (Kidlington) Airport", city: "Kidlington", country: "GB" },
  RCS: { name: "Rochester Airport", city: "Rochester", country: "GB" },
  BEX: { name: "RAF Benson", city: "Benson", country: "GB" },
  LKZ: { name: "RAF Lakenheath", city: "Lakenheath", country: "GB" },
  MHZ: { name: "RAF Mildenhall", city: "Mildenhall", country: "GB" },
  QUY: { name: "RAF Wyton", city: "St. Ives", country: "GB" },
  FFD: { name: "RAF Fairford", city: "Fairford", country: "GB" },
  BZZ: { name: "RAF Brize Norton", city: "Brize Norton", country: "GB" },
  ODH: { name: "RAF Odiham", city: "Odiham", country: "GB" },
  NHT: { name: "RAF Northolt", city: "London", country: "GB" },
  QCY: { name: "RAF Coningsby", city: "Coningsby", country: "GB" },
  BEQ: { name: "RAF Honington", city: "Thetford", country: "GB" },
  OKH: { name: "RAF Cottesmore", city: "Cottesmore", country: "GB" },
  SQZ: { name: "RAF Scampton", city: "Scampton", country: "GB" },
  HRT: { name: "RAF Linton-On-Ouse", city: "Linton-On-Ouse", country: "GB" },
  WTN: { name: "RAF Waddington", city: "Waddington", country: "GB" },
  KNF: { name: "RAF Marham", city: "Marham", country: "GB" },
  MPN: { name: "Mount Pleasant Airport", city: "Mount Pleasant", country: "FK" },
  AMS: { name: "Amsterdam Airport Schiphol", city: "Amsterdam", country: "NL" },
  MST: { name: "Maastricht Aachen Airport", city: "Maastricht", country: "NL" },
  EIN: { name: "Eindhoven Airport", city: "Eindhoven", country: "NL" },
  GRQ: { name: "Eelde Airport", city: "Groningen", country: "NL" },
  GLZ: { name: "Gilze Rijen Air Base", city: "Breda", country: "NL" },
  DHR: { name: "De Kooy Airport", city: "Den Helder", country: "NL" },
  LEY: { name: "Lelystad Airport", city: "Lelystad", country: "NL" },
  LWR: { name: "Leeuwarden Air Base", city: "Leeuwarden", country: "NL" },
  RTM: { name: "Rotterdam Airport", city: "Rotterdam", country: "NL" },
  ENS: { name: "Twenthe Airport", city: "Enschede", country: "NL" },
  UDE: { name: "Volkel Air Base", city: "Uden", country: "NL" },
  WOE: { name: "Woensdrecht Air Base", city: "Bergen Op Zoom", country: "NL" },
  BYT: { name: "Bantry Aerodrome", city: "Bantry", country: "IE" },
  BLY: { name: "Belmullet Aerodrome", city: "Belmullet", country: "IE" },
  NNR: { name: "Connemara Regional Airport", city: "Inverin", country: "IE" },
  ORK: { name: "Cork Airport", city: "Cork", country: "IE" },
  CFN: { name: "Donegal Airport", city: "Donegal", country: "IE" },
  DUB: { name: "Dublin Airport", city: "Dublin", country: "IE" },
  IOR: { name: "Inishmore Aerodrome", city: "Inis Mor", country: "IE" },
  INQ: { name: "Inisheer Aerodrome", city: "Inis Oirr", country: "IE" },
  KKY: { name: "Kilkenny Airport", city: "Kilkenny", country: "IE" },
  NOC: { name: "Ireland West Knock Airport", city: "Charleston", country: "IE" },
  KIR: { name: "Kerry Airport", city: "Killarney", country: "IE" },
  IIA: { name: "Inishmaan Aerodrome", city: "Inis Meain", country: "IE" },
  SNN: { name: "Shannon Airport", city: "Shannon", country: "IE" },
  SXL: { name: "Sligo Airport", city: "Sligo", country: "IE" },
  WAT: { name: "Waterford Airport", city: "Waterford", country: "IE" },
  AAR: { name: "Aarhus Airport", city: "Aarhus", country: "DK" },
  BLL: { name: "Billund Airport", city: "Billund", country: "DK" },
  CPH: { name: "Copenhagen Kastrup Airport", city: "Copenhagen", country: "DK" },
  EBJ: { name: "Esbjerg Airport", city: "Esbjerg", country: "DK" },
  KRP: { name: "Karup Airport", city: "Karup", country: "DK" },
  BYR: { name: "Laeso Airport", city: "Laeso", country: "DK" },
  MRW: {
    name: "Lolland Falster Maribo Airport",
    city: "Lolland Falster / Maribo",
    country: "DK"
  },
  ODE: { name: "Odense Airport", city: "Odense", country: "DK" },
  RKE: { name: "Copenhagen Roskilde Airport", city: "Copenhagen", country: "DK" },
  RNN: { name: "Bornholm Airport", city: "Ronne", country: "DK" },
  SGD: { name: "Sonderborg Airport", city: "Sonderborg", country: "DK" },
  CNL: { name: "Sindal Airport", city: "Sindal", country: "DK" },
  SKS: { name: "Vojens Skrydstrup Airport", city: "Vojens", country: "DK" },
  SQW: { name: "Skive Airport", city: "Skive", country: "DK" },
  TED: { name: "Thisted Airport", city: "Thisted", country: "DK" },
  FAE: { name: "Vagar Airport", city: "Vagar", country: "FO" },
  STA: { name: "Stauning Airport", city: "Skjern / Ringkobing", country: "DK" },
  AAL: { name: "Aalborg Airport", city: "Aalborg", country: "DK" },
  LUX: {
    name: "Luxembourg-Findel International Airport",
    city: "Luxembourg",
    country: "LU"
  },
  AES: { name: "\xC5lesund Airport", city: "\xC5lesund", country: "NO" },
  ANX: { name: "And\xF8ya Airport", city: "Andenes", country: "NO" },
  ALF: { name: "Alta Airport", city: "Alta", country: "NO" },
  FDE: { name: "Bringeland Airport", city: "F\xF8rde", country: "NO" },
  BNN: { name: "Br\xF8nn\xF8ysund Airport", city: "Br\xF8nn\xF8y", country: "NO" },
  BOO: { name: "Bod\xF8 Airport", city: "Bod\xF8", country: "NO" },
  BGO: { name: "Bergen Airport Flesland", city: "Bergen", country: "NO" },
  BJF: { name: "B\xE5tsfjord Airport", city: "B\xE5tsfjord", country: "NO" },
  BVG: { name: "Berlev\xE5g Airport", city: "Berlev\xE5g", country: "NO" },
  KRS: { name: "Kristiansand Airport", city: "Kjevik", country: "NO" },
  BDU: { name: "Bardufoss Airport", city: "Malselv", country: "NO" },
  EVE: { name: "Harstad/Narvik Airport Evenes", city: "Evenes", country: "NO" },
  FRO: { name: "Flor\xF8 Airport", city: "Flor\xF8", country: "NO" },
  OSL: { name: "Oslo Gardermoen Airport", city: "Oslo", country: "NO" },
  HMR: { name: "Stafsberg Airport", city: "Hamar", country: "NO" },
  HAU: { name: "Haugesund Airport", city: "Karmoy", country: "NO" },
  HFT: { name: "Hammerfest Airport", city: "Hammerfest", country: "NO" },
  HAA: { name: "Hasvik Airport", city: "Hasvik", country: "NO" },
  HVG: { name: "Valan Airport", city: "Honningsv\xE5g", country: "NO" },
  KSU: { name: "Kristiansund Airport Kvernberget", city: "Kvernberget", country: "NO" },
  GLL: { name: "Gol Airport", city: "Klanten", country: "NO" },
  KKN: { name: "Kirkenes Airport Hoybuktmoen", city: "Kirkenes", country: "NO" },
  LKN: { name: "Leknes Airport", city: "Leknes", country: "NO" },
  MEH: { name: "Mehamn Airport", city: "Mehamn", country: "NO" },
  MOL: { name: "Molde Airport", city: "Aro", country: "NO" },
  MJF: { name: "Mosj\xF8en Airport Kjaerstad", city: "", country: "NO" },
  LKL: { name: "Banak Airport", city: "Lakselv", country: "NO" },
  OSY: { name: "Namsos Hoknesora Airport", city: "Namsos", country: "NO" },
  NTB: { name: "Notodden Airport", city: "", country: "NO" },
  OLA: { name: "\xD8rland Airport", city: "\xD8rland", country: "NO" },
  HOV: { name: "\xD8rsta-Volda Airport Hovden", city: "\xD8rsta", country: "NO" },
  MQN: { name: "Mo i Rana Airport Rossvoll", city: "Mo i Rana", country: "NO" },
  RVK: { name: "R\xF8rvik Airport Ryum", city: "Rorvik", country: "NO" },
  RRS: { name: "R\xF8ros Airport", city: "Roros", country: "NO" },
  RET: { name: "R\xF8st Airport", city: "", country: "NO" },
  LYR: { name: "Svalbard Airport Longyear", city: "Longyearbyen", country: "NO" },
  SDN: { name: "Sandane Airport Anda", city: "Sandane", country: "NO" },
  SOG: { name: "Sogndal Airport", city: "Sogndal", country: "NO" },
  SVJ: { name: "Svolv\xE6r Helle Airport", city: "Svolv\xE6r", country: "NO" },
  SKN: { name: "Stokmarknes Skagen Airport", city: "Hadsel", country: "NO" },
  SRP: { name: "Stord Airport", city: "Leirvik", country: "NO" },
  SOJ: { name: "S\xF8rkjosen Airport", city: "S\xF8rkjosen", country: "NO" },
  VAW: { name: "Vard\xF8 Airport Svartnes", city: "Vard\xF8", country: "NO" },
  SSJ: { name: "Sandnessjoen Airport Stokka", city: "Alstahaug", country: "NO" },
  TOS: { name: "Troms\xF8 Airport", city: "Troms\xF8", country: "NO" },
  TRF: { name: "Sandefjord Airport Torp", city: "Torp", country: "NO" },
  TRD: { name: "Trondheim Airport Vaernes", city: "Trondheim", country: "NO" },
  VDS: { name: "Vads\xF8 Airport", city: "Vads\xF8", country: "NO" },
  SVG: { name: "Stavanger Airport Sola", city: "Stavanger", country: "NO" },
  BZG: {
    name: "Bydgoszcz Ignacy Jan Paderewski Airport",
    city: "Bydgoszcz",
    country: "PL"
  },
  GDN: {
    name: "Gda\u0144sk Lech Wa\u0142\u0119sa Airport",
    city: "Gda\u0144sk",
    country: "PL"
  },
  KRK: {
    name: "John Paul II International Airport Krak\xF3w-Balice Airport",
    city: "Krak\xF3w",
    country: "PL"
  },
  KTW: { name: "Katowice International Airport", city: "Katowice", country: "PL" },
  LUZ: { name: "Lublin Airport", city: "Lublin", country: "PL" },
  LCJ: {
    name: "\u0141\xF3d\u017A W\u0142adys\u0142aw Reymont Airport",
    city: "\u0141\xF3d\u017A",
    country: "PL"
  },
  WMI: { name: "Warsaw Modlin Airport", city: "Warsaw", country: "PL" },
  POZ: { name: "Pozna\u0144-\u0141awica Airport", city: "Pozna\u0144", country: "PL" },
  RDO: { name: "Radom-Sadkow Airport", city: "", country: "PL" },
  RZE: { name: "Rzeszow-Jasionka Airport", city: "Rzeszow", country: "PL" },
  SZZ: {
    name: "Szczecin-Goleniow Solidarno\u015B\u0107 Airport",
    city: "Goleniow",
    country: "PL"
  },
  SZY: { name: "Olsztyn-Mazury Airport", city: "Szymany", country: "PL" },
  WAW: { name: "Warsaw Chopin Airport", city: "Warsaw", country: "PL" },
  WRO: { name: "Copernicus Wroc\u0142aw Airport", city: "Wroc\u0142aw", country: "PL" },
  IEG: { name: "Zielona G\xF3ra-Babimost Airport", city: "Babimost", country: "PL" },
  RNB: { name: "Ronneby Airport", city: "", country: "SE" },
  GOT: { name: "Gothenburg-Landvetter Airport", city: "Gothenburg", country: "SE" },
  JKG: { name: "Jonkoping Airport", city: "Jonkoping", country: "SE" },
  LDK: { name: "Lidkoping-Hovby Airport", city: "Lidkoping", country: "SE" },
  GSE: { name: "Gothenburg City Airport", city: "Gothenburg", country: "SE" },
  KVB: { name: "Skovde Airport", city: "Skovde", country: "SE" },
  THN: { name: "Trollhattan-Vanersborg Airport", city: "Trollhattan", country: "SE" },
  KSK: { name: "Karlskoga Airport", city: "", country: "SE" },
  MXX: { name: "Mora Airport", city: "", country: "SE" },
  NYO: { name: "Stockholm Skavsta Airport", city: "Stockholm / Nykoping", country: "SE" },
  SCR: {
    name: "S\xE4len/Scandinavian Mountains Airport",
    city: "R\xF6rb\xE4cksn\xE4s",
    country: "SE"
  },
  KID: { name: "Kristianstad Airport", city: "Kristianstad", country: "SE" },
  OSK: { name: "Oskarshamn Airport", city: "", country: "SE" },
  KLR: { name: "Kalmar Airport", city: "", country: "SE" },
  MMX: { name: "Malmo Sturup Airport", city: "Malmo", country: "SE" },
  HAD: { name: "Halmstad Airport", city: "Halmstad", country: "SE" },
  VXO: { name: "Vaxjo Kronoberg Airport", city: "Vaxjo", country: "SE" },
  EVG: { name: "Sveg Airport", city: "", country: "SE" },
  GEV: { name: "Gallivare Airport", city: "Gallivare", country: "SE" },
  KRF: { name: "Kramfors Solleftea Airport", city: "Kramfors / Solleftea", country: "SE" },
  LYC: { name: "Lycksele Airport", city: "", country: "SE" },
  SDL: { name: "Sundsvall-Harnosand Airport", city: "Sundsvall/ Harnosand", country: "SE" },
  OER: { name: "Ornskoldsvik Airport", city: "Ornskoldsvik", country: "SE" },
  KRN: { name: "Kiruna Airport", city: "", country: "SE" },
  SFT: { name: "Skelleftea Airport", city: "Skelleftea", country: "SE" },
  UME: { name: "Umea Airport", city: "Umea", country: "SE" },
  VHM: { name: "Vilhelmina Airport", city: "", country: "SE" },
  AJR: { name: "Arvidsjaur Airport", city: "Arvidsjaur", country: "SE" },
  SOO: { name: "Soderhamn Airport", city: "Soderhamn", country: "SE" },
  OSD: { name: "Ostersund Airport", city: "Ostersund", country: "SE" },
  ORB: { name: "Orebro Airport", city: "Orebro", country: "SE" },
  HFS: { name: "Hagfors Airport", city: "", country: "SE" },
  KSD: { name: "Karlstad Airport", city: "Karlstad", country: "SE" },
  VST: { name: "Stockholm Vasteras Airport", city: "Stockholm / Vasteras", country: "SE" },
  LLA: { name: "Lulea Airport", city: "Lulea", country: "SE" },
  ARN: { name: "Stockholm-Arlanda Airport", city: "Stockholm", country: "SE" },
  BMA: { name: "Stockholm-Bromma Airport", city: "Stockholm", country: "SE" },
  BLE: { name: "Borlange Airport", city: "", country: "SE" },
  HLF: { name: "Hultsfred Airport", city: "", country: "SE" },
  GVX: { name: "Gavle Sandviken Airport", city: "Gavle / Sandviken", country: "SE" },
  LPI: { name: "Linkoping SAAB Airport", city: "Linkoping", country: "SE" },
  NRK: { name: "Norrkoping Airport", city: "Norrkoping", country: "SE" },
  TYF: { name: "Torsby Airport", city: "", country: "SE" },
  EKT: { name: "Eskilstuna Airport", city: "Eskilstuna", country: "SE" },
  VBY: { name: "Visby Airport", city: "Visby", country: "SE" },
  VVK: { name: "Vastervik Airport", city: "Vastervik", country: "SE" },
  AGH: { name: "Angelholm-Helsingborg Airport", city: "Angelholm", country: "SE" },
  SQO: { name: "Storuman Airport", city: "", country: "SE" },
  IDB: { name: "Idre Airport", city: "Idre", country: "SE" },
  PJA: { name: "Pajala Airport", city: "", country: "SE" },
  HMV: { name: "Hemavan Airport", city: "", country: "SE" },
  SPM: { name: "Spangdahlem Air Base", city: "Trier", country: "DE" },
  RMS: { name: "Ramstein Air Base", city: "Ramstein", country: "DE" },
  GHF: { name: "Giebelstadt Army Air Field", city: "", country: "DE" },
  FRZ: { name: "Fritzlar Airport", city: "Fritzlar", country: "DE" },
  ILH: { name: "Illesheim Air Base", city: "", country: "DE" },
  GKE: { name: "Geilenkirchen Airport", city: "", country: "DE" },
  QCN: { name: "Hohn Airport", city: "Hohn", country: "DE" },
  RLG: { name: "Rostock-Laage Airport", city: "Rostock", country: "DE" },
  WBG: { name: "Schleswig Airport", city: "", country: "DE" },
  FNB: { name: "Neubrandenburg Airport", city: "", country: "DE" },
  WIE: { name: "Wiesbaden Army Airfield", city: "Wiesbaden", country: "DE" },
  FEL: { name: "Furstenfeldbruck Airport", city: "Furstenfeldbruck", country: "DE" },
  IGS: { name: "Ingolstadt Manching Airport", city: "Manching", country: "DE" },
  GUT: { name: "Gutersloh Airport", city: "Gutersloh", country: "DE" },
  LPX: { name: "Liepaja International Airport", city: "Liepaja", country: "LV" },
  RIX: { name: "Riga International Airport", city: "Riga", country: "LV" },
  VNT: { name: "Ventspils International Airport", city: "Ventspils", country: "LV" },
  KUN: { name: "Kaunas International Airport", city: "Kaunas", country: "LT" },
  PLQ: { name: "Palanga International Airport", city: "Palanga", country: "LT" },
  SQQ: { name: "Siauliai International Airport", city: "Siauliai", country: "LT" },
  HLJ: { name: "Barysiai Airport", city: "Barysiai", country: "LT" },
  VNO: { name: "Vilnius International Airport", city: "Vilnius", country: "LT" },
  ALJ: { name: "Alexander Bay Airport", city: "Alexander Bay", country: "ZA" },
  AGZ: { name: "Aggeneys Airport", city: "Aggeneys", country: "ZA" },
  ADY: { name: "Alldays Airport", city: "Alldays", country: "ZA" },
  BIY: { name: "Bisho Airport", city: "Bisho", country: "ZA" },
  BFN: { name: "J B M Hertzog International Airport", city: "Bloemfontain", country: "ZA" },
  ASS: { name: "Arathusa Safari Lodge Airport", city: "Arathusa", country: "ZA" },
  CDO: { name: "Cradock Airport", city: "Cradock", country: "ZA" },
  CPT: { name: "Cape Town International Airport", city: "Cape Town", country: "ZA" },
  DUK: { name: "Mubatuba Airport", city: "Mubatuba", country: "ZA" },
  PZL: { name: "Zulu Inyala Airport", city: "Phinda", country: "ZA" },
  ELS: { name: "Ben Schoeman Airport", city: "East London", country: "ZA" },
  EMG: { name: "Empangeni Airport", city: "Empangeni", country: "ZA" },
  ELL: { name: "Ellisras Matimba Airport", city: "Ellisras", country: "ZA" },
  FCB: { name: "Ficksburg Sentraoes Airport", city: "Ficksburg", country: "ZA" },
  GCJ: { name: "Grand Central Airport", city: "Midrand", country: "ZA" },
  GRJ: { name: "George Airport", city: "George", country: "ZA" },
  GIY: { name: "Giyani Airport", city: "Giyani", country: "ZA" },
  QRA: { name: "Rand Airport", city: "Johannesburg", country: "ZA" },
  HLW: { name: "Hluhluwe Airport", city: "Hluhluwe", country: "ZA" },
  HRS: { name: "Harrismith Airport", city: "Harrismith", country: "ZA" },
  HDS: { name: "Hoedspruit Air Force Base Airport", city: "Hoedspruit", country: "ZA" },
  KXE: { name: "P C Pelser Airport", city: "Klerksdorp", country: "ZA" },
  KIM: { name: "Kimberley Airport", city: "Kimberley", country: "ZA" },
  MQP: {
    name: "Kruger Mpumalanga International Airport",
    city: "Mpumalanga",
    country: "ZA"
  },
  KOF: { name: "Komatipoort Airport", city: "Komatipoort", country: "ZA" },
  KMH: { name: "Johan Pienaar Airport", city: "Kuruman", country: "ZA" },
  KLZ: { name: "Kleinsee Airport", city: "Kleinsee", country: "ZA" },
  HLA: { name: "Lanseria Airport", city: "Johannesburg", country: "ZA" },
  LMR: { name: "Lime Acres Finsch Mine Airport", city: "Lime Acres", country: "ZA" },
  LDZ: { name: "Londolozi Airport", city: "Londolozi", country: "ZA" },
  DUR: { name: "King Shaka International Airport", city: "Durban", country: "ZA" },
  LCD: { name: "Louis Trichardt Airport", city: "Louis Trichardt", country: "ZA" },
  SDB: { name: "Langebaanweg Airport", city: "Langebaanweg", country: "ZA" },
  LAY: { name: "Ladysmith Airport", city: "Ladysmith", country: "ZA" },
  AAM: { name: "Malamala Airport", city: "Malamala", country: "ZA" },
  MGH: { name: "Margate Airport", city: "Margate", country: "ZA" },
  MEZ: { name: "Musina(Messina) Airport", city: "Musina", country: "ZA" },
  MBD: { name: "Mmabatho International Airport", city: "Mafeking", country: "ZA" },
  LLE: { name: "Riverside Airport", city: "Malelane", country: "ZA" },
  MZY: { name: "Mossel Bay Airport", city: "Mossel Bay", country: "ZA" },
  MZQ: { name: "Mkuze Airport", city: "Mkuze", country: "ZA" },
  NCS: { name: "Newcastle Airport", city: "Newcastle", country: "ZA" },
  NGL: { name: "Ngala Airport", city: "Ngala", country: "ZA" },
  NLP: { name: "Nelspruit Airport", city: "Nelspruit", country: "ZA" },
  OVG: { name: "Overberg Airport", city: "Overberg", country: "ZA" },
  OUH: { name: "Oudtshoorn Airport", city: "Oudtshoorn", country: "ZA" },
  JNB: { name: "O. R. Tambo International Airport", city: "Johannesburg", country: "ZA" },
  AFD: { name: "Port Alfred Airport", city: "Port Alfred", country: "ZA" },
  PLZ: { name: "Port Elizabeth Airport", city: "Port Elizabeth", country: "ZA" },
  PHW: { name: "Hendrik Van Eck Airport", city: "Phalaborwa", country: "ZA" },
  JOH: { name: "Port St Johns Airport", city: "Port St Johns", country: "ZA" },
  PRK: { name: "Prieska Airport", city: "Prieska", country: "ZA" },
  PZB: { name: "Pietermaritzburg Airport", city: "Pietermaritzburg", country: "ZA" },
  NTY: { name: "Pilanesberg International Airport", city: "Pilanesberg", country: "ZA" },
  PTG: { name: "Polokwane International Airport", city: "Potgietersrus", country: "ZA" },
  PCF: { name: "Potchefstroom Airport", city: "Potchefstroom", country: "ZA" },
  UTW: { name: "Queenstown Airport", city: "Queenstown", country: "ZA" },
  RCB: { name: "Richards Bay Airport", city: "Richards Bay", country: "ZA" },
  RVO: { name: "Reivilo Airport", city: "Reivilo", country: "ZA" },
  ROD: { name: "Robertson Airport", city: "Robertson", country: "ZA" },
  SBU: { name: "Springbok Airport", city: "Springbok", country: "ZA" },
  ZEC: { name: "Secunda Airport", city: "Secunda", country: "ZA" },
  GSS: { name: "Sabi Sabi Airport", city: "Belfast", country: "ZA" },
  SIS: { name: "Sishen Airport", city: "Sishen", country: "ZA" },
  SZK: { name: "Skukuza Airport", city: "Skukuza", country: "ZA" },
  TDT: { name: "Tanda Tula Airport", city: "Welverdiend", country: "ZA" },
  THY: { name: "Thohoyandou Airport", city: "Thohoyandou", country: "ZA" },
  TCU: { name: "Thaba Nchu Tar Airport", city: "Homeward", country: "ZA" },
  LTA: { name: "Tzaneen Airport", city: "Tzaneen", country: "ZA" },
  ULD: { name: "Prince Mangosuthu Buthelezi Airport", city: "Ulundi", country: "ZA" },
  UTN: { name: "Pierre Van Ryneveld Airport", city: "Upington", country: "ZA" },
  ULX: { name: "Ulusaba Airport", city: "Ulusaba", country: "ZA" },
  UTT: { name: "K. D. Matanzima Airport", city: "Mthatha", country: "ZA" },
  VRU: { name: "Vryburg Airport", city: "Vyrburg", country: "ZA" },
  VIR: { name: "Virginia Airport", city: "Durban", country: "ZA" },
  VRE: { name: "Vredendal Airport", city: "Vredendal", country: "ZA" },
  VYD: { name: "Vryheid Airport", city: "Vryheid", country: "ZA" },
  PRY: { name: "Wonderboom Airport", city: "Pretoria", country: "ZA" },
  WKF: { name: "Waterkloof Air Force Base", city: "Pretoria", country: "ZA" },
  WEL: { name: "Welkom Airport", city: "Welkom", country: "ZA" },
  FRW: { name: "Francistown Airport", city: "Francistown", country: "BW" },
  GNZ: { name: "Ghanzi Airport", city: "Ghanzi", country: "BW" },
  JWA: { name: "Jwaneng Airport", city: "", country: "BW" },
  BBK: { name: "Kasane Airport", city: "Kasane", country: "BW" },
  KHW: { name: "Khwai River Lodge Airport", city: "Khwai River Lodge", country: "BW" },
  MUB: { name: "Maun Airport", city: "Maun", country: "BW" },
  ORP: { name: "Orapa Airport", city: "", country: "BW" },
  GBE: { name: "Sir Seretse Khama International Airport", city: "Gaborone", country: "BW" },
  SXN: { name: "Sua Pan Airport", city: "", country: "BW" },
  PKW: { name: "Selebi Phikwe Airport", city: "", country: "BW" },
  SVT: { name: "Savuti Airport", city: "Savuti", country: "BW" },
  SWX: { name: "Shakawe Airport", city: "Shakawe", country: "BW" },
  TLD: { name: "Limpopo Valley Airport", city: "Tuli Lodge", country: "BW" },
  TBY: { name: "Tshabong Airport", city: "Tshabong", country: "BW" },
  BZV: { name: "Maya-Maya Airport", city: "Brazzaville", country: "CG" },
  DJM: { name: "Djambala Airport", city: "Djambala", country: "CG" },
  KNJ: { name: "Kindamba Airport", city: "Kindamba", country: "CG" },
  LCO: { name: "Lague Airport", city: "Lague", country: "CG" },
  MUY: { name: "Mouyondzi Airport", city: "Mouyondzi", country: "CG" },
  SIB: { name: "Sibiti Airport", city: "Sibiti", country: "CG" },
  NKY: { name: "Yokangassi Airport", city: "Nkayi", country: "CG" },
  ANJ: { name: "Zanaga Airport", city: "Zanaga", country: "CG" },
  MSX: { name: "Mossendjo Airport", city: "Mossendjo", country: "CG" },
  BOE: { name: "Boundji Airport", city: "Boundji", country: "CG" },
  EWO: { name: "Ewo Airport", city: "Ewo", country: "CG" },
  GMM: { name: "Gamboma Airport", city: "Gamboma", country: "CG" },
  ION: { name: "Impfondo Airport", city: "Impfondo", country: "CG" },
  KEE: { name: "Kelle Airport", city: "Kelle", country: "CG" },
  MKJ: { name: "Makoua Airport", city: "Makoua", country: "CG" },
  FTX: { name: "Owando Airport", city: "Owando", country: "CG" },
  SOE: { name: "Souanke Airport", city: "Souanke", country: "CG" },
  BTB: { name: "Betou Airport", city: "Betou", country: "CG" },
  OUE: { name: "Ouesso Airport", city: "", country: "CG" },
  KMK: { name: "Makabana Airport", city: "Makabana", country: "CG" },
  DIS: { name: "Ngot Nzoungou Airport", city: "Dolisie", country: "CG" },
  PNR: { name: "Pointe Noire Airport", city: "Pointe Noire", country: "CG" },
  MTS: { name: "Matsapha Airport", city: "Manzini", country: "SZ" },
  SHO: { name: "King Mswati III Intl", city: "Manzini", country: "SZ" },
  CRF: { name: "Carnot Airport", city: "Carnot", country: "CF" },
  BGF: { name: "Bangui M'Poko International Airport", city: "Bangui", country: "CF" },
  BGU: { name: "Bangassou Airport", city: "Bangassou", country: "CF" },
  IRO: { name: "Birao Airport", city: "Birao", country: "CF" },
  BBY: { name: "Bambari Airport", city: "Bambari", country: "CF" },
  NDL: { name: "N'Dele Airport", city: "N'Dele", country: "CF" },
  BOP: { name: "Bouar Airport", city: "Bouar", country: "CF" },
  BIV: { name: "Bria Airport", city: "Bria", country: "CF" },
  BSN: { name: "Bossangoa Airport", city: "Bossangoa", country: "CF" },
  BBT: { name: "Berberati Airport", city: "Berberati", country: "CF" },
  ODA: { name: "Ouadda Airport", city: "Ouadda", country: "CF" },
  AIG: { name: "Yalinga Airport", city: "Yalinga", country: "CF" },
  IMO: { name: "Zemio Airport", city: "Zemio", country: "CF" },
  MKI: { name: "M'Boki Airport", city: "Mboki", country: "CF" },
  BTG: { name: "Batangafo Airport", city: "Batangafo", country: "CF" },
  GDI: { name: "Gordil Airport", city: "Melle", country: "CF" },
  BMF: { name: "Bakouma Airport", city: "Bakouma", country: "CF" },
  ODJ: { name: "Ouanda Djalle Airport", city: "Ouanda Djalle", country: "CF" },
  RFA: { name: "Rafai Airport", city: "Rafai", country: "CF" },
  BCF: { name: "Bouca Airport", city: "Bouca", country: "CF" },
  BOZ: { name: "Bozoum Airport", city: "Bozoum", country: "CF" },
  BSG: { name: "Bata Airport", city: "", country: "GQ" },
  SSG: { name: "Malabo Airport", city: "Malabo", country: "GQ" },
  ASI: { name: "RAF Ascension Island", city: "Ascension Island", country: "SH" },
  HLE: { name: "Saint Helena Airport", city: "Saint Helena", country: "SH" },
  AHG: { name: "Agalega Island Airstrip", city: "Vingt Cinq", country: "MU" },
  MRU: {
    name: "Sir Seewoosagur Ramgoolam International Airport",
    city: "Port Louis",
    country: "MU"
  },
  RRG: { name: "Sir Charles Gaetan Duval Airport", city: "Port Mathurin", country: "MU" },
  NKS: { name: "Nkongsamba Airport", city: "Nkongsamba", country: "CM" },
  KBI: { name: "Kribi Airport", city: "Kribi", country: "CM" },
  TKC: { name: "Tiko Airport", city: "Tiko", country: "CM" },
  DLA: { name: "Douala International Airport", city: "Douala", country: "CM" },
  MMF: { name: "Mamfe Airport", city: "Mamfe", country: "CM" },
  BLC: { name: "Bali Airport", city: "Bali", country: "CM" },
  KLE: { name: "Kaele Airport", city: "Kaele", country: "CM" },
  OUR: { name: "Batouri Airport", city: "Batouri", country: "CM" },
  GXX: { name: "Yagoua Airport", city: "Yagoua", country: "CM" },
  MVR: { name: "Salak Airport", city: "Maroua", country: "CM" },
  FOM: { name: "Foumban Nkounja Airport", city: "Foumban", country: "CM" },
  NGE: { name: "N'Gaoundere Airport", city: "N'Gaoundere", country: "CM" },
  BTA: { name: "Bertoua Airport", city: "Bertoua", country: "CM" },
  GOU: { name: "Garoua International Airport", city: "Garoua", country: "CM" },
  DSC: { name: "Dschang Airport", city: "Dschang", country: "CM" },
  BFX: { name: "Bafoussam Airport", city: "Bafoussam", country: "CM" },
  BPC: { name: "Bamenda Airport", city: "Bamenda", country: "CM" },
  EBW: { name: "Ebolowa Airport", city: "Ebolowa", country: "CM" },
  YAO: { name: "Yaounde Airport", city: "Yaounde", country: "CM" },
  NSI: { name: "Yaounde Nsimalen International Airport", city: "Yaounde", country: "CM" },
  MMQ: { name: "Mbala Airport", city: "Mbala", country: "ZM" },
  CIP: { name: "Chipata Airport", city: "Chipata", country: "ZM" },
  JEK: { name: "Jeki Airstrip", city: "Lower Zambezi National Park", country: "ZM" },
  CGJ: { name: "Kasompe Airport", city: "Kasompe", country: "ZM" },
  LUN: { name: "Kenneth Kaunda International Airport", city: "Lusaka", country: "ZM" },
  KLB: { name: "Kalabo Airport", city: "Kalabo", country: "ZM" },
  KMZ: { name: "Kaoma Airport", city: "Kaoma", country: "ZM" },
  KAA: { name: "Kasama Airport", city: "Kasama", country: "ZM" },
  ZKB: { name: "Kasaba Bay Airport", city: "Kasaba Bay", country: "ZM" },
  LVI: { name: "Livingstone Airport", city: "Livingstone", country: "ZM" },
  LXU: { name: "Lukulu Airport", city: "Lukulu", country: "ZM" },
  MNS: { name: "Mansa Airport", city: "Mansa", country: "ZM" },
  MFU: { name: "Mfuwe Airport", city: "Mfuwe", country: "ZM" },
  MNR: { name: "Mongu Airport", city: "Mongu", country: "ZM" },
  ZGM: { name: "Ngoma Airport", city: "Ngoma", country: "ZM" },
  NLA: {
    name: "Simon Mwansa Kapwepwe International Airport",
    city: "Ndola",
    country: "ZM"
  },
  SXG: { name: "Senanga Airport", city: "Senanga", country: "ZM" },
  KIW: { name: "Southdowns Airport", city: "Kitwe", country: "ZM" },
  SJQ: { name: "Sesheke Airport", city: "Sesheke", country: "ZM" },
  SLI: { name: "Solwesi Airport", city: "Solwesi", country: "ZM" },
  BBZ: { name: "Zambezi Airport", city: "Zambezi", country: "ZM" },
  HAH: { name: "Prince Said Ibrahim International Airport", city: "Moroni", country: "KM" },
  NWA: { name: "Moheli Bandar Es Eslam Airport", city: "", country: "KM" },
  YVA: { name: "Iconi Airport", city: "Moroni", country: "KM" },
  AJN: { name: "Ouani Airport", city: "Ouani", country: "KM" },
  DZA: { name: "Dzaoudzi Pamandzi International Airport", city: "Dzaoudzi", country: "YT" },
  RUN: { name: "Roland Garros Airport", city: "St Denis", country: "RE" },
  ZSE: { name: "Pierrefonds Airport", city: "St Pierre", country: "RE" },
  OHB: { name: "Moramanga Aerodrome", city: "Moramanga", country: "MG" },
  ATJ: { name: "Antsirabe Airport", city: "Antsirabe", country: "MG" },
  WAQ: { name: "Antsalova Airport", city: "Antsalova", country: "MG" },
  VVB: { name: "Mahanoro Airport", city: "Mahanoro", country: "MG" },
  TNR: { name: "Ivato Airport", city: "Antananarivo", country: "MG" },
  JVA: { name: "Ankavandra Airport", city: "Ankavandra", country: "MG" },
  BMD: {
    name: "Belo sur Tsiribihina Airport",
    city: "Belo sur Tsiribihina",
    country: "MG"
  },
  ZVA: { name: "Miandrivazo Airport", city: "", country: "MG" },
  MXT: { name: "Maintirano Airport", city: "Maintirano", country: "MG" },
  ILK: { name: "Atsinanana Airport", city: "Ilaka", country: "MG" },
  TVA: { name: "Morafenobe Airport", city: "Morafenobe", country: "MG" },
  SMS: { name: "Sainte Marie Airport", city: "", country: "MG" },
  TMM: { name: "Toamasina Airport", city: "", country: "MG" },
  WTA: { name: "Tambohorano Airport", city: "Tambohorano", country: "MG" },
  MOQ: { name: "Morondava Airport", city: "", country: "MG" },
  WTS: { name: "Tsiroanomandidy Airport", city: "Tsiroanomandidy", country: "MG" },
  VAT: { name: "Vatomandry Airport", city: "Vatomandry", country: "MG" },
  WAM: { name: "Ambatondrazaka Airport", city: "Ambatondrazaka", country: "MG" },
  DIE: { name: "Arrachart Airport", city: "", country: "MG" },
  WMR: { name: "Mananara Nord Airport", city: "Mananara Nord", country: "MG" },
  ZWA: { name: "Andapa Airport", city: "", country: "MG" },
  AMB: { name: "Ambilobe Airport", city: "", country: "MG" },
  WPB: { name: "Port Berge Airport", city: "Port Berge", country: "MG" },
  ANM: { name: "Antsirabato Airport", city: "", country: "MG" },
  IVA: { name: "Ambanja Airport", city: "Ambanja", country: "MG" },
  HVA: { name: "Analalava Airport", city: "", country: "MG" },
  MJN: { name: "Amborovy Airport", city: "", country: "MG" },
  NOS: { name: "Fascene Airport", city: "Nosy Be", country: "MG" },
  DWB: { name: "Soalala Airport", city: "Soalala", country: "MG" },
  BPY: { name: "Besalampy Airport", city: "", country: "MG" },
  WMN: { name: "Maroantsetra Airport", city: "", country: "MG" },
  SVB: { name: "Sambava Airport", city: "", country: "MG" },
  TTS: { name: "Tsaratanana Airport", city: "Tsaratanana", country: "MG" },
  VOH: { name: "Vohimarina Airport", city: "", country: "MG" },
  WAI: { name: "Ambalabe Airport", city: "Antsohihy", country: "MG" },
  WMA: { name: "Mandritsara Airport", city: "Mandritsara", country: "MG" },
  WBO: { name: "Antsoa Airport", city: "Beroroha", country: "MG" },
  WMD: { name: "Mandabe Airport", city: "Mandabe", country: "MG" },
  FTU: { name: "Tolanaro Airport", city: "Tolanaro", country: "MG" },
  WFI: { name: "Fianarantsoa Airport", city: "", country: "MG" },
  RVA: { name: "Farafangana Airport", city: "", country: "MG" },
  IHO: { name: "Ihosy Airport", city: "Ihosy", country: "MG" },
  MJA: { name: "Manja Airport", city: "Manja", country: "MG" },
  WVK: { name: "Manakara Airport", city: "", country: "MG" },
  OVA: { name: "Bekily Airport", city: "Bekily", country: "MG" },
  MNJ: { name: "Mananjary Airport", city: "", country: "MG" },
  TDV: { name: "Samangoky Airport", city: "Tanandava", country: "MG" },
  MXM: { name: "Morombe Airport", city: "", country: "MG" },
  TLE: { name: "Toliara Airport", city: "", country: "MG" },
  VND: { name: "Vangaindrano Airport", city: "Vangaindrano", country: "MG" },
  BKU: { name: "Betioky Airport", city: "Betioky", country: "MG" },
  AMP: { name: "Ampanihy Airport", city: "Ampanihy", country: "MG" },
  WAK: { name: "Ankazoabo Airport", city: "Ankazoabo", country: "MG" },
  AZZ: { name: "Ambriz Airport", city: "Ambriz", country: "AO" },
  SSY: { name: "Mbanza Congo Airport", city: "Mbanza Congo", country: "AO" },
  BUG: { name: "Benguela Airport", city: "Benguela", country: "AO" },
  NBJ: {
    name: "Dr. Antonio Agostinho Neto International Airport",
    city: "Luanda",
    country: "AO"
  },
  CAB: { name: "Cabinda Airport", city: "Cabinda", country: "AO" },
  CFF: { name: "Cafunfo Airport", city: "Cafunfo", country: "AO" },
  PGI: { name: "Chitato Airport", city: "Chitato", country: "AO" },
  CBT: { name: "Catumbela Airport", city: "Catumbela", country: "AO" },
  CTI: { name: "Cuito Cuanavale Airport", city: "Cuito Cuanavale", country: "AO" },
  CAV: { name: "Cazombo Airport", city: "Cazombo", country: "AO" },
  DUE: { name: "Dundo Airport", city: "Chitato", country: "AO" },
  VPE: { name: "Ngjiva Pereira Airport", city: "Ngiva", country: "AO" },
  NOV: { name: "Nova Lisboa Airport", city: "Huambo", country: "AO" },
  SVP: { name: "Kuito Airport", city: "Kuito", country: "AO" },
  LLT: { name: "Lobito Airport", city: "Lobito", country: "AO" },
  LBZ: { name: "Lucapa Airport", city: "Lucapa", country: "AO" },
  LAD: { name: "Quatro De Fevereiro Airport", city: "Luanda", country: "AO" },
  LZM: { name: "Luzamba Airport", city: "Luzamba", country: "AO" },
  MEG: { name: "Malanje Airport", city: "Malanje", country: "AO" },
  SPP: { name: "Menongue Airport", city: "Menongue", country: "AO" },
  MSZ: { name: "Namibe Airport", city: "Namibe", country: "AO" },
  GXG: { name: "Negage Airport", city: "Negage", country: "AO" },
  PBN: { name: "Porto Amboim Airport", city: "Port Amboim", country: "AO" },
  VHC: { name: "Saurimo Airport", city: "Saurimo", country: "AO" },
  SZA: { name: "Soyo Airport", city: "Soyo", country: "AO" },
  NDD: { name: "Sumbe Airport", city: "Sumbe", country: "AO" },
  UAL: { name: "Luau Airport", city: "Luau", country: "AO" },
  SDD: { name: "Lubango Airport", city: "Lubango", country: "AO" },
  LUO: { name: "Luena Airport", city: "Luena", country: "AO" },
  UGO: { name: "Uige Airport", city: "Uige", country: "AO" },
  CEO: { name: "Waco Kungo Airport", city: "Waco Kungo", country: "AO" },
  XGN: { name: "Xangongo Airport", city: "Xangongo", country: "AO" },
  ARZ: { name: "N'zeto Airport", city: "N'zeto", country: "AO" },
  NZA: { name: "Nzagi Airport", city: "Nzagi", country: "AO" },
  AKE: { name: "Aki\xE9ni Airport", city: "Aki\xE9ni", country: "GA" },
  BGB: { name: "Booue Airport", city: "Booue", country: "GA" },
  KDN: { name: "Ndende Airport", city: "Ndende", country: "GA" },
  FOU: { name: "Fougamou Airport", city: "Fougamou", country: "GA" },
  MBC: { name: "M'Bigou Airport", city: "M'Bigou", country: "GA" },
  MGX: { name: "Moabi Airport", city: "Moabi", country: "GA" },
  KDJ: { name: "Ville Airport", city: "N'Djole", country: "GA" },
  KOU: { name: "Koulamoutou Airport", city: "Koulamoutou", country: "GA" },
  MJL: { name: "Mouilla Ville Airport", city: "Mouila", country: "GA" },
  OYE: { name: "Oyem Airport", city: "Oyem", country: "GA" },
  OKN: { name: "Okondja Airport", city: "Okondja", country: "GA" },
  LBQ: { name: "Lambarene Airport", city: "Lambarene", country: "GA" },
  MVX: { name: "Minvoul Airport", city: "Minvoul", country: "GA" },
  BMM: { name: "Bitam Airport", city: "Bitam", country: "GA" },
  MFF: { name: "Moanda Airport", city: "Moanda", country: "GA" },
  MKB: { name: "Mekambo Airport", city: "Mekambo", country: "GA" },
  POG: { name: "Port Gentil Airport", city: "Port Gentil", country: "GA" },
  OMB: { name: "Omboue Hopital Airport", city: "Omboue", country: "GA" },
  MKU: { name: "Makokou Airport", city: "Makokou", country: "GA" },
  LBV: { name: "Leon M Ba Airport", city: "Libreville", country: "GA" },
  MVB: {
    name: "M'Vengue El Hadj Omar Bongo Ondimba International Airport",
    city: "Franceville",
    country: "GA"
  },
  LTL: { name: "Lastourville Airport", city: "Lastourville", country: "GA" },
  TCH: { name: "Tchibanga Airport", city: "Tchibanga", country: "GA" },
  MYB: { name: "Mayumba Airport", city: "Mayumba", country: "GA" },
  PCP: { name: "Principe Airport", city: "", country: "ST" },
  TMS: { name: "Sao Tome International Airport", city: "Sao Tome", country: "ST" },
  ANO: { name: "Angoche Airport", city: "Angoche", country: "MZ" },
  BEW: { name: "Beira Airport", city: "Beira", country: "MZ" },
  FXO: { name: "Cuamba Airport", city: "Cuamba", country: "MZ" },
  VPY: { name: "Chimoio Airport", city: "Chimoio", country: "MZ" },
  IHC: { name: "Inhaca Airport", city: "Inhaca", country: "MZ" },
  INH: { name: "Inhambane Airport", city: "Inhambabe", country: "MZ" },
  VXC: { name: "Lichinga Airport", city: "Lichinga", country: "MZ" },
  LFB: { name: "Lumbo Airport", city: "Lumbo", country: "MZ" },
  MPM: { name: "Maputo Airport", city: "Maputo", country: "MZ" },
  MUD: { name: "Mueda Airport", city: "Mueda", country: "MZ" },
  MZB: { name: "Mocimboa da Praia Airport", city: "Mocimboa da Praia", country: "MZ" },
  MNC: { name: "Nacala Airport", city: "Nacala", country: "MZ" },
  APL: { name: "Nampula Airport", city: "Nampula", country: "MZ" },
  POL: { name: "Pemba Airport", city: "Pemba / Porto Amelia", country: "MZ" },
  PDD: { name: "Ponta do Ouro Airport", city: "Ponta do Ouro", country: "MZ" },
  UEL: { name: "Quelimane Airport", city: "Quelimane", country: "MZ" },
  TET: { name: "Chingozi Airport", city: "Tete", country: "MZ" },
  VNX: { name: "Vilankulo Airport", city: "Vilanculo", country: "MZ" },
  VJB: { name: "Xai-Xai Airport", city: "Xai-Xai", country: "MZ" },
  DES: { name: "Desroches Airport", city: "Desroches Island", country: "SC" },
  SEZ: { name: "Seychelles International Airport", city: "Mahe Island", country: "SC" },
  PRI: { name: "Praslin Airport", city: "Praslin Island", country: "SC" },
  BDI: { name: "Bird Island Airport", city: "Bird Island", country: "SC" },
  DEI: { name: "Denis Island Airport", city: "Denis Island", country: "SC" },
  FRK: { name: "Fregate Island Airport", city: "Fregate Island", country: "SC" },
  SRH: { name: "Sarh Airport", city: "Sarh", country: "TD" },
  OGR: { name: "Bongor Airport", city: "Bongor", country: "TD" },
  AEH: { name: "Abeche Airport", city: "", country: "TD" },
  MQQ: { name: "Moundou Airport", city: "", country: "TD" },
  LTC: { name: "Lai Airport", city: "Lai", country: "TD" },
  ATV: { name: "Ati Airport", city: "Ati", country: "TD" },
  NDJ: { name: "N'Djamena International Airport", city: "N'Djamena", country: "TD" },
  BKR: { name: "Bokoro Airport", city: "Bokoro", country: "TD" },
  OTC: { name: "Bol Airport", city: "Bol", country: "TD" },
  MVO: { name: "Mongo Airport", city: "Mongo", country: "TD" },
  AMC: { name: "Am Timan Airport", city: "Am Timan", country: "TD" },
  PLF: { name: "Pala Airport", city: "Pala", country: "TD" },
  OUT: { name: "Bousso Airport", city: "Bousso", country: "TD" },
  AMO: { name: "Mao Airport", city: "Mao", country: "TD" },
  FYT: { name: "Faya Largeau Airport", city: "", country: "TD" },
  BUQ: {
    name: "Joshua Mqabuko Nkomo International Airport",
    city: "Bulawayo",
    country: "ZW"
  },
  CHJ: { name: "Chipinge Airport", city: "Chipinge", country: "ZW" },
  BFO: { name: "Buffalo Range Airport", city: "Chiredzi", country: "ZW" },
  VFA: {
    name: "Victoria Falls International Airport",
    city: "Victoria Falls",
    country: "ZW"
  },
  HRE: { name: "Harare International Airport", city: "Harare", country: "ZW" },
  KAB: { name: "Kariba International Airport", city: "Kariba", country: "ZW" },
  UTA: { name: "Mutare Airport", city: "", country: "ZW" },
  MVZ: { name: "Masvingo International Airport", city: "Masvingo", country: "ZW" },
  GWE: { name: "Thornhill Air Base", city: "Gweru", country: "ZW" },
  HWN: { name: "Hwange National Park Airport", city: "Hwange", country: "ZW" },
  WKI: { name: "Hwange Airport", city: "Hwange", country: "ZW" },
  CEH: { name: "Chelinda Malawi Airport", city: "", country: "MW" },
  BLZ: { name: "Chileka International Airport", city: "Blantyre", country: "MW" },
  CMK: { name: "Club Makokola Airport", city: "Club Makokola", country: "MW" },
  KGJ: { name: "Karonga Airport", city: "Karonga", country: "MW" },
  KBQ: { name: "Kasungu Airport", city: "Kasungu", country: "MW" },
  LLW: { name: "Lilongwe International Airport", city: "Lilongwe", country: "MW" },
  LIX: { name: "Likoma Island Airport", city: "Likoma Island", country: "MW" },
  MYZ: { name: "Monkey Bay Airport", city: "Monkey Bay", country: "MW" },
  LMB: { name: "Salima Airport", city: "Salima", country: "MW" },
  LEF: { name: "Lebakeng Airport", city: "Lebakeng", country: "LS" },
  LRB: { name: "Leribe Airport", city: "Leribe", country: "LS" },
  LES: { name: "Lesobeng Airport", city: "Lesobeng", country: "LS" },
  MSG: { name: "Matsaile Airport", city: "Matsaile", country: "LS" },
  MFC: { name: "Mafeteng Airport", city: "Mafeteng", country: "LS" },
  MKH: { name: "Mokhotlong Airport", city: "Mokhotlong", country: "LS" },
  MSU: { name: "Moshoeshoe I International Airport", city: "Maseru", country: "LS" },
  NKU: { name: "Nkaus Airport", city: "Nkaus", country: "LS" },
  PEL: { name: "Pelaneng Airport", city: "Pelaneng", country: "LS" },
  UTG: { name: "Quthing Airport", city: "Quthing", country: "LS" },
  UNE: { name: "Qacha's Nek Airport", city: "Qacha's Nek", country: "LS" },
  SHK: { name: "Sehonghong Airport", city: "Sehonghong", country: "LS" },
  SKQ: { name: "Sekakes Airport", city: "Sekakes", country: "LS" },
  SOK: { name: "Semonkong Airport", city: "Semonkong", country: "LS" },
  SHZ: { name: "Seshutes Airport", city: "Seshutes", country: "LS" },
  THB: { name: "Thaba-Tseka Airport", city: "Thaba-Tseka", country: "LS" },
  TKO: { name: "Tlokoeng Airport", city: "Tlokoeng", country: "LS" },
  ADI: { name: "Arandis Airport", city: "Arandis", country: "NA" },
  GOG: { name: "Gobabis Airport", city: "Gobabis", country: "NA" },
  GFY: { name: "Grootfontein Airport", city: "Grootfontein", country: "NA" },
  MPA: { name: "Katima Mulilo Airport", city: "Mpacha", country: "NA" },
  KMP: { name: "Keetmanshoop Airport", city: "Keetmanshoop", country: "NA" },
  LHU: { name: "Lianshulu Airport", city: "Muneambuanas", country: "NA" },
  LUD: { name: "Luderitz Airport", city: "Luderitz", country: "NA" },
  MJO: { name: "Mount Etjo Airport", city: "", country: "NA" },
  OKU: { name: "Mokuti Lodge Airport", city: "Mokuti Lodge", country: "NA" },
  NNI: { name: "Namutoni Airport", city: "Namutoni", country: "NA" },
  OND: { name: "Ondangwa Airport", city: "Ondangwa", country: "NA" },
  OMG: { name: "Omega Airport", city: "Omega", country: "NA" },
  OMD: { name: "Oranjemund Airport", city: "Oranjemund", country: "NA" },
  OKF: { name: "Okaukuejo Airport", city: "Okaukuejo", country: "NA" },
  OTJ: { name: "Otjiwarongo Airport", city: "Otjiwarongo", country: "NA" },
  NDU: { name: "Rundu Airport", city: "Rundu", country: "NA" },
  RHN: { name: "Skorpion Mine Airport", city: "Rosh Pinah", country: "NA" },
  SWP: { name: "Swakopmund Airport", city: "Swakopmund", country: "NA" },
  SZM: { name: "Sesriem Airstrip", city: "", country: "NA" },
  TSB: { name: "Tsumeb Airport", city: "Tsumeb", country: "NA" },
  WVB: { name: "Walvis Bay Airport", city: "Walvis Bay", country: "NA" },
  ERS: { name: "Eros Airport", city: "Windhoek", country: "NA" },
  WDH: { name: "Hosea Kutako International Airport", city: "Windhoek", country: "NA" },
  FIH: { name: "Ndjili International Airport", city: "Kinshasa", country: "CD" },
  NLO: { name: "Ndolo Airport", city: "", country: "CD" },
  MNB: { name: "Muanda Airport", city: "", country: "CD" },
  BOA: { name: "Boma Airport", city: "Boma", country: "CD" },
  LZI: { name: "Luozi Airport", city: "Luozi", country: "CD" },
  MAT: { name: "Tshimpi Airport", city: "Matadi", country: "CD" },
  NKL: { name: "Nkolo Fuma Airport", city: "Nkolo Fuma", country: "CD" },
  INO: { name: "Inongo Airport", city: "Inongo", country: "CD" },
  NIO: { name: "Nioki Airport", city: "Nioki", country: "CD" },
  FDU: { name: "Bandundu Airport", city: "", country: "CD" },
  KRZ: { name: "Basango Mboliasa Airport", city: "Kiri", country: "CD" },
  KKW: { name: "Kikwit Airport", city: "", country: "CD" },
  IDF: { name: "Idiofa Airport", city: "Idiofa", country: "CD" },
  LUS: { name: "Lusanga Airport", city: "Lusanga", country: "CD" },
  MSM: { name: "Masi Manimba Airport", city: "Masi Manimba", country: "CD" },
  MDK: { name: "Mbandaka Airport", city: "Mbandaka", country: "CD" },
  BSU: { name: "Basankusu Airport", city: "Basankusu", country: "CD" },
  LIE: { name: "Libenge Airport", city: "Libenge", country: "CD" },
  BDT: { name: "Gbadolite Airport", city: "", country: "CD" },
  GMA: { name: "Gemena Airport", city: "Gemena", country: "CD" },
  KLI: { name: "Kotakoli Airport", city: "", country: "CD" },
  BMB: { name: "Bumbar Airport", city: "Bumbar", country: "CD" },
  LIQ: { name: "Lisala Airport", city: "Lisala", country: "CD" },
  BNB: { name: "Boende Airport", city: "Boende", country: "CD" },
  IKL: { name: "Ikela Airport", city: "Ikela", country: "CD" },
  FKI: { name: "Bangoka International Airport", city: "Kisangani", country: "CD" },
  YAN: { name: "Yangambi Airport", city: "Yangambi", country: "CD" },
  IRP: { name: "Matari Airport", city: "", country: "CD" },
  BUX: { name: "Bunia Airport", city: "", country: "CD" },
  BZU: { name: "Buta Zega Airport", city: "", country: "CD" },
  BKY: { name: "Bukavu Kavumu Airport", city: "", country: "CD" },
  RUE: { name: "Rughenda Airfield", city: "Butembo", country: "CD" },
  GOM: { name: "Goma International Airport", city: "Goma", country: "CD" },
  BNC: { name: "Beni Airport", city: "Beni", country: "CD" },
  KND: { name: "Kindu Airport", city: "Kindu", country: "CD" },
  KLY: { name: "Kinkungwa Airport", city: "Kalima", country: "CD" },
  KGN: { name: "Kasongo Airport", city: "Kasongo", country: "CD" },
  PUN: { name: "Punia Airport", city: "Punia", country: "CD" },
  FBM: { name: "Lubumbashi International Airport", city: "Lubumbashi", country: "CD" },
  PWO: { name: "Pweto Airport", city: "Pweto", country: "CD" },
  KEC: { name: "Kasenga Airport", city: "Kasenga", country: "CD" },
  KWZ: { name: "Kolwezi Airport", city: "", country: "CD" },
  MNO: { name: "Manono Airport", city: "Manono", country: "CD" },
  BDV: { name: "Moba Airport", city: "Moba", country: "CD" },
  FMI: { name: "Kalemie Airport", city: "", country: "CD" },
  KBO: { name: "Kabalo Airport", city: "Kabalo", country: "CD" },
  KOO: { name: "Kongolo Airport", city: "Kongolo", country: "CD" },
  KMN: { name: "Kamina / Ville Airport", city: "Kamina", country: "CD" },
  KAP: { name: "Kapanga Airport", city: "Kapanga", country: "CD" },
  KNM: { name: "Kaniama Airport", city: "Kaniama", country: "CD" },
  KGA: { name: "Kananga Airport", city: "Kananga", country: "CD" },
  LZA: { name: "Luiza Airport", city: "Luiza", country: "CD" },
  TSH: { name: "Tshikapa Airport", city: "Tshikapa", country: "CD" },
  LJA: { name: "Lodja Airport", city: "Lodja", country: "CD" },
  LBO: { name: "Lusambo Airport", city: "Lusambo", country: "CD" },
  MEW: { name: "Mweka Airport", city: "Mweka", country: "CD" },
  BAN: { name: "Basongo Airport", city: "Basongo", country: "CD" },
  PFR: { name: "Ilebo Airport", city: "Ilebo", country: "CD" },
  MJM: { name: "Mbuji Mayi Airport", city: "Mbuji Mayi", country: "CD" },
  GDJ: { name: "Gandajika Airport", city: "Gandajika", country: "CD" },
  KBN: { name: "Tunta Airport", city: "Kabinda", country: "CD" },
  BKO: { name: "Senou Airport", city: "Senou", country: "ML" },
  GUD: { name: "Goundam Airport", city: "Goundam", country: "ML" },
  GAQ: { name: "Gao Airport", city: "", country: "ML" },
  KNZ: { name: "Kenieba Airport", city: "Kenieba", country: "ML" },
  KTX: { name: "Koutiala Airport", city: "Koutiala", country: "ML" },
  KYS: { name: "Kayes Dag Dag Airport", city: "", country: "ML" },
  MZI: { name: "Ambodedjo Airport", city: "", country: "ML" },
  NRM: { name: "Nara Airport", city: "Nara", country: "ML" },
  NIX: { name: "Nioro du Sahel Airport", city: "Nioro du Sahel", country: "ML" },
  KSS: { name: "Sikasso Airport", city: "Sikasso", country: "ML" },
  TOM: { name: "Timbuktu Airport", city: "Timbuktu", country: "ML" },
  EYL: { name: "Yelimane Airport", city: "Yelimane", country: "ML" },
  BJL: { name: "Banjul International Airport", city: "Banjul", country: "GM" },
  FUE: { name: "Fuerteventura Airport", city: "Fuerteventura Island", country: "ES" },
  GMZ: { name: "La Gomera Airport", city: "Alajero", country: "ES" },
  VDE: { name: "Hierro Airport", city: "El Hierro Island", country: "ES" },
  SPC: { name: "La Palma Airport", city: "Sta Cruz de la Palma", country: "ES" },
  LPA: { name: "Gran Canaria Airport", city: "Gran Canaria Island", country: "ES" },
  ACE: { name: "Lanzarote Airport", city: "Lanzarote Island", country: "ES" },
  TFS: { name: "Tenerife South Airport", city: "Tenerife Island", country: "ES" },
  TFN: { name: "Tenerife Norte Airport", city: "Tenerife Island", country: "ES" },
  MLN: { name: "Melilla Airport", city: "Melilla Island", country: "ES" },
  BTE: { name: "Sherbro International Airport", city: "Bonthe", country: "SL" },
  KBS: { name: "Bo Airport", city: "Bo", country: "SL" },
  GBK: { name: "Gbangbatok Airport", city: "Gbangbatok", country: "SL" },
  HGS: { name: "Hastings Airport", city: "Freetown", country: "SL" },
  KBA: { name: "Kabala Airport", city: "Kabala", country: "SL" },
  KEN: { name: "Kenema Airport", city: "Kenema", country: "SL" },
  FNA: { name: "Lungi International Airport", city: "Freetown", country: "SL" },
  WYE: { name: "Yengema Airport", city: "Yengema", country: "SL" },
  BQE: { name: "Bubaque Airport", city: "Bubaque", country: "GW" },
  OXB: { name: "Osvaldo Vieira International Airport", city: "Bissau", country: "GW" },
  UCN: { name: "Buchanan Airport", city: "Buchanan", country: "LR" },
  SNI: { name: "Greenville Sinoe Airport", city: "Greenville", country: "LR" },
  MLW: { name: "Spriggs Payne Airport", city: "Monrovia", country: "LR" },
  NIA: { name: "Nimba Airport", city: "Nimba", country: "LR" },
  ROB: { name: "Roberts International Airport", city: "Monrovia", country: "LR" },
  SAZ: { name: "Sasstown Airport", city: "Sasstown", country: "LR" },
  THC: { name: "Tchien Airport", city: "Tchien", country: "LR" },
  VOI: { name: "Voinjama Airport", city: "Voinjama", country: "LR" },
  AGA: { name: "Al Massira Airport", city: "Agadir", country: "MA" },
  TTA: { name: "Tan Tan Airport", city: "Tan Tan", country: "MA" },
  OZG: { name: "Zagora Airport", city: "Zagora", country: "MA" },
  UAR: { name: "Bouarfa Airport", city: "Bouarfa", country: "MA" },
  FEZ: { name: "Saiss Airport", city: "Fes", country: "MA" },
  ERH: { name: "Moulay Ali Cherif Airport", city: "Errachidia", country: "MA" },
  MEK: { name: "Bassatine Airport", city: "Meknes", country: "MA" },
  OUD: { name: "Angads Airport", city: "Oujda", country: "MA" },
  SMW: { name: "Smara Airport", city: "Smara", country: "EH" },
  GMD: { name: "Ben Slimane Airport", city: "Ben Slimane", country: "MA" },
  BEM: { name: "Beni Mellal Airport", city: "", country: "MA" },
  RBA: { name: "Rabat-Sale Airport", city: "Rabat", country: "MA" },
  SII: { name: "Sidi Ifni Xx Airport", city: "Sidi Ifni", country: "MA" },
  VIL: { name: "Dakhla Airport", city: "Dakhla", country: "EH" },
  ESU: { name: "Mogador Airport", city: "Essaouira", country: "MA" },
  EUN: { name: "Hassan I Airport", city: "El Aaiun", country: "EH" },
  CMN: { name: "Mohammed V International Airport", city: "Casablanca", country: "MA" },
  NDR: { name: "Nador International Airport", city: "Nador", country: "MA" },
  RAK: { name: "Menara Airport", city: "Marrakech", country: "MA" },
  NNA: { name: "Kenitra Airport", city: "", country: "MA" },
  OZZ: { name: "Ouarzazate Airport", city: "Ouarzazate", country: "MA" },
  AHU: { name: "Cherif Al Idrissi Airport", city: "Al Hoceima", country: "MA" },
  TTU: { name: "Saniat Rmel Airport", city: "", country: "MA" },
  TNG: { name: "Ibn Batouta Airport", city: "Tangier", country: "MA" },
  DSS: { name: "Blaise Diagne International Airport", city: "Diass", country: "SN" },
  KDA: { name: "Kolda North Airport", city: "Kolda", country: "SN" },
  ZIG: { name: "Ziguinchor Airport", city: "Ziguinchor", country: "SN" },
  CSK: { name: "Cap Skirring Airport", city: "Cap Skirring", country: "SN" },
  KLC: { name: "Kaolack Airport", city: "Kaolack", country: "SN" },
  DKR: {
    name: "Leopold Sedar Senghor International Airport",
    city: "Dakar",
    country: "SN"
  },
  MAX: { name: "Ouro Sogui Airport", city: "Matam", country: "SN" },
  POD: { name: "Podor Airport", city: "Podor", country: "SN" },
  RDT: { name: "Richard Toll Airport", city: "Richard Toll", country: "SN" },
  XLS: { name: "Saint Louis Airport", city: "Saint Louis", country: "SN" },
  BXE: { name: "Bakel Airport", city: "Bakel", country: "SN" },
  KGG: { name: "Kedougou Airport", city: "Kedougou", country: "SN" },
  SMY: { name: "Simenti Airport", city: "Simenti", country: "SN" },
  TUD: { name: "Tambacounda Airport", city: "Tambacounda", country: "SN" },
  AEO: { name: "Aioun el Atrouss Airport", city: "Aioun El Atrouss", country: "MR" },
  OTL: { name: "Boutilimit Airport", city: "Boutilimit", country: "MR" },
  THI: { name: "Tichitt Airport", city: "Tichitt", country: "MR" },
  TIY: { name: "Tidjikja Airport", city: "Tidjikja", country: "MR" },
  BGH: { name: "Abbaye Airport", city: "Boghe", country: "MR" },
  KFA: { name: "Kiffa Airport", city: "Kiffa", country: "MR" },
  TMD: { name: "Timbedra Airport", city: "Timbedra", country: "MR" },
  EMN: { name: "Nema Airport", city: "Nema", country: "MR" },
  AJJ: { name: "Akjoujt Airport", city: "Akjoujt", country: "MR" },
  KED: { name: "Kaedi Airport", city: "Kaedi", country: "MR" },
  MOM: { name: "Letfotar Airport", city: "Moudjeria", country: "MR" },
  NKC: { name: "Nouakchott International Airport", city: "Nouakchott", country: "MR" },
  SEY: { name: "Selibaby Airport", city: "Selibaby", country: "MR" },
  THT: { name: "Tamchakett Airport", city: "Tamchakett", country: "MR" },
  ATR: { name: "Atar International Airport", city: "Atar", country: "MR" },
  FGD: { name: "Fderik Airport", city: "Fderik", country: "MR" },
  NDB: { name: "Nouadhibou International Airport", city: "Nouadhibou", country: "MR" },
  OUZ: { name: "Tazadit Airport", city: "Zouerate", country: "MR" },
  CKY: { name: "Conakry Airport", city: "Conakry", country: "GN" },
  FIG: { name: "Fria Airport", city: "", country: "GN" },
  FAA: { name: "Faranah Airport", city: "", country: "GN" },
  KSI: { name: "Kissidougou Airport", city: "Kissidougou", country: "GN" },
  LEK: { name: "Labe Airport", city: "", country: "GN" },
  MCA: { name: "Macenta Airport", city: "Macenta", country: "GN" },
  NZE: { name: "Nzerekore Airport", city: "Nzerekore", country: "GN" },
  BKJ: { name: "Boke Airport", city: "Boke", country: "GN" },
  SBI: { name: "Sambailo Airport", city: "Koundara", country: "GN" },
  GII: { name: "Siguiri Airport", city: "Siguiri", country: "GN" },
  KNN: { name: "Kankan Airport", city: "Kankan", country: "GN" },
  SID: { name: "Amilcar Cabral International Airport", city: "Espargos", country: "CV" },
  NTO: { name: "Agostinho Neto Airport", city: "Ponta do Sol", country: "CV" },
  BVC: { name: "Rabil Airport", city: "Rabil", country: "CV" },
  BVR: { name: "Esperadinha Airport", city: "Brava Island", country: "CV" },
  MMO: { name: "Maio Airport", city: "Vila do Maio", country: "CV" },
  MTI: { name: "Mosteiros Airport", city: "Vila do Mosteiros", country: "CV" },
  RAI: { name: "Praia International Airport", city: "Praia", country: "CV" },
  SFL: { name: "Sao Filipe Airport", city: "Sao Filipe", country: "CV" },
  SNE: { name: "Preguica Airport", city: "Preguica", country: "CV" },
  VXE: { name: "Sao Pedro Airport", city: "Sao Pedro", country: "CV" },
  ADD: { name: "Bole International Airport", city: "Addis Ababa", country: "ET" },
  AMH: { name: "Arba Minch Airport", city: "", country: "ET" },
  AXU: { name: "Axum Airport", city: "", country: "ET" },
  BCO: { name: "Baco Airport", city: "Baco", country: "ET" },
  BJR: { name: "Bahir Dar Airport", city: "Bahir Dar", country: "ET" },
  BEI: { name: "Beica Airport", city: "Beica", country: "ET" },
  DSE: { name: "Combolcha Airport", city: "Dessie", country: "ET" },
  DEM: { name: "Dembidollo Airport", city: "Dembidollo", country: "ET" },
  DBM: { name: "Debra Marcos Airport", city: "Debra Marcos", country: "ET" },
  DIR: {
    name: "Aba Tenna Dejazmach Yilma International Airport",
    city: "Dire Dawa",
    country: "ET"
  },
  DBT: { name: "Debre Tabor Airport", city: "Debre Tabor", country: "ET" },
  FNH: { name: "Fincha Airport", city: "Fincha", country: "ET" },
  GOB: { name: "Robe Airport", city: "Goba", country: "ET" },
  GMB: { name: "Gambella Airport", city: "Gambela", country: "ET" },
  GDQ: { name: "Gonder Airport", city: "Gondar", country: "ET" },
  GDE: { name: "Gode Airport", city: "Gode", country: "ET" },
  GOR: { name: "Gore Airport", city: "Gore", country: "ET" },
  HUE: { name: "Humera Airport", city: "Humera", country: "ET" },
  JIJ: { name: "Jigjiga Garad Wilwal Airport", city: "Jijiga", country: "ET" },
  JIM: { name: "Jimma Airport", city: "Jimma", country: "ET" },
  ABK: { name: "Kabri Dehar Airport", city: "Kabri Dehar", country: "ET" },
  LFO: { name: "Kelafo East Airport", city: "Kelafo", country: "ET" },
  AWA: { name: "Awassa Airport", city: "Awassa", country: "ET" },
  LLI: { name: "Lalibella Airport", city: "Lalibela", country: "ET" },
  TUJ: { name: "Tume Airport", city: "Maji", country: "ET" },
  MQX: { name: "Mekele Airport", city: "", country: "ET" },
  MZX: { name: "Masslo Airport", city: "Masslo", country: "ET" },
  ETE: { name: "Metema Airport", city: "Metema", country: "ET" },
  NDM: { name: "Mendi Airport", city: "Mendi", country: "ET" },
  MTF: { name: "Mizan Teferi Airport", city: "Mizan Teferi", country: "ET" },
  NEJ: { name: "Nejjo Airport", city: "Nejjo", country: "ET" },
  NEK: { name: "Nekemte Airport", city: "Nekemte", country: "ET" },
  ASO: { name: "Asosa Airport", city: "Asosa", country: "ET" },
  SHC: { name: "Shire Airport", city: "Shire", country: "ET" },
  TIE: { name: "Tippi Airport", city: "Tippi", country: "ET" },
  WAC: { name: "Waca Airport", city: "Waca", country: "ET" },
  BJM: { name: "Bujumbura International Airport", city: "Bujumbura", country: "BI" },
  GID: { name: "Gitega Airport", city: "Gitega", country: "BI" },
  KRE: { name: "Kirundo Airport", city: "Kirundo", country: "BI" },
  AAD: { name: "Adado Airport", city: "Adado", country: "SO" },
  ALU: { name: "Alula Airport", city: "Alula", country: "SO" },
  BIB: { name: "Baidoa Airport", city: "Baidoa", country: "SO" },
  CXN: { name: "Candala Airport", city: "Candala", country: "SO" },
  BSY: { name: "Bardera Airport", city: "", country: "SO" },
  HCM: { name: "Eil Airport", city: "Eil", country: "SO" },
  BSA: { name: "Bosaso Airport", city: "Bosaso", country: "SO" },
  GSR: { name: "Gardo Airport", city: "Gardo", country: "SO" },
  HGA: { name: "Egal International Airport", city: "Hargeisa", country: "SO" },
  BBO: { name: "Berbera Airport", city: "Berbera", country: "SO" },
  KMU: { name: "Kisimayu Airport", city: "", country: "SO" },
  MGQ: { name: "Aden Adde International Airport", city: "Mogadishu", country: "SO" },
  CMO: { name: "Obbia Airport", city: "Obbia", country: "SO" },
  GLK: { name: "Galcaio Airport", city: "Galcaio", country: "SO" },
  CMS: { name: "Scusciuban Airport", city: "Scusciuban", country: "SO" },
  ERA: { name: "Erigavo Airport", city: "Erigavo", country: "SO" },
  BUO: { name: "Burao Airport", city: "Burao", country: "SO" },
  GGR: { name: "Garowe Airport", city: "Garowe", country: "SO" },
  JIB: { name: "Djibouti-Ambouli Airport", city: "Djibouti City", country: "DJ" },
  AII: { name: "Ali-Sabieh Airport", city: "Ali-Sabieh", country: "DJ" },
  MHI: { name: "Moucha Airport", city: "Moucha Island", country: "DJ" },
  OBC: { name: "Obock Airport", city: "Obock", country: "DJ" },
  TDJ: { name: "Tadjoura Airport", city: "Tadjoura", country: "DJ" },
  SEW: { name: "Siwa Oasis North Airport", city: "Siwa", country: "EG" },
  DBB: { name: "El Alamein International Airport", city: "El Alamein", country: "EG" },
  AAC: { name: "El Arish International Airport", city: "El Arish", country: "EG" },
  ATZ: { name: "Assiut International Airport", city: "Assiut", country: "EG" },
  HBE: { name: "Borg El Arab International Airport", city: "Alexandria", country: "EG" },
  ABS: { name: "Abu Simbel Airport", city: "Abu Simbel", country: "EG" },
  CAI: { name: "Cairo International Airport", city: "Cairo", country: "EG" },
  CCE: {
    name: "Capital International Airport",
    city: "New Administrative Capital",
    country: "EG"
  },
  DAK: { name: "Dakhla Airport", city: "", country: "EG" },
  HRG: { name: "Hurghada International Airport", city: "Hurghada", country: "EG" },
  UVL: { name: "El Kharga Airport", city: "", country: "EG" },
  LXR: { name: "Luxor International Airport", city: "Luxor", country: "EG" },
  RMF: { name: "Marsa Alam International Airport", city: "Marsa Alam", country: "EG" },
  HMB: { name: "Sohag International Airport", city: "Sohag", country: "EG" },
  MUH: { name: "Mersa Matruh Airport", city: "Mersa Matruh", country: "EG" },
  GSQ: { name: "Shark El Oweinat International Airport", city: "", country: "EG" },
  PSD: { name: "Port Said Airport", city: "Port Said", country: "EG" },
  SKV: { name: "St Catherine International Airport", city: "", country: "EG" },
  SSH: {
    name: "Sharm El Sheikh International Airport",
    city: "Sharm el-Sheikh",
    country: "EG"
  },
  ASW: { name: "Aswan International Airport", city: "Aswan", country: "EG" },
  SPX: { name: "Sphinx International Airport", city: "Giza", country: "EG" },
  TCP: { name: "Taba International Airport", city: "Taba", country: "EG" },
  ELT: { name: "El Tor Airport", city: "", country: "EG" },
  ASM: { name: "Asmara International Airport", city: "Asmara", country: "ER" },
  MSW: { name: "Massawa International Airport", city: "Massawa", country: "ER" },
  ASA: { name: "Assab International Airport", city: "Assab", country: "ER" },
  TES: { name: "Teseney Airport", city: "Teseney", country: "ER" },
  HPV: { name: "Princeville Airport", city: "Hanalei", country: "US" },
  ASV: { name: "Amboseli Airport", city: "Amboseli National Park", country: "KE" },
  EDL: { name: "Eldoret International Airport", city: "Eldoret", country: "KE" },
  EYS: { name: "Eliye Springs Airport", city: "Eliye Springs", country: "KE" },
  KLK: { name: "Kalokol Airport", city: "Kalokol", country: "KE" },
  GAS: { name: "Garissa Airport", city: "Garissa", country: "KE" },
  HOA: { name: "Hola Airport", city: "Hola", country: "KE" },
  NBO: { name: "Jomo Kenyatta International Airport", city: "Nairobi", country: "KE" },
  KEU: { name: "Keekorok Airport", city: "Keekorok", country: "KE" },
  GGM: { name: "Kakamega Airport", city: "Kakamega", country: "KE" },
  KIS: { name: "Kisumu Airport", city: "Kisumu", country: "KE" },
  ILU: { name: "Kilaguni Airport", city: "Kilaguni", country: "KE" },
  KEY: { name: "Kericho Airport", city: "Kericho", country: "KE" },
  KTL: { name: "Kitale Airport", city: "Kitale", country: "KE" },
  LKG: { name: "Lokichoggio Airport", city: "Lokichoggio", country: "KE" },
  LOK: { name: "Lodwar Airport", city: "Lodwar", country: "KE" },
  LAU: { name: "Manda Airstrip", city: "Lamu", country: "KE" },
  LOY: { name: "Loyengalani Airport", city: "Loyengalani", country: "KE" },
  NDE: { name: "Mandera Airport", city: "Mandera", country: "KE" },
  RBT: { name: "Segel Airport", city: "Marsabit", country: "KE" },
  JJM: { name: "Mulika Lodge Airport", city: "Meru-Kinna", country: "KE" },
  MYD: { name: "Malindi Airport", city: "Malindi", country: "KE" },
  MBA: { name: "Mombasa Moi International Airport", city: "Mombasa", country: "KE" },
  MRE: { name: "Mara Serena Lodge Airstrip", city: "Masai Mara", country: "KE" },
  OYL: { name: "Moyale Airport", city: "Moyale (Lower)", country: "KE" },
  NYE: { name: "Nyeri Airport", city: "Nyeri", country: "KE" },
  NUU: { name: "Nakuru Airport", city: "Nakuru", country: "KE" },
  WIL: { name: "Nairobi Wilson Airport", city: "Nairobi", country: "KE" },
  NYK: { name: "Nanyuki Airport", city: "Nanyuki", country: "KE" },
  UAS: { name: "Samburu South Airport", city: "Samburu South", country: "KE" },
  UKA: { name: "Ukunda Airstrip", city: "Ukunda", country: "KE" },
  WJR: { name: "Wajir Airport", city: "Wajir", country: "KE" },
  SRX: { name: "Gardabya Airport", city: "Sirt", country: "LY" },
  TOB: { name: "Gamal Abdel Nasser Airport", city: "Tobruk", country: "LY" },
  GHT: { name: "Ghat Airport", city: "Ghat", country: "LY" },
  AKF: { name: "Kufra Airport", city: "Kufra", country: "LY" },
  BEN: { name: "Benina International Airport", city: "Benghazi", country: "LY" },
  MJI: { name: "Mitiga Airport", city: "Tripoli", country: "LY" },
  LAQ: { name: "La Abraq Airport", city: "Al Bayda'", country: "LY" },
  SEB: { name: "Sabha Airport", city: "Sabha", country: "LY" },
  TIP: { name: "Tripoli International Airport", city: "Tripoli", country: "LY" },
  LMQ: { name: "Marsa Brega Airport", city: "", country: "LY" },
  NFR: { name: "Nafurah 1 Airport", city: "Nafurah 1", country: "LY" },
  HUQ: { name: "Hon Airport", city: "", country: "LY" },
  LTD: { name: "Ghadames East Airport", city: "Ghadames", country: "LY" },
  WAX: { name: "Zwara Airport", city: "Zuwara", country: "LY" },
  GYI: { name: "Gisenyi Airport", city: "Gisenyi", country: "RW" },
  BTQ: { name: "Butare Airport", city: "Butare", country: "RW" },
  KGL: { name: "Kigali International Airport", city: "Kigali", country: "RW" },
  RHG: { name: "Ruhengeri Airport", city: "Ruhengeri", country: "RW" },
  KME: { name: "Kamembe Airport", city: "Kamembe", country: "RW" },
  ATB: { name: "Atbara Airport", city: "Atbara", country: "SD" },
  EDB: { name: "El Debba Airport", city: "El Debba", country: "SD" },
  DOG: { name: "Dongola Airport", city: "Dongola", country: "SD" },
  RSS: { name: "Damazin Airport", city: "Ad Damazin", country: "SD" },
  ELF: { name: "El Fasher Airport", city: "El Fasher", country: "SD" },
  GSU: { name: "Azaza Airport", city: "Gedaref", country: "SD" },
  DNX: { name: "Galegu Airport", city: "Dinder", country: "SD" },
  EGN: { name: "Geneina Airport", city: "Geneina", country: "SD" },
  KSL: { name: "Kassala Airport", city: "Kassala", country: "SD" },
  GBU: { name: "Khashm El Girba Airport", city: "Khashm El Girba", country: "SD" },
  KST: { name: "Kosti Airport", city: "Kosti", country: "SD" },
  KDX: { name: "Kadugli Airport", city: "Kadugli", country: "SD" },
  RBX: { name: "Rumbek Airport", city: "Rumbek", country: "SS" },
  MWE: { name: "Merowe Airport", city: "Merowe", country: "SD" },
  NUD: { name: "En Nahud Airport", city: "En Nahud", country: "SD" },
  UYL: { name: "Nyala Airport", city: "Nyala", country: "SD" },
  NHF: { name: "New Halfa Airport", city: "New Halfa", country: "SD" },
  EBD: { name: "El Obeid Airport", city: "Al-Ubayyid", country: "SD" },
  PZU: { name: "Port Sudan New International Airport", city: "Port Sudan", country: "SD" },
  JUB: { name: "Juba Airport", city: "Juba", country: "SS" },
  KRT: { name: "Khartoum International Airport", city: "Khartoum", country: "SD" },
  MAK: { name: "Malakal Airport", city: "Malakal", country: "SS" },
  WHF: { name: "Wadi Halfa Airport", city: "Wadi Halfa", country: "SD" },
  WUU: { name: "Wau Airport", city: "Wau", country: "SS" },
  ZLX: { name: "Zalingei Airport", city: "Zalingei", country: "SD" },
  ARK: { name: "Arusha Airport", city: "Arusha", country: "TZ" },
  BKZ: { name: "Bukoba Airport", city: "Bukoba", country: "TZ" },
  DAR: {
    name: "Mwalimu Julius K. Nyerere International Airport",
    city: "Dar es Salaam",
    country: "TZ"
  },
  DOD: { name: "Dodoma Airport", city: "Dodoma", country: "TZ" },
  IRI: { name: "Iringa Airport", city: "Nduli", country: "TZ" },
  TKQ: { name: "Kigoma Airport", city: "Kigoma", country: "TZ" },
  KIY: { name: "Kilwa Masoko Airport", city: "Kilwa Masoko", country: "TZ" },
  JRO: { name: "Kilimanjaro International Airport", city: "Arusha", country: "TZ" },
  LDI: { name: "Kikwetu Airport", city: "Lindi", country: "TZ" },
  LKY: { name: "Lake Manyara Airport", city: "Lake Manyara National Park", country: "TZ" },
  MFA: { name: "Mafia Island Airport", city: "Mafia Island", country: "TZ" },
  MBI: { name: "Mbeya Airport", city: "Mbeya", country: "TZ" },
  MWN: { name: "Mwadui Airport", city: "Mwadui", country: "TZ" },
  XMI: { name: "Masasi Airport", city: "Masasi", country: "TZ" },
  MYW: { name: "Mtwara Airport", city: "Mtwara", country: "TZ" },
  MUZ: { name: "Musoma Airport", city: "Musoma", country: "TZ" },
  MWZ: { name: "Mwanza Airport", city: "Mwanza", country: "TZ" },
  NCH: { name: "Nachingwea Airport", city: "Nachingwea", country: "TZ" },
  JOM: { name: "Njombe Airport", city: "Njombe", country: "TZ" },
  PMA: { name: "Pemba Airport", city: "Chake", country: "TZ" },
  SEU: { name: "Seronera Airport", city: "Seronera", country: "TZ" },
  SGX: { name: "Songea Airport", city: "Songea", country: "TZ" },
  SUT: { name: "Sumbawanga Airport", city: "Sumbawanga", country: "TZ" },
  SHY: { name: "Shinyanga Airport", city: "Shinyanga", country: "TZ" },
  TBO: { name: "Tabora Airport", city: "Tabora", country: "TZ" },
  TGT: { name: "Tanga Airport", city: "Tanga", country: "TZ" },
  ZNZ: { name: "Zanzibar Airport", city: "Kiembi Samaki", country: "TZ" },
  RUA: { name: "Arua Airport", city: "Arua", country: "UG" },
  EBB: { name: "Entebbe International Airport", city: "Kampala", country: "UG" },
  ULU: { name: "Gulu Airport", city: "Gulu", country: "UG" },
  JIN: { name: "Jinja Airport", city: "Jinja", country: "UG" },
  KBG: { name: "Kabalega Falls Airport", city: "Kabalega Falls", country: "UG" },
  KSE: { name: "Kasese Airport", city: "Kasese", country: "UG" },
  MBQ: { name: "Mbarara Airport", city: "Mbarara", country: "UG" },
  KCU: { name: "Masindi Airport", city: "Masindi", country: "UG" },
  PAF: { name: "Pakuba Airport", city: "", country: "UG" },
  SRT: { name: "Soroti Airport", city: "Soroti", country: "UG" },
  TRY: { name: "Tororo Airport", city: "Tororo", country: "UG" },
  AMK: { name: "Animas Air Park", city: "Durango", country: "US" },
  BDX: { name: "Broadus Airport", city: "Broadus", country: "US" },
  EUE: { name: "Eureka Airport", city: "Eureka", country: "US" },
  KPT: { name: "Jackpot/Hayden Field", city: "Jackpot", country: "US" },
  PQS: { name: "Pilot Station Airport", city: "Pilot Station", country: "US" },
  FID: { name: "Elizabeth Field", city: "Fishers Island", country: "US" },
  RTL: { name: "Spirit Lake Municipal Airport", city: "Spirit Lake", country: "US" },
  HUD: { name: "Humboldt Municipal Airport", city: "Humboldt", country: "US" },
  TWD: {
    name: "Jefferson County International Airport",
    city: "Port Townsend",
    country: "US"
  },
  MVM: { name: "Kayenta Airport", city: "Kayenta", country: "US" },
  HCC: { name: "Columbia County Airport", city: "Hudson", country: "US" },
  AHD: { name: "Ardmore Downtown Executive Airport", city: "Ardmore", country: "US" },
  GCW: { name: "Grand Canyon West Airport", city: "Peach Springs", country: "US" },
  KKK: { name: "Kalakaket Creek Air Station", city: "Kalakaket Creek", country: "US" },
  CKE: { name: "Lampson Field", city: "Lakeport", country: "US" },
  ROF: { name: "Montague-Yreka Rohrer Field", city: "Montague", country: "US" },
  MHS: { name: "Dunsmuir Municipal-Mott Airport", city: "Dunsmuir", country: "US" },
  PLY: { name: "Plymouth Municipal Airport", city: "Plymouth", country: "US" },
  MIJ: { name: "Mili Airport", city: "Mili Island", country: "MH" },
  PGC: { name: "Grant County Airport", city: "Hyannis", country: "US" },
  CNE: { name: "Fremont County Airport", city: "Canon City", country: "US" },
  GCT: { name: "Grand Canyon Bar Ten Airstrip", city: "Whitmore", country: "US" },
  LVD: { name: "Lime Village Airport", city: "Lime Village", country: "US" },
  NWH: { name: "Parlin Field", city: "Newport", country: "US" },
  IRB: { name: "Iraan Municipal Airport", city: "Iraan", country: "US" },
  ODM: { name: "Garrett County Airport", city: "Oakland", country: "US" },
  TLF: { name: "Telida Airport", city: "Telida", country: "US" },
  GNF: { name: "Gansner Field", city: "Quincy", country: "US" },
  CHZ: { name: "Chiloquin State Airport", city: "Chiloquin", country: "US" },
  LTW: { name: "St Mary's County Regional Airport", city: "Leonardtown", country: "US" },
  USC: { name: "Union County, Troy Shelton Field", city: "Union", country: "US" },
  AHF: { name: "Arapahoe Municipal Airport", city: "Arapahoe", country: "US" },
  PCT: { name: "Princeton Airport", city: "Princeton/Rocky Hill", country: "US" },
  NRI: { name: "Grand Lake Regional Airport", city: "Afton", country: "US" },
  GTP: { name: "Grants Pass Airport", city: "Grants Pass", country: "US" },
  TEH: { name: "Tetlin Airport", city: "Tetlin", country: "US" },
  NLE: { name: "Jerry Tyler Memorial Airport", city: "Niles", country: "US" },
  VRS: { name: "Roy Otten Memorial Airfield", city: "Versailles", country: "US" },
  GCD: { name: "Grand Coulee Dam Airport", city: "Electric City", country: "US" },
  VLE: { name: "Valle Airport", city: "Grand Canyon", country: "US" },
  NTJ: { name: "Sanpete County Regional Airport", city: "Manti", country: "US" },
  SBO: { name: "Salina-Gunnison Airport", city: "Salina", country: "US" },
  JVI: { name: "Central Jersey Regional Airport", city: "Manville", country: "US" },
  ATT: { name: "Atmautluak Airport", city: "Atmautluak", country: "US" },
  LIV: { name: "Livengood Camp Airport", city: "Livengood", country: "US" },
  PDB: { name: "Pedro Bay Airport", city: "Pedro Bay", country: "US" },
  KOZ: { name: "Ouzinkie Airport", city: "Ouzinkie", country: "US" },
  UCE: { name: "Eunice Airport", city: "Eunice", country: "US" },
  GOL: { name: "Gold Beach Municipal Airport", city: "Gold Beach", country: "US" },
  RNG: { name: "Rangely Airport", city: "Rangely", country: "US" },
  KKT: { name: "Kentland Municipal Airport", city: "Kentland", country: "US" },
  MNT: { name: "Minto Al Wright Airport", city: "Minto", country: "US" },
  WKK: { name: "Aleknagik /New Airport", city: "Aleknagik", country: "US" },
  PRW: { name: "Prentice Airport", city: "Prentice", country: "US" },
  NNK: { name: "Naknek Airport", city: "Naknek", country: "US" },
  EGP: {
    name: "Maverick County Memorial International Airport",
    city: "Eagle Pass",
    country: "US"
  },
  MFH: { name: "Mesquite Airport", city: "Mesquite", country: "US" },
  MMN: { name: "Minute Man Air Field", city: "Stow", country: "US" },
  ECA: { name: "Iosco County Airport", city: "East Tawas", country: "US" },
  NYS: { name: "New York Skyports Inc Seaplane Base", city: "New York", country: "US" },
  OLH: { name: "Old Harbor Airport", city: "Old Harbor", country: "US" },
  FMU: { name: "Florence Municipal Airport", city: "Florence", country: "US" },
  OTS: { name: "Anacortes Airport", city: "Anacortes", country: "US" },
  ROL: { name: "Roosevelt Municipal Airport", city: "Roosevelt", country: "US" },
  WPO: { name: "North Fork Valley Airport", city: "Paonia", country: "US" },
  ATE: { name: "Antlers Municipal Airport", city: "Antlers", country: "US" },
  UGS: { name: "Ugashik Airport", city: "Ugashik", country: "US" },
  WTL: { name: "Tuntutuliak Airport", city: "Tuntutuliak", country: "US" },
  TWA: { name: "Twin Hills Airport", city: "Twin Hills", country: "US" },
  KCQ: { name: "Chignik Lake Airport", city: "Chignik Lake", country: "US" },
  AAF: {
    name: "Apalachicola Regional-Cleve Randolph Field",
    city: "Apalachicola",
    country: "US"
  },
  ABE: { name: "Lehigh Valley International Airport", city: "Allentown", country: "US" },
  ABI: { name: "Abilene Regional Airport", city: "Abilene", country: "US" },
  ABQ: {
    name: "Albuquerque International Sunport Airport",
    city: "Albuquerque",
    country: "US"
  },
  ABR: { name: "Aberdeen Regional Airport", city: "Aberdeen", country: "US" },
  ABY: { name: "Southwest Georgia Regional Airport", city: "Albany", country: "US" },
  ACB: { name: "Antrim County Airport", city: "Bellaire", country: "US" },
  ACK: { name: "Nantucket Memorial Airport", city: "Nantucket", country: "US" },
  ACT: { name: "Waco Regional Airport", city: "Waco", country: "US" },
  ACV: {
    name: "California Redwood Coast-Humboldt County Airport",
    city: "Arcata/Eureka",
    country: "US"
  },
  ACY: {
    name: "Atlantic City International Airport",
    city: "Atlantic City",
    country: "US"
  },
  ADG: { name: "Lenawee County Airport", city: "Adrian", country: "US" },
  ADT: { name: "Ada Regional Airport", city: "Ada", country: "US" },
  ADM: { name: "Ardmore Municipal Airport", city: "Ardmore", country: "US" },
  ADS: { name: "Addison Airport", city: "Dallas", country: "US" },
  ADW: { name: "Joint Base Andrews Airport", city: "Camp Springs", country: "US" },
  AEL: { name: "Albert Lea Municipal Airport", city: "Albert Lea", country: "US" },
  AEX: { name: "Alexandria International Airport", city: "Alexandria", country: "US" },
  AFF: { name: "Usaf Academy Davis Airfield", city: "Colorado Springs", country: "US" },
  WSG: { name: "Washington County Airport", city: "Washington", country: "US" },
  AFN: { name: "Jaffrey Airfield Silver Ranch Airport", city: "Jaffrey", country: "US" },
  AFO: {
    name: "Afton Lincoln County/General Boyd L Eddins Field",
    city: "Afton",
    country: "US"
  },
  AFW: {
    name: "Perot Field/Fort Worth Alliance Airport",
    city: "Fort Worth",
    country: "US"
  },
  AGC: { name: "Allegheny County Airport", city: "Pittsburgh", country: "US" },
  AGO: { name: "Ralph C Weiser Field", city: "Magnolia", country: "US" },
  AGS: { name: "Augusta Regional At Bush Field", city: "Augusta", country: "US" },
  AHC: { name: "Amedee Army Air Field", city: "Herlong", country: "US" },
  AHH: { name: "Amery Municipal Airport", city: "Amery", country: "US" },
  AHN: { name: "Athens/Ben Epps Airport", city: "Athens", country: "US" },
  AIA: { name: "Alliance Municipal Airport", city: "Alliance", country: "US" },
  AID: { name: "Anderson Regional Airport", city: "Anderson", country: "US" },
  AIK: { name: "Aiken Regional Airport", city: "Aiken", country: "US" },
  AIO: { name: "Atlantic Municipal Airport", city: "Atlantic", country: "US" },
  AIV: { name: "George Downer Airport", city: "Aliceville", country: "US" },
  AIZ: { name: "Lee C Fine Memorial Airport", city: "Kaiser/Lake Ozark", country: "US" },
  AKO: { name: "Colorado Plains Regional Airport", city: "Akron", country: "US" },
  AKC: { name: "Akron Fulton International Airport", city: "Akron", country: "US" },
  ALB: { name: "Albany International Airport", city: "Albany", country: "US" },
  ALI: { name: "Alice International Airport", city: "Alice", country: "US" },
  ALM: {
    name: "Alamogordo-White Sands Regional Airport",
    city: "Alamogordo",
    country: "US"
  },
  ALN: { name: "St Louis Regional Airport", city: "Alton/St Louis", country: "US" },
  ALO: { name: "Waterloo Regional Airport", city: "Waterloo", country: "US" },
  ALS: { name: "San Luis Valley Regional/Bergman Field", city: "Alamosa", country: "US" },
  ALW: { name: "Walla Walla Regional Airport", city: "Walla Walla", country: "US" },
  ALX: { name: "Thomas C Russell Field", city: "Alexander City", country: "US" },
  AMA: {
    name: "Rick Husband Amarillo International Airport",
    city: "Amarillo",
    country: "US"
  },
  AMN: { name: "Gratiot Community Airport", city: "Alma", country: "US" },
  AMW: { name: "Ames Municipal Airport", city: "Ames", country: "US" },
  ANB: { name: "Anniston Regional Airport", city: "Anniston", country: "US" },
  AND: { name: "Anderson Regional Airport", city: "Anderson", country: "US" },
  SSM: {
    name: "Sault Ste Marie Municipal/Sanderson Field",
    city: "Sault Ste Marie",
    country: "US"
  },
  SLT: { name: "Salida/Harriett Alexander Field", city: "Salida", country: "US" },
  ANP: { name: "Lee Airport", city: "Annapolis", country: "US" },
  ANQ: { name: "Tri-State Steuben County Airport", city: "Angola", country: "US" },
  ANW: { name: "Ainsworth Regional Airport", city: "Ainsworth", country: "US" },
  ANY: { name: "Anthony Municipal Airport", city: "Anthony", country: "US" },
  AOH: { name: "Lima Allen County Airport", city: "Lima", country: "US" },
  AOO: { name: "Altoona/Blair County Airport", city: "Altoona", country: "US" },
  APA: { name: "Centennial Airport", city: "Denver", country: "US" },
  APC: { name: "Napa County Airport", city: "Napa", country: "US" },
  APF: { name: "Naples Municipal Airport", city: "Naples", country: "US" },
  APG: {
    name: "Phillips Army Air Field",
    city: "Aberdeen Proving Grounds (Aberdeen)",
    country: "US"
  },
  APH: { name: "Ap Hill Lz (Fort Ap Hill) Airport", city: "Bowling Green", country: "US" },
  APN: { name: "Alpena County Regional Airport", city: "Alpena", country: "US" },
  APT: { name: "Marion County/Brown Field", city: "Jasper", country: "US" },
  APV: { name: "Apple Valley Airport", city: "Apple Valley", country: "US" },
  AQY: { name: "Girdwood Airport", city: "Girdwood", country: "US" },
  ARA: { name: "Acadiana Regional Airport", city: "New Iberia", country: "US" },
  ARB: { name: "Ann Arbor Municipal Airport", city: "Ann Arbor", country: "US" },
  ARG: { name: "Walnut Ridge Regional Airport", city: "Walnut Ridge", country: "US" },
  WHT: { name: "Wharton Regional Airport", city: "Wharton", country: "US" },
  AUZ: { name: "Aurora Municipal Airport", city: "Chicago/Aurora", country: "US" },
  ART: { name: "Watertown International Airport", city: "Watertown", country: "US" },
  ARV: {
    name: "Lakeland/Noble F Lee Memorial Field",
    city: "Minocqua-Woodruff",
    country: "US"
  },
  BFT: { name: "Beaufort Executive Airport", city: "Beaufort", country: "US" },
  ASE: { name: "Aspen-Pitkin County/Sardy Field", city: "Aspen", country: "US" },
  SPZ: { name: "Springdale Municipal Airport", city: "Springdale", country: "US" },
  ASH: { name: "Boire Field", city: "Nashua", country: "US" },
  ASL: { name: "Harrison County Airport", city: "Marshall", country: "US" },
  ASN: { name: "Talladega Municipal Airport", city: "Talladega", country: "US" },
  AST: { name: "Astoria Regional Airport", city: "Astoria", country: "US" },
  ASX: { name: "John F Kennedy Memorial Airport", city: "Ashland", country: "US" },
  ASY: { name: "Ashley Municipal Airport", city: "Ashley", country: "US" },
  ATL: {
    name: "Hartsfield/Jackson Atlanta International Airport",
    city: "Atlanta",
    country: "US"
  },
  ATS: { name: "Artesia Municipal Airport", city: "Artesia", country: "US" },
  ATW: { name: "Appleton International Airport", city: "Appleton", country: "US" },
  ATY: { name: "Watertown Regional Airport", city: "Watertown", country: "US" },
  AUG: { name: "Augusta State Airport", city: "Augusta", country: "US" },
  AUM: { name: "Austin Municipal Airport", city: "Austin", country: "US" },
  AUN: { name: "Auburn Municipal Airport", city: "Auburn", country: "US" },
  AUO: { name: "Auburn University Regional Airport", city: "Auburn", country: "US" },
  AUS: { name: "Austin-Bergstrom International Airport", city: "Austin", country: "US" },
  AUW: { name: "Wausau Downtown Airport", city: "Wausau", country: "US" },
  AVL: { name: "Asheville Regional Airport", city: "Asheville", country: "US" },
  AVO: { name: "Avon Park Executive Airport", city: "Avon Park", country: "US" },
  AVP: {
    name: "Wilkes-Barre/Scranton International Airport",
    city: "Wilkes-Barre/Scranton",
    country: "US"
  },
  AVW: { name: "Marana Regional Airport", city: "Marana", country: "US" },
  AVX: { name: "Catalina Airport", city: "Avalon", country: "US" },
  AWM: { name: "West Memphis Municipal Airport", city: "West Memphis", country: "US" },
  AXG: { name: "Algona Municipal Airport", city: "Algona", country: "US" },
  AXN: { name: "Alexandria Regional/Chandler Field", city: "Alexandria", country: "US" },
  AXS: { name: "Altus/Quartz Mountain Regional Airport", city: "Altus", country: "US" },
  AXV: { name: "Neil Armstrong Airport", city: "Wapakoneta", country: "US" },
  AXX: { name: "Angel Fire Airport", city: "Angel Fire", country: "US" },
  AYS: { name: "Waycross-Ware County Airport", city: "Waycross", country: "US" },
  AZO: {
    name: "Kalamazoo/Battle Creek International Airport",
    city: "Kalamazoo",
    country: "US"
  },
  BAB: { name: "Beale Afb Airport", city: "Marysville", country: "US" },
  BAD: { name: "Barksdale Afb Airport", city: "Bossier City", country: "US" },
  BAF: {
    name: "Westfield-Barnes Regional Airport",
    city: "Westfield/Springfield",
    country: "US"
  },
  CLU: { name: "Columbus Municipal Airport", city: "Columbus", country: "US" },
  BAM: { name: "Battle Mountain Airport", city: "Battle Mountain", country: "US" },
  BBB: { name: "Benson Municipal Airport", city: "Benson", country: "US" },
  BBD: { name: "Curtis Field", city: "Brady", country: "US" },
  BKG: { name: "Branson Airport", city: "Branson", country: "US" },
  BTN: {
    name: "Marlboro County Jetport/H E Avent Field",
    city: "Bennettsville",
    country: "US"
  },
  BBW: {
    name: "Broken Bow Municipal/Keith Glaze Field",
    city: "Broken Bow",
    country: "US"
  },
  BCB: {
    name: "Virginia Tech/Montgomery Executive Airport",
    city: "Blacksburg",
    country: "US"
  },
  BCE: { name: "Bryce Canyon Airport", city: "Bryce Canyon", country: "US" },
  BCT: { name: "Boca Raton Airport", city: "Boca Raton", country: "US" },
  BDE: { name: "Baudette International Airport", city: "Baudette", country: "US" },
  BDG: { name: "Blanding Municipal Airport", city: "Blanding", country: "US" },
  ILL: { name: "Willmar Municipal/John L Rice Field", city: "Willmar", country: "US" },
  BDL: { name: "Bradley International Airport", city: "Windsor Locks", country: "US" },
  BDR: { name: "Bridgeport/Sikorsky Airport", city: "Bridgeport", country: "US" },
  WBU: { name: "Boulder Municipal Airport", city: "Boulder", country: "US" },
  BEC: { name: "Beech Factory Airport", city: "Wichita", country: "US" },
  BED: { name: "Laurence G Hanscom Field", city: "Bedford", country: "US" },
  BEH: {
    name: "Southwest Michigan Regional Airport",
    city: "Benton Harbor",
    country: "US"
  },
  BFD: { name: "Bradford Regional Airport", city: "Bradford", country: "US" },
  BFF: {
    name: "Scottsbluff/Western Nebraska Regional/Wm  B Heilig Field",
    city: "Scottsbluff",
    country: "US"
  },
  BFI: {
    name: "Boeing Field/King County International Airport",
    city: "Seattle",
    country: "US"
  },
  BFL: { name: "Meadows Field", city: "Bakersfield", country: "US" },
  BFM: { name: "Mobile International Airport", city: "Mobile", country: "US" },
  BFR: { name: "Virgil I Grissom Municipal Airport", city: "Bedford", country: "US" },
  BGD: { name: "Hutchinson County Airport", city: "Borger", country: "US" },
  BGE: { name: "Decatur County Industrial Air Park", city: "Bainbridge", country: "US" },
  BGM: { name: "Greater Binghamton/Edwin A Link Field", city: "Binghamton", country: "US" },
  BGR: { name: "Bangor International Airport", city: "Bangor", country: "US" },
  BHB: { name: "Hancock County/Bar Harbor Airport", city: "Bar Harbor", country: "US" },
  BHM: {
    name: "Birmingham-Shuttlesworth International Airport",
    city: "Birmingham",
    country: "US"
  },
  BID: { name: "Block Island State Airport", city: "Block Island", country: "US" },
  BIE: { name: "Beatrice Municipal Airport", city: "Beatrice", country: "US" },
  BIF: {
    name: "Biggs Army Air Field (Fort Bliss) Airport",
    city: "Fort Bliss/El Paso/",
    country: "US"
  },
  BIH: { name: "Bishop Airport", city: "Bishop", country: "US" },
  BIL: { name: "Billings Logan International Airport", city: "Billings", country: "US" },
  BIS: { name: "Bismarck Municipal Airport", city: "Bismarck", country: "US" },
  BIX: { name: "Keesler Afb Airport", city: "Biloxi", country: "US" },
  BJC: { name: "Rocky Mountain Metro Airport", city: "Denver", country: "US" },
  BJI: { name: "Bemidji Regional Airport", city: "Bemidji", country: "US" },
  BJJ: { name: "Wayne County Airport", city: "Wooster", country: "US" },
  BKD: { name: "Stephens County Airport", city: "Breckenridge", country: "US" },
  BKE: { name: "Baker City Municipal Airport", city: "Baker City", country: "US" },
  BFK: { name: "Buckley Space Force Base Airport", city: "Aurora", country: "US" },
  BKL: { name: "Burke Lakefront Airport", city: "Cleveland", country: "US" },
  BWL: { name: "Blackwell-Tonkawa Municipal Airport", city: "Blackwell", country: "US" },
  BKT: {
    name: "Allan C Perkinson/Blackstone Army Air Field",
    city: "Blackstone",
    country: "US"
  },
  BKW: { name: "Raleigh County Memorial Airport", city: "Beckley", country: "US" },
  BKX: { name: "Brookings Regional Airport", city: "Brookings", country: "US" },
  BLF: { name: "Mercer County Airport", city: "Bluefield", country: "US" },
  BLH: { name: "Blythe Airport", city: "Blythe", country: "US" },
  BLI: { name: "Bellingham International Airport", city: "Bellingham", country: "US" },
  BLM: { name: "Monmouth Executive Airport", city: "Belmar/Farmingdale", country: "US" },
  BLU: { name: "Blue Canyon - Nyack Airport", city: "Emigrant Gap", country: "US" },
  BLV: { name: "Scott Afb/Midamerica St Louis Airport", city: "Belleville", country: "US" },
  BMC: { name: "Brigham City Regional Airport", city: "Brigham City", country: "US" },
  BMG: { name: "Monroe County Airport", city: "Bloomington", country: "US" },
  BMI: {
    name: "Central Il Regional/Bloomington-Normal Airport",
    city: "Bloomington/Normal",
    country: "US"
  },
  BML: { name: "Berlin Regional Airport", city: "Berlin", country: "US" },
  BMT: { name: "Beaumont Municipal Airport", city: "Beaumont", country: "US" },
  BNA: { name: "Nashville International Airport", city: "Nashville", country: "US" },
  BNG: { name: "Banning Municipal Airport", city: "Banning", country: "US" },
  BNL: { name: "Barnwell Regional Airport", city: "Barnwell", country: "US" },
  BNO: { name: "Burns Municipal Airport", city: "Burns", country: "US" },
  BNW: { name: "Boone Municipal Airport", city: "Boone", country: "US" },
  BOI: { name: "Boise Air Trml/Gowen Field", city: "Boise", country: "US" },
  BOK: { name: "Brookings Airport", city: "Brookings", country: "US" },
  BOS: {
    name: "General Edward Lawrence Logan International Airport",
    city: "Boston",
    country: "US"
  },
  BOW: { name: "Bartow Executive Airport", city: "Bartow", country: "US" },
  HCA: { name: "Big Spring/Mc Mahon-Wrinkle Airport", city: "Big Spring", country: "US" },
  BPI: { name: "Miley Memorial Field", city: "Big Piney", country: "US" },
  WMH: { name: "Baxter County Airport", city: "Mountain Home", country: "US" },
  BPT: {
    name: "Jack Brooks Regional Airport",
    city: "Beaumont/Port Arthur",
    country: "US"
  },
  BQK: { name: "Brunswick Golden Isles Airport", city: "Brunswick", country: "US" },
  BRD: { name: "Brainerd Lakes Regional Airport", city: "Brainerd", country: "US" },
  BRL: { name: "Southeast Iowa Regional Airport", city: "Burlington", country: "US" },
  BRO: {
    name: "Brownsville/South Padre Island International Airport",
    city: "Brownsville",
    country: "US"
  },
  BRY: { name: "Samuels Field", city: "Bardstown", country: "US" },
  BTF: { name: "Skypark Airport", city: "Bountiful", country: "US" },
  BTL: {
    name: "Battle Creek Executive At Kellogg Field",
    city: "Battle Creek",
    country: "US"
  },
  BTM: { name: "Bert Mooney Airport", city: "Butte", country: "US" },
  TTO: { name: "Britton Municipal Airport", city: "Britton", country: "US" },
  BTP: { name: "Pittsburgh/Butler Regional Airport", city: "Butler", country: "US" },
  BTR: { name: "Baton Rouge Metro, Ryan Field", city: "Baton Rouge", country: "US" },
  BTV: {
    name: "Patrick Leahy Burlington International Airport",
    city: "Burlington",
    country: "US"
  },
  BTY: { name: "Beatty Airport", city: "Beatty", country: "US" },
  BUB: { name: "Cram Field", city: "Burwell", country: "US" },
  BUF: { name: "Buffalo Niagara International Airport", city: "Buffalo", country: "US" },
  BUM: { name: "Butler Memorial Airport", city: "Butler", country: "US" },
  BUR: { name: "Bob Hope Airport", city: "Burbank", country: "US" },
  BFP: { name: "Beaver County Airport", city: "Beaver Falls", country: "US" },
  BVO: { name: "Bartlesville Municipal Airport", city: "Bartlesville", country: "US" },
  MVW: { name: "Skagit Regional Airport", city: "Burlington/Mount Vernon", country: "US" },
  BLD: { name: "Boulder City Municipal Airport", city: "Boulder City", country: "US" },
  BVX: { name: "Batesville Regional Airport", city: "Batesville", country: "US" },
  BVY: { name: "Beverly Regional Airport", city: "Beverly", country: "US" },
  BWC: { name: "Brawley Municipal Airport", city: "Brawley", country: "US" },
  BWD: { name: "Brownwood Regional Airport", city: "Brownwood", country: "US" },
  BWG: {
    name: "Bowling Green-Warren County Regional Airport",
    city: "Bowling Green",
    country: "US"
  },
  BWI: {
    name: "Baltimore/Washington International Thurgood Marshall Airport",
    city: "Baltimore",
    country: "US"
  },
  WAH: { name: "Harry Stern Airport", city: "Wahpeton", country: "US" },
  BXA: { name: "George R Carr Memorial Air Field", city: "Bogalusa", country: "US" },
  BXK: { name: "Buckeye Municipal Airport", city: "Buckeye", country: "US" },
  NHZ: { name: "Brunswick Executive Airport", city: "Brunswick", country: "US" },
  BYA: { name: "Boundary Airport", city: "Boundary", country: "US" },
  BYG: { name: "Johnson County Airport", city: "Buffalo", country: "US" },
  BYH: { name: "Arkansas International Airport", city: "Blytheville", country: "US" },
  BYI: { name: "Burley Municipal Airport", city: "Burley", country: "US" },
  BYS: { name: "Bicycle Lake Army Air Field", city: "Fort Irwin/Barstow", country: "US" },
  BBC: { name: "Bay City Regional Airport", city: "Bay City", country: "US" },
  BZN: {
    name: "Bozeman Yellowstone International Airport",
    city: "Bozeman",
    country: "US"
  },
  CLG: { name: "New Coalinga Municipal Airport", city: "Coalinga", country: "US" },
  CAD: { name: "Wexford County Airport", city: "Cadillac", country: "US" },
  CAE: { name: "Columbia Metro Airport", city: "Columbia", country: "US" },
  CIG: { name: "Craig-Moffat Airport", city: "Craig", country: "US" },
  CAK: { name: "Akron-Canton Regional Airport", city: "Akron", country: "US" },
  CAO: { name: "Clayton Municipal Airpark", city: "Clayton", country: "US" },
  CAR: { name: "Caribou Municipal Airport", city: "Caribou", country: "US" },
  CBE: { name: "Greater Cumberland Regional Airport", city: "Cumberland", country: "US" },
  CBF: { name: "Council Bluffs Municipal Airport", city: "Council Bluffs", country: "US" },
  CBK: { name: "Shalz Field", city: "Colby", country: "US" },
  CBM: { name: "Columbus Afb Airport", city: "Columbus", country: "US" },
  CCB: { name: "Cable Airport", city: "Upland", country: "US" },
  CCR: { name: "Buchanan Field", city: "Concord", country: "US" },
  CCY: { name: "Northeast Iowa Regional Airport", city: "Charles City", country: "US" },
  LLX: { name: "Caledonia County Airport", city: "Lyndonville", country: "US" },
  CDC: { name: "Cedar City Regional Airport", city: "Cedar City", country: "US" },
  CDH: { name: "Harrell Field", city: "Camden", country: "US" },
  CDK: { name: "George T Lewis Airport", city: "Cedar Key", country: "US" },
  CDN: { name: "Woodward Field", city: "Camden", country: "US" },
  CDR: { name: "Chadron Municipal Airport", city: "Chadron", country: "US" },
  CDS: { name: "Childress Municipal Airport", city: "Childress", country: "US" },
  CDW: { name: "Essex County Airport", city: "Caldwell", country: "US" },
  CEA: { name: "Cessna Acft Field", city: "Wichita", country: "US" },
  CEC: { name: "Jack Mc Namara Field", city: "Crescent City", country: "US" },
  CEF: { name: "Westover Arb/Metro Airport", city: "Springfield/Chicopee", country: "US" },
  CEU: { name: "Oconee County Regional Airport", city: "Clemson", country: "US" },
  CEV: { name: "Mettel Field", city: "Connersville", country: "US" },
  CEW: { name: "Bob Sikes Airport", city: "Crestview", country: "US" },
  CEY: { name: "Kyle-Oakley Field", city: "Murray", country: "US" },
  CEZ: { name: "Cortez Municipal Airport", city: "Cortez", country: "US" },
  CFD: { name: "Coulter Field", city: "Bryan", country: "US" },
  TZC: { name: "Tuscola Area Airport", city: "Caro", country: "US" },
  CFT: { name: "Greenlee County Airport", city: "Clifton/Morenci", country: "US" },
  CFV: { name: "Coffeyville Municipal Airport", city: "Coffeyville", country: "US" },
  CGA: { name: "Craig Seaplane Base", city: "Craig", country: "US" },
  CGE: { name: "Cambridge-Dorchester Regional Airport", city: "Cambridge", country: "US" },
  CGF: { name: "Cuyahoga County Airport", city: "Cleveland", country: "US" },
  CGI: { name: "Cape Girardeau Regional Airport", city: "Cape Girardeau", country: "US" },
  CGS: { name: "College Park Airport", city: "College Park", country: "US" },
  CGZ: { name: "Casa Grande Municipal Airport", city: "Casa Grande", country: "US" },
  CHA: { name: "Lovell Field", city: "Chattanooga", country: "US" },
  CHK: { name: "Chickasha Municipal Airport", city: "Chickasha", country: "US" },
  CHO: {
    name: "Charlottesville-Albemarle Airport",
    city: "Charlottesville",
    country: "US"
  },
  CHP: { name: "Circle Hot Springs Airport", city: "Circle Hot Springs", country: "US" },
  CHS: { name: "Charleston Afb/International Airport", city: "Charleston", country: "US" },
  CIC: { name: "Chico Regional Airport", city: "Chico", country: "US" },
  CID: { name: "The Eastern Iowa Airport", city: "Cedar Rapids", country: "US" },
  CIN: { name: "Arthur N Neu Airport", city: "Carroll", country: "US" },
  CIR: { name: "Cairo Regional Airport", city: "Cairo", country: "US" },
  CIU: {
    name: "Chippewa County International Airport",
    city: "Sault Ste Marie",
    country: "US"
  },
  CKA: { name: "Kegelman Af Aux Field", city: "Cherokee", country: "US" },
  CKB: { name: "North Central West Virginia Airport", city: "Clarksburg", country: "US" },
  GRM: { name: "Grand Marais/Cook County Airport", city: "Grand Marais", country: "US" },
  CKM: { name: "Fletcher Field", city: "Clarksdale", country: "US" },
  CKN: { name: "Crookston Municipal/Kirkwood Field", city: "Crookston", country: "US" },
  CKU: { name: "Cordova Municipal Airport", city: "Cordova", country: "US" },
  CKV: { name: "Outlaw Field", city: "Clarksville", country: "US" },
  CKX: { name: "Chicken Airport", city: "Chicken", country: "US" },
  CLE: {
    name: "Cleveland-Hopkins International Airport",
    city: "Cleveland",
    country: "US"
  },
  CLI: { name: "Clintonville Municipal Airport", city: "Clintonville", country: "US" },
  CLK: { name: "Clinton Regional Airport", city: "Clinton", country: "US" },
  CLL: { name: "Easterwood Field", city: "College Station", country: "US" },
  CLM: {
    name: "William R Fairchild International Airport",
    city: "Port Angeles",
    country: "US"
  },
  CLR: { name: "Cliff Hatfield Memorial Airport", city: "Calipatria", country: "US" },
  CLS: { name: "Chehalis-Centralia Airport", city: "Chehalis", country: "US" },
  CLT: {
    name: "Charlotte/Douglas International Airport",
    city: "Charlotte",
    country: "US"
  },
  CLW: { name: "Clearwater Executive Airport", city: "Clearwater", country: "US" },
  CMH: {
    name: "John Glenn Columbus International Airport",
    city: "Columbus",
    country: "US"
  },
  CMI: {
    name: "University Of Illinois/Willard Airport",
    city: "Champaign/Urbana",
    country: "US"
  },
  CMX: { name: "Houghton County Memorial Airport", city: "Hancock", country: "US" },
  CMY: { name: "Sparta/Fort Mc Coy Airport", city: "Sparta", country: "US" },
  CNH: { name: "Claremont Municipal Airport", city: "Claremont", country: "US" },
  CNK: { name: "Blosser Municipal Airport", city: "Concordia", country: "US" },
  CNM: { name: "Cavern City Air Trml Airport", city: "Carlsbad", country: "US" },
  CNO: { name: "Chino Airport", city: "Chino", country: "US" },
  CNU: { name: "Chanute Martin Johnson Airport", city: "Chanute", country: "US" },
  CNW: { name: "Tstc Waco Airport", city: "Waco", country: "US" },
  CNY: { name: "Canyonlands Regional Airport", city: "Moab", country: "US" },
  COD: { name: "Yellowstone Regional Airport", city: "Cody", country: "US" },
  COE: {
    name: "Coeur D'Alene/Pappy Boyington Field",
    city: "Coeur D'Alene",
    country: "US"
  },
  COF: { name: "Patrick Space Force Base Airport", city: "Cocoa Beach", country: "US" },
  COI: { name: "Merritt Island Airport", city: "Merritt Island", country: "US" },
  COM: { name: "Coleman Municipal Airport", city: "Coleman", country: "US" },
  CON: { name: "Concord Municipal Airport", city: "Concord", country: "US" },
  COS: {
    name: "City Of Colorado Springs Municipal Airport",
    city: "Colorado Springs",
    country: "US"
  },
  COT: { name: "Cotulla-La Salle County Airport", city: "Cotulla", country: "US" },
  COU: { name: "Columbia Regional Airport", city: "Columbia", country: "US" },
  CPM: { name: "Compton/Woodley Airport", city: "Compton", country: "US" },
  CPR: {
    name: "Casper/Natrona County International Airport",
    city: "Casper",
    country: "US"
  },
  CPS: { name: "St Louis Downtown Airport", city: "Cahokia/St Louis", country: "US" },
  HCW: { name: "Cheraw Municipal/Lynch Bellinger Field", city: "Cheraw", country: "US" },
  CRE: { name: "Grand Strand Airport", city: "North Myrtle Beach", country: "US" },
  CRG: {
    name: "Jacksonville Executive At Craig Airport",
    city: "Jacksonville",
    country: "US"
  },
  CRP: {
    name: "Corpus Christi International Airport",
    city: "Corpus Christi",
    country: "US"
  },
  CLD: { name: "Mc Clellan-Palomar Airport", city: "Carlsbad", country: "US" },
  CRS: {
    name: "C David Campbell Field-Corsicana Municipal Airport",
    city: "Corsicana",
    country: "US"
  },
  CRT: { name: "Z M Jack Stell Field", city: "Crossett", country: "US" },
  CRW: {
    name: "West Virginia International Yeager Airport",
    city: "Charleston",
    country: "US"
  },
  CRX: { name: "Roscoe Turner Airport", city: "Corinth", country: "US" },
  CSG: { name: "Columbus Airport", city: "Columbus", country: "US" },
  CSM: { name: "Clinton/Sherman Airport", city: "Burns Flat", country: "US" },
  CSQ: { name: "Creston Municipal Airport", city: "Creston", country: "US" },
  CSV: { name: "Crossville Memorial-Whitson Field", city: "Crossville", country: "US" },
  CTB: { name: "Cut Bank International Airport", city: "Cut Bank", country: "US" },
  CTK: { name: "Ingersoll Airport", city: "Canton", country: "US" },
  CTY: { name: "Cross City Airport", city: "Cross City", country: "US" },
  CTZ: { name: "Clinton-Sampson County Airport", city: "Clinton", country: "US" },
  CUB: { name: "Jim Hamilton L B Owens Airport", city: "Columbia", country: "US" },
  CUH: { name: "Cushing Municipal Airport", city: "Cushing", country: "US" },
  CVG: {
    name: "Cincinnati/Northern Kentucky International Airport",
    city: "Covington",
    country: "US"
  },
  HLI: { name: "Hollister Municipal Airport", city: "Hollister", country: "US" },
  CKK: { name: "Sharp County Regional Airport", city: "Ash Flat", country: "US" },
  CVN: { name: "Clovis Regional Airport", city: "Clovis", country: "US" },
  CVO: { name: "Corvallis Municipal Airport", city: "Corvallis", country: "US" },
  CVS: { name: "Cannon Afb Airport", city: "Clovis", country: "US" },
  CWA: { name: "Central Wisconsin Airport", city: "Mosinee", country: "US" },
  KIP: { name: "Kickapoo Downtown Airport", city: "Wichita Falls", country: "US" },
  CWF: { name: "Chennault International Airport", city: "Lake Charles", country: "US" },
  CWI: { name: "Clinton Municipal Airport", city: "Clinton", country: "US" },
  CXC: { name: "Chitina Airport", city: "Chitina", country: "US" },
  CXL: { name: "Calexico International Airport", city: "Calexico", country: "US" },
  CXO: { name: "Conroe/North Houston Regional Airport", city: "Houston", country: "US" },
  CSN: { name: "Carson City Airport", city: "Carson City", country: "US" },
  HAR: { name: "Capital City Airport", city: "Harrisburg", country: "US" },
  CYS: { name: "Cheyenne Regional/Jerry Olson Field", city: "Cheyenne", country: "US" },
  CZK: { name: "Cascade Locks State Airport", city: "Cascade Locks", country: "US" },
  CZN: { name: "Chisana Airport", city: "Chisana", country: "US" },
  CZO: { name: "Chistochina Airport", city: "Chistochina", country: "US" },
  CZT: { name: "Dimmit County Airport", city: "Carrizo Springs", country: "US" },
  VEX: { name: "Tioga Municipal Airport", city: "Tioga", country: "US" },
  DJN: { name: "Delta Junction Airport", city: "Delta Junction", country: "US" },
  DAA: { name: "Davison Army Air Field", city: "Fort Belvoir", country: "US" },
  DAB: {
    name: "Daytona Beach International Airport",
    city: "Daytona Beach",
    country: "US"
  },
  DAG: { name: "Barstow-Daggett Airport", city: "Daggett", country: "US" },
  DAL: { name: "Dallas Love Field", city: "Dallas", country: "US" },
  DAN: { name: "Danville Regional Airport", city: "Danville", country: "US" },
  DAY: { name: "James M Cox Dayton International Airport", city: "Dayton", country: "US" },
  DBN: { name: "W H 'Bud' Barron Airport", city: "Dublin", country: "US" },
  DBQ: { name: "Dubuque Regional Airport", city: "Dubuque", country: "US" },
  DCA: { name: "Ronald Reagan Washington Ntl Airport", city: "Washington", country: "US" },
  DCU: { name: "Pryor Field Regional Airport", city: "Decatur", country: "US" },
  DDC: { name: "Dodge City Regional Airport", city: "Dodge City", country: "US" },
  DEC: { name: "Decatur Airport", city: "Decatur", country: "US" },
  DEH: { name: "Decorah Municipal Airport", city: "Decorah", country: "US" },
  DEN: { name: "Denver International Airport", city: "Denver", country: "US" },
  DET: { name: "Coleman A Young Municipal Airport", city: "Detroit", country: "US" },
  DFI: { name: "Defiance Memorial Airport", city: "Defiance", country: "US" },
  DFW: {
    name: "Dallas-Fort Worth International Airport",
    city: "Dallas-Fort Worth",
    country: "US"
  },
  DGL: { name: "Douglas Municipal Airport", city: "Douglas", country: "US" },
  DGW: { name: "Converse County Airport", city: "Douglas", country: "US" },
  DHN: { name: "Dothan Regional Airport", city: "Dothan", country: "US" },
  DHT: { name: "Dalhart Municipal Airport", city: "Dalhart", country: "US" },
  DIK: {
    name: "Dickinson/Theodore Roosevelt Regional Airport",
    city: "Dickinson",
    country: "US"
  },
  DKK: { name: "Chautauqua County/Dunkirk Airport", city: "Dunkirk", country: "US" },
  DLL: { name: "Dillon County Airport", city: "Dillon", country: "US" },
  DLF: { name: "Laughlin Afb Airport", city: "Del Rio", country: "US" },
  DLH: { name: "Duluth International Airport", city: "Duluth", country: "US" },
  DLN: { name: "Dillon Airport", city: "Dillon", country: "US" },
  DLS: {
    name: "Columbia Gorge Regional/The Dalles Municipal Airport",
    city: "The Dalles",
    country: "US"
  },
  DMA: { name: "Davis Monthan Afb Airport", city: "Tucson", country: "US" },
  DMN: { name: "Deming Municipal Airport", city: "Deming", country: "US" },
  DMO: { name: "Sedalia Regional Airport", city: "Sedalia", country: "US" },
  DNL: { name: "Daniel Field", city: "Augusta", country: "US" },
  DNN: { name: "Dalton Municipal Airport", city: "Dalton", country: "US" },
  DNS: { name: "Denison Municipal Airport", city: "Denison", country: "US" },
  DNV: { name: "Vermilion Regional Airport", city: "Danville", country: "US" },
  DOV: { name: "Dover Afb Airport", city: "Dover", country: "US" },
  DPA: { name: "Dupage Airport", city: "Chicago/West Chicago", country: "US" },
  DPG: {
    name: "Michael Army Air Field (Dugway Proving Ground) Airport",
    city: "Dugway Proving Ground",
    country: "US"
  },
  DRI: { name: "Beauregard Regional Airport", city: "De Ridder", country: "US" },
  DRE: { name: "Drummond Island Airport", city: "Drummond Island", country: "US" },
  DRO: { name: "Durango-La Plata County Airport", city: "Durango", country: "US" },
  DRT: { name: "Del Rio International Airport", city: "Del Rio", country: "US" },
  DSM: { name: "Des Moines International Airport", city: "Des Moines", country: "US" },
  DSV: { name: "Dansville Municipal Airport", city: "Dansville", country: "US" },
  DTA: { name: "Delta Municipal Airport", city: "Delta", country: "US" },
  DTL: { name: "Detroit Lakes/Wething Field", city: "Detroit Lakes", country: "US" },
  DTN: { name: "Shreveport Downtown Airport", city: "Shreveport", country: "US" },
  DSI: { name: "Destin Executive Airport", city: "Destin", country: "US" },
  DTW: { name: "Detroit Metro Wayne County Airport", city: "Detroit", country: "US" },
  DUA: { name: "Durant Regional/Eaker Field", city: "Durant", country: "US" },
  DUC: { name: "Halliburton Field", city: "Duncan", country: "US" },
  DUG: {
    name: "Bisbee Douglas International Airport",
    city: "Douglas Bisbee",
    country: "US"
  },
  DUJ: { name: "Dubois Regional Airport", city: "Dubois", country: "US" },
  DVL: { name: "Devils Lake Regional Airport", city: "Devils Lake", country: "US" },
  DVN: { name: "Davenport Municipal Airport", city: "Davenport", country: "US" },
  NOT: { name: "Gnoss Field", city: "Novato", country: "US" },
  NSL: { name: "Slayton Municipal Airport", city: "Slayton", country: "US" },
  DVT: { name: "Phoenix Deer Valley Airport", city: "Phoenix", country: "US" },
  DWH: { name: "David Wayne Hooks Memorial Airport", city: "Houston", country: "US" },
  DXR: { name: "Danbury Municipal Airport", city: "Danbury", country: "US" },
  DYL: { name: "Doylestown Airport", city: "Doylestown", country: "US" },
  DYS: { name: "Dyess Afb Airport", city: "Abilene", country: "US" },
  MIF: { name: "Roy Hurd Memorial Airport", city: "Monahans", country: "US" },
  CCG: { name: "Crane County Airport", city: "Crane", country: "US" },
  ESO: { name: "Ohkay Owingeh Airport", city: "Espanola", country: "US" },
  WTR: { name: "Whiteriver Airport", city: "Whiteriver", country: "US" },
  ALE: { name: "Alpine-Casparis Municipal Airport", city: "Alpine", country: "US" },
  BGT: { name: "Bagdad Airport", city: "Bagdad", country: "US" },
  EAN: { name: "Phifer Airfield", city: "Wheatland", country: "US" },
  EAR: { name: "Kearney Regional Airport", city: "Kearney", country: "US" },
  EAT: { name: "Pangborn Memorial Airport", city: "Wenatchee", country: "US" },
  EAU: { name: "Chippewa Valley Regional Airport", city: "Eau Claire", country: "US" },
  EBS: { name: "Webster City Municipal Airport", city: "Webster City", country: "US" },
  ECG: {
    name: "Elizabeth City Cg Air Station/Regional Airport",
    city: "Elizabeth City",
    country: "US"
  },
  ECP: {
    name: "Northwest Florida Beaches International Airport",
    city: "Panama City",
    country: "US"
  },
  ECS: { name: "Mondell Field", city: "Newcastle", country: "US" },
  EDC: { name: "Austin Executive Airport", city: "Austin", country: "US" },
  EDE: { name: "Northeastern Regional Airport", city: "Edenton", country: "US" },
  ETS: { name: "Enterprise Municipal Airport", city: "Enterprise", country: "US" },
  EDW: { name: "Edwards Afb Airport", city: "Edwards", country: "US" },
  EED: { name: "Needles Airport", city: "Needles", country: "US" },
  EEN: { name: "Dillant/Hopkins Airport", city: "Keene", country: "US" },
  EFD: { name: "Ellington Airport", city: "Houston", country: "US" },
  EFK: { name: "Northeast Kingdom International Airport", city: "Newport", country: "US" },
  EFW: { name: "Jefferson Municipal Airport", city: "Jefferson", country: "US" },
  EGE: { name: "Eagle County Regional Airport", city: "Eagle", country: "US" },
  EGI: { name: "Duke Field,(Eglin Af Aux Nr 3) Airport", city: "Crestview", country: "US" },
  EGV: { name: "Eagle River Union Airport", city: "Eagle River", country: "US" },
  EKA: { name: "Murray Field", city: "Eureka", country: "US" },
  EKI: { name: "Elkhart Municipal Airport", city: "Elkhart", country: "US" },
  EKN: {
    name: "Elkins/Randolph County (Jennings Randolph Field) Airport",
    city: "Elkins",
    country: "US"
  },
  EKO: { name: "Elko Regional Airport", city: "Elko", country: "US" },
  EKX: { name: "Addington Field", city: "Elizabethtown", country: "US" },
  ELA: { name: "Eagle Lake Airport", city: "Eagle Lake", country: "US" },
  ELD: {
    name: "South Arkansas Regional At Goodwin Field",
    city: "El Dorado",
    country: "US"
  },
  ELK: { name: "Elk City Regional Business Airport", city: "Elk City", country: "US" },
  ELM: { name: "Elmira/Corning Regional Airport", city: "Elmira/Corning", country: "US" },
  ELN: { name: "Bowers Field", city: "Ellensburg", country: "US" },
  LYU: { name: "Ely Municipal Airport", city: "Ely", country: "US" },
  ELP: { name: "El Paso International Airport", city: "El Paso", country: "US" },
  ELY: { name: "Ely/Yelland Field", city: "Ely", country: "US" },
  ELZ: { name: "Wellsville Municipal/Tarantine Field", city: "Wellsville", country: "US" },
  EMM: { name: "Kemmerer Municipal Airport", city: "Kemmerer", country: "US" },
  EMP: { name: "Emporia Municipal Airport", city: "Emporia", country: "US" },
  EMT: { name: "San Gabriel Valley Airport", city: "El Monte", country: "US" },
  END: { name: "Vance Afb Airport", city: "Enid", country: "US" },
  ENL: { name: "Centralia Municipal Airport", city: "Centralia", country: "US" },
  ENV: { name: "Wendover Airport", city: "Wendover", country: "US" },
  ENW: { name: "Kenosha Regional Airport", city: "Kenosha", country: "US" },
  EOK: { name: "Keokuk Municipal Airport", city: "Keokuk", country: "US" },
  EOS: { name: "Neosho Hugh Robinson Airport", city: "Neosho", country: "US" },
  EPH: { name: "Ephrata Municipal Airport", city: "Ephrata", country: "US" },
  EDK: {
    name: "El Dorado/Capt Jack Thomas Memorial Airport",
    city: "El Dorado",
    country: "US"
  },
  ERI: { name: "Erie International/Tom Ridge Field", city: "Erie", country: "US" },
  ERR: { name: "Errol Airport", city: "Errol", country: "US" },
  ERV: {
    name: "Kerrville Municipal/Louis Schreiner Field",
    city: "Kerrville",
    country: "US"
  },
  ESC: { name: "Delta County Airport", city: "Escanaba", country: "US" },
  ESF: { name: "Esler Regional Airport", city: "Alexandria", country: "US" },
  ESN: { name: "Easton/Newnam Field", city: "Easton", country: "US" },
  EST: { name: "Estherville Municipal Airport", city: "Estherville", country: "US" },
  ESW: { name: "Easton State Airport", city: "Easton", country: "US" },
  ETB: { name: "West Bend Municipal Airport", city: "West Bend", country: "US" },
  ETN: { name: "Eastland Municipal Airport", city: "Eastland", country: "US" },
  EUF: { name: "Weedon Field", city: "Eufaula", country: "US" },
  EUG: { name: "Mahlon Sweet Field", city: "Eugene", country: "US" },
  EVM: { name: "Eveleth/Virginia Municipal Airport", city: "Eveleth", country: "US" },
  EVV: { name: "Evansville Regional Airport", city: "Evansville", country: "US" },
  EVW: { name: "Evanston-Uinta County Burns Field", city: "Evanston", country: "US" },
  EWB: { name: "New Bedford Regional Airport", city: "New Bedford", country: "US" },
  EWK: { name: "Newton-City-County Airport", city: "Newton", country: "US" },
  EWN: { name: "Coastal Carolina Regional Airport", city: "New Bern", country: "US" },
  EWR: { name: "Newark Liberty International Airport", city: "Newark", country: "US" },
  EYW: { name: "Key West International Airport", city: "Key West", country: "US" },
  WIB: { name: "Wilbarger County Airport", city: "Vernon", country: "US" },
  RGR: { name: "Ranger Municipal Airport", city: "Ranger", country: "US" },
  RBK: { name: "French Valley Airport", city: "Murrieta/Temecula", country: "US" },
  FAF: { name: "Felker Army Air Field", city: "Fort Eustis", country: "US" },
  FAM: { name: "Farmington Regional Airport", city: "Farmington", country: "US" },
  FAR: { name: "Hector International Airport", city: "Fargo", country: "US" },
  FAT: { name: "Fresno Yosemite International Airport", city: "Fresno", country: "US" },
  FAY: { name: "Fayetteville Regional/Grannis Field", city: "Fayetteville", country: "US" },
  FBG: { name: "Simmons Army Air Field", city: "Fort Bragg", country: "US" },
  FBL: {
    name: "Faribault Municipal-Liz Wall Strohfus Field",
    city: "Faribault",
    country: "US"
  },
  FBR: { name: "Fort Bridger Airport", city: "Fort Bridger", country: "US" },
  FBY: { name: "Fairbury Municipal Airport", city: "Fairbury", country: "US" },
  FCH: { name: "Fresno Chandler Executive Airport", city: "Fresno", country: "US" },
  FCM: { name: "Flying Cloud Airport", city: "Minneapolis", country: "US" },
  FCS: {
    name: "Butts Army Air Field (Fort Carson) Airport",
    city: "Fort Carson",
    country: "US"
  },
  FCY: { name: "Hutfly Airport", city: "Forrest City", country: "US" },
  FDK: { name: "Frederick Municipal Airport", city: "Frederick", country: "US" },
  FDR: { name: "Frederick Regional Airport", city: "Frederick", country: "US" },
  FDY: { name: "Findlay Airport", city: "Findlay", country: "US" },
  FEP: { name: "Albertus Airport", city: "Freeport", country: "US" },
  FET: { name: "Fremont Municipal Airport", city: "Fremont", country: "US" },
  FFA: { name: "First Flight Airport", city: "Kill Devil Hills", country: "US" },
  FFL: { name: "Fairfield Municipal Airport", city: "Fairfield", country: "US" },
  FFM: { name: "Fergus Falls Regional Airport", city: "Fergus Falls", country: "US" },
  FFO: { name: "Wright-Patterson Afb Airport", city: "Dayton", country: "US" },
  FFT: { name: "Capital City Airport", city: "Frankfort", country: "US" },
  MSC: { name: "Falcon Field", city: "Mesa", country: "US" },
  FRD: { name: "Friday Harbor Airport", city: "Friday Harbor", country: "US" },
  FHU: {
    name: "Sierra Vista Municipal-Libby Army Air Field",
    city: "Fort Huachuca Sierra Vista",
    country: "US"
  },
  FKL: { name: "Venango Regional Airport", city: "Franklin", country: "US" },
  FKN: { name: "Franklin Regional Airport", city: "Franklin", country: "US" },
  FLD: { name: "Fond Du Lac County Airport", city: "Fond Du Lac", country: "US" },
  FLG: { name: "Flagstaff Pulliam Airport", city: "Flagstaff", country: "US" },
  FLL: {
    name: "Fort Lauderdale/Hollywood International Airport",
    city: "Fort Lauderdale",
    country: "US"
  },
  FLO: { name: "Florence Regional Airport", city: "Florence", country: "US" },
  FLP: { name: "Marion County Regional Airport", city: "Flippin", country: "US" },
  FLT: { name: "Flat Airport", city: "Flat", country: "US" },
  FLV: { name: "Sherman Army Air Field", city: "Fort Leavenworth", country: "US" },
  FLX: { name: "Fallon Municipal Airport", city: "Fallon", country: "US" },
  FME: {
    name: "Fort Meade Executive Airport",
    city: "Fort Meade (Odenton)",
    country: "US"
  },
  FMH: { name: "Cape Cod Coast Guard Air Station", city: "Falmouth", country: "US" },
  FMN: { name: "Four Corners Regional Airport", city: "Farmington", country: "US" },
  FMY: { name: "Page Field", city: "Fort Myers", country: "US" },
  FNL: {
    name: "Northern Colorado Regional Airport",
    city: "Fort Collins/Loveland",
    country: "US"
  },
  FNT: { name: "Bishop International Airport", city: "Flint", country: "US" },
  FOD: { name: "Fort Dodge Regional Airport", city: "Fort Dodge", country: "US" },
  FOE: { name: "Topeka Regional Airport", city: "Topeka", country: "US" },
  FOK: { name: "Francis S Gabreski Airport", city: "Westhampton Beach", country: "US" },
  FIL: { name: "Fillmore Municipal Airport", city: "Fillmore", country: "US" },
  FPR: { name: "Treasure Coast International Airport", city: "Fort Pierce", country: "US" },
  FPY: { name: "Perry-Foley Airport", city: "Perry", country: "US" },
  FRG: { name: "Republic Airport", city: "Farmingdale", country: "US" },
  FRH: { name: "French Lick Municipal Airport", city: "French Lick", country: "US" },
  FRI: {
    name: "Marshall Army Air Field",
    city: "Fort Riley (Junction City)",
    country: "US"
  },
  FRM: { name: "Fairmont Municipal Airport", city: "Fairmont", country: "US" },
  FRR: { name: "Front Royal-Warren County Airport", city: "Front Royal", country: "US" },
  FSD: { name: "Joe Foss Field", city: "Sioux Falls", country: "US" },
  FSI: {
    name: "Henry Post Army Air Field (Fort Sill) Airport",
    city: "Fort Sill",
    country: "US"
  },
  FSK: { name: "Fort Scott Municipal Airport", city: "Fort Scott", country: "US" },
  FSM: { name: "Fort Smith Regional Airport", city: "Fort Smith", country: "US" },
  FST: { name: "Fort Stockton-Pecos County Airport", city: "Fort Stockton", country: "US" },
  FSU: { name: "Fort Sumner Municipal Airport", city: "Fort Sumner", country: "US" },
  FMS: { name: "Fort Madison Municipal Airport", city: "Fort Madison", country: "US" },
  FTK: { name: "Godman Army Air Field", city: "Fort Knox", country: "US" },
  FTW: {
    name: "Fort Worth Meacham International Airport",
    city: "Fort Worth",
    country: "US"
  },
  FTY: {
    name: "Fulton County Executive/Charlie Brown Field",
    city: "Atlanta",
    country: "US"
  },
  FUL: { name: "Fullerton Municipal Airport", city: "Fullerton", country: "US" },
  WFK: { name: "Northern Aroostook Regional Airport", city: "Frenchville", country: "US" },
  FWA: { name: "Fort Wayne International Airport", city: "Fort Wayne", country: "US" },
  FXE: {
    name: "Fort Lauderdale Executive Airport",
    city: "Fort Lauderdale",
    country: "US"
  },
  FXY: { name: "Forest City Municipal/Trimble Field", city: "Forest City", country: "US" },
  FYM: { name: "Fayetteville Municipal Airport", city: "Fayetteville", country: "US" },
  FYV: { name: "Drake Field", city: "Fayetteville", country: "US" },
  GAB: { name: "Gabbs Airport", city: "Gabbs", country: "US" },
  GAD: { name: "Northeast Alabama Regional Airport", city: "Gadsden", country: "US" },
  GAG: { name: "Gage Airport", city: "Gage", country: "US" },
  GAI: { name: "Montgomery County Airpark", city: "Gaithersburg", country: "US" },
  GBD: { name: "Great Bend Municipal Airport", city: "Great Bend", country: "US" },
  GBG: {
    name: "Harrel W Timmons Galesburg Regional Airport",
    city: "Galesburg",
    country: "US"
  },
  GBR: { name: "Great Barrington Airport", city: "Great Barrington", country: "US" },
  GCC: { name: "Northeast Wyoming Regional Airport", city: "Gillette", country: "US" },
  JDA: { name: "Grant County Regional/Ogilvie Field", city: "John Day", country: "US" },
  GCK: { name: "Garden City Regional Airport", city: "Garden City", country: "US" },
  GCN: { name: "Grand Canyon Ntl Park Airport", city: "Grand Canyon", country: "US" },
  GCY: { name: "Greeneville Municipal Airport", city: "Greeneville", country: "US" },
  GDM: { name: "Gardner Municipal Airport", city: "Gardner", country: "US" },
  GDV: { name: "Dawson Community Airport", city: "Glendive", country: "US" },
  GDW: { name: "Gladwin Zettel Memorial Airport", city: "Gladwin", country: "US" },
  GED: { name: "Delaware Coastal Airport", city: "Georgetown", country: "US" },
  GEG: { name: "Spokane International Airport", city: "Spokane", country: "US" },
  GEY: { name: "South Big Horn County Airport", city: "Greybull", country: "US" },
  GFD: { name: "Pope Field", city: "Greenfield", country: "US" },
  GFK: { name: "Grand Forks International Airport", city: "Grand Forks", country: "US" },
  GFL: { name: "Floyd Bennett Memorial Airport", city: "Glens Falls", country: "US" },
  GGE: { name: "Georgetown County Airport", city: "Georgetown", country: "US" },
  GGG: { name: "East Texas Regional Airport", city: "Longview", country: "US" },
  GGW: {
    name: "Wokal Field/Glasgow-Valley County Airport",
    city: "Glasgow",
    country: "US"
  },
  GHM: { name: "Centerville Municipal Airport", city: "Centerville", country: "US" },
  IDH: { name: "Idaho County Airport", city: "Grangeville", country: "US" },
  GIF: { name: "Winter Haven Regional Airport", city: "Winter Haven", country: "US" },
  GJT: { name: "Grand Junction Regional Airport", city: "Grand Junction", country: "US" },
  MEJ: { name: "Port Meadville Airport", city: "Meadville", country: "US" },
  GKT: { name: "Gatlinburg-Pigeon Forge Airport", city: "Sevierville", country: "US" },
  GLD: { name: "Renner Field/Goodland Municipal Airport", city: "Goodland", country: "US" },
  GLE: { name: "Gainesville Municipal Airport", city: "Gainesville", country: "US" },
  GLH: { name: "Greenville Mid-Delta Airport", city: "Greenville", country: "US" },
  GLR: { name: "Gaylord Regional Airport", city: "Gaylord", country: "US" },
  GLS: {
    name: "Scholes International At Galveston Airport",
    city: "Galveston",
    country: "US"
  },
  GLW: { name: "Glasgow Municipal Airport", city: "Glasgow", country: "US" },
  GMU: { name: "Greenville Downtown Airport", city: "Greenville", country: "US" },
  GNG: { name: "Gooding Municipal Airport", city: "Gooding", country: "US" },
  GNT: { name: "Grants-Milan Municipal Airport", city: "Grants", country: "US" },
  GNU: { name: "Goodnews Airport", city: "Goodnews", country: "US" },
  GNV: { name: "Gainesville Regional Airport", city: "Gainesville", country: "US" },
  GOK: { name: "Guthrie/Edmond Regional Airport", city: "Guthrie", country: "US" },
  GON: { name: "Groton-New London Airport", city: "Groton (New London)", country: "US" },
  FCA: { name: "Glacier Park International Airport", city: "Kalispell", country: "US" },
  GPT: { name: "Gulfport-Biloxi International Airport", city: "Gulfport", country: "US" },
  GPZ: {
    name: "Grand Rapids/Itasca County-Gordon Newstrom Field",
    city: "Grand Rapids",
    country: "US"
  },
  GQQ: { name: "Galion Municipal Airport", city: "Galion", country: "US" },
  GRB: {
    name: "Green Bay/Austin Straubel International Airport",
    city: "Green Bay",
    country: "US"
  },
  GRD: { name: "Greenwood County Airport", city: "Greenwood", country: "US" },
  GRE: { name: "Greenville Airport", city: "Greenville", country: "US" },
  GRF: {
    name: "Gray Army Air Field (Joint Base Lewis-Mcchord) Airport",
    city: "Fort Lewis/Tacoma",
    country: "US"
  },
  GRI: { name: "Central Nebraska Regional Airport", city: "Grand Island", country: "US" },
  GRK: { name: "Robert Gray Army Air Field", city: "Fort Hood (Killeen)", country: "US" },
  GRN: { name: "Gordon Municipal Airport", city: "Gordon", country: "US" },
  GRR: { name: "Gerald R Ford International Airport", city: "Grand Rapids", country: "US" },
  GSB: { name: "Seymour Johnson Afb Airport", city: "Goldsboro", country: "US" },
  GSH: { name: "Goshen Municipal Airport", city: "Goshen", country: "US" },
  GSO: { name: "Piedmont Triad International Airport", city: "Greensboro", country: "US" },
  GSP: {
    name: "Greenville Spartanburg International Airport",
    city: "Greer",
    country: "US"
  },
  GTF: { name: "Great Falls International Airport", city: "Great Falls", country: "US" },
  GTG: { name: "Grantsburg Municipal Airport", city: "Grantsburg", country: "US" },
  GTR: {
    name: "Golden Triangle Regional Airport",
    city: "Columbus/W Point/Starkville",
    country: "US"
  },
  GUC: { name: "Gunnison-Crested Butte Regional Airport", city: "Gunnison", country: "US" },
  GUP: { name: "Gallup Municipal Airport", city: "Gallup", country: "US" },
  GUS: { name: "Grissom Arb Airport", city: "Peru", country: "US" },
  GUY: { name: "Guymon Municipal Airport", city: "Guymon", country: "US" },
  GVE: { name: "Gordonsville Municipal Airport", city: "Gordonsville", country: "US" },
  GVL: { name: "Lee Gilmer Memorial Airport", city: "Gainesville", country: "US" },
  GVT: { name: "Majors Airport", city: "Greenville", country: "US" },
  GWO: { name: "Greenwood-Leflore Airport", city: "Greenwood", country: "US" },
  GWS: { name: "Kgws Sumers Airpark", city: "Glenwood Springs", country: "US" },
  GXY: { name: "Greeley-Weld County Airport", city: "Greeley", country: "US" },
  GDC: { name: "Donaldson Field", city: "Greenville", country: "US" },
  PNX: {
    name: "North Texas Regional/Perrin Field",
    city: "Sherman/Denison",
    country: "US"
  },
  GYR: { name: "Phoenix Goodyear Airport", city: "Goodyear", country: "US" },
  GYY: { name: "Gary/Chicago International Airport", city: "Gary/Chicago", country: "US" },
  HAB: { name: "Marion County-Rankin Fite Airport", city: "Hamilton", country: "US" },
  HAF: { name: "Half Moon Bay Airport", city: "Half Moon Bay", country: "US" },
  HAI: {
    name: "Three Rivers Municipal/Dr Haines Airport",
    city: "Three Rivers",
    country: "US"
  },
  HAO: { name: "Butler County Regional/Hogan Field", city: "Hamilton", country: "US" },
  HBG: {
    name: "Hattiesburg Bobby L Chain Municipal Airport",
    city: "Hattiesburg",
    country: "US"
  },
  HBR: { name: "Hobart Regional Airport", city: "Hobart", country: "US" },
  HDE: { name: "Brewster Field", city: "Holdrege", country: "US" },
  HDN: { name: "Yampa Valley Airport", city: "Hayden", country: "US" },
  HEE: { name: "Thompson-Robbins Airport", city: "Helena/West Helena", country: "US" },
  MNZ: { name: "Manassas Regional/Harry P Davis Field", city: "Washington", country: "US" },
  HEZ: {
    name: "Hardy-Anders Field/Natchez-Adams County Airport",
    city: "Natchez",
    country: "US"
  },
  HFD: { name: "Hartford-Brainard Airport", city: "Hartford", country: "US" },
  HFF: { name: "Mackall Army Air Field", city: "Camp Mackall", country: "US" },
  HGR: {
    name: "Hagerstown Regional/Richard A Henson Field",
    city: "Hagerstown",
    country: "US"
  },
  HHR: {
    name: "Jack Northrop Field/Hawthorne Municipal Airport",
    city: "Hawthorne",
    country: "US"
  },
  HUJ: { name: "Stan Stamper Municipal Airport", city: "Hugo", country: "US" },
  HIB: { name: "Range Regional Airport", city: "Hibbing", country: "US" },
  HIE: { name: "Mount Washington Regional Airport", city: "Whitefield", country: "US" },
  HIF: { name: "Hill Afb Airport", city: "Ogden", country: "US" },
  HII: { name: "Lake Havasu City Airport", city: "Lake Havasu City", country: "US" },
  HIO: { name: "Portland-Hillsboro Airport", city: "Portland", country: "US" },
  HKA: { name: "Blytheville Municipal Airport", city: "Blytheville", country: "US" },
  HKS: { name: "Hawkins Field", city: "Jackson", country: "US" },
  HKY: { name: "Hickory Regional Airport", city: "Hickory", country: "US" },
  HLB: { name: "Batesville Airport", city: "Batesville", country: "US" },
  HLC: { name: "Hill City Municipal Airport", city: "Hill City", country: "US" },
  HLG: { name: "Wheeling Ohio County Airport", city: "Wheeling", country: "US" },
  HLN: { name: "Helena Regional Airport", city: "Helena", country: "US" },
  HLR: { name: "Yoakum-Defrenn Army Heliport", city: "Fort Hood (Killeen)", country: "US" },
  HMN: { name: "Holloman Afb Airport", city: "Alamogordo", country: "US" },
  HMT: { name: "Hemet-Ryan Airport", city: "Hemet", country: "US" },
  HNB: { name: "Huntingburg Airport", city: "Huntingburg", country: "US" },
  HSH: { name: "Henderson Executive Airport", city: "Las Vegas", country: "US" },
  HOB: { name: "Lea County Regional Airport", city: "Hobbs", country: "US" },
  HON: { name: "Huron Regional Airport", city: "Huron", country: "US" },
  HOP: {
    name: "Campbell Army Air Field (Fort Campbell) Airport",
    city: "Fort Campbell/Hopkinsville",
    country: "US"
  },
  HOT: { name: "Memorial Field", city: "Hot Springs", country: "US" },
  HOU: { name: "William P Hobby Airport", city: "Houston", country: "US" },
  HPN: { name: "Westchester County Airport", city: "White Plains", country: "US" },
  HPT: { name: "Hampton Municipal Airport", city: "Hampton", country: "US" },
  HPY: { name: "Baytown Airport", city: "Baytown", country: "US" },
  HQM: { name: "Bowerman Field", city: "Hoquiam", country: "US" },
  HES: { name: "Hermiston Municipal Airport", city: "Hermiston", country: "US" },
  HRL: { name: "Valley International Airport", city: "Harlingen", country: "US" },
  HRO: { name: "Boone County Airport", city: "Harrison", country: "US" },
  HSB: { name: "Harrisburg-Raleigh Airport", city: "Harrisburg", country: "US" },
  HNC: { name: "Billy Mitchell Airport", city: "Hatteras", country: "US" },
  THP: { name: "Hot Springs County Airport", city: "Thermopolis", country: "US" },
  HSI: { name: "Hastings Municipal Airport", city: "Hastings", country: "US" },
  HSP: { name: "Ingalls Field", city: "Hot Springs", country: "US" },
  HST: { name: "Homestead Arb Airport", city: "Homestead", country: "US" },
  HSV: {
    name: "Huntsville International-Carl T Jones Field",
    city: "Huntsville",
    country: "US"
  },
  HTH: { name: "Hawthorne Industrial Airport", city: "Hawthorne", country: "US" },
  HTL: {
    name: "Roscommon County/Blodgett Memorial Airport",
    city: "Houghton Lake",
    country: "US"
  },
  HTS: { name: "Tri-State/Milton J Ferguson Field", city: "Huntington", country: "US" },
  HTW: {
    name: "Lawrence County Airpark",
    city: "Chesapeake/Huntington Wva",
    country: "US"
  },
  HUA: {
    name: "Redstone Army Air Field",
    city: "Redstone Arsnl Huntsville",
    country: "US"
  },
  HUF: { name: "Terre Haute Regional Airport", city: "Terre Haute", country: "US" },
  HUL: { name: "Houlton International Airport", city: "Houlton", country: "US" },
  HUM: { name: "Houma-Terrebonne Airport", city: "Houma", country: "US" },
  HUT: { name: "Hutchinson Regional Airport", city: "Hutchinson", country: "US" },
  HVE: { name: "Hanksville Airport", city: "Hanksville", country: "US" },
  HVN: { name: "Tweed/New Haven Airport", city: "New Haven", country: "US" },
  HVR: { name: "Havre City-County Airport", city: "Havre", country: "US" },
  HVS: { name: "Hartsville Regional Airport", city: "Hartsville", country: "US" },
  HWD: { name: "Hayward Executive Airport", city: "Hayward", country: "US" },
  HWO: { name: "North Perry Airport", city: "Hollywood", country: "US" },
  WSH: { name: "Brookhaven Airport", city: "Shirley", country: "US" },
  HHH: { name: "Hilton Head Airport", city: "Hilton Head Island", country: "US" },
  HYA: { name: "Cape Cod Gateway Airport", city: "Hyannis", country: "US" },
  HYL: { name: "Clark Bay Seaplane Base", city: "Hollis", country: "US" },
  HYR: { name: "Sawyer County Airport", city: "Hayward", country: "US" },
  HYS: { name: "Hays Regional Airport", city: "Hays", country: "US" },
  HZL: { name: "Hazleton Regional Airport", city: "Hazleton", country: "US" },
  JFN: { name: "Northeast Ohio Regional Airport", city: "Ashtabula", country: "US" },
  OTN: { name: "Ed-Air Airport", city: "Oaktown", country: "US" },
  IAB: { name: "Mc Connell Afb Airport", city: "Wichita", country: "US" },
  IAD: {
    name: "Washington Dulles International Airport",
    city: "Washington",
    country: "US"
  },
  IAG: {
    name: "Niagara Falls International Airport",
    city: "Niagara Falls",
    country: "US"
  },
  IAH: { name: "George Bush Intcntl/Houston Airport", city: "Houston", country: "US" },
  ICL: { name: "Schenck Field", city: "Clarinda", country: "US" },
  ICT: { name: "Wichita Dwight D Eisenhower Ntl Airport", city: "Wichita", country: "US" },
  IDA: { name: "Idaho Falls Regional Airport", city: "Idaho Falls", country: "US" },
  IDG: { name: "Ida Grove Municipal Airport", city: "Ida Grove", country: "US" },
  IDI: { name: "Indiana County/Jimmy Stewart Field", city: "Indiana", country: "US" },
  IDP: { name: "Independence Municipal Airport", city: "Independence", country: "US" },
  XPR: { name: "Pine Ridge Airport", city: "Pine Ridge", country: "US" },
  IFA: { name: "Iowa Falls Municipal Airport", city: "Iowa Falls", country: "US" },
  IFP: {
    name: "Laughlin/Bullhead International Airport",
    city: "Bullhead City",
    country: "US"
  },
  IGM: { name: "Kingman Airport", city: "Kingman", country: "US" },
  IJX: { name: "Jacksonville Municipal Airport", city: "Jacksonville", country: "US" },
  IKK: { name: "Greater Kankakee Airport", city: "Kankakee", country: "US" },
  ILE: { name: "Skylark Field", city: "Killeen", country: "US" },
  ILG: { name: "New Castle Airport", city: "Wilmington", country: "US" },
  ILM: { name: "Wilmington International Airport", city: "Wilmington", country: "US" },
  ILN: { name: "Wilmington Air Park", city: "Wilmington", country: "US" },
  IML: { name: "Imperial Municipal Airport", city: "Imperial", country: "US" },
  IMM: { name: "Immokalee Regional Airport", city: "Immokalee", country: "US" },
  MDN: { name: "Madison Regional Airport", city: "Madison", country: "US" },
  IMT: { name: "Ford Airport", city: "Iron Mountain Kingsford", country: "US" },
  IND: { name: "Indianapolis International Airport", city: "Indianapolis", country: "US" },
  INK: { name: "Winkler County Airport", city: "Wink", country: "US" },
  INL: {
    name: "Falls International/Einarson Field",
    city: "International Falls",
    country: "US"
  },
  INS: { name: "Creech Afb Airport", city: "Indian Springs", country: "US" },
  INT: { name: "Smith Reynolds Airport", city: "Winston Salem", country: "US" },
  INW: { name: "Winslow-Lindbergh Regional Airport", city: "Winslow", country: "US" },
  IOW: { name: "Iowa City Municipal Airport", city: "Iowa City", country: "US" },
  IPL: { name: "Imperial County Airport", city: "Imperial", country: "US" },
  IPT: { name: "Williamsport Regional Airport", city: "Williamsport", country: "US" },
  IRK: { name: "Kirksville Regional Airport", city: "Kirksville", country: "US" },
  IRS: { name: "Kirsch Municipal Airport", city: "Sturgis", country: "US" },
  ISM: { name: "Kissimmee Gateway Airport", city: "Orlando", country: "US" },
  ISO: {
    name: "Kinston Regional Jetport At Stallings Field",
    city: "Kinston",
    country: "US"
  },
  ISP: { name: "Long Island Mac Arthur Airport", city: "New York", country: "US" },
  ISQ: { name: "Schoolcraft County Airport", city: "Manistique", country: "US" },
  ISW: {
    name: "Alexander Field South Wood County Airport",
    city: "Wisconsin Rapids",
    country: "US"
  },
  ITH: { name: "Ithaca Tompkins International Airport", city: "Ithaca", country: "US" },
  AZA: { name: "Mesa Gateway Airport", city: "Phoenix", country: "US" },
  IWD: { name: "Gogebic/Iron County Airport", city: "Ironwood", country: "US" },
  ISS: { name: "Wiscasset Airport", city: "Wiscasset", country: "US" },
  IWS: { name: "West Houston Airport", city: "Houston", country: "US" },
  RZZ: {
    name: "Halifax/Northampton Regional Airport",
    city: "Roanoke Rapids",
    country: "US"
  },
  JCI: { name: "New Century Aircenter Airport", city: "Olathe", country: "US" },
  IYK: { name: "Inyokern Airport", city: "Inyokern", country: "US" },
  SQA: { name: "Santa Ynez/Kunkle Field", city: "Santa Ynez", country: "US" },
  FRY: { name: "White Mountain Regional Airport", city: "Fryeburg", country: "US" },
  JAC: { name: "Jackson Hole Airport", city: "Jackson", country: "US" },
  JAN: {
    name: "Jackson-Medgar Wiley Evers International Airport",
    city: "Jackson",
    country: "US"
  },
  JAS: { name: "Jasper County/Bell Field", city: "Jasper", country: "US" },
  JAX: { name: "Jacksonville International Airport", city: "Jacksonville", country: "US" },
  JBR: { name: "Jonesboro Municipal Airport", city: "Jonesboro", country: "US" },
  JCT: { name: "Kimble County Airport", city: "Junction", country: "US" },
  JDN: { name: "Jordan Airport", city: "Jordan", country: "US" },
  JEF: { name: "Jefferson City Memorial Airport", city: "Jefferson City", country: "US" },
  JFK: { name: "John F Kennedy International Airport", city: "New York", country: "US" },
  JHW: { name: "Chautauqua County/Jamestown Airport", city: "Jamestown", country: "US" },
  GUF: {
    name: "Gulf Shores International/Jack Edwards Field",
    city: "Gulf Shores",
    country: "US"
  },
  JLA: { name: "Quartz Creek Airport", city: "Cooper Landing", country: "US" },
  JLN: { name: "Joplin Regional Airport", city: "Joplin", country: "US" },
  JMS: { name: "Jamestown Regional Airport", city: "Jamestown", country: "US" },
  JOT: { name: "Joliet Regional Airport", city: "Joliet", country: "US" },
  HTO: { name: "East Hampton Town Airport", city: "East Hampton", country: "US" },
  USA: { name: "Concord-Padgett Regional Airport", city: "Concord", country: "US" },
  JKV: { name: "Cherokee County Airport", city: "Jacksonville", country: "US" },
  JST: {
    name: "John Murtha Johnstown/Cambria County Airport",
    city: "Johnstown",
    country: "US"
  },
  JVL: { name: "Southern Wisconsin Regional Airport", city: "Janesville", country: "US" },
  JXN: { name: "Jackson County/Reynolds Field", city: "Jackson", country: "US" },
  COP: { name: "Cooperstown-Westville Airport", city: "Cooperstown", country: "US" },
  CIL: { name: "Council Airport", city: "Council", country: "US" },
  KAE: { name: "Kake Seaplane Base", city: "Kake", country: "US" },
  KCL: { name: "Chignik Lagoon Airport", city: "Chignik Lagoon", country: "US" },
  KCR: { name: "Colorado Creek Airport", city: "Colorado Creek", country: "US" },
  KEB: { name: "Nanwalek Airport", city: "Nanwalek", country: "US" },
  KEK: { name: "Ekwok Airport", city: "Ekwok", country: "US" },
  KGZ: { name: "Glacier Creek Airport", city: "Glacier Creek", country: "US" },
  KIC: { name: "Mesa Del Rey Airport", city: "King City", country: "US" },
  KKU: { name: "Ekuk Airport", city: "Ekuk", country: "US" },
  KLS: { name: "Southwest Washington Regional Airport", city: "Kelso", country: "US" },
  KNB: { name: "Kanab Municipal Airport", city: "Kanab", country: "US" },
  KWP: { name: "West Point Village Seaplane Base", city: "West Point", country: "US" },
  DTH: { name: "Furnace Creek Airport", city: "Death Valley National Park", country: "US" },
  BXS: { name: "Borrego Valley Airport", city: "Borrego Springs", country: "US" },
  RBF: { name: "Big Bear City Airport", city: "Big Bear City", country: "US" },
  PGS: { name: "Grand Canyon Caverns Airport", city: "Peach Springs", country: "US" },
  MYH: { name: "Marble Canyon Airport", city: "Marble Canyon", country: "US" },
  TRH: { name: "Trona Airport", city: "Trona", country: "US" },
  LAA: { name: "Southeast Colorado Regional Airport", city: "Lamar", country: "US" },
  LAF: { name: "Purdue University Airport", city: "Lafayette", country: "US" },
  LAL: { name: "Lakeland Linder International Airport", city: "Lakeland", country: "US" },
  LAM: { name: "Los Alamos Airport", city: "Los Alamos", country: "US" },
  LAN: { name: "Capital Region International Airport", city: "Lansing", country: "US" },
  LAR: { name: "Laramie Regional Airport", city: "Laramie", country: "US" },
  LAS: { name: "Harry Reid International Airport", city: "Las Vegas", country: "US" },
  LAW: { name: "Lawton-Fort Sill Regional Airport", city: "Lawton", country: "US" },
  LAX: { name: "Los Angeles International Airport", city: "Los Angeles", country: "US" },
  LBB: {
    name: "Lubbock Preston Smith International Airport",
    city: "Lubbock",
    country: "US"
  },
  LBE: { name: "Arnold Palmer Regional Airport", city: "Latrobe", country: "US" },
  LBF: {
    name: "North Platte Regional/Lee Bird Field",
    city: "North Platte",
    country: "US"
  },
  LBL: { name: "Liberal Mid-America Regional Airport", city: "Liberal", country: "US" },
  LBT: { name: "Lumberton Regional Airport", city: "Lumberton", country: "US" },
  LJN: {
    name: "Texas Gulf Coast Regional Airport",
    city: "Angleton/Lake Jackson",
    country: "US"
  },
  LCH: { name: "Lake Charles Regional Airport", city: "Lake Charles", country: "US" },
  LCI: { name: "Laconia Municipal Airport", city: "Laconia", country: "US" },
  LCK: { name: "Rickenbacker International Airport", city: "Columbus", country: "US" },
  LCQ: { name: "Lake City Gateway Airport", city: "Lake City", country: "US" },
  LDJ: { name: "Linden Airport", city: "Linden", country: "US" },
  LDM: { name: "Mason County Airport", city: "Ludington", country: "US" },
  LEB: { name: "Lebanon Municipal Airport", city: "Lebanon", country: "US" },
  LEE: { name: "Leesburg International Airport", city: "Leesburg", country: "US" },
  LEM: { name: "Lemmon Municipal Airport", city: "Lemmon", country: "US" },
  LEW: {
    name: "Auburn/Lewiston Municipal Airport",
    city: "Auburn/Lewiston",
    country: "US"
  },
  LEX: { name: "Blue Grass Airport", city: "Lexington", country: "US" },
  LFI: { name: "Langley Afb Airport", city: "Hampton", country: "US" },
  LFK: { name: "Angelina County Airport", city: "Lufkin", country: "US" },
  LFT: { name: "Lafayette Regional/Paul Fournet Field", city: "Lafayette", country: "US" },
  LGA: { name: "Laguardia Airport", city: "New York", country: "US" },
  LGB: { name: "Long Beach (Daugherty Field) Airport", city: "Long Beach", country: "US" },
  LGC: { name: "Lagrange/Callaway Airport", city: "Lagrange", country: "US" },
  LGD: { name: "La Grande/Union County Airport", city: "La Grande", country: "US" },
  LGF: {
    name: "Laguna Army Air Field (Yuma Proving Ground) Airport",
    city: "Yuma Proving Ground (Yuma)",
    country: "US"
  },
  LGU: { name: "Logan-Cache Airport", city: "Logan", country: "US" },
  LHV: { name: "William T Piper Memorial Airport", city: "Lock Haven", country: "US" },
  LIY: {
    name: "Wright Army Air Field (Fort Stewart)/Midcoast Regional Airport",
    city: "Fort Stewart (Hinesville)",
    country: "US"
  },
  LFN: { name: "Triangle North Executive Airport", city: "Louisburg", country: "US" },
  LIC: { name: "Limon Municipal Airport", city: "Limon", country: "US" },
  LIT: {
    name: "Bill And Hillary Clinton Ntl/Adams Field",
    city: "Little Rock",
    country: "US"
  },
  LKP: { name: "Lake Placid Airport", city: "Lake Placid", country: "US" },
  LOW: { name: "Louisa County/Freeman Field", city: "Louisa", country: "US" },
  LKV: { name: "Lake County Airport", city: "Lakeview", country: "US" },
  CHL: { name: "Challis Airport", city: "Challis", country: "US" },
  LMS: { name: "Louisville/Winston County Airport", city: "Louisville", country: "US" },
  LMT: {
    name: "Crater Lake/Klamath Regional Airport",
    city: "Klamath Falls",
    country: "US"
  },
  LNA: { name: "Palm Beach County Park Airport", city: "West Palm Beach", country: "US" },
  LND: { name: "Hunt Field", city: "Lander", country: "US" },
  LNK: { name: "Lincoln Airport", city: "Lincoln", country: "US" },
  LNN: { name: "Lake County Executive Airport", city: "Willoughby", country: "US" },
  LNP: { name: "Lonesome Pine Airport", city: "Wise", country: "US" },
  LNR: { name: "Tri-County Regional Airport", city: "Lone Rock", country: "US" },
  LNS: { name: "Lancaster Airport", city: "Lancaster", country: "US" },
  LOL: { name: "Derby Field", city: "Lovelock", country: "US" },
  BBX: { name: "Wings Field", city: "Philadelphia", country: "US" },
  LOT: { name: "Lewis University Airport", city: "Chicago/Romeoville", country: "US" },
  LOU: { name: "Bowman Field", city: "Louisville", country: "US" },
  LOZ: { name: "London/Corbin/Magee Airport", city: "London", country: "US" },
  LPC: { name: "Lompoc Airport", city: "Lompoc", country: "US" },
  LQK: { name: "Pickens County Airport", city: "Pickens", country: "US" },
  LRD: { name: "Laredo International Airport", city: "Laredo", country: "US" },
  LRF: { name: "Little Rock Afb Airport", city: "Jacksonville", country: "US" },
  LRJ: { name: "Le Mars Municipal Airport", city: "Le Mars", country: "US" },
  LRU: { name: "Las Cruces International Airport", city: "Las Cruces", country: "US" },
  LSB: { name: "Lordsburg Municipal Airport", city: "Lordsburg", country: "US" },
  LSE: { name: "La Crosse Regional Airport", city: "La Crosse", country: "US" },
  LSF: {
    name: "Lawson Army Air Field (Fort Benning) Airport",
    city: "Fort Benning (Columbus)",
    country: "US"
  },
  LSK: { name: "Lusk Municipal Airport", city: "Lusk", country: "US" },
  LSN: { name: "Los Banos Municipal Airport", city: "Los Banos", country: "US" },
  LSV: { name: "Nellis Afb Airport", city: "Las Vegas", country: "US" },
  LTS: { name: "Altus Afb Airport", city: "Altus", country: "US" },
  LUF: { name: "Luke Afb Airport", city: "Glendale", country: "US" },
  LUK: { name: "Cincinnati Municipal/Lunken Field", city: "Cincinnati", country: "US" },
  LUL: { name: "Hesler/Noble Field", city: "Laurel", country: "US" },
  LVK: { name: "Livermore Municipal Airport", city: "Livermore", country: "US" },
  LVL: { name: "Brunswick County Airport", city: "Lawrenceville", country: "US" },
  LVM: { name: "Mission Field", city: "Livingston", country: "US" },
  LVS: { name: "Las Vegas Municipal Airport", city: "Las Vegas", country: "US" },
  LWB: { name: "Greenbrier Valley Airport", city: "Lewisburg", country: "US" },
  LWC: { name: "Lawrence Regional Airport", city: "Lawrence", country: "US" },
  LWL: { name: "Wells Municipal/Harriet Field", city: "Wells", country: "US" },
  LWM: { name: "Lawrence Municipal Airport", city: "Lawrence", country: "US" },
  LWS: { name: "Lewiston/Nez Perce County Airport", city: "Lewiston", country: "US" },
  LWT: { name: "Lewistown Municipal Airport", city: "Lewistown", country: "US" },
  LWV: {
    name: "Lawrenceville-Vincennes International Airport",
    city: "Lawrenceville",
    country: "US"
  },
  LXN: { name: "Jim Kelly Field", city: "Lexington", country: "US" },
  LXV: { name: "Lake County Airport", city: "Leadville", country: "US" },
  LYH: { name: "Lynchburg Regional/Preston Glenn Field", city: "Lynchburg", country: "US" },
  LYO: { name: "Lyons-Rice County Municipal Airport", city: "Lyons", country: "US" },
  LZU: { name: "Gwinnett County/Briscoe Field", city: "Lawrenceville", country: "US" },
  PCU: {
    name: "Poplarville/Pearl River County Airport",
    city: "Poplarville",
    country: "US"
  },
  DRU: { name: "Drummond Airport", city: "Drummond", country: "US" },
  MLK: { name: "Malta Airport", city: "Malta", country: "US" },
  MAC: { name: "Macon Downtown Airport", city: "Macon", country: "US" },
  MAE: { name: "Madera Municipal Airport", city: "Madera", country: "US" },
  MAF: {
    name: "Midland International Air And Space Port Airport",
    city: "Midland",
    country: "US"
  },
  MAW: { name: "Malden Regional Airport", city: "Malden", country: "US" },
  MBG: { name: "Mobridge Municipal Airport", city: "Mobridge", country: "US" },
  MBL: { name: "Manistee County/Blacker Airport", city: "Manistee", country: "US" },
  DXE: { name: "Bruce Campbell Field", city: "Madison", country: "US" },
  MBS: { name: "Mbs International Airport", city: "Saginaw", country: "US" },
  MBY: { name: "Omar N Bradley Airport", city: "Moberly", country: "US" },
  MCB: { name: "Mc Comb/Pike County/John E Lewis Field", city: "Mc Comb", country: "US" },
  MCC: { name: "Mc Clellan Airfield", city: "Sacramento", country: "US" },
  MCD: { name: "Mackinac Island Airport", city: "Mackinac Island", country: "US" },
  MCE: { name: "Merced Yosemite Regional Airport", city: "Merced", country: "US" },
  MCF: { name: "Macdill Afb Airport", city: "Tampa", country: "US" },
  MCI: { name: "Kansas City International Airport", city: "Kansas City", country: "US" },
  MCK: { name: "Mc Cook Ben Nelson Regional Airport", city: "Mc Cook", country: "US" },
  MCN: { name: "Middle Georgia Regional Airport", city: "Macon", country: "US" },
  MCO: { name: "Orlando International Airport", city: "Orlando", country: "US" },
  MCW: { name: "Mason City Municipal Airport", city: "Mason City", country: "US" },
  MDD: { name: "Midland Airpark", city: "Midland", country: "US" },
  MDH: { name: "Southern Illinois Airport", city: "Carbondale/Murphysboro", country: "US" },
  XMD: { name: "Madison Municipal Airport", city: "Madison", country: "US" },
  MDT: { name: "Harrisburg International Airport", city: "Harrisburg", country: "US" },
  MDW: { name: "Chicago Midway International Airport", city: "Chicago", country: "US" },
  MDF: { name: "Taylor County Airport", city: "Medford", country: "US" },
  MXE: { name: "Laurinburg/Maxton Airport", city: "Maxton", country: "US" },
  MEI: { name: "Key Field", city: "Meridian", country: "US" },
  MEM: { name: "Frederick W Smith International Airport", city: "Memphis", country: "US" },
  MER: { name: "Castle Airport", city: "Atwater", country: "US" },
  MEV: { name: "Minden-Tahoe Airport", city: "Minden", country: "US" },
  UMZ: { name: "Mena Intermountain Municipal Airport", city: "Mena", country: "US" },
  MFD: { name: "Mansfield Lahm Regional Airport", city: "Mansfield", country: "US" },
  MFE: { name: "Mc Allen International Airport", city: "Mc Allen", country: "US" },
  MFI: { name: "Marshfield Municipal Airport", city: "Marshfield", country: "US" },
  MFR: {
    name: "Rogue Valley International/Medford Airport",
    city: "Medford",
    country: "US"
  },
  MFV: { name: "Accomack County Airport", city: "Melfa", country: "US" },
  MGC: {
    name: "Michigan City Municipal-Phillips Field",
    city: "Michigan City",
    country: "US"
  },
  MGE: { name: "Dobbins Arb Airport", city: "Marietta", country: "US" },
  MGJ: { name: "Orange County Airport", city: "Montgomery", country: "US" },
  MGM: {
    name: "Montgomery Regional (Dannelly Field) Airport",
    city: "Montgomery",
    country: "US"
  },
  MGR: { name: "Moultrie Municipal Airport", city: "Moultrie", country: "US" },
  MGW: {
    name: "Morgantown Municipal/Walter L Bill Hart Field",
    city: "Morgantown",
    country: "US"
  },
  MGY: { name: "Dayton/Wright Brothers Airport", city: "Dayton", country: "US" },
  MHE: { name: "Mitchell Municipal Airport", city: "Mitchell", country: "US" },
  MHK: { name: "Manhattan Regional Airport", city: "Manhattan", country: "US" },
  MHL: { name: "Marshall Memorial Municipal Airport", city: "Marshall", country: "US" },
  MHR: { name: "Sacramento Mather Airport", city: "Sacramento", country: "US" },
  MHT: { name: "Manchester Boston Regional Airport", city: "Manchester", country: "US" },
  MHV: { name: "Mojave Air & Space Port/Rutan Field", city: "Mojave", country: "US" },
  MIA: { name: "Miami International Airport", city: "Miami", country: "US" },
  MIB: { name: "Minot Afb Airport", city: "Minot", country: "US" },
  MIC: { name: "Crystal Airport", city: "Minneapolis", country: "US" },
  MIE: { name: "Delaware County Regional Airport", city: "Muncie", country: "US" },
  MIO: { name: "Miami Regional Airport", city: "Miami", country: "US" },
  MIT: { name: "Shafter-Minter Field", city: "Shafter", country: "US" },
  MIV: { name: "Millville Municipal Airport", city: "Millville", country: "US" },
  MIW: { name: "Marshalltown Municipal Airport", city: "Marshalltown", country: "US" },
  MJQ: { name: "Jackson Municipal Airport", city: "Jackson", country: "US" },
  MJX: { name: "Ocean County Airport", city: "Toms River", country: "US" },
  MKC: { name: "Kansas City Downtown/Wheeler Field", city: "Kansas City", country: "US" },
  MKE: { name: "General Mitchell International Airport", city: "Milwaukee", country: "US" },
  MKG: { name: "Muskegon County Airport", city: "Muskegon", country: "US" },
  MKL: { name: "Jackson Regional Airport", city: "Jackson", country: "US" },
  MKO: { name: "Muskogee-Davis Regional Airport", city: "Muskogee", country: "US" },
  MKT: { name: "Mankato Regional Airport", city: "Mankato", country: "US" },
  MRK: { name: "Marco Island Executive Airport", city: "Marco Island", country: "US" },
  MLB: {
    name: "Melbourne Orlando International Airport",
    city: "Melbourne",
    country: "US"
  },
  MLC: { name: "Mc Alester Regional Airport", city: "Mc Alester", country: "US" },
  MLD: { name: "Malad City Airport", city: "Malad City", country: "US" },
  MIQ: { name: "Millard Airport", city: "Omaha", country: "US" },
  MLF: {
    name: "Milford Municipal/Ben And Judy Briscoe Field",
    city: "Milford",
    country: "US"
  },
  MLI: { name: "Quad Cities International Airport", city: "Moline", country: "US" },
  MLJ: { name: "Baldwin County Regional Airport", city: "Milledgeville", country: "US" },
  MLS: { name: "Frank Wiley Field", city: "Miles City", country: "US" },
  MLT: { name: "Millinocket Municipal Airport", city: "Millinocket", country: "US" },
  MLU: { name: "Monroe Regional Airport", city: "Monroe", country: "US" },
  MMH: { name: "Mammoth Yosemite Airport", city: "Mammoth Lakes", country: "US" },
  MMI: { name: "Mcminn County Airport", city: "Athens", country: "US" },
  MML: {
    name: "Southwest Minnesota Regional Marshall/Ryan Field",
    city: "Marshall",
    country: "US"
  },
  MMS: { name: "Selfs Airport", city: "Marks", country: "US" },
  MMT: { name: "Mc Entire Jngb Airport", city: "Eastover", country: "US" },
  MMU: { name: "Morristown Municipal Airport", city: "Morristown", country: "US" },
  MNM: { name: "Menominee Regional Airport", city: "Menominee", country: "US" },
  MNN: { name: "Marion Municipal Airport", city: "Marion", country: "US" },
  MOB: { name: "Mobile Regional Airport", city: "Mobile", country: "US" },
  MOD: { name: "Modesto City-County-Harry Sham Field", city: "Modesto", country: "US" },
  MOP: { name: "Mount Pleasant Municipal Airport", city: "Mount Pleasant", country: "US" },
  MOR: { name: "Moore-Murrell Airport", city: "Morristown", country: "US" },
  MOS: { name: "Moses Point Airport", city: "Elim", country: "US" },
  MOT: { name: "Minot International Airport", city: "Minot", country: "US" },
  MOX: { name: "Morris Municipal/Charlie Schmidt Field", city: "Morris", country: "US" },
  RMY: { name: "Mariposa-Yosemite Airport", city: "Mariposa", country: "US" },
  MPJ: { name: "Petit Jean Park Airport", city: "Morrilton", country: "US" },
  MPO: { name: "Pocono Mountains Regional Airport", city: "Mount Pocono", country: "US" },
  MPR: { name: "Mc Pherson Airport", city: "Mc Pherson", country: "US" },
  MPV: { name: "Edward F Knapp State Airport", city: "Barre/Montpelier", country: "US" },
  MPZ: { name: "Mount Pleasant Municipal Airport", city: "Mount Pleasant", country: "US" },
  MQB: { name: "Macomb Municipal Airport", city: "Macomb", country: "US" },
  MEO: { name: "Dare County Regional Airport", city: "Manteo", country: "US" },
  CTH: { name: "Chester County G O Carlson Airport", city: "Coatesville", country: "US" },
  MQW: { name: "Telfair-Wheeler Airport", city: "Mc Rae", country: "US" },
  MQY: { name: "Smyrna Airport", city: "Smyrna", country: "US" },
  MRB: { name: "Eastern Wv Regional/Shepherd Field", city: "Martinsburg", country: "US" },
  MRC: {
    name: "Maury County Regional Airport",
    city: "Columbia/Mount Pleasant",
    country: "US"
  },
  MRF: { name: "Marfa Municipal Airport", city: "Marfa", country: "US" },
  MRN: { name: "Foothills Regional Airport", city: "Morganton", country: "US" },
  MRY: { name: "Monterey Regional Airport", city: "Monterey", country: "US" },
  MSL: { name: "Northwest Alabama Regional Airport", city: "Muscle Shoals", country: "US" },
  MSN: { name: "Dane County Regional/Truax Field", city: "Madison", country: "US" },
  MSO: { name: "Missoula Montana Airport", city: "Missoula", country: "US" },
  MSP: {
    name: "Minneapolis-St Paul International/Wold-Chamberlain Airport",
    city: "Minneapolis",
    country: "US"
  },
  MSS: { name: "Massena International-Richards Field", city: "Massena", country: "US" },
  MSV: { name: "Sullivan County International Airport", city: "Monticello", country: "US" },
  MSY: {
    name: "Louis Armstrong New Orleans International Airport",
    city: "New Orleans",
    country: "US"
  },
  MTC: { name: "Selfridge Angb Airport", city: "Mount Clemens", country: "US" },
  MTX: { name: "Metro Field", city: "Fairbanks", country: "US" },
  MTH: {
    name: "The Florida Keys Marathon International Airport",
    city: "Marathon",
    country: "US"
  },
  MTJ: { name: "Montrose Regional Airport", city: "Montrose", country: "US" },
  MTN: { name: "Martin State Airport", city: "Baltimore", country: "US" },
  MTO: { name: "Coles County Memorial Airport", city: "Mattoon/Charleston", country: "US" },
  MTP: { name: "Montauk Airport", city: "Montauk", country: "US" },
  MTW: { name: "Manitowoc County Airport", city: "Manitowoc", country: "US" },
  MUI: {
    name: "Muir Army Heliport (Fort Indiantown Gap) Heliport",
    city: "Fort Indiantown Gap (Annville)",
    country: "US"
  },
  MUL: { name: "Spence Airport", city: "Moultrie", country: "US" },
  MUO: { name: "Mountain Home Afb Airport", city: "Mountain Home", country: "US" },
  MUT: { name: "Muscatine Municipal Airport", city: "Muscatine", country: "US" },
  MVC: { name: "Monroe County Aeroplex Airport", city: "Monroeville", country: "US" },
  MVE: { name: "Montevideo-Chippewa County Airport", city: "Montevideo", country: "US" },
  MVL: { name: "Morrisville-Stowe State Airport", city: "Morrisville", country: "US" },
  MVN: { name: "Mount Vernon Airport", city: "Mount Vernon", country: "US" },
  MVY: { name: "Martha's Vineyard Airport", city: "Vineyard Haven", country: "US" },
  MWA: {
    name: "Veterans Airport Of Southern Illinois Airport",
    city: "Marion",
    country: "US"
  },
  MWC: { name: "Lawrence J Timmerman Airport", city: "Milwaukee", country: "US" },
  MWH: { name: "Grant County International Airport", city: "Moses Lake", country: "US" },
  MWL: { name: "Mineral Wells Regional Airport", city: "Mineral Wells", country: "US" },
  MWM: { name: "Windom Municipal Airport", city: "Windom", country: "US" },
  MWO: { name: "Middletown Regional/Hook Field", city: "Middletown", country: "US" },
  MXA: { name: "Manila Municipal Airport", city: "Manila", country: "US" },
  MXF: { name: "Maxwell Afb Airport", city: "Montgomery", country: "US" },
  MXO: { name: "Monticello Regional Airport", city: "Monticello", country: "US" },
  MYF: { name: "Montgomery-Gibbs Executive Airport", city: "San Diego", country: "US" },
  MYK: { name: "May Creek Airport", city: "May Creek", country: "US" },
  MYL: { name: "Mc Call Municipal Airport", city: "Mc Call", country: "US" },
  MYR: { name: "Myrtle Beach International Airport", city: "Myrtle Beach", country: "US" },
  MYV: { name: "Yuba County Airport", city: "Marysville", country: "US" },
  MZJ: { name: "Pinal Airpark", city: "Marana", country: "US" },
  MZZ: { name: "Marion Municipal - Mckinney Field", city: "Marion", country: "US" },
  CTX: { name: "Cortland County/Chase Field", city: "Cortland", country: "US" },
  SXY: { name: "Sidney Municipal Airport", city: "Sidney", country: "US" },
  ONH: { name: "Albert S Nader Regional Airport", city: "Oneonta", country: "US" },
  NBG: {
    name: "New Orleans Nas Jrb (Alvin Callender Field) Airport",
    city: "New Orleans",
    country: "US"
  },
  NHX: { name: "Barin Nolf Airport", city: "Foley", country: "US" },
  DGN: { name: "Dahlgren Nsf Airport", city: "Dahlgren", country: "US" },
  NEL: { name: "Lakehurst Maxfield Field", city: "Lakehurst", country: "US" },
  NEN: { name: "Whitehouse Nolf Airport", city: "Jacksonville", country: "US" },
  NEW: { name: "Lakefront Airport", city: "New Orleans", country: "US" },
  NFL: { name: "Fallon Nas (Van Voorhis Field) Airport", city: "Fallon", country: "US" },
  FWH: {
    name: "Fort Worth Nas Jrb (Carswell Field) Airport",
    city: "Fort Worth",
    country: "US"
  },
  NGP: {
    name: "Corpus Christi Nas (Truax Field) Airport",
    city: "Corpus Christi",
    country: "US"
  },
  NGU: { name: "Norfolk Ns (Chambers Field) Airport", city: "Norfolk", country: "US" },
  NGW: { name: "Cabaniss Field Nolf Airport", city: "Corpus Christi", country: "US" },
  NHK: {
    name: "Patuxent River Nas (Trapnell Field) Airport",
    city: "Patuxent River",
    country: "US"
  },
  NIN: { name: "Ninilchik Airport", city: "Ninilchik", country: "US" },
  NIP: {
    name: "Jacksonville Nas (Towers Field) Airport",
    city: "Jacksonville",
    country: "US"
  },
  NJK: { name: "El Centro Naf (Vraciu Field) Airport", city: "El Centro", country: "US" },
  NKX: { name: "Miramar Mcas (Joe Foss Field) Airport", city: "San Diego", country: "US" },
  NLC: { name: "Lemoore Nas (Reeves Field) Airport", city: "Lemoore", country: "US" },
  NPA: {
    name: "Pensacola Nas (Forrest Sherman Field) Airport",
    city: "Pensacola",
    country: "US"
  },
  NQA: { name: "Millington/Memphis Airport", city: "Millington", country: "US" },
  NQI: { name: "Kingsville Nas Airport", city: "Kingsville", country: "US" },
  NQX: { name: "Key West Nas (Boca Chica Field) Airport", city: "Key West", country: "US" },
  NRB: {
    name: "Mayport Ns (Adm David L Mcdonald Field) Airport",
    city: "Mayport",
    country: "US"
  },
  NRS: {
    name: "Imperial Beach Nolf (Ream Field) Airport",
    city: "Imperial Beach",
    country: "US"
  },
  NSE: { name: "Whiting Field Nas North Airport", city: "Milton", country: "US" },
  NTD: {
    name: "Point Mugu Nas (Naval Base Ventura Co) Airport",
    city: "Oxnard",
    country: "US"
  },
  NTU: {
    name: "Oceana Nas (Apollo Soucek Field) Airport",
    city: "Virginia Beach",
    country: "US"
  },
  NUQ: { name: "Moffett Federal Airfield", city: "Mountain View", country: "US" },
  NUW: {
    name: "Whidbey Island Nas (Ault Field) Airport",
    city: "Oak Harbor",
    country: "US"
  },
  NVD: { name: "Nevada Municipal Airport", city: "Nevada", country: "US" },
  NYG: { name: "Quantico Mcaf (Turner Field) Airport", city: "Quantico", country: "US" },
  YUM: { name: "Yuma Mcas/Yuma International Airport", city: "Yuma", country: "US" },
  NZY: {
    name: "North Island Nas (Halsey Field) Airport",
    city: "San Diego",
    country: "US"
  },
  NVN: { name: "Nervino Airport", city: "Beckwourth", country: "US" },
  NLN: { name: "Kneeland Airport", city: "Eureka", country: "US" },
  COA: { name: "Columbia Airport", city: "Columbia", country: "US" },
  ODC: { name: "Oakdale Airport", city: "Oakdale", country: "US" },
  EYR: { name: "Yerington Municipal Airport", city: "Yerington", country: "US" },
  BZF: { name: "Benton Field", city: "Redding", country: "US" },
  OAJ: { name: "Albert J Ellis Airport", city: "Jacksonville", country: "US" },
  OAK: { name: "Oakland San Francisco Bay Airport", city: "Oakland", country: "US" },
  OAR: { name: "Marina Municipal Airport", city: "Marina", country: "US" },
  OBE: { name: "Okeechobee County Airport", city: "Okeechobee", country: "US" },
  OCF: { name: "Ocala International-Jim Taylor Field", city: "Ocala", country: "US" },
  OCH: {
    name: "Nacogdoches A L Mangham Jr Regional Airport",
    city: "Nacogdoches",
    country: "US"
  },
  OCW: { name: "Washington-Warren Airport", city: "Washington", country: "US" },
  ODT: { name: "Odessa-Schlemeyer Field", city: "Odessa", country: "US" },
  OEO: { name: "L O Simenstad Municipal Airport", city: "Osceola", country: "US" },
  OFF: { name: "Offutt Afb Airport", city: "Omaha", country: "US" },
  OFK: {
    name: "Norfolk Regional/Karl Stefan Memorial Field",
    city: "Norfolk",
    country: "US"
  },
  OGA: { name: "Searle Field", city: "Ogallala", country: "US" },
  OGB: { name: "Orangeburg Municipal Airport", city: "Orangeburg", country: "US" },
  OGD: { name: "Ogden-Hinckley Airport", city: "Ogden", country: "US" },
  OGS: { name: "Ogdensburg International Airport", city: "Ogdensburg", country: "US" },
  OIC: { name: "Lt Warren Eaton Airport", city: "Norwich", country: "US" },
  OJC: { name: "Johnson County Executive Airport", city: "Olathe", country: "US" },
  OCN: { name: "Bob Maxwell Memorial Airfield", city: "Oceanside", country: "US" },
  OKC: {
    name: "Okc Will Rogers International Airport",
    city: "Oklahoma City",
    country: "US"
  },
  ODW: { name: "Delaurentis Airport", city: "Oak Harbor", country: "US" },
  OKK: { name: "Kokomo Municipal Airport", city: "Kokomo", country: "US" },
  OKM: {
    name: "Okmulgee Regional/Paul And Betty Abbott Field",
    city: "Okmulgee",
    country: "US"
  },
  OKS: { name: "Garden County/King Rhiley Field", city: "Oshkosh", country: "US" },
  WGO: { name: "Winchester Regional Airport", city: "Winchester", country: "US" },
  OLD: { name: "Dewitt Field/Old Town Municipal Airport", city: "Old Town", country: "US" },
  OLE: { name: "Cattaraugus County-Olean Airport", city: "Olean", country: "US" },
  OLF: { name: "L M Clayton Airport", city: "Wolf Point", country: "US" },
  OLM: { name: "Olympia Regional Airport", city: "Olympia", country: "US" },
  OLS: { name: "Nogales International Airport", city: "Nogales", country: "US" },
  OLU: { name: "Columbus Municipal Airport", city: "Columbus", country: "US" },
  OLV: { name: "Olive Branch/Taylor Field", city: "Olive Branch", country: "US" },
  OLY: { name: "Olney-Noble Airport", city: "Olney-Noble", country: "US" },
  OMA: { name: "Eppley Airfield", city: "Omaha", country: "US" },
  OMK: { name: "Omak Airport", city: "Omak", country: "US" },
  ONA: { name: "Winona Municipal/Max Conrad Field", city: "Winona", country: "US" },
  ONL: { name: "The O'Neill Municipal-John L Baker Field", city: "O'Neill", country: "US" },
  ONM: { name: "Socorro Municipal Airport", city: "Socorro", country: "US" },
  ONO: { name: "Ontario Municipal Airport", city: "Ontario", country: "US" },
  ONP: { name: "Newport Municipal Airport", city: "Newport", country: "US" },
  ONT: { name: "Ontario International Airport", city: "Ontario", country: "US" },
  ONY: { name: "Olney Municipal Airport", city: "Olney", country: "US" },
  OOA: { name: "Oskaloosa Municipal Airport", city: "Oskaloosa", country: "US" },
  OPF: { name: "Miami-Opa Locka Executive Airport", city: "Miami", country: "US" },
  OPL: { name: "St Landry Parish Airport", city: "Opelousas", country: "US" },
  NCO: { name: "Quonset State Airport", city: "North Kingstown", country: "US" },
  ORD: { name: "Chicago O'Hare International Airport", city: "Chicago", country: "US" },
  ORF: { name: "Norfolk International Airport", city: "Norfolk", country: "US" },
  ORH: { name: "Worcester Regional Airport", city: "Worcester", country: "US" },
  ORI: { name: "Port Lions Airport", city: "Port Lions", country: "US" },
  ORL: { name: "Orlando Executive Airport", city: "Orlando", country: "US" },
  ESD: { name: "Orcas Island Airport", city: "Eastsound", country: "US" },
  MPS: { name: "Mount Pleasant Regional Airport", city: "Mount Pleasant", country: "US" },
  OSC: { name: "Oscoda/Wurtsmith Airport", city: "Oscoda", country: "US" },
  OSH: { name: "Wittman Regional Airport", city: "Oshkosh", country: "US" },
  OSU: { name: "Ohio State University Airport", city: "Columbus", country: "US" },
  OSX: { name: "Kosciusko-Attala County Airport", city: "Kosciusko", country: "US" },
  OTG: { name: "Worthington Municipal Airport", city: "Worthington", country: "US" },
  OTH: { name: "Southwest Oregon Regional Airport", city: "North Bend", country: "US" },
  OTM: { name: "Ottumwa Regional Airport", city: "Ottumwa", country: "US" },
  OUN: { name: "University Of Oklahoma Westheimer Airport", city: "Norman", country: "US" },
  OVE: { name: "Oroville Municipal Airport", city: "Oroville", country: "US" },
  OWA: { name: "Owatonna Degner Regional Airport", city: "Owatonna", country: "US" },
  OWB: {
    name: "Owensboro/Daviess County Regional Airport",
    city: "Owensboro",
    country: "US"
  },
  OWD: { name: "Norwood Memorial Airport", city: "Norwood", country: "US" },
  OWK: { name: "Central Maine/Norridgewock Airport", city: "Norridgewock", country: "US" },
  OCE: { name: "Ocean City Municipal Airport", city: "Ocean City", country: "US" },
  OXC: { name: "Waterbury-Oxford Airport", city: "Oxford", country: "US" },
  OXD: { name: "Miami University Airport", city: "Oxford", country: "US" },
  OXR: { name: "Oxnard Airport", city: "Oxnard", country: "US" },
  STQ: { name: "St Marys Municipal Airport", city: "St Marys", country: "US" },
  OZA: { name: "Ozona Municipal Airport", city: "Ozona", country: "US" },
  OZR: {
    name: "Cairns Army Air Field (Fort Rucker) Airport",
    city: "Fort Rucker",
    country: "US"
  },
  BSQ: { name: "Bisbee Municipal Airport", city: "Bisbee", country: "US" },
  PXL: { name: "Polacca Airport", city: "Polacca", country: "US" },
  GLB: { name: "San Carlos Apache Airport", city: "Globe", country: "US" },
  HBK: { name: "Holbrook Municipal Airport", city: "Holbrook", country: "US" },
  CWX: { name: "Cochise County Airport", city: "Willcox", country: "US" },
  CTW: { name: "Cottonwood Airport", city: "Cottonwood", country: "US" },
  PAE: {
    name: "Seattle Paine Field International Airport",
    city: "Everett",
    country: "US"
  },
  PAH: { name: "Barkley Regional Airport", city: "Paducah", country: "US" },
  PAM: { name: "Tyndall Afb Airport", city: "Panama City", country: "US" },
  PJB: { name: "Payson Airport", city: "Payson", country: "US" },
  PAO: { name: "Palo Alto Airport", city: "Palo Alto", country: "US" },
  PBF: { name: "Pinebluff Regional/Grider Field", city: "Pine Bluff", country: "US" },
  PBG: { name: "Plattsburgh International Airport", city: "Plattsburgh", country: "US" },
  PBI: { name: "Palm Beach International Airport", city: "West Palm Beach", country: "US" },
  PVL: { name: "Pike County/Hatcher Field", city: "Pikeville", country: "US" },
  PCD: {
    name: "Prairie Du Chien Municipal Airport",
    city: "Prairie Du Chien",
    country: "US"
  },
  PDK: { name: "Dekalb-Peachtree Airport", city: "Atlanta", country: "US" },
  PDT: {
    name: "Eastern Oregon Regional At Pendleton Airport",
    city: "Pendleton",
    country: "US"
  },
  PDX: { name: "Portland International Airport", city: "Portland", country: "US" },
  PEQ: { name: "Pecos Municipal Airport", city: "Pecos", country: "US" },
  PFC: { name: "Pacific City State Airport", city: "Pacific City", country: "US" },
  PGA: { name: "Page Municipal Airport", city: "Page", country: "US" },
  PGD: { name: "Punta Gorda Airport", city: "Punta Gorda", country: "US" },
  PGM: { name: "Port Graham Airport", city: "Port Graham", country: "US" },
  PGR: { name: "Kirk Field", city: "Paragould", country: "US" },
  PGV: { name: "Pitt-Greenville Airport", city: "Greenville", country: "US" },
  PHD: { name: "Harry Clever Field", city: "New Philadelphia", country: "US" },
  PHF: {
    name: "Newport News/Williamsburg International Airport",
    city: "Newport News",
    country: "US"
  },
  ADR: { name: "Robert F Swinnie Airport", city: "Andrews", country: "US" },
  PHK: { name: "Palm Beach County Glades Airport", city: "Pahokee", country: "US" },
  PHL: { name: "Philadelphia International Airport", city: "Philadelphia", country: "US" },
  PHN: { name: "St Clair County International Airport", city: "Port Huron", country: "US" },
  PHP: { name: "Philip Airport", city: "Philip", country: "US" },
  PHT: { name: "Henry County Airport", city: "Paris", country: "US" },
  PHX: { name: "Phoenix Sky Harbor International Airport", city: "Phoenix", country: "US" },
  PIA: {
    name: "General Downing - Peoria International Airport",
    city: "Peoria",
    country: "US"
  },
  PIB: {
    name: "Hattiesburg/Laurel Regional Airport",
    city: "Hattiesburg-Laurel",
    country: "US"
  },
  PIE: {
    name: "St Pete-Clearwater International Airport",
    city: "St Petersburg-Clearwater",
    country: "US"
  },
  PIH: { name: "Pocatello Regional Airport", city: "Pocatello", country: "US" },
  PIM: { name: "Harris County Airport", city: "Pine Mountain", country: "US" },
  PIR: { name: "Pierre Regional Airport", city: "Pierre", country: "US" },
  PIT: { name: "Pittsburgh International Airport", city: "Pittsburgh", country: "US" },
  PKB: { name: "Mid-Ohio Valley Regional Airport", city: "Parkersburg", country: "US" },
  PKD: { name: "Park Rapids Municipal/Konshok Field", city: "Park Rapids", country: "US" },
  PKF: { name: "Park Falls Municipal Airport", city: "Park Falls", country: "US" },
  PLK: { name: "M Graham Clark Downtown Airport", city: "Branson", country: "US" },
  PLN: { name: "Pellston Regional/Emmet County Airport", city: "Pellston", country: "US" },
  PLR: { name: "St Clair County Airport", city: "Pell City", country: "US" },
  PMB: { name: "Pembina Municipal Airport", city: "Pembina", country: "US" },
  PMD: { name: "Palmdale Usaf Plant 42 Airport", city: "Palmdale", country: "US" },
  PMH: { name: "Greater Portsmouth Regional Airport", city: "Portsmouth", country: "US" },
  PPM: { name: "Pompano Beach Airpark", city: "Pompano Beach", country: "US" },
  PWY: { name: "Ralph Wenz Field", city: "Pinedale", country: "US" },
  PNC: { name: "Ponca City Regional Airport", city: "Ponca City", country: "US" },
  PNE: { name: "Northeast Philadelphia Airport", city: "Philadelphia", country: "US" },
  PNN: { name: "Princeton Municipal Airport", city: "Princeton", country: "US" },
  PNS: { name: "Pensacola International Airport", city: "Pensacola", country: "US" },
  POB: { name: "Pope Army Air Field", city: "Fayetteville", country: "US" },
  POC: { name: "Brackett Field", city: "La Verne", country: "US" },
  POE: { name: "Maks Army Air Field", city: "Fort Polk", country: "US" },
  POF: {
    name: "Poplar Bluff Regional Business Airport",
    city: "Poplar Bluff",
    country: "US"
  },
  POH: { name: "Pocahontas Municipal Airport", city: "Pocahontas", country: "US" },
  POU: { name: "Hudson Valley Regional Airport", city: "Poughkeepsie", country: "US" },
  POY: { name: "Powell Municipal Airport", city: "Powell", country: "US" },
  PPA: { name: "Perry Lefors Field", city: "Pampa", country: "US" },
  PPF: { name: "Tri-City Airport", city: "Parsons", country: "US" },
  LPO: { name: "La Porte Municipal Airport", city: "La Porte", country: "US" },
  PQI: { name: "Presque Isle International Airport", city: "Presque Isle", country: "US" },
  PGL: { name: "Trent Lott International Airport", city: "Pascagoula", country: "US" },
  PRB: { name: "Paso Robles Municipal Airport", city: "Paso Robles", country: "US" },
  PRC: { name: "Prescott Regional/Ernest A Love Field", city: "Prescott", country: "US" },
  PRO: { name: "Perry Municipal Airport", city: "Perry", country: "US" },
  PRX: { name: "Cox Field", city: "Paris", country: "US" },
  PSB: { name: "Mid-State Airport", city: "Philipsburg", country: "US" },
  PSC: { name: "Tri-Cities Airport", city: "Pasco", country: "US" },
  PSF: { name: "Pittsfield Municipal Airport", city: "Pittsfield", country: "US" },
  PSK: { name: "New River Valley Airport", city: "Dublin", country: "US" },
  PSM: {
    name: "Portsmouth International At Pease Airport",
    city: "Portsmouth",
    country: "US"
  },
  PSN: { name: "Palestine Municipal Airport", city: "Palestine", country: "US" },
  PGO: { name: "Stevens Field", city: "Pagosa Springs", country: "US" },
  PSP: { name: "Palm Springs International Airport", city: "Palm Springs", country: "US" },
  PSX: { name: "Palacios Municipal Airport", city: "Palacios", country: "US" },
  PTB: {
    name: "Tri Cities Executive/Dinwiddie County Airport",
    city: "Petersburg",
    country: "US"
  },
  PTK: { name: "Oakland County International Airport", city: "Pontiac", country: "US" },
  PTN: { name: "Harry P Williams Memorial Airport", city: "Patterson", country: "US" },
  PTS: { name: "Atkinson Municipal Airport", city: "Pittsburg", country: "US" },
  PTT: { name: "Pratt Regional Airport", city: "Pratt", country: "US" },
  PTV: { name: "Porterville Municipal Airport", city: "Porterville", country: "US" },
  PTW: { name: "Heritage Field", city: "Pottstown", country: "US" },
  PUB: { name: "Pueblo Memorial Airport", city: "Pueblo", country: "US" },
  PUC: { name: "Carbon County Regional/Buck Davis Field", city: "Price", country: "US" },
  PUW: { name: "Pullman/Moscow Regional Airport", city: "Pullman/Moscow", country: "US" },
  PVC: { name: "Provincetown Municipal Airport", city: "Provincetown", country: "US" },
  PVD: {
    name: "Rhode Island Tf Green International Airport",
    city: "Providence",
    country: "US"
  },
  PVF: { name: "Placerville Airport", city: "Placerville", country: "US" },
  PVU: { name: "Provo Municipal Airport", city: "Provo", country: "US" },
  PVW: { name: "Hale County Airport", city: "Plainview", country: "US" },
  PWA: { name: "Wiley Post Airport", city: "Oklahoma City", country: "US" },
  PWD: { name: "Sher-Wood Airport", city: "Plentywood", country: "US" },
  PWK: {
    name: "Chicago Executive Airport",
    city: "Chicago/Prospect Heights/Wheeling",
    country: "US"
  },
  PWM: { name: "Portland International Jetport Airport", city: "Portland", country: "US" },
  PWT: { name: "Bremerton Ntl Airport", city: "Bremerton", country: "US" },
  PYM: { name: "Plymouth Municipal Airport", city: "Plymouth", country: "US" },
  RAC: { name: "Batten International Airport", city: "Racine", country: "US" },
  RAL: { name: "Riverside Airport", city: "Riverside", country: "US" },
  RAP: { name: "Rapid City Regional Airport", city: "Rapid City", country: "US" },
  RBD: { name: "Dallas Executive Airport", city: "Dallas", country: "US" },
  RBG: { name: "Roseburg Regional Airport", city: "Roseburg", country: "US" },
  RBL: { name: "Red Bluff Municipal Airport", city: "Red Bluff", country: "US" },
  RBW: { name: "Lowcountry Regional Airport", city: "Walterboro", country: "US" },
  RCA: { name: "Ellsworth Afb Airport", city: "Rapid City", country: "US" },
  RCK: { name: "H H Coffield Regional Airport", city: "Rockdale", country: "US" },
  RCR: { name: "Fulton County Airport", city: "Rochester", country: "US" },
  RCT: { name: "Nartron Field", city: "Reed City", country: "US" },
  RDD: { name: "Redding Regional Airport", city: "Redding", country: "US" },
  RDG: { name: "Reading Regional/Carl A Spaatz Field", city: "Reading", country: "US" },
  RDM: { name: "Roberts Field", city: "Redmond", country: "US" },
  RDR: { name: "Grand Forks Afb Airport", city: "Grand Forks", country: "US" },
  RDU: {
    name: "Raleigh-Durham International Airport",
    city: "Raleigh/Durham",
    country: "US"
  },
  RDV: { name: "Red Devil Airport", city: "Red Devil", country: "US" },
  REO: { name: "Rome State Airport", city: "Rome", country: "US" },
  RFD: {
    name: "Chicago/Rockford International Airport",
    city: "Chicago/Rockford",
    country: "US"
  },
  RFG: { name: "Rooke Field", city: "Refugio", country: "US" },
  RHI: { name: "Rhinelander/Oneida County Airport", city: "Rhinelander", country: "US" },
  RHV: {
    name: "Reid-Hillview Of Santa Clara County Airport",
    city: "San Jose",
    country: "US"
  },
  RIC: { name: "Richmond International Airport", city: "Richmond", country: "US" },
  RID: { name: "Richmond Municipal Airport", city: "Richmond", country: "US" },
  RIF: { name: "Richfield Municipal Airport", city: "Richfield", country: "US" },
  RIL: { name: "Rifle Garfield County Airport", city: "Rifle", country: "US" },
  RIR: { name: "Flabob Airport", city: "Riverside/Rubidoux/", country: "US" },
  RIV: { name: "March Arb Airport", city: "Riverside", country: "US" },
  RIW: { name: "Central Wyoming Regional Airport", city: "Riverton", country: "US" },
  RKD: { name: "Knox County Regional Airport", city: "Rockland", country: "US" },
  RKP: { name: "Aransas County Airport", city: "Rockport", country: "US" },
  RKR: { name: "Robert S Kerr Airport", city: "Poteau", country: "US" },
  RKS: { name: "Southwest Wyoming Regional Airport", city: "Rock Springs", country: "US" },
  RKW: { name: "Rockwood Municipal Airport", city: "Rockwood", country: "US" },
  RLD: { name: "Richland Airport", city: "Richland", country: "US" },
  RME: { name: "Griffiss International Airport", city: "Rome", country: "US" },
  RMG: {
    name: "Richard B Russell Regional - J H Towers Field",
    city: "Rome",
    country: "US"
  },
  RNC: { name: "Warren County Memorial Airport", city: "Mc Minnville", country: "US" },
  RND: { name: "Randolph Afb Airport", city: "Universal City", country: "US" },
  RNH: { name: "New Richmond Regional Airport", city: "New Richmond", country: "US" },
  RNO: { name: "Reno/Tahoe International Airport", city: "Reno", country: "US" },
  RNT: { name: "Renton Municipal Airport", city: "Renton", country: "US" },
  ROA: {
    name: "Roanoke/Blacksburg Regional (Woodrum Field) Airport",
    city: "Roanoke",
    country: "US"
  },
  ROC: {
    name: "Frederick Douglass/Greater Rochester International Airport",
    city: "Rochester",
    country: "US"
  },
  ROG: { name: "Rogers Executive - Carter Field", city: "Rogers", country: "US" },
  ROW: { name: "Roswell Air Center Airport", city: "Roswell", country: "US" },
  ROX: { name: "Roseau Municipal/Rudy Billberg Field", city: "Roseau", country: "US" },
  RIE: { name: "Rice Lake Regional/Carl's Field", city: "Rice Lake", country: "US" },
  RPX: { name: "Roundup Airport", city: "Roundup", country: "US" },
  WBR: { name: "Roben-Hood Airport", city: "Big Rapids", country: "US" },
  RRL: { name: "Merrill Municipal Airport", city: "Merrill", country: "US" },
  RRT: { name: "Warroad International Memorial Airport", city: "Warroad", country: "US" },
  RSL: { name: "Russell Municipal Airport", city: "Russell", country: "US" },
  RSN: { name: "Ruston Regional Airport", city: "Ruston", country: "US" },
  RST: { name: "Rochester International Airport", city: "Rochester", country: "US" },
  RSW: {
    name: "Southwest Florida International Airport",
    city: "Fort Myers",
    country: "US"
  },
  RTN: { name: "Raton Municipal/Crews Field", city: "Raton", country: "US" },
  SRW: { name: "Mid-Carolina Regional Airport", city: "Salisbury", country: "US" },
  RUT: {
    name: "Rutland/Southern Vermont Regional Airport",
    city: "Rutland",
    country: "US"
  },
  RED: { name: "Mifflin County Airport", city: "Reedsville", country: "US" },
  RVS: { name: "Tulsa Riverside Airport", city: "Tulsa", country: "US" },
  RWF: { name: "Redwood Falls Municipal Airport", city: "Redwood Falls", country: "US" },
  RWI: { name: "Rocky Mount/Wilson Regional Airport", city: "Rocky Mount", country: "US" },
  RWL: { name: "Rawlins Municipal/Harvey Field", city: "Rawlins", country: "US" },
  RXE: { name: "Rexburg-Madison County Airport", city: "Rexburg", country: "US" },
  RNZ: { name: "Jasper County Airport", city: "Rensselaer", country: "US" },
  AHM: { name: "Ashland Municipal/Sumner Parker Field", city: "Ashland", country: "US" },
  BDY: { name: "Bandon State Airport", city: "Bandon", country: "US" },
  SUO: { name: "Sunriver Airport", city: "Sunriver", country: "US" },
  LPS: { name: "Lopez Island Airport", city: "Lopez", country: "US" },
  MDJ: { name: "Madras Municipal Airport", city: "Madras", country: "US" },
  PRZ: { name: "Prineville Airport", city: "Prineville", country: "US" },
  SAA: { name: "Shively Field", city: "Saratoga", country: "US" },
  SAC: { name: "Sacramento Executive Airport", city: "Sacramento", country: "US" },
  SAD: {
    name: "Safford Regional/1Lt Duane Spalsbury Field",
    city: "Safford",
    country: "US"
  },
  SAF: { name: "Santa Fe Regional Airport", city: "Santa Fe", country: "US" },
  SAN: { name: "San Diego International Airport", city: "San Diego", country: "US" },
  SAR: { name: "Sparta Community-Hunter Field", city: "Sparta", country: "US" },
  SAS: { name: "Salton Sea Airport", city: "Salton City", country: "US" },
  SAT: { name: "San Antonio International Airport", city: "San Antonio", country: "US" },
  SAV: {
    name: "Savannah/Hilton Head International Airport",
    city: "Savannah",
    country: "US"
  },
  MQT: { name: "Marquette/Sawyer Regional Airport", city: "Marquette", country: "US" },
  SBA: { name: "Santa Barbara Municipal Airport", city: "Santa Barbara", country: "US" },
  SBD: {
    name: "San Bernardino International Airport",
    city: "San Bernardino",
    country: "US"
  },
  SBM: {
    name: "Sheboygan County Memorial International Airport",
    city: "Sheboygan",
    country: "US"
  },
  SBN: { name: "South Bend International Airport", city: "South Bend", country: "US" },
  SBP: {
    name: "San Luis Obispo County Regional Airport",
    city: "San Luis Obispo",
    country: "US"
  },
  SBS: {
    name: "Steamboat Springs/Bob Adams Field",
    city: "Steamboat Springs",
    country: "US"
  },
  SBX: { name: "Shelby Airport", city: "Shelby", country: "US" },
  SBY: {
    name: "Salisbury-Ocean City Wicomico Regional Airport",
    city: "Salisbury",
    country: "US"
  },
  SCB: { name: "Scribner State Airport", city: "Scribner", country: "US" },
  SCH: { name: "Schenectady County Airport", city: "Schenectady", country: "US" },
  SCK: { name: "Stockton Metro Airport", city: "Stockton", country: "US" },
  SDF: {
    name: "Louisville Muhammad Ali International Airport",
    city: "Louisville",
    country: "US"
  },
  SCF: { name: "Scottsdale Airport", city: "Scottsdale", country: "US" },
  SDM: { name: "Brown Field Municipal Airport", city: "San Diego", country: "US" },
  SDY: { name: "Sidney-Richland Regional Airport", city: "Sidney", country: "US" },
  SEA: { name: "Seattle-Tacoma International Airport", city: "Seattle", country: "US" },
  SEE: { name: "Gillespie Field", city: "San Diego/El Cajon", country: "US" },
  SEF: { name: "Sebring Regional Airport", city: "Sebring", country: "US" },
  SEG: { name: "Penn Valley Airport", city: "Selinsgrove", country: "US" },
  SEM: { name: "Craig Field", city: "Selma", country: "US" },
  SEP: { name: "Stephenville Clark Regional Airport", city: "Stephenville", country: "US" },
  SER: { name: "Freeman Municipal Airport", city: "Seymour", country: "US" },
  SDX: { name: "Sedona Airport", city: "Sedona", country: "US" },
  SFB: { name: "Orlando Sanford International Airport", city: "Orlando", country: "US" },
  SFF: { name: "Felts Field", city: "Spokane", country: "US" },
  SFM: { name: "Sanford Seacoast Regional Airport", city: "Sanford", country: "US" },
  SFO: {
    name: "San Francisco International Airport",
    city: "San Francisco",
    country: "US"
  },
  SFZ: { name: "North Central State Airport", city: "Pawtucket", country: "US" },
  SGF: { name: "Springfield-Branson Ntl Airport", city: "Springfield", country: "US" },
  SGH: {
    name: "Springfield/Beckley Municipal Airport",
    city: "Springfield",
    country: "US"
  },
  UST: { name: "St Augustine Airport", city: "St Augustine", country: "US" },
  SGR: { name: "Sugar Land Regional Airport", city: "Houston", country: "US" },
  SGT: {
    name: "Stuttgart Municipal Carl Humphrey Field",
    city: "Stuttgart",
    country: "US"
  },
  SGU: { name: "St George Regional Airport", city: "St George", country: "US" },
  SHD: {
    name: "Shenandoah Valley Regional Airport",
    city: "Staunton/Waynesboro/Harrisonburg",
    country: "US"
  },
  SHN: { name: "Sanderson Field", city: "Shelton", country: "US" },
  SHR: { name: "Sheridan County Airport", city: "Sheridan", country: "US" },
  SHV: { name: "Shreveport Regional Airport", city: "Shreveport", country: "US" },
  SIK: { name: "Sikeston Memorial Municipal Airport", city: "Sikeston", country: "US" },
  SIV: { name: "Sullivan County Airport", city: "Sullivan", country: "US" },
  SIY: { name: "Siskiyou County Airport", city: "Montague", country: "US" },
  SJC: {
    name: "Norman Y Mineta San Jose International Airport",
    city: "San Jose",
    country: "US"
  },
  SJN: { name: "St Johns Industrial Air Park", city: "St Johns", country: "US" },
  SJT: { name: "San Angelo Regional/Mathis Field", city: "San Angelo", country: "US" },
  SKA: { name: "Fairchild Afb Airport", city: "Spokane", country: "US" },
  SKF: { name: "Kelly Field", city: "San Antonio", country: "US" },
  TSM: { name: "Taos Regional Airport", city: "Taos", country: "US" },
  SLB: { name: "Storm Lake Municipal Airport", city: "Storm Lake", country: "US" },
  SLC: {
    name: "Salt Lake City International Airport",
    city: "Salt Lake City",
    country: "US"
  },
  SLE: { name: "Mcnary Field", city: "Salem", country: "US" },
  SLG: { name: "Smith Field", city: "Siloam Springs", country: "US" },
  SLK: { name: "Adirondack Regional Airport", city: "Saranac Lake", country: "US" },
  SLN: { name: "Salina Regional Airport", city: "Salina", country: "US" },
  SLO: { name: "Salem-Leckrone Airport", city: "Salem", country: "US" },
  SLR: {
    name: "Sulphur Springs Municipal Airport",
    city: "Sulphur Springs",
    country: "US"
  },
  SMD: { name: "Smith Field", city: "Fort Wayne", country: "US" },
  SME: { name: "Lake Cumberland Regional Airport", city: "Somerset", country: "US" },
  SMF: { name: "Sacramento International Airport", city: "Sacramento", country: "US" },
  SMN: { name: "Lemhi County Airport", city: "Salmon", country: "US" },
  SMO: { name: "Santa Monica Municipal Airport", city: "Santa Monica", country: "US" },
  SUM: { name: "Sumter Airport", city: "Sumter", country: "US" },
  SMX: {
    name: "Santa Maria Pub/Capt G Allan Hancock Field",
    city: "Santa Maria",
    country: "US"
  },
  SNA: { name: "John Wayne/Orange County Airport", city: "Santa Ana", country: "US" },
  SNK: { name: "Winston Field", city: "Snyder", country: "US" },
  SNL: { name: "Shawnee Regional Airport", city: "Shawnee", country: "US" },
  SNS: { name: "Salinas Municipal Airport", city: "Salinas", country: "US" },
  SNY: { name: "Sidney Municipal/Lloyd W Carr Field", city: "Sidney", country: "US" },
  SOP: { name: "Moore County Airport", city: "Pinehurst/Southern Pines", country: "US" },
  SOW: { name: "Show Low Regional Airport", city: "Show Low", country: "US" },
  SPA: {
    name: "Spartanburg Downtown Memorial/Simpson Field",
    city: "Spartanburg",
    country: "US"
  },
  SPF: { name: "Black Hills-Clyde Ice Field", city: "Spearfish", country: "US" },
  SPG: { name: "Albert Whitted Airport", city: "St Petersburg", country: "US" },
  SPI: { name: "Abraham Lincoln Capital Airport", city: "Springfield", country: "US" },
  SPS: {
    name: "Sheppard Afb/Wichita Falls Municipal Airport",
    city: "Wichita Falls",
    country: "US"
  },
  SPW: { name: "Spencer Municipal Airport", city: "Spencer", country: "US" },
  SQI: {
    name: "Whiteside County/Jos H Bittorf Field",
    city: "Sterling/Rockfalls",
    country: "US"
  },
  SQL: { name: "San Carlos Airport", city: "San Carlos", country: "US" },
  SRC: { name: "Searcy Regional Airport", city: "Searcy", country: "US" },
  SRQ: {
    name: "Sarasota/Bradenton International Airport",
    city: "Sarasota/Bradenton",
    country: "US"
  },
  RUI: { name: "Sierra Blanca Regional Airport", city: "Ruidoso", country: "US" },
  SRV: { name: "Stony River 2 Airport", city: "Stony River", country: "US" },
  SSC: { name: "Shaw Afb Airport", city: "Sumter", country: "US" },
  SSF: { name: "Stinson Municipal Airport", city: "San Antonio", country: "US" },
  SSI: { name: "St Simons Island Airport", city: "St Simons Island", country: "US" },
  STC: { name: "St Cloud Regional Airport", city: "St Cloud", country: "US" },
  STE: { name: "Stevens Point Municipal Airport", city: "Stevens Point", country: "US" },
  STJ: { name: "Rosecrans Memorial Airport", city: "St Joseph", country: "US" },
  STK: { name: "Sterling Municipal Airport", city: "Sterling", country: "US" },
  STL: { name: "St Louis Lambert International Airport", city: "St Louis", country: "US" },
  STP: { name: "St Paul Downtown Holman Field", city: "St Paul", country: "US" },
  STS: {
    name: "Charles M Schulz/Sonoma County Airport",
    city: "Santa Rosa",
    country: "US"
  },
  SUA: { name: "Witham Field", city: "Stuart", country: "US" },
  SUD: { name: "Stroud Municipal Airport", city: "Stroud", country: "US" },
  SUE: { name: "Door County Cherryland Airport", city: "Sturgeon Bay", country: "US" },
  SUN: { name: "Friedman Memorial Airport", city: "Hailey", country: "US" },
  SUS: { name: "Spirit Of St Louis Airport", city: "St Louis", country: "US" },
  SUU: { name: "Travis Afb Airport", city: "Fairfield", country: "US" },
  SUW: { name: "Richard I Bong Airport", city: "Superior", country: "US" },
  SUX: {
    name: "Sioux Gateway/Brig General Bud Day Field",
    city: "Sioux City",
    country: "US"
  },
  SVC: { name: "Grant County Airport", city: "Silver City", country: "US" },
  SVE: { name: "Susanville Municipal Airport", city: "Susanville", country: "US" },
  SVH: { name: "Statesville Regional Airport", city: "Statesville", country: "US" },
  SVN: { name: "Hunter Army Air Field", city: "Savannah", country: "US" },
  SWF: { name: "New York Stewart International Airport", city: "New York", country: "US" },
  SWO: { name: "Stillwater Regional Airport", city: "Stillwater", country: "US" },
  SWW: { name: "Avenger Field", city: "Sweetwater", country: "US" },
  SXP: { name: "Nunam Iqua Airport", city: "Nunam Iqua", country: "US" },
  SYI: {
    name: "Bomar Field/Shelbyville Municipal Airport",
    city: "Shelbyville",
    country: "US"
  },
  SYN: { name: "Stanton Airfield", city: "Stanton", country: "US" },
  SYR: { name: "Syracuse Hancock International Airport", city: "Syracuse", country: "US" },
  SYV: { name: "Sylvester Airport", city: "Sylvester", country: "US" },
  SZL: { name: "Whiteman Afb Airport", city: "Knob Noster", country: "US" },
  SZP: { name: "Santa Paula Airport", city: "Santa Paula", country: "US" },
  TBC: { name: "Tuba City Airport", city: "Tuba City", country: "US" },
  TAD: { name: "Perry Stokes Airport", city: "Trinidad", country: "US" },
  TBN: {
    name: "Waynesville-St Robert Regional Forney Field",
    city: "Fort Leonard Wood",
    country: "US"
  },
  TBR: { name: "Statesboro-Bulloch County Airport", city: "Statesboro", country: "US" },
  TCC: { name: "Tucumcari Municipal Airport", city: "Tucumcari", country: "US" },
  TCL: { name: "Tuscaloosa Ntl Airport", city: "Tuscaloosa", country: "US" },
  TCM: {
    name: "Mcchord Field (Joint Base Lewis-Mcchord) Airport",
    city: "Tacoma",
    country: "US"
  },
  TCS: {
    name: "Truth Or Consequences Municipal Airport",
    city: "Truth Or Consequences",
    country: "US"
  },
  TDO: {
    name: "Ed Carlson Memorial Field/South Lewis County Airport",
    city: "Toledo",
    country: "US"
  },
  TDW: { name: "Tradewind Airport", city: "Amarillo", country: "US" },
  TDZ: { name: "Toledo Executive Airport", city: "Toledo", country: "US" },
  TEB: { name: "Teterboro Airport", city: "Teterboro", country: "US" },
  TEX: { name: "Telluride Regional Airport", city: "Telluride", country: "US" },
  THA: { name: "Tullahoma Regional/Wm Northern Field", city: "Tullahoma", country: "US" },
  THM: { name: "Thompson Falls Airport", city: "Thompson Falls", country: "US" },
  THV: { name: "York Airport", city: "York", country: "US" },
  TIK: { name: "Tinker Afb Airport", city: "Oklahoma City", country: "US" },
  TIW: { name: "Tacoma Narrows Airport", city: "Tacoma", country: "US" },
  TIX: { name: "Space Coast Regional Airport", city: "Titusville", country: "US" },
  KNT: { name: "Kennett Memorial Airport", city: "Kennett", country: "US" },
  TLH: { name: "Tallahassee International Airport", city: "Tallahassee", country: "US" },
  TLR: { name: "Mefford Field", city: "Tulare", country: "US" },
  TMA: { name: "Henry Tift Myers Airport", city: "Tifton", country: "US" },
  TMB: { name: "Miami Executive Airport", city: "Miami", country: "US" },
  OTK: { name: "Tillamook Airport", city: "Tillamook", country: "US" },
  ASQ: { name: "Austin Airport", city: "Austin", country: "US" },
  TNP: { name: "Twentynine Palms Airport", city: "Twentynine Palms", country: "US" },
  TNT: {
    name: "Dade-Collier Training And Transition Airport",
    city: "Miami",
    country: "US"
  },
  TNU: { name: "Newton Municipal-Earl Johnson Field", city: "Newton", country: "US" },
  XSD: { name: "Tonopah Test Range", city: "Tonopah", country: "US" },
  TOA: { name: "Zamperini Field", city: "Torrance", country: "US" },
  TOC: { name: "Toccoa Rg Letourneau Field", city: "Toccoa", country: "US" },
  TOI: { name: "Troy Municipal At N Kenneth Campbell Field", city: "Troy", country: "US" },
  TOL: { name: "Eugene F Kranz Toledo Express Airport", city: "Toledo", country: "US" },
  TOP: { name: "Philip Billard Municipal Airport", city: "Topeka", country: "US" },
  TOR: { name: "Torrington Municipal Airport", city: "Torrington", country: "US" },
  TPA: { name: "Tampa International Airport", city: "Tampa", country: "US" },
  TPF: { name: "Peter O Knight Airport", city: "Tampa", country: "US" },
  TPH: { name: "Tonopah Airport", city: "Tonopah", country: "US" },
  TPL: {
    name: "Draughon-Miller Central Texas Regional Airport",
    city: "Temple",
    country: "US"
  },
  PTA: { name: "Port Alsworth Airport", city: "Port Alsworth", country: "US" },
  TRI: { name: "Tri-Cities Airport", city: "Bristol/Johnson/Kingsport", country: "US" },
  TKF: { name: "Truckee-Tahoe Airport", city: "Truckee", country: "US" },
  TRL: { name: "Terrell Municipal Airport", city: "Terrell", country: "US" },
  TRM: { name: "Jacqueline Cochran Regional Airport", city: "Palm Springs", country: "US" },
  TRX: { name: "Trenton Municipal Airport", city: "Trenton", country: "US" },
  TSG: { name: "Tanacross Airport", city: "Tanacross", country: "US" },
  TSP: { name: "Tehachapi Municipal Airport", city: "Tehachapi", country: "US" },
  TTD: { name: "Portland-Troutdale Airport", city: "Portland", country: "US" },
  TTN: { name: "Trenton Mercer Airport", city: "Trenton", country: "US" },
  TUL: { name: "Tulsa International Airport", city: "Tulsa", country: "US" },
  TUP: { name: "Tupelo Regional Airport", city: "Tupelo", country: "US" },
  TUS: { name: "Tucson International Airport", city: "Tucson", country: "US" },
  TVC: { name: "Cherry Capital Airport", city: "Traverse City", country: "US" },
  TVF: {
    name: "Thief River Falls Regional Airport",
    city: "Thief River Falls",
    country: "US"
  },
  TVI: { name: "Thomasville Regional Airport", city: "Thomasville", country: "US" },
  TVL: { name: "Lake Tahoe Airport", city: "South Lake Tahoe", country: "US" },
  TWF: {
    name: "Joslin Field/Magic Valley Regional Airport",
    city: "Twin Falls",
    country: "US"
  },
  NIR: { name: "Chase Field Industrial Airport", city: "Beeville", country: "US" },
  TXK: { name: "Texarkana Regional-Webb Field", city: "Texarkana", country: "US" },
  TYE: { name: "Tyonek Airport", city: "Tyonek", country: "US" },
  TYZ: { name: "Taylor Airport", city: "Taylor", country: "US" },
  TYR: { name: "Tyler Pounds Regional Airport", city: "Tyler", country: "US" },
  TYS: { name: "Mc Ghee Tyson Airport", city: "Knoxville", country: "US" },
  BFG: { name: "Bullfrog Basin Airport", city: "Glen Canyon Natl Rec Area", country: "US" },
  NPH: { name: "Nephi Municipal Airport", city: "Nephi", country: "US" },
  RVR: { name: "Green River Municipal Airport", city: "Green River", country: "US" },
  DBS: { name: "Dubois Municipal Airport", city: "Dubois", country: "US" },
  PNU: { name: "Panguitch Municipal Airport", city: "Panguitch", country: "US" },
  MXC: { name: "Monticello Airport", city: "Monticello", country: "US" },
  ICS: { name: "Cascade Airport", city: "Cascade", country: "US" },
  UBS: { name: "Columbus-Lowndes County Airport", city: "Columbus", country: "US" },
  UCY: { name: "Everett-Stewart Regional Airport", city: "Union City", country: "US" },
  UDD: { name: "Bermuda Dunes Airport", city: "Palm Springs", country: "US" },
  UES: { name: "Waukesha County Airport", city: "Waukesha", country: "US" },
  UGB: { name: "Ugashik Bay Airport", city: "Pilot Point", country: "US" },
  UGN: { name: "Waukegan Ntl Airport", city: "Chicago/Waukegan", country: "US" },
  UIL: { name: "Quillayute Airport", city: "Quillayute", country: "US" },
  UIN: { name: "Quincy Regional-Baldwin Field", city: "Quincy", country: "US" },
  IKB: { name: "Wilkes County Airport", city: "North Wilkesboro", country: "US" },
  UKI: { name: "Ukiah Municipal Airport", city: "Ukiah", country: "US" },
  UKT: { name: "Quakertown Airport", city: "Quakertown", country: "US" },
  ULM: { name: "New Ulm Municipal Airport", city: "New Ulm", country: "US" },
  ATO: { name: "Ohio University Airport", city: "Athens/Albany", country: "US" },
  UNU: { name: "Dodge County Airport", city: "Juneau", country: "US" },
  SCE: { name: "State College Regional Airport", city: "State College", country: "US" },
  UOS: { name: "Franklin County Airport", city: "Sewanee", country: "US" },
  UOX: { name: "University-Oxford Airport", city: "Oxford", country: "US" },
  UTM: { name: "Tunica Municipal Airport", city: "Tunica", country: "US" },
  HTV: { name: "Huntsville Municipal Airport", city: "Huntsville", country: "US" },
  NPT: { name: "Newport State Airport", city: "Newport", country: "US" },
  UVA: { name: "Garner Field", city: "Uvalde", country: "US" },
  RKH: { name: "Rock Hill/York County/Bryant Field", city: "Rock Hill", country: "US" },
  VAD: { name: "Moody Afb Airport", city: "Valdosta", country: "US" },
  LLY: { name: "South Jersey Regional Airport", city: "Mount Holly", country: "US" },
  VBG: { name: "Vandenberg Space Force Base Airport", city: "Lompoc", country: "US" },
  VCT: { name: "Victoria Regional Airport", city: "Victoria", country: "US" },
  VCV: {
    name: "Southern California Logistics Airport",
    city: "Victorville",
    country: "US"
  },
  VDI: { name: "Vidalia Regional Airport", city: "Vidalia", country: "US" },
  VEL: { name: "Vernal Regional Airport", city: "Vernal", country: "US" },
  VGT: { name: "North Las Vegas Airport", city: "Las Vegas", country: "US" },
  VHN: { name: "Culberson County Airport", city: "Van Horn", country: "US" },
  VIH: { name: "Rolla Ntl Airport", city: "Rolla/Vichy", country: "US" },
  VIS: { name: "Visalia Municipal Airport", city: "Visalia", country: "US" },
  VJI: { name: "Virginia Highlands Airport", city: "Abingdon", country: "US" },
  VKS: { name: "Vicksburg Municipal Airport", city: "Vicksburg", country: "US" },
  VLA: { name: "Vandalia Municipal Airport", city: "Vandalia", country: "US" },
  VLD: { name: "Valdosta Regional Airport", city: "Valdosta", country: "US" },
  VNC: { name: "Venice Municipal Airport", city: "Venice", country: "US" },
  VNY: { name: "Van Nuys Airport", city: "Van Nuys", country: "US" },
  VOK: { name: "Volk Field", city: "Camp Douglas", country: "US" },
  VPS: {
    name: "Eglin Afb/Destin-Ft Walton Beach Airport",
    city: "Valparaiso/Destin-Ft Walton Beach",
    country: "US"
  },
  VPZ: { name: "Porter County Regional Airport", city: "Valparaiso", country: "US" },
  VQQ: { name: "Cecil Airport", city: "Jacksonville", country: "US" },
  VRB: { name: "Vero Beach Regional Airport", city: "Vero Beach", country: "US" },
  VSF: { name: "Hartness State (Springfield) Airport", city: "Springfield", country: "US" },
  VTN: { name: "Miller Field", city: "Valentine", country: "US" },
  VYS: {
    name: "Illinois Valley Regional-Walter A Duncan Field",
    city: "Peru",
    country: "US"
  },
  GTY: { name: "Gettysburg Regional Airport", city: "Gettysburg", country: "US" },
  SQV: { name: "Sequim Valley Airport", city: "Sequim", country: "US" },
  RCE: { name: "Roche Harbor Seaplane Base", city: "Roche Harbor", country: "US" },
  WAL: { name: "Wallops Flight Facility Airport", city: "Wallops Island", country: "US" },
  WAY: { name: "Greene County Airport", city: "Waynesburg", country: "US" },
  WBB: { name: "Stebbins Airport", city: "Stebbins", country: "US" },
  WBW: { name: "Wilkes-Barre Wyoming Valley Airport", city: "Wilkes-Barre", country: "US" },
  WDG: { name: "Enid Woodring Regional Airport", city: "Enid", country: "US" },
  WDR: { name: "Barrow County Airport", city: "Winder", country: "US" },
  WEA: { name: "Parker County Airport", city: "Weatherford", country: "US" },
  WHP: { name: "Whiteman Airport", city: "Los Angeles", country: "US" },
  WJF: { name: "General Wm J Fox Airfield", city: "Lancaster", country: "US" },
  WLD: { name: "Strother Field", city: "Winfield/Arkansas City", country: "US" },
  WLW: { name: "Willows/Glenn County Airport", city: "Willows", country: "US" },
  WMC: { name: "Winnemucca Municipal Airport", city: "Winnemucca", country: "US" },
  WRB: { name: "Robins Afb Airport", city: "Warner Robins", country: "US" },
  WRI: {
    name: "Mc Guire Field (Joint Base Mc Guire Dix Lakehurst) Airport",
    city: "Wrightstown",
    country: "US"
  },
  WRL: { name: "Worland Municipal Airport", city: "Worland", country: "US" },
  WSM: { name: "Wiseman Airport", city: "Wiseman", country: "US" },
  WST: { name: "Westerly State Airport", city: "Westerly", country: "US" },
  WVI: { name: "Watsonville Municipal Airport", city: "Watsonville", country: "US" },
  WVL: { name: "Waterville Regional Airport", city: "Waterville", country: "US" },
  WWD: { name: "Cape May County Airport", city: "Wildwood", country: "US" },
  WWR: { name: "West Woodward Airport", city: "Woodward", country: "US" },
  WYS: { name: "Yellowstone Airport", city: "West Yellowstone", country: "US" },
  KYO: { name: "Tampa North Aero Park Airport", city: "Tampa", country: "US" },
  HUC: { name: "Dr Hermenegildo Ortiz Quinones Airport", city: "Humacao", country: "US" },
  XNA: {
    name: "Northwest Arkansas Ntl Airport",
    city: "Fayetteville/Springdale/Rogers",
    country: "US"
  },
  XWA: { name: "Williston Basin International Airport", city: "Williston", country: "US" },
  UKN: { name: "Waukon Municipal Airport", city: "Waukon", country: "US" },
  WBK: { name: "West Branch Community Airport", city: "West Branch", country: "US" },
  YIP: { name: "Willow Run Airport", city: "Detroit", country: "US" },
  YKM: { name: "Yakima Air Trml/Mcallister Field", city: "Yakima", country: "US" },
  YKN: { name: "Chan Gurney Municipal Airport", city: "Yankton", country: "US" },
  YNG: {
    name: "Youngstown/Warren Regional Airport",
    city: "Youngstown/Warren",
    country: "US"
  },
  BCC: { name: "Bear Creek 3 Airport", city: "Bear Creek", country: "US" },
  KBC: { name: "Birch Creek Airport", city: "Birch Creek", country: "US" },
  CZC: { name: "Copper Center 2 Airport", city: "Copper Center", country: "US" },
  ZNC: { name: "Nyac Airport", city: "Nyac", country: "US" },
  ZPH: { name: "Zephyrhills Municipal Airport", city: "Zephyrhills", country: "US" },
  ZZV: { name: "Zanesville Municipal Airport", city: "Zanesville", country: "US" },
  KFZ: { name: "Kukes Airport", city: "Kukes", country: "AL" },
  TIA: {
    name: "Tirana International Airport Mother Teresa",
    city: "Tirana",
    country: "AL"
  },
  VLO: { name: "Vlora Internationa Airport", city: "Vlora", country: "AL" },
  BOJ: { name: "Burgas Airport", city: "Burgas", country: "BG" },
  GOZ: { name: "Gorna Oryahovitsa Airport", city: "Gorna Oryahovitsa", country: "BG" },
  JAM: { name: "Bezmer Air Base", city: "Yambol", country: "BG" },
  PDV: { name: "Plovdiv International Airport", city: "Plovdiv", country: "BG" },
  SOF: { name: "Sofia Airport", city: "Sofia", country: "BG" },
  VAR: { name: "Varna Airport", city: "Varna", country: "BG" },
  ECN: { name: "Ercan International Airport", city: "Nicosia", country: "CY" },
  LCA: { name: "Larnaca International Airport", city: "Larnarca", country: "CY" },
  PFO: { name: "Paphos International Airport", city: "Paphos", country: "CY" },
  AKT: { name: "RAF Akrotiri", city: "", country: "CY" },
  DBV: { name: "Dubrovnik Airport", city: "Dubrovnik", country: "HR" },
  LSZ: { name: "Losinj Island Airport", city: "Losinj", country: "HR" },
  OSI: { name: "Osijek Airport", city: "Osijek", country: "HR" },
  PUY: { name: "Pula Airport", city: "Pula", country: "HR" },
  RJK: { name: "Rijeka Airport", city: "Rijeka", country: "HR" },
  BWK: { name: "Brac Airport", city: "Brac Island", country: "HR" },
  SPU: { name: "Split Airport", city: "Split", country: "HR" },
  ZAG: { name: "Zagreb Airport", city: "Zagreb", country: "HR" },
  ZAD: { name: "Zemunik Airport", city: "Zadar", country: "HR" },
  ABC: { name: "Albacete-Los Llanos Airport", city: "Albacete", country: "ES" },
  ALC: { name: "Alicante International Airport", city: "Alicante", country: "ES" },
  LEI: { name: "Almeria International Airport", city: "Almeria", country: "ES" },
  OVD: { name: "Asturias Airport", city: "Ranon", country: "ES" },
  ODB: { name: "Cordoba Airport", city: "Cordoba", country: "ES" },
  BIO: { name: "Bilbao Airport", city: "Bilbao", country: "ES" },
  RGS: { name: "Burgos Airport", city: "Burgos", country: "ES" },
  BCN: { name: "Barcelona International Airport", city: "Barcelona", country: "ES" },
  BJZ: { name: "Badajoz Airport", city: "Badajoz", country: "ES" },
  CDT: {
    name: "Castell\xF3n Airport",
    city: "Castell\xF3n de la Plana",
    country: "ES"
  },
  LCG: { name: "A Coruna Airport", city: "Culleredo", country: "ES" },
  ILD: { name: "Lleida-Alguaire Airport", city: "Lleida", country: "ES" },
  GRO: { name: "Girona Airport", city: "Girona", country: "ES" },
  GRX: { name: "Federico Garcia Lorca Airport", city: "Granada", country: "ES" },
  HSK: {
    name: "Huesca/Pirineos Airport",
    city: "Monflorite/Alcala del Obispo",
    country: "ES"
  },
  IBZ: { name: "Ibiza Airport", city: "Ibiza", country: "ES" },
  XRY: { name: "Jerez Airport", city: "Jerez de la Forntera", country: "ES" },
  LEN: { name: "Leon Airport", city: "Leon", country: "ES" },
  RJL: { name: "Logrono-Agoncillo Airport", city: "Logrono", country: "ES" },
  MAD: { name: "Madrid Barajas International Airport", city: "Madrid", country: "ES" },
  AGP: { name: "Malaga Airport", city: "Malaga", country: "ES" },
  MAH: { name: "Menorca Airport", city: "Menorca Island", country: "ES" },
  RMU: {
    name: "Regi\xF3n de Murcia International Airport",
    city: "Corvera",
    country: "ES"
  },
  OZP: { name: "Moron Air Base", city: "Moron", country: "ES" },
  PMI: { name: "Palma De Mallorca Airport", city: "Palma De Mallorca", country: "ES" },
  PNA: { name: "Pamplona Airport", city: "Pamplona", country: "ES" },
  CQM: { name: "Ciudad Real International Airport", city: "Ciudad Real", country: "ES" },
  REU: { name: "Reus Air Base", city: "Reus", country: "ES" },
  ROZ: { name: "Rota Naval Station Airport", city: "Rota", country: "ES" },
  SLM: { name: "Salamanca Airport", city: "Salamanca", country: "ES" },
  EAS: { name: "San Sebastian Airport", city: "Hondarribia", country: "ES" },
  SCQ: {
    name: "Santiago de Compostela Airport",
    city: "Santiago de Compostela",
    country: "ES"
  },
  LEU: {
    name: "Aerodrom dels Pirineus-Alt Urgell Airport",
    city: "Montferrer / Castellbo",
    country: "ES"
  },
  TEV: { name: "Teruel Airport", city: "Teruel", country: "ES" },
  TOJ: { name: "Torrejon Airport", city: "Madrid", country: "ES" },
  VLC: { name: "Valencia Airport", city: "Valencia", country: "ES" },
  VLL: { name: "Valladolid Airport", city: "Valladolid", country: "ES" },
  VIT: { name: "Vitoria/Foronda Airport", city: "Alava", country: "ES" },
  VGO: { name: "Vigo Airport", city: "Vigo", country: "ES" },
  SDR: { name: "Santander Airport", city: "Santander", country: "ES" },
  ZAZ: { name: "Zaragoza Air Base", city: "Zaragoza", country: "ES" },
  SVQ: { name: "Sevilla Airport", city: "Sevilla", country: "ES" },
  DPE: { name: "St Aubin Airport", city: "Dieppe", country: "FR" },
  CQF: { name: "Calais-Dunkerque Airport", city: "Marck", country: "FR" },
  BYF: { name: "Albert-Bray Airport", city: "Albert/Bray", country: "FR" },
  LTQ: {
    name: "Le Touquet-Cote d'Opale Airport",
    city: "Le Touquet-Paris-Plage",
    country: "FR"
  },
  AGF: { name: "Agen-La Garenne Airport", city: "Agen/La Garenne", country: "FR" },
  BOD: {
    name: "Bordeaux-Merignac (BA 106) Airport",
    city: "Bordeaux/Merignac",
    country: "FR"
  },
  EGC: { name: "Bergerac-Roumaniere Airport", city: "Bergerac/Roumaniere", country: "FR" },
  CNG: {
    name: "Cognac-Chateaubernard (BA 709) Air Base",
    city: "Cognac/Chateaubernard",
    country: "FR"
  },
  LRH: {
    name: "La Rochelle-Ile de Re Airport",
    city: "La Rochelle/Ile de Re",
    country: "FR"
  },
  PIS: { name: "Poitiers-Biard Airport", city: "Poitiers/Biard", country: "FR" },
  MCU: { name: "Montlucon-Gueret Airport", city: "Montlucon/Gueret", country: "FR" },
  LIG: { name: "Limoges Airport", city: "Limoges/Bellegarde", country: "FR" },
  NIT: { name: "Niort-Souche Airport", city: "Niort/Souche", country: "FR" },
  TLS: { name: "Toulouse-Blagnac Airport", city: "Toulouse/Blagnac", country: "FR" },
  PUF: { name: "Pau Pyrenees Airport", city: "Pau/Pyrenees (Uzein)", country: "FR" },
  LDE: {
    name: "Tarbes-Lourdes-Pyrenees Airport",
    city: "Tarbes/Lourdes/Pyrenees",
    country: "FR"
  },
  ANG: {
    name: "Angouleme-Brie-Champniers Airport",
    city: "Angouleme/Brie/Champniers",
    country: "FR"
  },
  PGX: { name: "Perigueux-Bassillac Airport", city: "Perigueux/Bassillac", country: "FR" },
  BIQ: {
    name: "Biarritz-Anglet-Bayonne Airport",
    city: "Biarritz/Anglet/Bayonne",
    country: "FR"
  },
  ZAO: { name: "Cahors-Lalbenque Airport", city: "Cahors/Lalbenque", country: "FR" },
  LBI: { name: "Albi-Le Sequestre Airport", city: "Albi/Le Sequestre", country: "FR" },
  DCM: { name: "Castres-Mazamet Airport", city: "Castres/Mazamet", country: "FR" },
  RDZ: { name: "Rodez-Marcillac Airport", city: "Rodez/Marcillac", country: "FR" },
  RYN: { name: "Royan-Medis Airport", city: "Royan/Medis", country: "FR" },
  RCO: {
    name: "Rochefort-Saint-Agnant (BA 721) Airport",
    city: "Rochefort/Saint-Agnant",
    country: "FR"
  },
  IDY: { name: "Ile d'Yeu Airport", city: "Ile d'Yeu", country: "FR" },
  CMR: { name: "Colmar-Houssen Airport", city: "Colmar/Houssen", country: "FR" },
  DLE: { name: "Dole-Tavaux Airport", city: "Dole/Tavaux", country: "FR" },
  MVV: { name: "Megeve Airport", city: "Verdun", country: "FR" },
  OBS: {
    name: "Aubenas-Ardeche Meridional Airport",
    city: "Aubenas/Ardeche Meridional",
    country: "FR"
  },
  LPY: { name: "Le Puy-Loudes Airport", city: "Le Puy/Loudes", country: "FR" },
  XBK: { name: "Bourg-Ceyzeriat Airport", city: "Bourg/Ceyzeriat", country: "FR" },
  AHZ: { name: "L'alpe D'huez Airport", city: "Bourg", country: "FR" },
  XMU: { name: "Moulins-Montbeugny Airport", city: "Moulins/Montbeugny", country: "FR" },
  ETZ: { name: "Metz-Nancy-Lorraine Airport", city: "Metz / Nancy", country: "FR" },
  ANE: { name: "Angers-Loire Airport", city: "Angers/Marce", country: "FR" },
  BIA: { name: "Bastia-Poretta Airport", city: "Bastia/Poretta", country: "FR" },
  CLY: {
    name: "Calvi-Sainte-Catherine Airport",
    city: "Calvi/Sainte-Catherine",
    country: "FR"
  },
  FSC: { name: "Figari Sud-Corse Airport", city: "Figari Sud-Corse", country: "FR" },
  AJA: {
    name: "Ajaccio-Napoleon Bonaparte Airport",
    city: "Ajaccio/Napoleon Bonaparte",
    country: "FR"
  },
  PRP: { name: "Propriano Airport", city: "Propriano", country: "FR" },
  SOZ: { name: "Solenzara (BA 126) Air Base", city: "Solenzara", country: "FR" },
  MFX: { name: "Meribel Airport", city: "Ajaccio", country: "FR" },
  AUF: { name: "Auxerre-Branches Airport", city: "Auxerre/Branches", country: "FR" },
  CMF: { name: "Chambery-Savoie Airport", city: "Chambery/Aix-les-Bains", country: "FR" },
  CFE: {
    name: "Clermont-Ferrand Auvergne Airport",
    city: "Clermont-Ferrand/Auvergne",
    country: "FR"
  },
  BOU: { name: "Bourges Airport", city: "Bourges", country: "FR" },
  CVF: { name: "Courchevel Airport", city: "Courcheval", country: "FR" },
  LYS: { name: "Lyon Saint-Exupery Airport", city: "Lyon", country: "FR" },
  SYT: { name: "Saint-Yan Airport", city: "Saint-Yan", country: "FR" },
  RNE: { name: "Roanne-Renaison Airport", city: "Roanne/Renaison", country: "FR" },
  NCY: {
    name: "Annecy-Haute-Savoie-Mont Blanc Airport",
    city: "Annecy/Meythet",
    country: "FR"
  },
  GNB: { name: "Grenoble-Isere Airport", city: "Grenoble/Saint-Geoirs", country: "FR" },
  VAF: { name: "Valence-Chabeuil Airport", city: "Valence/Chabeuil", country: "FR" },
  VHY: { name: "Vichy-Charmeil Airport", city: "Vichy/Charmeil", country: "FR" },
  AUR: { name: "Aurillac Airport", city: "Aurillac", country: "FR" },
  CHR: {
    name: "Chateauroux-Deols Marcel Dassault Airport",
    city: "Chateauroux/Deols",
    country: "FR"
  },
  LYN: { name: "Lyon-Bron Airport", city: "Lyon/Bron", country: "FR" },
  QXB: { name: "Aix-en-Provence (BA 114) Airport", city: "Lyon", country: "FR" },
  CEQ: { name: "Cannes-Mandelieu Airport", city: "Cannes/Mandelieu", country: "FR" },
  EBU: {
    name: "Saint-Etienne-Boutheon Airport",
    city: "Saint-Etienne/Boutheon",
    country: "FR"
  },
  CCF: { name: "Carcassonne Airport", city: "Carcassonne/Salvaza", country: "FR" },
  MRS: { name: "Marseille Provence Airport", city: "Marseille", country: "FR" },
  NCE: { name: "Nice-Cote d'Azur Airport", city: "Nice", country: "FR" },
  PGF: {
    name: "Perpignan-Rivesaltes (Llabanere) Airport",
    city: "Perpignan/Rivesaltes",
    country: "FR"
  },
  CTT: { name: "Le Castellet Airport", city: "Le Castellet", country: "FR" },
  BAE: { name: "Barcelonnette - Saint-Pons Airport", city: "Le Castellet", country: "FR" },
  MPL: {
    name: "Montpellier-Mediterranee Airport",
    city: "Montpellier/Mediterranee",
    country: "FR"
  },
  BZR: { name: "Beziers-Vias Airport", city: "Beziers/Vias", country: "FR" },
  AVN: { name: "Avignon-Caumont Airport", city: "Avignon/Caumont", country: "FR" },
  GAT: { name: "Gap - Tallard Airport", city: "Avignon", country: "FR" },
  MEN: { name: "Mende-Brenoux Airport", city: "Mende/Brenoux", country: "FR" },
  SCP: { name: "Mont-Dauphin - St-Crepin Airport", city: "Mende", country: "FR" },
  BVA: { name: "Paris Beauvais Tille Airport", city: "Beauvais/Tille", country: "FR" },
  EVX: {
    name: "Evreux-Fauville (BA 105) Air Base",
    city: "Evreux/Fauville",
    country: "FR"
  },
  LEH: { name: "Le Havre Octeville Airport", city: "Le Havre/Octeville", country: "FR" },
  XCR: { name: "Chalons-Vatry Air Base", city: "Chalons/Vatry", country: "FR" },
  LSO: {
    name: "Les Sables-d'Olonne Talmont Airport",
    city: "Les Sables-d'Olonne",
    country: "FR"
  },
  URO: { name: "Rouen Airport", city: "Rouen/Vallee de Seine", country: "FR" },
  TUF: {
    name: "Tours-Val-de-Loire Airport",
    city: "Tours/Val de Loire (Loire Valley)",
    country: "FR"
  },
  CET: { name: "Cholet Le Pontreau Airport", city: "Cholet/Le Pontreau", country: "FR" },
  LVA: { name: "Laval-Entrammes Airport", city: "Laval/Entrammes", country: "FR" },
  ORE: {
    name: "Orleans-Saint-Denis-de-l'Hotel Airport",
    city: "Orleans/Saint-Denis-de-l'Hotel",
    country: "FR"
  },
  LBG: { name: "Paris-Le Bourget Airport", city: "Paris", country: "FR" },
  CSF: { name: "Creil Air Base", city: "Creil", country: "FR" },
  CDG: { name: "Charles de Gaulle International Airport", city: "Paris", country: "FR" },
  TNF: { name: "Toussus-le-Noble Airport", city: "Toussus-le-Noble", country: "FR" },
  ORY: { name: "Paris-Orly Airport", city: "Paris", country: "FR" },
  POX: { name: "Pontoise - Cormeilles-en-Vexin Airport", city: "Pontoise", country: "FR" },
  VIY: {
    name: "Villacoublay-Velizy (BA 107) Air Base",
    city: "Villacoublay/Velizy",
    country: "FR"
  },
  NVS: {
    name: "Nevers-Fourchambault Airport",
    city: "Nevers/Fourchambault",
    country: "FR"
  },
  LIL: { name: "Lille-Lesquin Airport", city: "Lille/Lesquin", country: "FR" },
  HZB: { name: "Merville-Calonne Airport", city: "Merville/Calonne", country: "FR" },
  BES: { name: "Brest Bretagne Airport", city: "Brest/Guipavas", country: "FR" },
  CER: { name: "Cherbourg-Maupertus Airport", city: "Cherbourg/Maupertus", country: "FR" },
  DNR: {
    name: "Dinard-Pleurtuit-Saint-Malo Airport",
    city: "Dinard/Pleurtuit/Saint-Malo",
    country: "FR"
  },
  LBY: { name: "La Baule-Escoublac Airport", city: "La Baule-Escoublac", country: "FR" },
  GFR: { name: "Granville Airport", city: "Granville", country: "FR" },
  DOL: { name: "Deauville-Saint-Gatien Airport", city: "Deauville", country: "FR" },
  LRT: {
    name: "Lorient South Brittany (Bretagne Sud) Airport",
    city: "Lorient/Lann/Bihoue",
    country: "FR"
  },
  EDM: {
    name: "La Roche-sur-Yon Airport",
    city: "La Roche-sur-Yon/Les Ajoncs",
    country: "FR"
  },
  LDV: { name: "Landivisiau Air Base", city: "Landivisiau", country: "FR" },
  CFR: { name: "Caen-Carpiquet Airport", city: "Caen/Carpiquet", country: "FR" },
  LME: { name: "Le Mans-Arnage Airport", city: "Le Mans/Arnage", country: "FR" },
  RNS: {
    name: "Rennes-Saint-Jacques Airport",
    city: "Rennes/Saint-Jacques",
    country: "FR"
  },
  LAI: { name: "Lannion-Cote de Granit Airport", city: "Lannion", country: "FR" },
  UIP: { name: "Quimper-Cornouaille Airport", city: "Quimper/Pluguffan", country: "FR" },
  NTE: { name: "Nantes Atlantique Airport", city: "Nantes", country: "FR" },
  SBK: { name: "Saint-Brieuc-Armor Airport", city: "Saint-Brieuc/Armor", country: "FR" },
  MXN: { name: "Morlaix-Ploujean Airport", city: "Morlaix/Ploujean", country: "FR" },
  VNE: { name: "Vannes-Meucon Airport", city: "Vannes/Meucon", country: "FR" },
  SNR: {
    name: "Saint-Nazaire-Montoir Airport",
    city: "Saint-Nazaire/Montoir",
    country: "FR"
  },
  BSL: {
    name: "EuroAirport Basel-Mulhouse-Freiburg Airport",
    city: "Bale/Mulhouse",
    country: "FR"
  },
  DIJ: { name: "Dijon-Bourgogne Airport", city: "Dijon/Longvic", country: "FR" },
  MZM: { name: "Metz-Frescaty (BA 128) Air Base", city: "Metz/Frescaty", country: "FR" },
  EPL: { name: "Epinal-Mirecourt Airport", city: "Epinal/Mirecourt", country: "FR" },
  BVE: { name: "Brive Souillac Airport", city: "Nespouls", country: "FR" },
  ENC: { name: "Nancy-Essey Airport", city: "Nancy/Essey", country: "FR" },
  RHE: { name: "Reims-Champagne (BA 112) Airport", city: "Reims/Champagne", country: "FR" },
  SXB: { name: "Strasbourg Airport", city: "Strasbourg", country: "FR" },
  VTL: { name: "Vittel Champ De Course Airport", city: "Luxeuil", country: "FR" },
  TLN: {
    name: "Toulon-Hyeres Airport",
    city: "Toulon/Hyeres/Le Palyvestre",
    country: "FR"
  },
  FNI: { name: "Nimes-Arles-Camargue Airport", city: "Nimes/Garons", country: "FR" },
  LTT: { name: "La Mole Airport", city: "La Mole", country: "FR" },
  MQC: { name: "Miquelon Airport", city: "Miquelon", country: "PM" },
  FSP: { name: "St Pierre Airport", city: "Saint-Pierre", country: "PM" },
  PYR: { name: "Andravida Airport", city: "Andravida", country: "GR" },
  AGQ: { name: "Agrinion Airport", city: "Agrinion", country: "GR" },
  AXD: { name: "Dimokritos Airport", city: "Alexandroupolis", country: "GR" },
  HEW: { name: "Athen Helenikon Airport", city: "Athens", country: "GR" },
  ATH: {
    name: "Eleftherios Venizelos International Airport",
    city: "Athens",
    country: "GR"
  },
  VOL: { name: "Nea Anchialos Airport", city: "Nea Anchialos", country: "GR" },
  JKH: { name: "Chios Island National Airport", city: "Chios Island", country: "GR" },
  PKH: { name: "Porto Cheli Airport", city: "Porto Cheli", country: "GR" },
  JIK: { name: "Ikaria Airport", city: "Ikaria Island", country: "GR" },
  IOA: { name: "Ioannina Airport", city: "Ioannina", country: "GR" },
  HER: {
    name: "Heraklion International Nikos Kazantzakis Airport",
    city: "Heraklion",
    country: "GR"
  },
  KSO: { name: "Kastoria National Airport", city: "Kastoria", country: "GR" },
  KIT: { name: "Kithira Airport", city: "Kithira Island", country: "GR" },
  EFL: { name: "Kefallinia Airport", city: "Kefallinia Island", country: "GR" },
  KZS: { name: "Kastelorizo Airport", city: "Kastelorizo Island", country: "GR" },
  KLX: { name: "Kalamata Airport", city: "Kalamata", country: "GR" },
  KGS: { name: "Kos Airport", city: "Kos Island", country: "GR" },
  AOK: { name: "Karpathos Airport", city: "Karpathos Island", country: "GR" },
  CFU: {
    name: "Ioannis Kapodistrias International Airport",
    city: "Kerkyra Island",
    country: "GR"
  },
  KSJ: { name: "Kasos Airport", city: "Kasos Island", country: "GR" },
  KVA: { name: "Alexander the Great International Airport", city: "Kavala", country: "GR" },
  JKL: { name: "Kalymnos Airport", city: "Kalymnos Island", country: "GR" },
  KZI: { name: "Filippos Airport", city: "Kozani", country: "GR" },
  LRS: { name: "Leros Airport", city: "Leros Island", country: "GR" },
  LXS: { name: "Limnos Airport", city: "Limnos Island", country: "GR" },
  LRA: { name: "Larisa Airport", city: "Larisa", country: "GR" },
  JMK: { name: "Mikonos Airport", city: "Mykonos Island", country: "GR" },
  MLO: { name: "Milos Airport", city: "Milos Island", country: "GR" },
  MJT: { name: "Mytilene International Airport", city: "Mytilene", country: "GR" },
  JNX: { name: "Naxos Airport", city: "Naxos Island", country: "GR" },
  PAS: { name: "Paros Airport", city: "Paros Island", country: "GR" },
  JTY: { name: "Astypalaia Airport", city: "Astypalaia Island", country: "GR" },
  PVK: { name: "Aktion National Airport", city: "Preveza/Lefkada", country: "GR" },
  RHO: { name: "Diagoras Airport", city: "Rodes Island", country: "GR" },
  GPA: { name: "Araxos Airport", city: "Patras", country: "GR" },
  CHQ: { name: "Chania International Airport", city: "Souda", country: "GR" },
  JSI: { name: "Skiathos Island National Airport", city: "Skiathos", country: "GR" },
  SMI: { name: "Samos Airport", city: "Samos Island", country: "GR" },
  JSY: { name: "Syros Airport", city: "Syros Island", country: "GR" },
  SPJ: { name: "Sparti Airport", city: "Sparti", country: "GR" },
  JTR: { name: "Santorini Airport", city: "Santorini Island", country: "GR" },
  JSH: { name: "Sitia Airport", city: "Crete Island", country: "GR" },
  SKU: { name: "Skiros Airport", city: "Skiros Island", country: "GR" },
  SKG: {
    name: "Thessaloniki Macedonia International Airport",
    city: "Thessaloniki",
    country: "GR"
  },
  ZTH: { name: "Dionysios Solomos Airport", city: "Zakynthos Island", country: "GR" },
  BUD: {
    name: "Budapest Ferenc Liszt International Airport",
    city: "Budapest",
    country: "HU"
  },
  DEB: { name: "Debrecen International Airport", city: "Debrecen", country: "HU" },
  PEV: { name: "Pecs-Pogany Airport", city: "Pecs-Pogany", country: "HU" },
  QGY: { name: "Gyor-Per International Airport", city: "Gyor", country: "HU" },
  SOB: { name: "Sarmellek International Airport", city: "Sarmellek", country: "HU" },
  TZR: { name: "Taszar Air Base", city: "Taszar", country: "HU" },
  QZD: { name: "Szeged Glider Airport", city: "Szeged", country: "HU" },
  QAQ: { name: "L'Aquila / Preturo Airport", city: "L'Aquila", country: "IT" },
  CRV: { name: "Crotone Airport", city: "Crotone", country: "IT" },
  BRI: { name: "Bari / Palese International Airport", city: "Bari", country: "IT" },
  FOG: { name: "Foggia / Gino Lisa Airport", city: "Foggia", country: "IT" },
  TAR: { name: "Taranto / Grottaglie Airport", city: "Grottaglie", country: "IT" },
  LCC: { name: "Lecce Airport", city: "", country: "IT" },
  PSR: { name: "Pescara International Airport", city: "Pescara", country: "IT" },
  BDS: { name: "Brindisi / Casale Airport", city: "Brindisi", country: "IT" },
  SUF: { name: "Lamezia Terme Airport", city: "Lamezia Terme", country: "IT" },
  CIY: { name: "Comiso Airport Vincenzo Magliocco", city: "Comiso", country: "IT" },
  CTA: { name: "Catania / Fontanarossa Airport", city: "Catania", country: "IT" },
  LMP: { name: "Lampedusa Airport", city: "Lampedusa", country: "IT" },
  PNL: { name: "Pantelleria Airport", city: "Pantelleria", country: "IT" },
  PMO: { name: "Palermo / Punta Raisi Airport", city: "Palermo", country: "IT" },
  REG: { name: "Reggio Calabria Airport", city: "Reggio Calabria", country: "IT" },
  TPS: { name: "Trapani / Birgi Airport", city: "Trapani", country: "IT" },
  NSY: { name: "Sigonella Airport", city: "", country: "IT" },
  BLX: { name: "Belluno Airport", city: "Belluno", country: "IT" },
  RAN: { name: "Ravenna Airport", city: "Ravenna", country: "IT" },
  AHO: { name: "Alghero / Fertilia Airport", city: "Alghero", country: "IT" },
  DCI: { name: "Decimomannu Airport", city: "Decimomannu", country: "IT" },
  CAG: { name: "Cagliari / Elmas Airport", city: "Cagliari", country: "IT" },
  OLB: { name: "Olbia / Costa Smeralda Airport", city: "Olbia", country: "IT" },
  FNU: { name: "Oristano / Fenosu Airport", city: "Oristano", country: "IT" },
  TTB: { name: "Tortoli' / Arbatax Airport", city: "Arbatax", country: "IT" },
  MXP: { name: "Malpensa International Airport", city: "Milan", country: "IT" },
  BGY: { name: "Bergamo / Orio Al Serio Airport", city: "Bergamo", country: "IT" },
  TRN: { name: "Torino / Caselle International Airport", city: "Torino", country: "IT" },
  ALL: {
    name: "Villanova D'Albenga International Airport",
    city: "Albenga",
    country: "IT"
  },
  GOA: {
    name: "Genova / Sestri Cristoforo Colombo Airport",
    city: "Genova",
    country: "IT"
  },
  LIN: { name: "Linate Airport", city: "Milan", country: "IT" },
  PMF: { name: "Parma Airport", city: "Parma", country: "IT" },
  AOT: { name: "Aosta Airport", city: "Aosta", country: "IT" },
  CUF: { name: "Cuneo / Levaldigi Airport", city: "Cuneo", country: "IT" },
  AVB: { name: "Aviano Air Base", city: "Aviano", country: "IT" },
  BZO: { name: "Bolzano Airport", city: "Bolzano", country: "IT" },
  BLQ: { name: "Bologna / Borgo Panigale Airport", city: "Bologna", country: "IT" },
  TSF: { name: "Treviso / Sant'Angelo Airport", city: "Treviso", country: "IT" },
  FRL: { name: "Forli Airport", city: "Forli", country: "IT" },
  VBS: { name: "Brescia / Montichiari Airport", city: "Brescia", country: "IT" },
  TRS: { name: "Trieste / Ronchi Dei Legionari", city: "Trieste", country: "IT" },
  RMI: {
    name: "Rimini / Miramare - Federico Fellini International Airport",
    city: "Rimini",
    country: "IT"
  },
  VRN: { name: "Verona / Villafranca Airport", city: "Verona", country: "IT" },
  AOI: { name: "Ancona / Falconara Airport", city: "Ancona", country: "IT" },
  VCE: { name: "Venezia / Tessera -  Marco Polo Airport", city: "Venezia", country: "IT" },
  LCV: { name: "Lucca / Tassignano Airport", city: "Lucca", country: "IT" },
  SAY: { name: "Siena / Ampugnano Airport", city: "Siena", country: "IT" },
  CIA: { name: "Ciampino Airport", city: "Roma", country: "IT" },
  FCO: {
    name: "Leonardo Da Vinci (Fiumicino) International Airport",
    city: "Rome",
    country: "IT"
  },
  QSR: { name: "Salerno / Pontecagnano Airport", city: "Salerno", country: "IT" },
  EBA: { name: "Marina Di Campo Airport", city: "Marina  Di Campo", country: "IT" },
  NAP: {
    name: "Napoli / Capodichino International Airport",
    city: "Napoli",
    country: "IT"
  },
  PSA: {
    name: "Pisa / San Giusto - Galileo Galilei International Airport",
    city: "Pisa",
    country: "IT"
  },
  FLR: { name: "Firenze / Peretola Airport", city: "Firenze", country: "IT" },
  GRS: { name: "Grosseto Airport", city: "Grosetto", country: "IT" },
  PEG: { name: "Perugia / San Egidio Airport", city: "Perugia", country: "IT" },
  LJU: { name: "Ljubljana Joze Pucnik Airport", city: "Ljubljana", country: "SI" },
  MBX: { name: "Maribor Airport", city: "", country: "SI" },
  POW: { name: "Portoroz Airport", city: "Portoroz", country: "SI" },
  JCL: { name: "Ceske Budejovice Airport", city: "Ceske Budejovice", country: "CZ" },
  UHE: { name: "Kunovice Airport", city: "Uherske Hradiste", country: "CZ" },
  KLV: { name: "Karlovy Vary International Airport", city: "Karlovy Vary", country: "CZ" },
  MKA: { name: "Marianske Lazne Airport", city: "Marianske Lazne", country: "CZ" },
  OSR: { name: "Ostrava Leos Janacek Airport", city: "Ostrava", country: "CZ" },
  OLO: { name: "Olomouc Glider Airport", city: "Olomouc", country: "CZ" },
  PED: { name: "Pardubice Airport", city: "Pardubice", country: "CZ" },
  PRV: { name: "Prerov Air Base", city: "Prerov", country: "CZ" },
  PRG: { name: "V\xE1clav Havel Airport", city: "Prague", country: "CZ" },
  BRQ: { name: "Brno-Turany Airport", city: "Brno", country: "CZ" },
  VOD: { name: "Vodochody Airport", city: "Vodochoky", country: "CZ" },
  ZBE: { name: "Zabreh Ostrava Airport", city: "Zabreh", country: "CZ" },
  TLV: { name: "Ben Gurion International Airport", city: "Tel Aviv", country: "IL" },
  BEV: { name: "Be'er Sheva (Teyman) Airport", city: "Beersheva", country: "IL" },
  ETM: { name: "Ilan and Asaf Ramon Airport", city: "Eilat", country: "IS" },
  EIY: { name: "Ein Yahav Airfield", city: "Sapir", country: "IL" },
  HFA: { name: "Haifa International Airport", city: "Haifa", country: "IL" },
  RPN: { name: "Ben Ya'akov Airport", city: "Rosh Pina", country: "IL" },
  KSW: { name: "Kiryat Shmona Airport", city: "Kiryat Shmona", country: "IL" },
  MIP: { name: "Mitzpe Ramon Airfield", city: "Mitzpe Ramon", country: "IL" },
  MTZ: { name: "Bar Yehuda Airfield", city: "Masada", country: "IL" },
  VTM: { name: "Nevatim Air Base", city: "Beersheba", country: "IL" },
  YOT: { name: "Yotvata Airfield", city: "Yotvata", country: "IL" },
  MLA: { name: "Luqa Airport", city: "Luqa", country: "MT" },
  HOH: { name: "Hohenems-Dornbirn Airport", city: "Hohenems / Dornbirn", country: "AT" },
  GRZ: { name: "Graz Airport", city: "Graz", country: "AT" },
  INN: { name: "Innsbruck Airport", city: "Innsbruck", country: "AT" },
  KLU: { name: "Klagenfurt Airport", city: "Klagenfurt am Worthersee", country: "AT" },
  LNZ: { name: "Linz Airport", city: "Linz", country: "AT" },
  SZG: { name: "Salzburg Airport", city: "Salzburg", country: "AT" },
  VIE: { name: "Vienna International Airport", city: "Vienna", country: "AT" },
  SMA: { name: "Santa Maria Airport", city: "Vila do Porto", country: "PT" },
  BGC: { name: "Braganca Airport", city: "Bragan\xE7a", country: "PT" },
  BYJ: { name: "Beja International Airport", city: "Beja", country: "PT" },
  CVU: { name: "Corvo Airport", city: "Corvo", country: "PT" },
  CAT: { name: "Cascais Airport", city: "Cascais", country: "PT" },
  FLW: { name: "Flores Airport", city: "Santa Cruz das Flores", country: "PT" },
  FAO: { name: "Faro Airport", city: "Faro", country: "PT" },
  GRW: { name: "Graciosa Airport", city: "Santa Cruz da Graciosa", country: "PT" },
  HOR: { name: "Horta Airport", city: "Horta", country: "PT" },
  TER: { name: "Lajes Field", city: "Lajes", country: "PT" },
  FNC: { name: "Madeira Airport", city: "Funchal", country: "PT" },
  PDL: { name: "Jo\xE3o Paulo II Airport", city: "Ponta Delgada", country: "PT" },
  PIX: { name: "Pico Airport", city: "Pico Island", country: "PT" },
  PRM: { name: "Portim\xE3o Airport", city: "Portim\xE3o", country: "PT" },
  OPO: { name: "Francisco de S\xE1 Carneiro Airport", city: "Porto", country: "PT" },
  PXO: { name: "Porto Santo Airport", city: "Porto Santo", country: "PT" },
  LIS: { name: "Lisbon Portela Airport", city: "Lisbon", country: "PT" },
  SIE: { name: "Sines Airport", city: "Sines", country: "PT" },
  SJZ: { name: "Sao Jorge Airport", city: "Velas", country: "PT" },
  VRL: { name: "Vila Real Airport", city: "Vila Real", country: "PT" },
  VSE: { name: "Viseu Airport", city: "Viseu", country: "PT" },
  BNX: { name: "Banja Luka International Airport", city: "Banja Luka", country: "BA" },
  OMO: { name: "Mostar International Airport", city: "Mostar", country: "BA" },
  SJJ: { name: "Sarajevo International Airport", city: "Sarajevo", country: "BA" },
  TZL: { name: "Tuzla International Airport", city: "Tuzla", country: "BA" },
  ARW: { name: "Arad International Airport", city: "Arad", country: "RO" },
  BCM: { name: "Bacau Airport", city: "Bacau", country: "RO" },
  BAY: { name: "Tautii Magheraus Airport", city: "Baia Mare", country: "RO" },
  BBU: { name: "Baneasa International Airport", city: "Bucharest", country: "RO" },
  GHV: {
    name: "Bra\u015Fov-Ghimbav International Airport",
    city: "Bra\u015Fov",
    country: "RO"
  },
  CND: {
    name: "Mihail Kogalniceanu International Airport",
    city: "Constanta",
    country: "RO"
  },
  CLJ: { name: "Cluj-Napoca International Airport", city: "Cluj-Napoca", country: "RO" },
  CSB: { name: "Caransebes Airport", city: "Caransebes", country: "RO" },
  CRA: { name: "Craiova Airport", city: "Craiova", country: "RO" },
  IAS: { name: "Iasi Airport", city: "Iasi", country: "RO" },
  OMR: { name: "Oradea International Airport", city: "Oradea", country: "RO" },
  OTP: { name: "Henri Coanda International Airport", city: "Bucharest", country: "RO" },
  SBZ: { name: "Sibiu International Airport", city: "Sibiu", country: "RO" },
  SUJ: { name: "Satu Mare Airport", city: "Satu Mare", country: "RO" },
  SCV: { name: "Suceava Stefan cel Mare Airport", city: "Suceava", country: "RO" },
  TCE: { name: "Tulcea Airport", city: "Tulcea", country: "RO" },
  TGM: {
    name: "Transilvania Targu Mures International Airport",
    city: "Targu Mures",
    country: "RO"
  },
  TSR: { name: "Timisoara Traian Vuia Airport", city: "Timisoara", country: "RO" },
  GVA: { name: "Geneva Cointrin International Airport", city: "Geneva", country: "CH" },
  QLS: { name: "Lausanne-la Blecherette Airport", city: "Lausanne", country: "CH" },
  QNC: { name: "Neuchatel Airport", city: "", country: "CH" },
  SIR: { name: "Sion Airport", city: "Sion", country: "CH" },
  EML: { name: "Emmen Airport", city: "", country: "CH" },
  ZIN: { name: "Interlaken Air Base", city: "", country: "CH" },
  VIP: { name: "Payerne Airport", city: "Payerne", country: "CH" },
  LUG: { name: "Lugano Airport", city: "Lugano", country: "CH" },
  BRN: { name: "Bern Belp Airport", city: "Bern", country: "CH" },
  BXO: { name: "Buochs Airport", city: "Buochs", country: "CH" },
  ZHI: { name: "Grenchen Airport", city: "", country: "CH" },
  ZRH: { name: "Zurich Airport", city: "Zurich", country: "CH" },
  ZJI: { name: "Locarno Airport", city: "", country: "CH" },
  ACH: { name: "St Gallen Altenrhein Airport", city: "Altenrhein", country: "CH" },
  SMV: { name: "Samedan Airport", city: "", country: "CH" },
  ESB: { name: "Esenboga International Airport", city: "Ankara", country: "TR" },
  ANK: { name: "Etimesgut Air Base", city: "Ankara", country: "TR" },
  ADA: { name: "Adana Airport", city: "Adana", country: "TR" },
  UAB: { name: "Incirlik Air Base", city: "Adana", country: "TR" },
  AFY: { name: "Afyon Airport", city: "Afyonkarahisar", country: "TR" },
  AYT: { name: "Antalya International Airport", city: "Antalya", country: "TR" },
  GZT: { name: "Gaziantep International Airport", city: "Gaziantep", country: "TR" },
  KFS: { name: "Kastamonu Airport", city: "Kastamonu", country: "TR" },
  KYA: { name: "Konya Airport", city: "Konya", country: "TR" },
  MZH: { name: "Amasya Merzifon Airport", city: "Amasya", country: "TR" },
  SSX: { name: "Samsun Samair Airport", city: "Samsun", country: "TR" },
  VAS: { name: "Sivas Airport", city: "Sivas", country: "TR" },
  ONQ: { name: "Zonguldak Airport", city: "Zonguldak", country: "TR" },
  MLX: { name: "Malatya Erhac Airport", city: "Malatya", country: "TR" },
  ASR: { name: "Kayseri Erkilet Airport", city: "Kayseri", country: "TR" },
  TJK: { name: "Tokat Airport", city: "Tokat", country: "TR" },
  DNZ: { name: "Cardak Airport", city: "Denizli", country: "TR" },
  NAV: {
    name: "Nevsehir Kapadokya International Airport",
    city: "Nevsehir",
    country: "TR"
  },
  ISL: { name: "Ataturk International Airport", city: "Istanbul", country: "TR" },
  CII: { name: "Cildir Airport", city: "Aydin", country: "TR" },
  BTZ: { name: "Bursa Airport", city: "Bursa", country: "TR" },
  BZI: { name: "Balikesir Merkez Airport", city: "Balikesir", country: "TR" },
  BDM: { name: "Bandirma Airport", city: "Bandirma", country: "TR" },
  CKZ: { name: "Canakkale Airport", city: "Canakkale", country: "TR" },
  ESK: { name: "Eskisehir Air Base", city: "Eskisehir", country: "TR" },
  ADB: { name: "Adnan Menderes International Airport", city: "Izmir", country: "TR" },
  IGL: { name: "Cigli Airport", city: "Izmir", country: "TR" },
  USQ: { name: "Usak Airport", city: "Usak", country: "TR" },
  KCO: { name: "Cengiz Topel Airport", city: "", country: "TR" },
  YEI: { name: "Bursa Yenisehir Airport", city: "Bursa", country: "TR" },
  DLM: { name: "Dalaman International Airport", city: "Dalaman", country: "TR" },
  TEQ: { name: "Tekirdag Corlu Airport", city: "Corlu", country: "TR" },
  BXN: { name: "Imsik Airport", city: "Bodrum", country: "TR" },
  AOE: { name: "Anadolu University Airport", city: "Eskisehir", country: "TR" },
  KZR: { name: "Zafer Airport", city: "Altintas", country: "TR" },
  EZS: { name: "Elazig Airport", city: "Elazig", country: "TR" },
  OGU: { name: "Ordu\u2013Giresun Airport", city: "Ordu", country: "TR" },
  DIY: { name: "Diyarbakir Airport", city: "Diyarbakir", country: "TR" },
  ERC: { name: "Erzincan Airport", city: "Erzincan", country: "TR" },
  ERZ: { name: "Erzurum International Airport", city: "Erzurum", country: "TR" },
  KSY: { name: "Kars Airport", city: "Kars", country: "TR" },
  TZX: { name: "Trabzon International Airport", city: "Trabzon", country: "TR" },
  SFQ: { name: "Sanliurfa Airport", city: "Sanliurfa", country: "TR" },
  VAN: { name: "Van Ferit Melen Airport", city: "Van", country: "TR" },
  BAL: { name: "Batman Airport", city: "Batman", country: "TR" },
  MSR: { name: "Mus Airport", city: "Mus", country: "TR" },
  SXZ: { name: "Siirt Airport", city: "Siirt", country: "TR" },
  NOP: { name: "Sinop Airport", city: "Sinop", country: "TR" },
  KCM: { name: "Kahramanmaras Airport", city: "Kahramanmaras", country: "TR" },
  AJI: { name: "Agri Airport", city: "Agri", country: "TR" },
  ADF: { name: "Adiyaman Airport", city: "Adiyaman", country: "TR" },
  MQM: { name: "Mardin Airport", city: "Mardin", country: "TR" },
  GNY: { name: "Sanliurfa GAP Airport", city: "Sanliurfa", country: "TR" },
  IGD: { name: "Igdir Airport", city: "Igdir", country: "TR" },
  BGG: { name: "Bing\xF6l Airport", city: "Bing\xF6l", country: "TR" },
  YKO: {
    name: "Y\xFCksekova Selahaddin Eyyubi Airport",
    city: "Y\xFCksekova",
    country: "TR"
  },
  HTY: { name: "Hatay Airport", city: "Hatay", country: "TR" },
  COV: { name: "\xC7ukurova International Airport", city: "Tarsus", country: "TR" },
  ISE: { name: "Suleyman Demirel International Airport", city: "Isparta", country: "TR" },
  EDO: { name: "Balikesir Korfez Airport", city: "Edremit", country: "TR" },
  BJV: { name: "Milas Bodrum International Airport", city: "Bodrum", country: "TR" },
  GZP: { name: "Gazipasa Airport", city: "Gazipasa", country: "TR" },
  SZF: { name: "Samsun Carsamba Airport", city: "Samsun", country: "TR" },
  SAW: { name: "Sabiha Gokcen International Airport", city: "Istanbul", country: "TR" },
  GKD: { name: "Imroz Airport", city: "Gokceada", country: "TR" },
  IST: { name: "Istanbul Airport", city: "Istanbul", country: "TR" },
  RZV: { name: "Rize\u2013Artvin Airport", city: "", country: "TR" },
  BZY: { name: "Balti International Airport", city: "Strymba", country: "MD" },
  RMO: {
    name: "Chi\u0219in\u0103u International Airport",
    city: "Chi\u0219in\u0103u",
    country: "MD"
  },
  OHD: { name: "Ohrid St. Paul the Apostle Airport", city: "Ohrid", country: "MK" },
  SKP: { name: "Skopje Alexander the Great Airport", city: "Skopje", country: "MK" },
  GIB: { name: "Gibraltar Airport", city: "Gibraltar", country: "GI" },
  BEG: { name: "Belgrade Nikola Tesla Airport", city: "Belgrad", country: "RS" },
  IVG: { name: "Berane Airport", city: "Berane", country: "ME" },
  BJY: { name: "Batajnica Air Base", city: "Batajnica", country: "RS" },
  INI: { name: "Nis Airport", city: "Nis", country: "RS" },
  QND: { name: "Cenej Airport", city: "Novi Sad", country: "RS" },
  TGD: { name: "Podgorica Airport", city: "Podgorica", country: "ME" },
  TIV: { name: "Tivat Airport", city: "Tivat", country: "ME" },
  UZC: { name: "Ponikve Airport", city: "Uzice", country: "RS" },
  QWV: { name: "Divci Airport", city: "Valjevo", country: "RS" },
  ZRE: { name: "Zrenjanin Airport", city: "Zrenjanin", country: "RS" },
  BTS: { name: "M. R. Stefanik Airport", city: "Bratislava", country: "SK" },
  KSC: { name: "Kosice Airport", city: "Kosice", country: "SK" },
  LUE: { name: "Lucenec Airport", city: "Lucenec", country: "SK" },
  PZY: { name: "Piestany Airport", city: "Piestany", country: "SK" },
  POV: { name: "Presov Air Base", city: "Presov", country: "SK" },
  SLD: { name: "Sliac Airport", city: "Sliac", country: "SK" },
  TAT: { name: "Poprad-Tatry Airport", city: "Poprad", country: "SK" },
  ILZ: { name: "Zilina Airport", city: "Zilina", country: "SK" },
  UWA: { name: "Ware Airport", city: "Ware", country: "US" },
  GDT: {
    name: "JAGS McCartney International Airport",
    city: "Cockburn Town",
    country: "TC"
  },
  MDS: { name: "Middle Caicos Airport", city: "Middle Caicos", country: "TC" },
  NCA: { name: "North Caicos Airport", city: "", country: "TC" },
  PIC: { name: "Pine Cay Airport", city: "Pine Cay", country: "TC" },
  PLS: { name: "Providenciales Airport", city: "Providenciales Island", country: "TC" },
  XSC: { name: "South Caicos Airport", city: "", country: "TC" },
  SLX: { name: "Salt Cay Airport", city: "Salt Cay", country: "TC" },
  EPS: { name: "Arroyo Barril Airport", city: "Arroyo Barril", country: "DO" },
  BRX: { name: "Maria Montez International Airport", city: "Barahona", country: "DO" },
  CBJ: { name: "Cabo Rojo Airport", city: "Cabo Rojo", country: "DO" },
  AZS: { name: "Samana El Catey International Airport", city: "Samana", country: "DO" },
  COZ: { name: "Constanza Dom Re Airport", city: "Costanza", country: "DO" },
  JBQ: { name: "La Isabela International Airport", city: "La Isabela", country: "DO" },
  LRM: { name: "Casa De Campo International Airport", city: "La Romana", country: "DO" },
  PUJ: { name: "Punta Cana International Airport", city: "Punta Cana", country: "DO" },
  POP: {
    name: "Gregorio Luperon International Airport",
    city: "Puerto Plata",
    country: "DO"
  },
  SDQ: { name: "Las Americas International Airport", city: "Santo Domingo", country: "DO" },
  STI: { name: "Cibao International Airport", city: "Santiago", country: "DO" },
  LIZ: { name: "Loring International Airport", city: "Limestone", country: "US" },
  CBV: { name: "Coban Airport", city: "Coban", country: "GT" },
  CIQ: { name: "Chiquimula Airport", city: "Chiquimula", country: "GT" },
  CMM: { name: "Carmelita Airport", city: "Carmelita", country: "GT" },
  CTF: { name: "Coatepeque Airport", city: "Coatepeque", country: "GT" },
  DON: { name: "Dos Lagunas Airport", city: "Dos Lagunas", country: "GT" },
  GUA: { name: "La Aurora Airport", city: "Guatemala City", country: "GT" },
  HUG: { name: "Huehuetenango Airport", city: "Huehuetenango", country: "GT" },
  MCR: { name: "Melchor de Mencos Airport", city: "Melchor de Mencos", country: "GT" },
  PBR: { name: "Puerto Barrios Airport", city: "Puerto Barrios", country: "GT" },
  PCG: { name: "Paso Caballos Airport", city: "Paso Caballos", country: "GT" },
  PKJ: { name: "Playa Grande Airport", city: "Playa Grande", country: "GT" },
  PON: { name: "Poptun Airport", city: "Poptun", country: "GT" },
  AQB: {
    name: "Santa Cruz del Quiche Airport",
    city: "Santa Cruz del Quiche",
    country: "GT"
  },
  AAZ: { name: "Quezaltenango Airport", city: "Quezaltenango", country: "GT" },
  RUV: { name: "Rubelsanto Airport", city: "Rubelsanto", country: "GT" },
  LCF: { name: "Las Vegas Airport", city: "Rio Dulce", country: "GT" },
  RER: { name: "Retalhuleu Airport", city: "Retalhuleu", country: "GT" },
  GSJ: { name: "San Jose Airport", city: "Puerto San Jose", country: "GT" },
  FRS: { name: "Mundo Maya International Airport", city: "San Benito", country: "GT" },
  AHS: { name: "Ahuas Airport", city: "Ahuas", country: "HN" },
  CAA: { name: "Catacamas Airport", city: "Catacamas", country: "HN" },
  CYL: { name: "Coyoles Airport", city: "Coyoles", country: "HN" },
  CDD: { name: "Cauquira Airport", city: "Cauquira", country: "HN" },
  OAN: { name: "El Arrayan Airport", city: "Olanchito", country: "HN" },
  GAC: { name: "Gracias Airport", city: "El Molino", country: "HN" },
  IRN: { name: "Iriona Airport", city: "Iriona", country: "HN" },
  JUT: { name: "Jutigalpa airport", city: "Jutigalpa", country: "HN" },
  LCE: { name: "Goloson International Airport", city: "La Ceiba", country: "HN" },
  SAP: {
    name: "Ramon Villeda Morales International Airport",
    city: "La Mesa",
    country: "HN"
  },
  GJA: { name: "La Laguna Airport", city: "Guanaja", country: "HN" },
  PCH: { name: "Palacios Airport", city: "Palacios", country: "HN" },
  PEU: { name: "Puerto Lempira Airport", city: "Puerto Lempira", country: "HN" },
  XPL: {
    name: "Comayagua-Palmerola International Airport",
    city: "Comayagua",
    country: "HN"
  },
  RTB: {
    name: "Juan Manuel Galvez International Airport",
    city: "Roatan Island",
    country: "HN"
  },
  RUY: { name: "Copan Ruinas Airport", city: "Ruinas de Copan", country: "HN" },
  TEA: { name: "Tela Airport", city: "Tela", country: "HN" },
  TGU: { name: "Toncontin International Airport", city: "Tegucigalpa", country: "HN" },
  TJI: { name: "Trujillo Airport", city: "Trujillo", country: "HN" },
  UII: { name: "Utila Airport", city: "Utila Island", country: "HN" },
  OCJ: { name: "Boscobel Aerodrome", city: "Ocho Rios", country: "JM" },
  KIN: { name: "Norman Manley International Airport", city: "Kingston", country: "JM" },
  MBJ: { name: "Sangster International Airport", city: "Montego Bay", country: "JM" },
  POT: { name: "Ken Jones Airport", city: "Ken Jones", country: "JM" },
  NEG: { name: "Negril Airport", city: "Negril", country: "JM" },
  KTP: { name: "Tinson Pen Airport", city: "Tinson Pen", country: "JM" },
  ACA: {
    name: "General Juan N Alvarez International Airport",
    city: "Acapulco",
    country: "MX"
  },
  NTR: { name: "Del Norte International Airport", city: "", country: "MX" },
  AGU: { name: "Jesus Teran International Airport", city: "Aguascalientes", country: "MX" },
  HUX: {
    name: "Bahias de Huatulco International Airport",
    city: "Huatulco",
    country: "MX"
  },
  CNA: { name: "Cananea Airport", city: "", country: "MX" },
  CVJ: { name: "General Mariano Matamoros Airport", city: "", country: "MX" },
  ACN: {
    name: "Ciudad Acuna New International Airport",
    city: "Ciudad Acuna",
    country: "MX"
  },
  CME: {
    name: "Ciudad del Carmen International Airport",
    city: "Ciudad del Carmen",
    country: "MX"
  },
  NCG: { name: "Nuevo Casas Grandes Airport", city: "", country: "MX" },
  CUL: {
    name: "Federal de Bachigualato International Airport",
    city: "Culiacan",
    country: "MX"
  },
  CTM: { name: "Chetumal International Airport", city: "Chetumal", country: "MX" },
  CEN: {
    name: "Ciudad Obregon International Airport",
    city: "Ciudad Obregon",
    country: "MX"
  },
  CJT: { name: "Comitan Airport", city: "", country: "MX" },
  CPE: {
    name: "Ingeniero Alberto Acuna Ongay International Airport",
    city: "Campeche",
    country: "MX"
  },
  CJS: {
    name: "Abraham Gonzalez International Airport",
    city: "Ciudad Juarez",
    country: "MX"
  },
  CZA: { name: "Chichen Itza International Airport", city: "", country: "MX" },
  CUU: {
    name: "General Roberto Fierro Villalobos International Airport",
    city: "Chihuahua",
    country: "MX"
  },
  CVM: {
    name: "General Pedro Jose Mendez International Airport",
    city: "Ciudad Victoria",
    country: "MX"
  },
  CYW: { name: "Captain Rogelio Castillo National Airport", city: "Celaya", country: "MX" },
  CZM: { name: "Cozumel International Airport", city: "Cozumel", country: "MX" },
  CUA: { name: "Ciudad Constitucion Airport", city: "Ciudad Constitucion", country: "MX" },
  MMC: { name: "Ciudad Mante National Airport", city: "Ciudad Mante", country: "MX" },
  DGO: {
    name: "General Guadalupe Victoria International Airport",
    city: "Durango",
    country: "MX"
  },
  TPQ: { name: "Amado Nervo National Airport", city: "Tepic", country: "MX" },
  ESE: { name: "Ensenada Airport", city: "", country: "MX" },
  GDL: {
    name: "Don Miguel Hidalgo Y Costilla International Airport",
    city: "Guadalajara",
    country: "MX"
  },
  GYM: {
    name: "General Jose Maria Yanez International Airport",
    city: "Guaymas",
    country: "MX"
  },
  GUB: { name: "Guerrero Negro Airport", city: "Guerrero Negro", country: "MX" },
  TCN: { name: "Tehuacan Airport", city: "", country: "MX" },
  HMO: {
    name: "General Ignacio P. Garcia International Airport",
    city: "Hermosillo",
    country: "MX"
  },
  CLQ: { name: "Lic. Miguel de la Madrid Airport", city: "Colima", country: "MX" },
  ISJ: { name: "Isla Mujeres Airport", city: "", country: "MX" },
  SLW: { name: "Plan De Guadalupe International Airport", city: "Saltillo", country: "MX" },
  IZT: { name: "Ixtepec Airport", city: "", country: "MX" },
  JAL: { name: "El Lencero Airport", city: "Xalapa", country: "MX" },
  AZP: { name: "Atizapan De Zaragoza Airport", city: "", country: "MX" },
  LZC: { name: "Lazaro Cardenas Airport", city: "Lazaro Cardenas", country: "MX" },
  LMM: {
    name: "Valle del Fuerte International Airport",
    city: "Los Mochis",
    country: "MX"
  },
  BJX: { name: "Del Bajio International Airport", city: "Silao", country: "MX" },
  LAP: {
    name: "Manuel Marquez de Leon International Airport",
    city: "La Paz",
    country: "MX"
  },
  LTO: { name: "Loreto International Airport", city: "Loreto", country: "MX" },
  MAM: {
    name: "General Servando Canales International Airport",
    city: "Matamoros",
    country: "MX"
  },
  MID: {
    name: "Licenciado Manuel Crescencio Rejon Int Airport",
    city: "Merida",
    country: "MX"
  },
  MUG: { name: "Mulege Airport", city: "Mulege", country: "MX" },
  MXL: {
    name: "General Rodolfo Sanchez Taboada International Airport",
    city: "Mexicali",
    country: "MX"
  },
  MLM: {
    name: "General Francisco J. Mujica International Airport",
    city: "Morelia",
    country: "MX"
  },
  MTT: {
    name: "Minatitlan/Coatzacoalcos National Airport",
    city: "Minatitlan",
    country: "MX"
  },
  LOV: { name: "Monclova International Airport", city: "", country: "MX" },
  MEX: {
    name: "Licenciado Benito Juarez International Airport",
    city: "Mexico City",
    country: "MX"
  },
  MTY: {
    name: "General Mariano Escobedo International Airport",
    city: "Monterrey",
    country: "MX"
  },
  MZT: {
    name: "General Rafael Buelna International Airport",
    city: "Mazatlan",
    country: "MX"
  },
  NOG: { name: "Nogales International Airport", city: "", country: "MX" },
  NLD: { name: "Quetzalcoatl International Airport", city: "Nuevo Laredo", country: "MX" },
  OAX: { name: "Xoxocotlan International Airport", city: "Oaxaca", country: "MX" },
  PAZ: { name: "El Tajin National Airport", city: "Poza Rica", country: "MX" },
  PBC: { name: "Hermanos Serdan International Airport", city: "Puebla", country: "MX" },
  PPE: {
    name: "Puerto Penasco International Airport",
    city: "Puerto Penasco",
    country: "MX"
  },
  PDS: { name: "Piedras Negras International Airport", city: "", country: "MX" },
  PCO: { name: "Punta Colorada Airport", city: "La Ribera", country: "MX" },
  UPN: {
    name: "Licenciado y General Ignacio Lopez Rayon Airport",
    city: "",
    country: "MX"
  },
  PQM: { name: "Palenque International Airport", city: "", country: "MX" },
  PVR: {
    name: "Licenciado Gustavo Diaz Ordaz International Airport",
    city: "Puerto Vallarta",
    country: "MX"
  },
  PXM: {
    name: "Puerto Escondido International Airport",
    city: "Puerto Escondido",
    country: "MX"
  },
  QRO: { name: "Queretaro Intercontinental Airport", city: "Queretaro", country: "MX" },
  REX: {
    name: "General Lucio Blanco International Airport",
    city: "Reynosa",
    country: "MX"
  },
  SZT: { name: "San Cristobal De Las Casas Airport", city: "", country: "MX" },
  SJD: {
    name: "Los Cabos International Airport",
    city: "San Jose del Cabo",
    country: "MX"
  },
  SFH: { name: "San Felipe International Airport", city: "", country: "MX" },
  CSW: {
    name: "Cabo San Lucas International Airport",
    city: "Cabo San Lucas",
    country: "MX"
  },
  NLU: { name: "Santa Lucia Air Force Base", city: "Reyes Acozac", country: "MX" },
  SLP: {
    name: "Ponciano Arriaga International Airport",
    city: "San Luis Potosi",
    country: "MX"
  },
  TRC: { name: "Francisco Sarabia International Airport", city: "Torreon", country: "MX" },
  TGZ: {
    name: "Angel Albino Corzo International Airport",
    city: "Tuxtla Gutierrez",
    country: "MX"
  },
  TIJ: {
    name: "General Abelardo L. Rodriguez International Airport",
    city: "Tijuana",
    country: "MX"
  },
  TQO: {
    name: "Felipe Carrillo Puerto International Airport",
    city: "Tulum",
    country: "MX"
  },
  TAM: {
    name: "General Francisco Javier Mina International Airport",
    city: "Tampico",
    country: "MX"
  },
  TSL: { name: "Tamuin Airport", city: "", country: "MX" },
  TLC: {
    name: "Licenciado Adolfo Lopez Mateos International Airport",
    city: "Toluca",
    country: "MX"
  },
  TAP: { name: "Tapachula International Airport", city: "Tapachula", country: "MX" },
  WIX: { name: "Tuxpan Airport", city: "", country: "MX" },
  CUN: { name: "Cancun International Airport", city: "Cancun", country: "MX" },
  VSA: {
    name: "Carlos Rovirosa Perez International Airport",
    city: "Villahermosa",
    country: "MX"
  },
  VER: {
    name: "General Heriberto Jara International Airport",
    city: "Veracruz",
    country: "MX"
  },
  ZCL: {
    name: "General Leobardo C. Ruiz International Airport",
    city: "Zacatecas",
    country: "MX"
  },
  ZIH: { name: "Ixtapa Zihuatanejo International Airport", city: "Ixtapa", country: "MX" },
  ZMM: { name: "Zamora Airport", city: "", country: "MX" },
  ZLO: { name: "Playa De Oro International Airport", city: "Manzanillo", country: "MX" },
  BEF: { name: "Bluefields Airport", city: "Bluefileds", country: "NI" },
  BZA: { name: "San Pedro Airport", city: "Bonanza", country: "NI" },
  RNI: { name: "Corn Island", city: "Corn Island", country: "NI" },
  MGA: {
    name: "Augusto C. Sandino (Managua) International Airport",
    city: "Managua",
    country: "NI"
  },
  NVG: { name: "Nueva Guinea Airport", city: "Nueva Guinea", country: "NI" },
  PUZ: { name: "Puerto Cabezas Airport", city: "Puerto Cabezas", country: "NI" },
  RFS: { name: "Rosita Airport", city: "La Rosita", country: "NI" },
  NCR: { name: "San Carlos", city: "San Carlos", country: "NI" },
  SIU: { name: "Siuna", city: "Siuna", country: "NI" },
  WSP: { name: "Waspam Airport", city: "Waspam", country: "NI" },
  BOC: { name: "Bocas Del Toro International Airport", city: "Isla Colon", country: "PA" },
  CTD: { name: "Alonso Valderrama Airport", city: "Chitre", country: "PA" },
  CHX: {
    name: "Cap Manuel Nino International Airport",
    city: "Changuinola",
    country: "PA"
  },
  DAV: { name: "Enrique Malek International Airport", city: "David", country: "PA" },
  ONX: { name: "Enrique Adolfo Jimenez Airport", city: "Colon", country: "PA" },
  JQE: { name: "Jaque Airport", city: "Jaque", country: "PA" },
  PAC: { name: "Marcos A. Gelabert International Airport", city: "Albrook", country: "PA" },
  PUE: { name: "Puerto Obaldia Airport", city: "Puerto Obaldia", country: "PA" },
  BLB: {
    name: "Howard/Panama Pacifico International Airport",
    city: "Panama City",
    country: "PA"
  },
  SYP: { name: "Ruben Cantu Airport", city: "Santiago", country: "PA" },
  RIH: {
    name: "Cap Scarlet R. Mart\xEDnez L. Airport",
    city: "R\xEDo Hato",
    country: "PA"
  },
  PTY: { name: "Tocumen International Airport", city: "Tocumen", country: "PA" },
  PVE: { name: "El Porvenir Airport", city: "El Porvenir", country: "PA" },
  NBL: { name: "San Blas Airport", city: "Wannukandi", country: "PA" },
  FON: { name: "Arenal Airport", city: "La Fortuna/San Carlos", country: "CR" },
  TTQ: { name: "Aerotortuguero Airport", city: "Roxana", country: "CR" },
  BAI: { name: "Buenos Aires Airport", city: "Punta Arenas", country: "CR" },
  BCL: { name: "Barra del Colorado Airport", city: "Pococi", country: "CR" },
  OTR: { name: "Coto 47 Airport", city: "Corredores", country: "CR" },
  JAP: { name: "Chacarita Airport", city: "Puntarenas", country: "CR" },
  RIK: { name: "Carrillo Airport", city: "Nicoya", country: "CR" },
  DRK: { name: "Drake Bay Airport", city: "Puntarenas", country: "CR" },
  FMG: { name: "Flamingo Airport", city: "Brasilito", country: "CR" },
  GLF: { name: "Golfito Airport", city: "Golfito", country: "CR" },
  GPL: { name: "Guapiles Airport", city: "Pococi", country: "CR" },
  PBP: { name: "Islita Airport", city: "Nandayure", country: "CR" },
  LIR: {
    name: "Daniel Oduber Quiros International Airport",
    city: "Liberia",
    country: "CR"
  },
  LSL: { name: "Los Chiles Airport", city: "Los Chiles", country: "CR" },
  LIO: { name: "Limon International Airport", city: "Puerto Limon", country: "CR" },
  CSC: { name: "Mojica Airport", city: "Canas", country: "CR" },
  NCT: { name: "Guanacaste Airport", city: "Nicoya/Guanacate", country: "CR" },
  NOB: { name: "Nosara Airport", city: "Nicoya", country: "CR" },
  SJO: { name: "Juan Santamaria International Airport", city: "San Jose", country: "CR" },
  PJM: { name: "Puerto Jimenez Airport", city: "Puerto Jimenez", country: "CR" },
  PMZ: { name: "Palmar Sur Airport", city: "Palmar Sur", country: "CR" },
  SYQ: { name: "Tobias Bolanos International Airport", city: "San Jose", country: "CR" },
  XQP: { name: "Quepos Managua Airport", city: "Quepos", country: "CR" },
  RFR: { name: "Rio Frio / Progreso Airport", city: "Rio Frio / Progreso", country: "CR" },
  IPZ: { name: "San Isidro del General Airport", city: "Perez Zeledon", country: "CR" },
  TOO: { name: "San Vito De Java Airport", city: "Coto Brus", country: "CR" },
  TNO: { name: "Tamarindo De Santa Cruz Airport", city: "Santa Cruz", country: "CR" },
  TMU: { name: "Tambor Airport", city: "Nicoya", country: "CR" },
  UPL: { name: "Upala Airport", city: "Upala", country: "CR" },
  SAL: { name: "El Salvador International Airport", city: "Santa Clara", country: "SV" },
  ILS: { name: "Ilopango International Airport", city: "San Salvador", country: "SV" },
  CYA: { name: "Les Cayes Airport", city: "Les Cayes", country: "HT" },
  CAP: { name: "Cap Haitien International Airport", city: "Cap Haitien", country: "HT" },
  JAK: { name: "Jacmel Airport", city: "Jacmel", country: "HT" },
  JEE: { name: "Jeremie Airport", city: "Jeremie", country: "HT" },
  PAP: {
    name: "Toussaint Louverture International Airport",
    city: "Port-au-Prince",
    country: "HT"
  },
  BCA: { name: "Gustavo Rizo Airport", city: "Baracoa", country: "CU" },
  BWW: { name: "Las Brujas Airport", city: "Cayo Santa Maria", country: "CU" },
  BYM: { name: "Carlos Manuel de Cespedes Airport", city: "Bayamo", country: "CU" },
  AVI: { name: "Maximo Gomez Airport", city: "Ciego de Avila", country: "CU" },
  CCC: { name: "Jardines Del Rey Airport", city: "Cayo Coco", country: "CU" },
  CFG: { name: "Jaime Gonzalez Airport", city: "Cienfuegos", country: "CU" },
  CYO: {
    name: "Vilo Acuna International Airport",
    city: "Cayo Largo del Sur",
    country: "CU"
  },
  CMW: { name: "Ignacio Agramonte International Airport", city: "Camaguey", country: "CU" },
  QCO: { name: "Colon Airport", city: "Colon", country: "CU" },
  SCU: { name: "Antonio Maceo International Airport", city: "Santiago", country: "CU" },
  NBW: { name: "Leeward Point Field", city: "Guantanamo Bay Naval Station", country: "CU" },
  GAO: { name: "Mariana Grajales Airport", city: "Guantanamo", country: "CU" },
  HAV: { name: "Jose Marti International Airport", city: "Havana", country: "CU" },
  HOG: { name: "Frank Pais International Airport", city: "Holguin", country: "CU" },
  VRO: { name: "Kawama Airport", city: "Matanzas", country: "CU" },
  LCL: { name: "La Coloma Airport", city: "Pinar del Rio", country: "CU" },
  UMA: { name: "Punta de Maisi Airport", city: "Maisi", country: "CU" },
  MJG: { name: "Mayajigua Airport", city: "Mayajigua", country: "CU" },
  MOA: { name: "Orestes Acosta Airport", city: "Moa", country: "CU" },
  MZO: { name: "Sierra Maestra Airport", city: "Manzanillo", country: "CU" },
  QSN: { name: "San Nicolas De Bari Airport", city: "San Nicolas", country: "CU" },
  ICR: { name: "Nicaro Airport", city: "Nicaro", country: "CU" },
  GER: { name: "Rafael Cabrera Airport", city: "Nueva Gerona", country: "CU" },
  UPB: { name: "Playa Baracoa Airport", city: "Havana", country: "CU" },
  QPD: { name: "Pinar Del Rio Airport", city: "Pinar del Rio", country: "CU" },
  SNU: { name: "Abel Santamaria Airport", city: "Santa Clara", country: "CU" },
  SNJ: { name: "San Julian Air Base", city: "Pinar Del Rio", country: "CU" },
  SZJ: { name: "Siguanea Airport", city: "Isla de la Juventud", country: "CU" },
  USS: { name: "Sancti Spiritus Airport", city: "Sancti Spiritus", country: "CU" },
  TND: { name: "Alberto Delgado Airport", city: "Trinidad", country: "CU" },
  VRA: {
    name: "Juan Gualberto Gomez International Airport",
    city: "Varadero",
    country: "CU"
  },
  VTU: { name: "Hermanos Ameijeiras Airport", city: "Las Tunas", country: "CU" },
  CYB: { name: "Gerrard Smith International Airport", city: "Cayman Brac", country: "KY" },
  LYB: { name: "Edward Bodden Airfield", city: "Little Cayman", country: "KY" },
  GCM: { name: "Owen Roberts International Airport", city: "Georgetown", country: "KY" },
  MAY: { name: "Clarence A. Bain Airport", city: "Mangrove Cay", country: "BS" },
  ASD: { name: "Andros Town Airport", city: "", country: "BS" },
  COX: { name: "Congo Town Airport", city: "Andros", country: "BS" },
  MHH: {
    name: "Marsh Harbour International Airport",
    city: "Marsh Harbour",
    country: "BS"
  },
  SAQ: { name: "San Andros Airport", city: "Andros Island", country: "BS" },
  AXP: { name: "Spring Point Airport", city: "Spring Point", country: "BS" },
  TCB: { name: "Treasure Cay Airport", city: "Treasure Cay", country: "BS" },
  WKR: { name: "Abaco I Walker C Airport", city: "", country: "BS" },
  CCZ: { name: "Chub Cay Airport", city: "", country: "BS" },
  GHC: { name: "Great Harbour Cay Airport", city: "", country: "BS" },
  BIM: { name: "South Bimini Airport", city: "South Bimini", country: "BS" },
  ATC: { name: "Arthur's Town Airport", city: "Arthur's Town", country: "BS" },
  TBI: { name: "New Bight Airport", city: "Cat Island", country: "BS" },
  CXY: { name: "Cat Cay Airport", city: "Cat Cay", country: "BS" },
  CRI: { name: "Colonel Hill Airport", city: "Colonel Hill", country: "BS" },
  PWN: { name: "Pitts Town Airport", city: "Pitts Town", country: "BS" },
  GGT: { name: "Exuma International Airport", city: "George Town", country: "BS" },
  ELH: { name: "North Eleuthera Airport", city: "North Eleuthera", country: "BS" },
  GHB: { name: "Governor's Harbour Airport", city: "Governor's Harbour", country: "BS" },
  NMC: { name: "Normans Cay Airport", city: "", country: "BS" },
  RSD: { name: "Rock Sound Airport", city: "Rock Sound", country: "BS" },
  TYM: { name: "Staniel Cay Airport", city: "", country: "BS" },
  TCV: { name: "Torch Cay Airport", city: "Hog Cay", country: "BS" },
  FPO: { name: "Grand Bahama International Airport", city: "Freeport", country: "BS" },
  WTD: { name: "West End Airport", city: "West End", country: "BS" },
  IGA: { name: "Inagua Airport", city: "Matthew Town", country: "BS" },
  LGI: { name: "Deadman's Cay Airport", city: "Deadman's Cay", country: "BS" },
  SML: { name: "Stella Maris Airport", city: "Stella Maris", country: "BS" },
  MYG: { name: "Mayaguana Airport", city: "Mayaguana", country: "BS" },
  NAS: { name: "Lynden Pindling International Airport", city: "Nassau", country: "BS" },
  PID: { name: "Nassau Paradise Island Airport", city: "Nassau", country: "BS" },
  DCT: { name: "Duncan Town Airport", city: "", country: "BS" },
  RCY: { name: "Rum Cay Airport", city: "", country: "BS" },
  ZSA: { name: "San Salvador Airport", city: "San Salvador", country: "BS" },
  BGK: { name: "Big Creek Airport", city: "Big Creek", country: "BZ" },
  BZE: {
    name: "Philip S. W. Goldson International Airport",
    city: "Belize City",
    country: "BZ"
  },
  DGA: { name: "Pelican Beach Airstrip", city: "Dangriga", country: "BZ" },
  MZE: { name: "Manatee Airport", city: "Spanish Lookout", country: "BZ" },
  AIT: { name: "Aitutaki Airport", city: "Aitutaki", country: "CK" },
  AIU: { name: "Enua Airport", city: "Atiu Island", country: "CK" },
  MGS: { name: "Mangaia Island Airport", city: "Mangaia Island", country: "CK" },
  MHX: { name: "Manihiki Island Airport", city: "Manihiki Island", country: "CK" },
  MUK: { name: "Mauke Airport", city: "Mauke Island", country: "CK" },
  MOI: { name: "Mitiaro Island Airport", city: "Mitiaro Island", country: "CK" },
  PYE: { name: "Tongareva Airport", city: "Penrhyn Island", country: "CK" },
  RAR: { name: "Rarotonga International Airport", city: "Avarua", country: "CK" },
  EPG: { name: "Browns Airport", city: "Weeping Water", country: "US" },
  ICI: { name: "Cicia Airport", city: "Cicia", country: "FJ" },
  NAN: { name: "Nadi International Airport", city: "Nadi", country: "FJ" },
  PTF: {
    name: "Malolo Lailai Island Airport",
    city: "Malolo Lailai Island",
    country: "FJ"
  },
  KDV: { name: "Vunisea Airport", city: "Vunisea", country: "FJ" },
  MNF: { name: "Mana Island Airport", city: "Mana Island", country: "FJ" },
  MFJ: { name: "Moala Airport", city: "Moala", country: "FJ" },
  SUV: { name: "Nausori International Airport", city: "Nausori", country: "FJ" },
  LEV: { name: "Levuka Airfield", city: "Bureta", country: "FJ" },
  NGI: { name: "Ngau Airport", city: "Ngau", country: "FJ" },
  LUC: { name: "Laucala Island Airport", city: "Laucala Island", country: "FJ" },
  LKB: { name: "Lakeba Island Airport", city: "Lakeba Island", country: "FJ" },
  LBS: { name: "Labasa Airport", city: "", country: "FJ" },
  TVU: { name: "Matei Airport", city: "Matei", country: "FJ" },
  KXF: { name: "Koro Island Airport", city: "Koro Island", country: "FJ" },
  RTA: { name: "Rotuma Airport", city: "Rotuma", country: "FJ" },
  SVU: { name: "Savusavu Airport", city: "Savusavu", country: "FJ" },
  KAY: { name: "Wakaya Island Airport", city: "Wakaya Island", country: "FJ" },
  ONU: { name: "Ono-I-Lau Airport", city: "Ono-I-Lau", country: "FJ" },
  YAS: { name: "Yasawa Island Airport", city: "Yasawa Island", country: "FJ" },
  EUA: { name: "Kaufana Airport", city: "Eua Island", country: "TO" },
  TBU: { name: "Fua'amotu International Airport", city: "Nuku'alofa", country: "TO" },
  HPA: { name: "Lifuka Island Airport", city: "Lifuka", country: "TO" },
  NFO: { name: "Mata'aho Airport", city: "Angaha", country: "TO" },
  NTT: { name: "Kuini Lavenia Airport", city: "Niuatoputapu", country: "TO" },
  VAV: { name: "Vava'u International Airport", city: "Vava'u Island", country: "TO" },
  VBV: { name: "Vanua Balavu Airport", city: "Vanua Balavu", country: "FJ" },
  VTF: { name: "Vatulele Airport", city: "Vatulele", country: "FJ" },
  ABF: { name: "Abaiang Airport", city: "Abaiang", country: "KI" },
  BEZ: { name: "Beru Airport", city: "Beru", country: "KI" },
  FUN: { name: "Funafuti International Airport", city: "Funafuti", country: "TV" },
  KUC: { name: "Kuria Airport", city: "Kuria", country: "KI" },
  MNK: { name: "Maiana Airport", city: "Maiana", country: "KI" },
  MZK: { name: "Marakei Airport", city: "Marakei", country: "KI" },
  MTK: { name: "Makin Island Airport", city: "Makin Island", country: "KI" },
  NIG: { name: "Nikunau Airport", city: "Nikunau", country: "KI" },
  OOT: { name: "Onotoa Airport", city: "Onotoa", country: "KI" },
  TRW: { name: "Bonriki International Airport", city: "Tarawa", country: "KI" },
  AEA: { name: "Abemama Atoll Airport", city: "Abemama Atoll", country: "KI" },
  TBF: { name: "Tabiteuea North Airport", city: "", country: "KI" },
  TMN: { name: "Tamana Island Airport", city: "Tamana Island", country: "KI" },
  NON: { name: "Nonouti Airport", city: "Nonouti", country: "KI" },
  AIS: { name: "Arorae Island Airport", city: "Arorae Island", country: "KI" },
  TSU: { name: "Tabiteuea South Airport", city: "Tabiteuea South", country: "KI" },
  BBG: { name: "Butaritari Atoll Airport", city: "Butaritari Atoll", country: "KI" },
  AAK: { name: "Buariki Airport", city: "Buariki", country: "KI" },
  IUE: { name: "Niue International Airport", city: "Alofi", country: "NU" },
  FUT: { name: "Pointe Vele Airport", city: "Futuna Island", country: "WF" },
  WLS: { name: "Hihifo Airport", city: "Wallis Island", country: "WF" },
  HBB: { name: "Industrial Airpark", city: "Hobbs", country: "US" },
  AAU: { name: "Asau Airport", city: "Asau", country: "WS" },
  APW: { name: "Faleolo International Airport", city: "Apia", country: "WS" },
  FGI: { name: "Fagali'i Airport", city: "Apia", country: "WS" },
  FTI: { name: "Fitiuta Airport", city: "Fitiuta Village", country: "AS" },
  MXS: { name: "Maota Airport", city: "Maota", country: "WS" },
  PPG: { name: "Pago Pago International Airport", city: "Pago Pago", country: "AS" },
  PPT: { name: "Faa'a International Airport", city: "Papeete", country: "PF" },
  RUR: { name: "Rurutu Airport", city: "", country: "PF" },
  TUB: { name: "Tubuai Airport", city: "", country: "PF" },
  RVV: { name: "Raivavae Airport", city: "", country: "PF" },
  AAA: { name: "Anaa Airport", city: "", country: "PF" },
  FGU: { name: "Fangatau Airport", city: "", country: "PF" },
  TIH: { name: "Tikehau Airport", city: "", country: "PF" },
  APK: { name: "Apataki Airport", city: "Apataki", country: "PF" },
  REA: { name: "Reao Airport", city: "", country: "PF" },
  FAV: { name: "Fakarava Airport", city: "", country: "PF" },
  HHZ: { name: "Hikueru Atoll Airport", city: "Hikueru Atoll", country: "PF" },
  XMH: { name: "Manihi Airport", city: "", country: "PF" },
  GMR: { name: "Totegegie Airport", city: "", country: "PF" },
  KKR: { name: "Kaukura Airport", city: "", country: "PF" },
  MKP: { name: "Makemo Airport", city: "", country: "PF" },
  NAU: { name: "Napuka Island Airport", city: "Napuka Island", country: "PF" },
  TKV: { name: "Tatakoto Airport", city: "Tatakoto", country: "PF" },
  PKP: { name: "Puka Puka Airport", city: "", country: "PF" },
  PUK: { name: "Pukarua Airport", city: "Pukarua", country: "PF" },
  TKP: { name: "Takapoto Airport", city: "", country: "PF" },
  AXR: { name: "Arutua Airport", city: "", country: "PF" },
  MVT: { name: "Mataiva Airport", city: "", country: "PF" },
  NUK: { name: "Nukutavake Airport", city: "Nukutavake", country: "PF" },
  ZTA: { name: "Tureia Airport", city: "", country: "PF" },
  AHE: { name: "Ahe Airport", city: "Ahe Atoll", country: "PF" },
  KHZ: { name: "Kauehi Airport", city: "Kauehi", country: "PF" },
  FAC: { name: "Faaite Airport", city: "", country: "PF" },
  FHZ: { name: "Fakahina Airport", city: "Fakahina", country: "PF" },
  RKA: { name: "Aratika Nord Airport", city: "", country: "PF" },
  TJN: { name: "Takume Airport", city: "Takume", country: "PF" },
  NIU: { name: "Niau Airport", city: "Niau", country: "PF" },
  RRR: { name: "Raroia Airport", city: "", country: "PF" },
  TKX: { name: "Takaroa Airport", city: "", country: "PF" },
  KXU: { name: "Katiu Airport", city: "Katiu", country: "PF" },
  NHV: { name: "Nuku Hiva Airport", city: "", country: "PF" },
  AUQ: { name: "Hiva Oa-Atuona Airport", city: "", country: "PF" },
  UAP: { name: "Ua Pou Airport", city: "Ua Pou", country: "PF" },
  UAH: { name: "Ua Huka Airport", city: "Ua Huka", country: "PF" },
  BOB: { name: "Bora Bora Airport", city: "Motu Mute", country: "PF" },
  TTI: { name: "Tetiaroa Airport", city: "Tetiaroa", country: "PF" },
  RGI: { name: "Rangiroa Airport", city: "", country: "PF" },
  HUH: { name: "Huahine-Fare Airport", city: "Fare", country: "PF" },
  MOZ: { name: "Moorea Airport", city: "", country: "PF" },
  HOI: { name: "Hao Airport", city: "", country: "PF" },
  MAU: { name: "Maupiti Airport", city: "", country: "PF" },
  RFP: { name: "Raiatea Airport", city: "Uturoa", country: "PF" },
  UOA: { name: "Mururoa Atoll Airport", city: "Mururoa Atoll", country: "PF" },
  VHZ: { name: "Vahitahi Airport", city: "Vahitahi", country: "PF" },
  DRA: { name: "Desert Rock Airport", city: "Mercury", country: "US" },
  MTV: { name: "Mota Lava Airport", city: "Ablow", country: "VU" },
  SLH: { name: "Sola Airport", city: "Sola", country: "VU" },
  TOH: { name: "Torres Airstrip", city: "Loh/Linua", country: "VU" },
  EAE: { name: "Sangafa Airport", city: "Sangafa", country: "VU" },
  CCV: { name: "Craig Cove Airport", city: "Craig Cove", country: "VU" },
  LOD: { name: "Longana Airport", city: "Longana", country: "VU" },
  SSR: { name: "Sara Airport", city: "Pentecost Island", country: "VU" },
  PBJ: { name: "Tavie Airport", city: "Paama Island", country: "VU" },
  LPM: { name: "Lamap Airport", city: "Lamap", country: "VU" },
  LNB: { name: "Lamen Bay Airport", city: "Lamen Bay", country: "VU" },
  MWF: { name: "Naone Airport", city: "Maewo Island", country: "VU" },
  LNE: { name: "Lonorore Airport", city: "Lonorore", country: "VU" },
  NUS: { name: "Norsup Airport", city: "Norsup", country: "VU" },
  ZGU: { name: "Gaua Island Airport", city: "Gaua Island", country: "VU" },
  RCL: { name: "Redcliffe Airport", city: "Redcliffe", country: "VU" },
  SON: { name: "Santo Pekoa International Airport", city: "Luganville", country: "VU" },
  TGH: { name: "Tongoa Island Airport", city: "Tongoa Island", country: "VU" },
  ULB: { name: "Ulei Airport", city: "Ambryn Island", country: "VU" },
  VLS: { name: "Valesdir Airport", city: "Valesdir", country: "VU" },
  WLH: { name: "Walaha Airport", city: "Walaha", country: "VU" },
  SWJ: { name: "Southwest Bay Airport", city: "Malekula Island", country: "VU" },
  OLJ: { name: "North West Santo Airport", city: "Olpoi", country: "VU" },
  AUY: { name: "Anelghowhat Airport", city: "Anelghowhat", country: "VU" },
  AWD: { name: "Aniwa Airport", city: "Aniwa", country: "VU" },
  DLY: { name: "Dillon's Bay Airport", city: "Dillon's Bay", country: "VU" },
  FTA: { name: "Futuna Airport", city: "Futuna Island", country: "VU" },
  IPA: { name: "Ipota Airport", city: "Ipota", country: "VU" },
  UIQ: { name: "Quion Hill Airport", city: "Quion Hill", country: "VU" },
  VLI: { name: "Port Vila Bauerfield Airport", city: "Port Vila", country: "VU" },
  TAH: { name: "Tanna Airport", city: "", country: "VU" },
  TGJ: { name: "Tiga Airport", city: "Tiga", country: "NC" },
  BMY: { name: "Ile Art - Waala Airport", city: "Waala", country: "NC" },
  KNQ: { name: "Kone Airport", city: "Kone", country: "NC" },
  ILP: { name: "Ile des Pins Airport", city: "Ile des Pins", country: "NC" },
  HLU: { name: "Nesson Airport", city: "Houailou", country: "NC" },
  KOC: { name: "Koumac Airport", city: "Koumac", country: "NC" },
  LIF: { name: "Lifou Airport", city: "Lifou", country: "NC" },
  GEA: { name: "Noumea Magenta Airport", city: "Noumea", country: "NC" },
  IOU: { name: "Edmond Cane Airport", city: "Ile Ouen", country: "NC" },
  PUV: { name: "Poum Airport", city: "Poum", country: "NC" },
  PDC: { name: "Mueo Airport", city: "Mueo", country: "NC" },
  MEE: { name: "Mare Airport", city: "Mare", country: "NC" },
  TOU: { name: "Touho Airport", city: "Touho", country: "NC" },
  UVE: { name: "Ouvea Airport", city: "Ouvea", country: "NC" },
  NOU: { name: "La Tontouta International Airport", city: "Noumea", country: "NC" },
  AKL: { name: "Auckland International Airport", city: "Auckland", country: "NZ" },
  TUO: { name: "Taupo Airport", city: "Taupo", country: "NZ" },
  AMZ: { name: "Ardmore Airport", city: "Manurewa", country: "NZ" },
  ASG: { name: "Ashburton Aerodrome", city: "", country: "NZ" },
  CHC: { name: "Christchurch International Airport", city: "Christchurch", country: "NZ" },
  CHT: { name: "Chatham Islands-Tuuta Airport", city: "Waitangi", country: "NZ" },
  CMV: { name: "Coromandel Aerodrome", city: "", country: "NZ" },
  DGR: { name: "Dargaville Aerodrome", city: "", country: "NZ" },
  DUD: { name: "Dunedin Airport", city: "Dunedin", country: "NZ" },
  WHO: { name: "Franz Josef Aerodrome", city: "", country: "NZ" },
  GBZ: { name: "Great Barrier Aerodrome", city: "Claris", country: "NZ" },
  GMN: { name: "Greymouth Airport", city: "", country: "NZ" },
  GIS: { name: "Gisborne Airport", city: "Gisborne", country: "NZ" },
  GTN: { name: "Glentanner Airport", city: "Glentanner Station", country: "NZ" },
  HKK: { name: "Hokitika Airfield", city: "", country: "NZ" },
  HLZ: { name: "Hamilton International Airport", city: "Hamilton", country: "NZ" },
  WIK: { name: "Waiheke Reeve Airport", city: "", country: "NZ" },
  KBZ: { name: "Kaikoura Airport", city: "", country: "NZ" },
  KKE: { name: "Kerikeri Airport", city: "Kerikeri", country: "NZ" },
  KKO: { name: "Kaikohe Airport", city: "", country: "NZ" },
  KAT: { name: "Kaitaia Airport", city: "Kaitaia", country: "NZ" },
  ALR: { name: "Alexandra Airport", city: "Alexandra", country: "NZ" },
  MTA: { name: "Matamata Glider Airport", city: "", country: "NZ" },
  MON: { name: "Mount Cook Airport", city: "", country: "NZ" },
  MFN: { name: "Milford Sound Airport", city: "", country: "NZ" },
  MZP: { name: "Motueka Airport", city: "", country: "NZ" },
  TEU: { name: "Manapouri Airport", city: "", country: "NZ" },
  MRO: { name: "Hood Airport", city: "Masterton", country: "NZ" },
  NPL: { name: "New Plymouth Airport", city: "New Plymouth", country: "NZ" },
  NPE: { name: "Napier Airport", city: "", country: "NZ" },
  NSN: { name: "Nelson Airport", city: "Nelson", country: "NZ" },
  IVC: { name: "Invercargill Airport", city: "Invercargill", country: "NZ" },
  OHA: { name: "RNZAF Base Ohakea", city: "", country: "NZ" },
  OAM: { name: "Oamaru Airport", city: "", country: "NZ" },
  PMR: { name: "Palmerston North Airport", city: "", country: "NZ" },
  PCN: { name: "Picton Aerodrome", city: "Picton", country: "NZ" },
  PPQ: { name: "Paraparaumu Airport", city: "", country: "NZ" },
  ZQN: { name: "Queenstown International Airport", city: "Queenstown", country: "NZ" },
  RAG: { name: "Raglan Airfield", city: "", country: "NZ" },
  SZS: { name: "Ryans Creek Aerodrome", city: "Oban", country: "NZ" },
  ROT: { name: "Rotorua Regional Airport", city: "Rotorua", country: "NZ" },
  TRG: { name: "Tauranga Airport", city: "Tauranga", country: "NZ" },
  TMZ: { name: "Thames Aerodrome", city: "", country: "NZ" },
  KTF: { name: "Takaka Airport", city: "", country: "NZ" },
  TKZ: { name: "Tokoroa Airfield", city: "Tokoroa", country: "NZ" },
  TIU: { name: "Timaru Airport", city: "", country: "NZ" },
  TWZ: { name: "Pukaki Airport", city: "Twitzel", country: "NZ" },
  BHE: { name: "Woodbourne Airport", city: "Blenheim", country: "NZ" },
  WKA: { name: "Wanaka Airport", city: "", country: "NZ" },
  WHK: { name: "Whakatane Airport", city: "", country: "NZ" },
  WLG: { name: "Wellington International Airport", city: "Wellington", country: "NZ" },
  WIR: { name: "Wairoa Airport", city: "Wairoa", country: "NZ" },
  WRE: { name: "Whangarei Airport", city: "", country: "NZ" },
  WSZ: { name: "Westport Airport", city: "", country: "NZ" },
  WTZ: { name: "Whitianga Airport", city: "", country: "NZ" },
  WAG: { name: "Wanganui Airport", city: "Wanganui", country: "NZ" },
  BIN: { name: "Bamiyan Airport", city: "Bamiyan", country: "AF" },
  BST: { name: "Bost Airport", city: "Bost", country: "AF" },
  CCN: { name: "Chakcharan Airport", city: "Chakcharan", country: "AF" },
  DAZ: { name: "Darwaz Airport", city: "Darwaz", country: "AF" },
  FAH: { name: "Farah Airport", city: "Farah", country: "AF" },
  FBD: { name: "Faizabad Airport", city: "Faizabad", country: "AF" },
  KWH: { name: "Khwahan Airport", city: "Khwahan", country: "AF" },
  HEA: { name: "Herat Airport", city: "", country: "AF" },
  OAI: { name: "Bagram Air Base", city: "Bagram", country: "AF" },
  JAA: { name: "Jalalabad Airport", city: "", country: "AF" },
  KBL: { name: "Kabul International Airport", city: "Kabul", country: "AF" },
  KDH: { name: "Kandahar Airport", city: "", country: "AF" },
  KHT: { name: "Khost Airport", city: "Khost", country: "AF" },
  MMZ: { name: "Maimana Airport", city: "", country: "AF" },
  MZR: { name: "Mazar I Sharif Airport", city: "", country: "AF" },
  LQN: { name: "Qala-I-Naw Airport", city: "Qala-I-Naw", country: "AF" },
  OAS: { name: "Sharana Airstrip", city: "Sharana", country: "AF" },
  OAH: { name: "Shindand Airport", city: "", country: "AF" },
  SGA: { name: "Sheghnan Airport", city: "Sheghnan", country: "AF" },
  TII: { name: "Tarin Kowt Airport", city: "Tarin Kowt", country: "AF" },
  TQN: { name: "Talolqan Airport", city: "Taloqan", country: "AF" },
  UND: { name: "Konduz Airport", city: "", country: "AF" },
  OAZ: { name: "Camp Bastion Airport", city: "", country: "AF" },
  ZAJ: { name: "Zaranj Airport", city: "Zaranj", country: "AF" },
  BAH: { name: "Bahrain International Airport", city: "Manama", country: "BH" },
  AHB: { name: "Abha Regional Airport", city: "Abha", country: "SA" },
  HOF: { name: "Al Ahsa Airport", city: "", country: "SA" },
  ABT: { name: "Al Baha Airport", city: "", country: "SA" },
  BHH: { name: "Bisha Airport", city: "", country: "SA" },
  DMM: { name: "King Fahd International Airport", city: "Ad Dammam", country: "SA" },
  DWD: { name: "Al Dawadmi Airport", city: "Al Dawadmi", country: "SA" },
  GIZ: { name: "Jizan Regional Airport", city: "Jizan", country: "SA" },
  ELQ: { name: "Gassim Airport", city: "", country: "SA" },
  URY: { name: "Guriat Domestic Airport", city: "", country: "SA" },
  HAS: { name: "Hail Airport", city: "", country: "SA" },
  QJB: { name: "Jubail Airport", city: "Jubail", country: "SA" },
  JED: { name: "King Abdulaziz International Airport", city: "Jeddah", country: "SA" },
  HBT: {
    name: "King Khaled Military City Airport",
    city: "King Khaled Military City",
    country: "SA"
  },
  KMX: { name: "King Khaled Air Base", city: "", country: "SA" },
  MED: { name: "Prince Mohammad Bin Abdulaziz Airport", city: "Medina", country: "SA" },
  EAM: { name: "Nejran Airport", city: "Nejran", country: "SA" },
  NUM: { name: "Neom Bay Airport", city: "Neom Bay", country: "SA" },
  AQI: { name: "Hafr Al Batin Airport", city: "Qaisumah", country: "SA" },
  AKH: { name: "Prince Sultan Air Base", city: "", country: "SA" },
  RAH: { name: "Rafha Domestic Airport", city: "Rafha", country: "SA" },
  RUH: { name: "King Khaled International Airport", city: "Riyadh", country: "SA" },
  RAE: { name: "Arar Domestic Airport", city: "Arar", country: "SA" },
  RSI: { name: "Red Sea International Airport", city: "Hanak", country: "SA" },
  XXN: { name: "Riyadh Air Base", city: "Riyadh", country: "SA" },
  SHW: { name: "Sharurah Airport", city: "", country: "SA" },
  AJF: { name: "Al-Jawf Domestic Airport", city: "Al-Jawf", country: "SA" },
  SLF: { name: "Sulayel Airport", city: "", country: "SA" },
  TUU: { name: "Tabuk Airport", city: "", country: "SA" },
  TIF: { name: "Taif Airport", city: "", country: "SA" },
  TUI: { name: "Turaif Domestic Airport", city: "", country: "SA" },
  WAE: { name: "Wadi Al Dawasir Airport", city: "", country: "SA" },
  EJH: { name: "Al Wajh Domestic Airport", city: "Al Wajh", country: "SA" },
  YNB: { name: "Yenbo Airport", city: "", country: "SA" },
  ZUL: { name: "Zilfi Airport", city: "Zilfi", country: "SA" },
  ABD: { name: "Abadan Airport", city: "Abadan", country: "IR" },
  DEF: { name: "Dezful Airport", city: "", country: "IR" },
  AKW: { name: "Aghajari Airport", city: "Omidiyeh", country: "IR" },
  GCH: { name: "Gachsaran Airport", city: "", country: "IR" },
  OMI: { name: "Omidiyeh Airport", city: "Omidiyeh", country: "IR" },
  MRX: { name: "Mahshahr Airport", city: "", country: "IR" },
  AWZ: { name: "Ahwaz Airport", city: "Ahwaz", country: "IR" },
  AEU: { name: "Abumusa Island Airport", city: "", country: "IR" },
  BUZ: { name: "Bushehr Airport", city: "Bushehr", country: "IR" },
  IAQ: { name: "Bastak Airport", city: "", country: "IR" },
  AOY: { name: "Asaloyeh Airport", city: "Asaloyeh", country: "IR" },
  KNR: { name: "Jam Airport", city: "Kangan", country: "IR" },
  KIH: { name: "Kish International Airport", city: "Kish Island", country: "IR" },
  BDH: { name: "Bandar Lengeh Airport", city: "Bandar Lengeh", country: "IR" },
  KHK: { name: "Khark Island Airport", city: "", country: "IR" },
  SXI: { name: "Sirri Island Airport", city: "", country: "IR" },
  LVP: { name: "Lavan Island Airport", city: "", country: "IR" },
  KSH: { name: "Shahid Ashrafi Esfahani Airport", city: "Kermanshah", country: "IR" },
  IIL: { name: "Ilam Airport", city: "Ilam", country: "IR" },
  KHD: { name: "Khoram Abad Airport", city: "", country: "IR" },
  SDG: { name: "Sanandaj Airport", city: "", country: "IR" },
  IFH: { name: "Hesa Airport", city: "Hesa", country: "IR" },
  KKS: { name: "Kashan Airport", city: "", country: "IR" },
  IFN: {
    name: "Esfahan Shahid Beheshti International Airport",
    city: "Isfahan",
    country: "IR"
  },
  CQD: { name: "Shahrekord Airport", city: "Shahrekord", country: "IR" },
  RAS: { name: "Sardar-e-Jangal Airport", city: "Rasht", country: "IR" },
  HDM: { name: "Hamadan Airport", city: "Hamadan", country: "IR" },
  AJK: { name: "Arak Airport", city: "Araak", country: "IR" },
  NUJ: { name: "Hamadan Air Base", city: "Hamadan", country: "IR" },
  IKA: { name: "Imam Khomeini International Airport", city: "Tehran", country: "IR" },
  THR: { name: "Mehrabad International Airport", city: "Tehran", country: "IR" },
  GZW: { name: "Qazvin Airport", city: "Qazvin", country: "IR" },
  PYK: { name: "Payam Airport", city: "", country: "IR" },
  SNX: { name: "Semnan Airport", city: "Semnan", country: "IR" },
  BND: { name: "Bandar Abbas International Airport", city: "Bandar Abbas", country: "IR" },
  JYR: { name: "Jiroft Airport", city: "", country: "IR" },
  KER: { name: "Kerman Airport", city: "Kerman", country: "IR" },
  BXR: { name: "Bam Airport", city: "", country: "IR" },
  HDR: { name: "Havadarya Airport", city: "Havadarya", country: "IR" },
  GSM: { name: "Dayrestan Airport", city: "", country: "IR" },
  RJN: { name: "Rafsanjan Airport", city: "", country: "IR" },
  SYJ: { name: "Sirjan Airport", city: "", country: "IR" },
  XBJ: { name: "Birjand Airport", city: "Birjand", country: "IR" },
  CKT: { name: "Sarakhs Airport", city: "Sarakhs", country: "IR" },
  RUD: { name: "Shahroud Airport", city: "", country: "IR" },
  MHD: { name: "Mashhad International Airport", city: "Mashhad", country: "IR" },
  BJB: { name: "Bojnord Airport", city: "Bojnord", country: "IR" },
  AFZ: { name: "Sabzevar National Airport", city: "Sabzevar", country: "IR" },
  TCX: { name: "Tabas Airport", city: "Tabas", country: "IR" },
  KLM: { name: "Kalaleh Airport", city: "", country: "IR" },
  GBT: { name: "Gorgan Airport", city: "Gorgan", country: "IR" },
  BSM: { name: "Bishe Kola Air Base", city: "Amol", country: "IR" },
  NSH: { name: "Noshahr Airport", city: "", country: "IR" },
  RZR: { name: "Ramsar Airport", city: "", country: "IR" },
  SRY: { name: "Dasht-e Naz Airport", city: "Sari", country: "IR" },
  FAZ: { name: "Fasa Airport", city: "Fasa", country: "IR" },
  JAR: { name: "Jahrom Airport", city: "", country: "IR" },
  LRR: { name: "Lar Airport", city: "Lar", country: "IR" },
  LFM: { name: "Lamerd Airport", city: "Lamerd", country: "IR" },
  SYZ: {
    name: "Shiraz Shahid Dastghaib International Airport",
    city: "Shiraz",
    country: "IR"
  },
  YES: { name: "Yasouj Airport", city: "", country: "IR" },
  KHY: { name: "Khoy Airport", city: "Khoy", country: "IR" },
  ADU: { name: "Ardabil Airport", city: "Ardabil", country: "IR" },
  ACP: { name: "Sahand Airport", city: "Maragheh", country: "IR" },
  PFQ: { name: "Parsabade Moghan Airport", city: "Parsabad", country: "IR" },
  OMH: { name: "Urmia Airport", city: "Urmia", country: "IR" },
  TBZ: { name: "Tabriz International Airport", city: "Tabriz", country: "IR" },
  IMQ: { name: "Makou Airport", city: "Makou", country: "IR" },
  JWN: { name: "Zanjan Airport", city: "", country: "IR" },
  AZD: { name: "Shahid Sadooghi Airport", city: "Yazd", country: "IR" },
  ACZ: { name: "Zabol Airport", city: "", country: "IR" },
  ZBR: { name: "Konarak Airport", city: "Chabahar", country: "IR" },
  ZAH: { name: "Zahedan International Airport", city: "Zahedan", country: "IR" },
  IHR: { name: "Iran Shahr Airport", city: "", country: "IR" },
  AMM: { name: "Queen Alia International Airport", city: "Amman", country: "JO" },
  ADJ: { name: "Amman-Marka International Airport", city: "Amman", country: "JO" },
  AQJ: { name: "Aqaba King Hussein International Airport", city: "Aqaba", country: "JO" },
  OMF: { name: "King Hussein Air College", city: "Mafraq", country: "JO" },
  XIJ: { name: "Ahmed Al Jaber Air Base", city: "Ahmed Al Jaber AB", country: "KW" },
  KWI: { name: "Kuwait International Airport", city: "Kuwait City", country: "KW" },
  BEY: { name: "Beirut Rafic Hariri International Airport", city: "Beirut", country: "LB" },
  KYE: { name: "Rene Mouawad Air Base", city: "Tripoli", country: "LB" },
  AUH: { name: "Abu Dhabi International Airport", city: "Abu Dhabi", country: "AE" },
  AZI: { name: "Al Bateen Executive Airport", city: "Abu Dhabi", country: "AE" },
  AAN: { name: "Al Ain International Airport", city: "Al Ain", country: "AE" },
  DHF: { name: "Abu Dhabi-Al Dhafra AB Airport", city: "Al Bihouth", country: "AE" },
  XSB: { name: "Sir Bani Yas Airport", city: "Sir Bani Yas", country: "AE" },
  DXB: { name: "Dubai International Airport", city: "Dubai", country: "AE" },
  NHD: { name: "Al Minhad Air Base", city: "Dubai", country: "AE" },
  DWC: { name: "Al Maktoum International Airport", city: "Jebel Ali", country: "AE" },
  FJR: { name: "Fujairah International Airport", city: "", country: "AE" },
  RKT: {
    name: "Ras Al Khaimah International Airport",
    city: "Ras Al Khaimah",
    country: "AE"
  },
  SHJ: { name: "Sharjah International Airport", city: "Sharjah", country: "AE" },
  AOM: { name: "Adam Airport", city: "Adam", country: "OM" },
  RMB: { name: "Buraimi Airport", city: "Buraimi", country: "OM" },
  DQM: { name: "Duqm International Airport", city: "Duqm", country: "OM" },
  FAU: { name: "Fahud Airport", city: "Fahud", country: "OM" },
  RNM: { name: "Qarn Alam Airport", city: "Ghaba", country: "OM" },
  KHS: { name: "Khasab Air Base", city: "Khasab", country: "OM" },
  LKW: { name: "Lekhwair Airport", city: "", country: "OM" },
  MSH: { name: "Masirah Air Base", city: "Masirah", country: "OM" },
  MCT: { name: "Muscat International Airport", city: "Muscat", country: "OM" },
  OMM: { name: "Marmul Airport", city: "Marmul", country: "OM" },
  MNH: { name: "Rustaq Airport", city: "Al Muladdah", country: "OM" },
  SLL: { name: "Salalah Airport", city: "Salalah", country: "OM" },
  OHS: { name: "Sohar Airport", city: "Sohar", country: "OM" },
  SUH: { name: "Sur Airport", city: "Sur", country: "OM" },
  TTH: { name: "Thumrait Air Base", city: "Thumrait", country: "OM" },
  AAW: { name: "Abbottabad Airport", city: "Abbottabad", country: "PK" },
  BHW: { name: "Bhagatanwala Airport", city: "Bhagatanwala", country: "PK" },
  BNP: { name: "Bannu Airport", city: "Bannu", country: "PK" },
  WGB: { name: "Bahawalnagar Airport", city: "Bahawalnagar", country: "PK" },
  BHV: { name: "Bahawalpur Airport", city: "Bahawalpur", country: "PK" },
  CJL: { name: "Chitral Airport", city: "Chitral", country: "PK" },
  CHB: { name: "Chilas Airport", city: "Chilas", country: "PK" },
  DBA: { name: "Dalbandin Airport", city: "Dalbandin", country: "PK" },
  DDU: { name: "Dadu Airport", city: "Dadu", country: "PK" },
  DEA: { name: "Dera Ghazi Khan Airport", city: "Dera Ghazi Khan", country: "PK" },
  DSK: { name: "Dera Ismael Khan Airport", city: "Dera Ismael Khan", country: "PK" },
  LYP: { name: "Faisalabad International Airport", city: "Faisalabad", country: "PK" },
  GWD: { name: "Gwadar International Airport", city: "Gwadar", country: "PK" },
  GIL: { name: "Gilgit Airport", city: "Gilgit", country: "PK" },
  ISB: { name: "Islamabad International Airport", city: "Islamabad", country: "PK" },
  JAG: { name: "Shahbaz Air Base", city: "Jacobabad", country: "PK" },
  JIW: { name: "Jiwani Airport", city: "Jiwani", country: "PK" },
  KHI: { name: "Jinnah International Airport", city: "Karachi", country: "PK" },
  HDD: { name: "Hyderabad Airport", city: "Hyderabad", country: "PK" },
  KDD: { name: "Khuzdar Airport", city: "Khuzdar", country: "PK" },
  OHT: { name: "Kohat Airport", city: "Kohat", country: "PK" },
  KCF: { name: "Kadanwari Airport", city: "Kadanwari", country: "PK" },
  LHE: { name: "Alama Iqbal International Airport", city: "Lahore", country: "PK" },
  LRG: { name: "Loralai Airport", city: "Loralai", country: "PK" },
  XJM: { name: "Mangla Airport", city: "Mangla", country: "PK" },
  MFG: { name: "Muzaffarabad Airport", city: "Muzaffarabad", country: "PK" },
  MWD: { name: "Mianwali Air Base", city: "Mianwali", country: "PK" },
  MJD: { name: "Moenjodaro Airport", city: "Moenjodaro", country: "PK" },
  MPD: { name: "Sindhri Tharparkar Airport", city: "Sindhri", country: "PK" },
  MUX: { name: "Multan International Airport", city: "Multan", country: "PK" },
  WNS: { name: "Nawabshah Airport", city: "Nawabash", country: "PK" },
  NHS: { name: "Nushki Airport", city: "Nushki", country: "PK" },
  ORW: { name: "Ormara Airport", city: "Ormara Raik", country: "PK" },
  PAJ: { name: "Parachinar Airport", city: "Parachinar", country: "PK" },
  PJG: { name: "Panjgur Airport", city: "Panjgur", country: "PK" },
  PSI: { name: "Pasni Airport", city: "Pasni", country: "PK" },
  PEW: { name: "Peshawar International Airport", city: "Peshawar", country: "PK" },
  UET: { name: "Quetta International Airport", city: "Quetta", country: "PK" },
  RYK: { name: "Shaikh Zaid Airport", city: "Rahim Yar Khan", country: "PK" },
  RAZ: { name: "Rawalakot Airport", city: "Rawalakot", country: "PK" },
  SBQ: { name: "Sibi Airport", city: "Sibi", country: "PK" },
  KDU: { name: "Skardu Airport", city: "Skardu", country: "PK" },
  SKZ: { name: "Sukkur Airport", city: "Mirpur Khas", country: "PK" },
  SYW: { name: "Sehwan Sharif Airport", city: "Sehwan Sharif", country: "PK" },
  SGI: { name: "Mushaf Air Base", city: "Sargodha", country: "PK" },
  SDT: { name: "Saidu Sharif Airport", city: "Saidu Sharif", country: "PK" },
  SKT: { name: "Sialkot Airport", city: "Sialkot", country: "PK" },
  SUL: { name: "Sui Airport", city: "Sui", country: "PK" },
  SWN: { name: "Sahiwal Airport", city: "Sahiwal", country: "PK" },
  TLB: { name: "Tarbela Dam Airport", city: "Tarbela", country: "PK" },
  BDN: { name: "Talhar Airport", city: "Badin", country: "PK" },
  TFT: { name: "Taftan Airport", city: "Taftan", country: "PK" },
  TUK: { name: "Turbat International Airport", city: "Turbat", country: "PK" },
  WAF: { name: "Wana Airport", city: "Waana", country: "PK" },
  PZH: { name: "Zhob Airport", city: "Fort Sandeman", country: "PK" },
  IQA: { name: "Al Asad Air Base", city: "Hit", country: "IQ" },
  TQD: { name: "Al Taqaddum Air Base", city: "Al Habbaniyah", country: "IQ" },
  BMN: { name: "Bamarni Airport", city: "Bamarni", country: "IQ" },
  BGW: { name: "Baghdad International Airport", city: "Baghdad", country: "IQ" },
  OSB: { name: "Mosul International Airport", city: "Mosul", country: "IQ" },
  EBL: { name: "Erbil International Airport", city: "Arbil", country: "IQ" },
  KIK: { name: "Kirkuk Air Base", city: "Kirkuk", country: "IQ" },
  BSR: { name: "Basrah International Airport", city: "Basrah", country: "IQ" },
  NJF: { name: "Al Najaf International Airport", city: "Najaf", country: "IQ" },
  RQW: { name: "Qayyarah West Airport", city: "Qayyarah", country: "IQ" },
  ISU: { name: "Sulaymaniyah International Airport", city: "Sulaymaniyah", country: "IQ" },
  ALP: { name: "Aleppo International Airport", city: "Aleppo", country: "SY" },
  DAM: { name: "Damascus International Airport", city: "Damascus", country: "SY" },
  DEZ: { name: "Deir ez-Zor Airport", city: "Deir ez-Zor", country: "SY" },
  KAC: { name: "Kamishly Airport", city: "Kamishly", country: "SY" },
  LTK: { name: "Bassel Al-Assad International Airport", city: "Latakia", country: "SY" },
  PMS: { name: "Palmyra Airport", city: "", country: "SY" },
  DIA: { name: "Doha International Airport", city: "Doha", country: "QA" },
  IUD: { name: "Al Udeid Air Base", city: "Ar Rayyan", country: "QA" },
  DOH: { name: "Hamad International Airport", city: "Doha", country: "QA" },
  ADE: { name: "Aden International Airport", city: "Aden", country: "YE" },
  EAB: { name: "Abs Airport", city: "Abs", country: "YE" },
  AXK: { name: "Ataq Airport", city: "", country: "YE" },
  BYD: { name: "Al-Bayda Airport", city: "Al-Bayda", country: "YE" },
  AAY: { name: "Al Ghaidah International Airport", city: "", country: "YE" },
  HOD: { name: "Hodeidah International Airport", city: "Hodeida", country: "YE" },
  MYN: { name: "Mareb Airport", city: "Mareb", country: "YE" },
  RIY: { name: "Mukalla International Airport", city: "Riyan", country: "YE" },
  SAH: { name: "Sana'a International Airport", city: "Sana'a", country: "YE" },
  SCT: { name: "Socotra International Airport", city: "Socotra Islands", country: "YE" },
  GXF: { name: "Sayun International Airport", city: "Sayun", country: "YE" },
  TAI: { name: "Ta'izz International Airport", city: "Ta'izz", country: "YE" },
  AKB: { name: "Atka Airport", city: "Atka", country: "US" },
  PML: { name: "Port Moller Airport", city: "Cold Bay", country: "US" },
  PAQ: {
    name: 'Warren "Bud" Woods Palmer Municipal Airport',
    city: "Palmer",
    country: "US"
  },
  ATU: { name: "Casco Cove Cgs Airport", city: "Attu", country: "US" },
  BTI: { name: "Barter Island Airport", city: "Barter Island", country: "US" },
  BET: { name: "Bethel Airport", city: "Bethel", country: "US" },
  BVU: { name: "Beluga Airport", city: "Beluga", country: "US" },
  BIG: { name: "Allen Army Air Field", city: "Delta Junction Ft Greely", country: "US" },
  BKC: { name: "Buckland Airport", city: "Buckland", country: "US" },
  BMX: { name: "Big Mountain Airport", city: "Big Mountain", country: "US" },
  BRW: {
    name: "Wiley Post-Will Rogers Memorial Airport",
    city: "Utqiagvik",
    country: "US"
  },
  BTT: { name: "Bettles Airport", city: "Bettles", country: "US" },
  CDB: { name: "Cold Bay Airport", city: "Cold Bay", country: "US" },
  CEM: { name: "Central Airport", city: "Central", country: "US" },
  CHU: { name: "Chuathbaluk Airport", city: "Chuathbaluk", country: "US" },
  CIK: { name: "Chalkyitsik Airport", city: "Chalkyitsik", country: "US" },
  CKD: { name: "Crooked Creek Airport", city: "Crooked Creek", country: "US" },
  CYF: { name: "Chefornak Airport", city: "Chefornak", country: "US" },
  SCM: { name: "Scammon Bay Airport", city: "Scammon Bay", country: "US" },
  IRC: { name: "Circle City Airport", city: "Circle", country: "US" },
  WSF: { name: "Cape Sarichef Airport", city: "Cape Sarichef", country: "US" },
  CDV: { name: "Merle K (Mudhole) Smith Airport", city: "Cordova", country: "US" },
  CXF: { name: "Coldfoot Airport", city: "Coldfoot", country: "US" },
  CZF: { name: "Cape Romanzof Lrrs Airport", city: "Cape Romanzof", country: "US" },
  DRG: { name: "Deering Airport", city: "Deering", country: "US" },
  RDB: { name: "Red Dog Airport", city: "Red Dog", country: "US" },
  ADK: { name: "Adak Airport", city: "Adak Island", country: "US" },
  DLG: { name: "Dillingham Airport", city: "Dillingham", country: "US" },
  MLL: { name: "Marshall Don Hunter Sr Airport", city: "Marshall", country: "US" },
  ADQ: { name: "Kodiak Airport", city: "Kodiak", country: "US" },
  DUT: { name: "Unalaska Airport", city: "Unalaska", country: "US" },
  KKH: { name: "Kongiganak Airport", city: "Kongiganak", country: "US" },
  EDF: { name: "Elmendorf Afb Airport", city: "Anchorage", country: "US" },
  EEK: { name: "Eek Airport", city: "Eek", country: "US" },
  EAA: { name: "Eagle Airport", city: "Eagle", country: "US" },
  EHM: { name: "Cape Newenham Lrrs Airport", city: "Cape Newenham", country: "US" },
  EIL: { name: "Eielson Afb Airport", city: "Fairbanks", country: "US" },
  EMK: { name: "Emmonak Airport", city: "Emmonak", country: "US" },
  ENA: { name: "Kenai Municipal Airport", city: "Kenai", country: "US" },
  WWT: { name: "Mertarvik Airport", city: "Mertarvik", country: "US" },
  FAI: { name: "Fairbanks International Airport", city: "Fairbanks", country: "US" },
  FBK: { name: "Ladd Army Air Field", city: "Fairbanks/Ft Wainwright", country: "US" },
  ABL: { name: "Ambler Airport", city: "Ambler", country: "US" },
  FRN: {
    name: "Bryant Army Air Field",
    city: "Fort Richardson (Anchorage)",
    country: "US"
  },
  NIB: { name: "Nikolai Airport", city: "Nikolai", country: "US" },
  GAL: { name: "Edward G Pitka Sr Airport", city: "Galena", country: "US" },
  GBH: { name: "Galbraith Lake Airport", city: "Galbraith Lake", country: "US" },
  KWK: { name: "Kwigillingok Airport", city: "Kwigillingok", country: "US" },
  SHG: { name: "Shungnak Airport", city: "Shungnak", country: "US" },
  GKN: { name: "Gulkana Airport", city: "Gulkana", country: "US" },
  GLV: { name: "Golovin Airport", city: "Golovin", country: "US" },
  GAM: { name: "Gambell Airport", city: "Gambell", country: "US" },
  AGN: { name: "Angoon Seaplane Base", city: "Angoon", country: "US" },
  BGQ: { name: "Big Lake Airport", city: "Big Lake", country: "US" },
  GST: { name: "Gustavus Airport", city: "Gustavus", country: "US" },
  NME: { name: "Nightmute Airport", city: "Nightmute", country: "US" },
  KGX: { name: "Grayling Airport", city: "Grayling", country: "US" },
  SGY: { name: "Skagway Airport", city: "Skagway", country: "US" },
  GMT: { name: "Granite Mountain Air Station", city: "Granite Mountain", country: "US" },
  HCR: { name: "Holy Cross Airport", city: "Holy Cross", country: "US" },
  HSL: { name: "Huslia Airport", city: "Huslia", country: "US" },
  HNS: { name: "Haines Airport", city: "Haines", country: "US" },
  HOM: { name: "Homer Airport", city: "Homer", country: "US" },
  HPB: { name: "Hooper Bay Airport", city: "Hooper Bay", country: "US" },
  HUS: { name: "Hughes Airport", city: "Hughes", country: "US" },
  SHX: { name: "Shageluk Airport", city: "Shageluk", country: "US" },
  IGG: { name: "Igiugig Airport", city: "Igiugig", country: "US" },
  EGX: { name: "Egegik Airport", city: "Egegik", country: "US" },
  IAN: { name: "Bob Baker Memorial Airport", city: "Kiana", country: "US" },
  ILI: { name: "Iliamna Airport", city: "Iliamna", country: "US" },
  UTO: { name: "Indian Mountain Lrrs Airport", city: "Utopia Creek", country: "US" },
  MCL: { name: "Mc Kinley Ntl Park Airport", city: "Mckinley Park", country: "US" },
  WAA: { name: "Wales Airport", city: "Wales", country: "US" },
  KCG: { name: "Chignik Airport", city: "Chignik", country: "US" },
  JNU: { name: "Juneau International Airport", city: "Juneau", country: "US" },
  KGK: { name: "Koliganek Airport", city: "Koliganek", country: "US" },
  TEK: { name: "Tatitlek Airport", city: "Tatitlek", country: "US" },
  KDK: { name: "Kodiak Municipal Airport", city: "Kodiak", country: "US" },
  KFP: { name: "False Pass Airport", city: "False Pass", country: "US" },
  AKK: { name: "Akhiok Airport", city: "Akhiok", country: "US" },
  KPN: { name: "Kipnuk Airport", city: "Kipnuk", country: "US" },
  KKA: { name: "Koyuk Alfred Adams Airport", city: "Koyuk", country: "US" },
  LKK: { name: "Kulik Lake Airport", city: "Kulik Lake", country: "US" },
  AKN: { name: "King Salmon Airport", city: "King Salmon", country: "US" },
  IKO: { name: "Nikolski Air Station", city: "Nikolski", country: "US" },
  AKP: { name: "Anaktuvuk Pass Airport", city: "Anaktuvuk Pass", country: "US" },
  KTN: { name: "Ketchikan International Airport", city: "Ketchikan", country: "US" },
  UUK: { name: "Ugnu-Kuparuk Airport", city: "Kuparuk", country: "US" },
  KAL: { name: "Kaltag Airport", city: "Kaltag", country: "US" },
  KLW: { name: "Klawock Airport", city: "Klawock", country: "US" },
  KYK: { name: "Karluk Airport", city: "Karluk", country: "US" },
  KLN: { name: "Larsen Bay Airport", city: "Larsen Bay", country: "US" },
  KLG: { name: "Kalskag Airport", city: "Kalskag", country: "US" },
  WCR: { name: "Chandalar Lake Airport", city: "Chandalar Lake", country: "US" },
  TLT: { name: "Tuluksak Airport", city: "Tuluksak", country: "US" },
  LUR: { name: "Cape Lisburne Lrrs Airport", city: "Cape Lisburne", country: "US" },
  KMO: { name: "Manokotak Airport", city: "Manokotak", country: "US" },
  MCG: { name: "Mc Grath Airport", city: "Mc Grath", country: "US" },
  MDO: { name: "Middleton Island Airport", city: "Middleton Island", country: "US" },
  LMA: { name: "Minchumina Airport", city: "Minchumina", country: "US" },
  SMK: { name: "St Michael Airport", city: "St Michael", country: "US" },
  MLY: { name: "Manley Hot Springs Airport", city: "Manley Hot Springs", country: "US" },
  MOU: { name: "Mountain Village Airport", city: "Mountain Village", country: "US" },
  MRI: { name: "Merrill Field", city: "Anchorage", country: "US" },
  MXY: { name: "Mccarthy Airport", city: "Mccarthy", country: "US" },
  MYU: { name: "Mekoryuk Airport", city: "Mekoryuk", country: "US" },
  WNA: { name: "Napakiak Airport", city: "Napakiak", country: "US" },
  ANC: {
    name: "Ted Stevens Anchorage International Airport",
    city: "Anchorage",
    country: "US"
  },
  ANI: { name: "Aniak Airport", city: "Aniak", country: "US" },
  ENN: { name: "Nenana Municipal Airport", city: "Nenana", country: "US" },
  NNL: { name: "Nondalton Airport", city: "Nondalton", country: "US" },
  ANN: { name: "Annette Island Airport", city: "Annette", country: "US" },
  NUL: { name: "Nulato Airport", city: "Nulato", country: "US" },
  ANV: { name: "Anvik Airport", city: "Anvik", country: "US" },
  KNW: { name: "New Stuyahok Airport", city: "New Stuyahok", country: "US" },
  OBU: { name: "Kobuk Airport", city: "Kobuk", country: "US" },
  PCA: { name: "Portage Creek Airport", city: "Portage Creek", country: "US" },
  HNH: { name: "Hoonah Airport", city: "Hoonah", country: "US" },
  OME: { name: "Nome Airport", city: "Nome", country: "US" },
  OOK: { name: "Toksook Bay Airport", city: "Toksook Bay", country: "US" },
  ORT: { name: "Northway Airport", city: "Northway", country: "US" },
  OTZ: { name: "Ralph Wien Memorial Airport", city: "Kotzebue", country: "US" },
  NLG: { name: "Nelson Lagoon Airport", city: "Nelson Lagoon", country: "US" },
  STG: { name: "St George Airport", city: "St George", country: "US" },
  KPC: { name: "Port Clarence Cgs Airport", city: "Port Clarence", country: "US" },
  KPV: { name: "Perryville Airport", city: "Perryville", country: "US" },
  PSG: { name: "Petersburg James A Johnson Airport", city: "Petersburg", country: "US" },
  PTH: { name: "Port Heiden Airport", city: "Port Heiden", country: "US" },
  PKA: { name: "Napaskiak Airport", city: "Napaskiak", country: "US" },
  PTU: { name: "Platinum Airport", city: "Platinum", country: "US" },
  PIP: { name: "Pilot Point Airport", city: "Pilot Point", country: "US" },
  PHO: { name: "Point Hope Airport", city: "Point Hope", country: "US" },
  PPC: { name: "Prospect Creek Airport", city: "Prospect Creek", country: "US" },
  KWN: { name: "Quinhagak Airport", city: "Quinhagak", country: "US" },
  NUI: { name: "Nuiqsut Airport", city: "Nuiqsut", country: "US" },
  ARC: { name: "Arctic Village Airport", city: "Arctic Village", country: "US" },
  RSH: { name: "Russian Mission Airport", city: "Russian Mission", country: "US" },
  RBY: { name: "Ruby Airport", city: "Ruby", country: "US" },
  SVA: { name: "Savoonga Airport", city: "Savoonga", country: "US" },
  SCC: { name: "Deadhorse Airport", city: "Deadhorse", country: "US" },
  SDP: { name: "Sand Point Airport", city: "Sand Point", country: "US" },
  SHH: { name: "Shishmaref Airport", city: "Shishmaref", country: "US" },
  SIT: { name: "Sitka Rocky Gutierrez Airport", city: "Sitka", country: "US" },
  WLK: { name: "Selawik Airport", city: "Selawik", country: "US" },
  SLQ: { name: "Sleetmute Airport", city: "Sleetmute", country: "US" },
  KSM: { name: "St Mary's Airport", city: "St Mary'S", country: "US" },
  SNP: { name: "St Paul Island Airport", city: "St Paul Island", country: "US" },
  SOV: { name: "Seldovia Airport", city: "Seldovia", country: "US" },
  SMU: { name: "Sheep Mountain Airport", city: "Sheep Mountain", country: "US" },
  UMM: { name: "Summit Airport", city: "Summit", country: "US" },
  SVW: { name: "Sparrevohn Lrrs Airport", city: "Sparrevohn", country: "US" },
  SKW: { name: "Skwentna Airport", city: "Skwentna", country: "US" },
  SXQ: { name: "Soldotna Airport", city: "Soldotna", country: "US" },
  SYA: { name: "Eareckson Air Station", city: "Shemya", country: "US" },
  TAL: { name: "Ralph M Calhoun Memorial Airport", city: "Tanana", country: "US" },
  TNC: { name: "Tin City Lrrs Airport", city: "Tin City", country: "US" },
  TLA: { name: "Teller Airport", city: "Teller", country: "US" },
  TOG: { name: "Togiak Airport", city: "Togiak Village", country: "US" },
  TKA: { name: "Talkeetna Airport", city: "Talkeetna", country: "US" },
  TLJ: { name: "Tatalina Lrrs Airport", city: "Takotna", country: "US" },
  ATK: {
    name: "Atqasuk Edward Burnell Sr Memorial Airport",
    city: "Atqasuk",
    country: "US"
  },
  AUK: { name: "Alakanuk Airport", city: "Alakanuk", country: "US" },
  UMT: { name: "Umiat Airport", city: "Umiat", country: "US" },
  UNK: { name: "Unalakleet Airport", city: "Unalakleet", country: "US" },
  WOW: { name: "Willow Airport", city: "Willow", country: "US" },
  KQA: { name: "Akutan Airport", city: "Akutan", country: "US" },
  VAK: { name: "Chevak Airport", city: "Chevak", country: "US" },
  KVC: { name: "King Cove Airport", city: "King Cove", country: "US" },
  VDZ: { name: "Valdez Pioneer Field", city: "Valdez", country: "US" },
  VEE: { name: "Venetie Airport", city: "Venetie", country: "US" },
  KVL: { name: "Kivalina Airport", city: "Kivalina", country: "US" },
  WBQ: { name: "Beaver Airport", city: "Beaver", country: "US" },
  SWD: { name: "Seward Airport", city: "Seward", country: "US" },
  WRG: { name: "Wrangell Airport", city: "Wrangell", country: "US" },
  AIN: { name: "Wainwright Airport", city: "Wainwright", country: "US" },
  WMO: { name: "White Mountain Airport", city: "White Mountain", country: "US" },
  WTK: { name: "Noatak Airport", city: "Noatak", country: "US" },
  WWA: { name: "Wasilla Airport", city: "Wasilla", country: "US" },
  YAK: { name: "Yakutat Airport", city: "Yakutat", country: "US" },
  CIS: { name: "Canton Airport", city: "Abariringa", country: "KI" },
  AKI: { name: "Akiak Airport", city: "Akiak", country: "US" },
  AET: { name: "Allakaket Airport", city: "Allakaket", country: "US" },
  NCN: { name: "Chenega Bay Airport", city: "Chenega", country: "US" },
  CLP: { name: "Clarks Point Airport", city: "Clarks Point", country: "US" },
  ELI: { name: "Elim Airport", city: "Elim", country: "US" },
  KUK: { name: "Kasigluk Airport", city: "Kasigluk", country: "US" },
  KNK: { name: "Kokhanok Airport", city: "Kokhanok", country: "US" },
  KOT: { name: "Kotlik Airport", city: "Kotlik", country: "US" },
  KTS: { name: "Brevig Mission Airport", city: "Brevig Mission", country: "US" },
  KYU: { name: "Koyukuk Airport", city: "Koyukuk", country: "US" },
  KWT: { name: "Kwethluk Airport", city: "Kwethluk", country: "US" },
  RMP: { name: "Rampart Airport", city: "Rampart", country: "US" },
  ORV: { name: "Robert/Bob/Curtis Memorial Airport", city: "Noorvik", country: "US" },
  SKK: { name: "Shaktoolik Airport", city: "Shaktoolik", country: "US" },
  SVS: { name: "Stevens Village Airport", city: "Stevens Village", country: "US" },
  TKJ: { name: "Tok Junction Airport", city: "Tok", country: "US" },
  WSN: { name: "South Naknek Nr 2 Airport", city: "South Naknek", country: "US" },
  FYU: { name: "Fort Yukon Airport", city: "Fort Yukon", country: "US" },
  KKI: { name: "Akiachak Airport", city: "Akiachak", country: "US" },
  ROP: {
    name: "Benjamin Taisacan Manglona International Airport",
    city: "Rota Island",
    country: "MP"
  },
  SPN: {
    name: "Francisco C Ada/Saipan International Airport",
    city: "Saipan Island",
    country: "MP"
  },
  UAM: { name: "Andersen Afb Airport", city: "Yigo", country: "GU" },
  GUM: { name: "Guam International Airport", city: "Tamuning", country: "GU" },
  TIQ: {
    name: "Francisco Manglona Borja/Tinian International Airport",
    city: "Tinian Island",
    country: "MP"
  },
  BKH: { name: "Barking Sands Pmrf Airport", city: "Kekaha,Kauai", country: "US" },
  HDH: { name: "Kawaihapai Airfield", city: "Mokuleia", country: "US" },
  HHI: { name: "Wheeler Army Air Field", city: "Wahiawa", country: "US" },
  HNM: { name: "Hana Airport", city: "Hana", country: "US" },
  JHM: { name: "Kapalua Airport", city: "Lahaina", country: "US" },
  JRF: { name: "Kalaeloa (John Rodgers Field) Airport", city: "Kapolei", country: "US" },
  KOA: {
    name: "Ellison Onizuka Kona International At Keahole Airport",
    city: "Kailua-Kona",
    country: "US"
  },
  LIH: { name: "Lihue Airport", city: "Lihue", country: "US" },
  LUP: { name: "Kalaupapa Airport", city: "Kalaupapa", country: "US" },
  MKK: { name: "Molokai Airport", city: "Kaunakakai", country: "US" },
  MUE: { name: "Waimea-Kohala Airport", city: "Kamuela", country: "US" },
  NGF: {
    name: "Kaneohe Bay Mcas (Marion E Carl Field) Airport",
    city: "Kaneohe",
    country: "US"
  },
  HNL: { name: "Daniel K Inouye International Airport", city: "Honolulu", country: "US" },
  LNY: { name: "Lanai Airport", city: "Lanai City", country: "US" },
  OGG: { name: "Kahului Airport", city: "Kahului", country: "US" },
  PAK: { name: "Port Allen Airport", city: "Hanapepe", country: "US" },
  BSF: { name: "Bradshaw Army Airfield", city: "Camp Pohakuloa", country: "US" },
  ITO: { name: "Hilo International Airport", city: "Hilo", country: "US" },
  UPP: { name: "Upolu Airport", city: "Hawi", country: "US" },
  MAJ: { name: "Amata Kabua International Airport", city: "Majuro Atoll", country: "MH" },
  KIA: { name: "Kaieteur International Airport", city: "Kaieteur Falls", country: "GY" },
  KWA: {
    name: "Bucholz Army Air Field(Kwajalein Kmr)(Atoll) Airport",
    city: "Kwajalein",
    country: "MH"
  },
  CXI: { name: "Cassidy International Airport", city: "Banana", country: "KI" },
  TNV: { name: "Tabuaeran Island Airport", city: "Tabuaeran Island", country: "KI" },
  MDY: { name: "Henderson Field", city: "Midway Atoll", country: "UM" },
  DCK: { name: "Dahl Creek Airport", city: "Dahl Creek", country: "US" },
  TNK: { name: "Tununak Airport", city: "Tununak", country: "US" },
  TCT: { name: "Takotna Airport", city: "Takotna", country: "US" },
  NUP: { name: "Nunapitchuk Airport", city: "Nunapitchuk", country: "US" },
  PIZ: { name: "Point Lay Lrrs Airport", city: "Point Lay", country: "US" },
  TKK: { name: "Chuuk International Airport", city: "Weno Island", country: "FM" },
  PNI: { name: "Pohnpei International Airport", city: "Pohnpei Island", country: "FM" },
  ROR: { name: "Palau International Airport", city: "Babelthuap Island", country: "PW" },
  KSA: { name: "Kosrae Airport", city: "Kosrae", country: "FM" },
  YAP: { name: "Yap International Airport", city: "Yap Island", country: "FM" },
  AWK: { name: "Wake Island Airfield", city: "Wake Island", country: "UM" },
  KNH: { name: "Kinmen Airport", city: "Shang-I", country: "TW" },
  CMJ: { name: "Qimei Airport", city: "Qimei", country: "TW" },
  LZN: { name: "Matsu Nangan Airport", city: "Nangang Island", country: "TW" },
  TTT: { name: "Taitung Airport", city: "Taitung City", country: "TW" },
  GNI: { name: "Lyudao Airport", city: "Lyudao", country: "TW" },
  KHH: { name: "Kaohsiung International Airport", city: "Kaohsiung City", country: "TW" },
  CYI: { name: "Chiayi Airport", city: "Chiayi City", country: "TW" },
  HCN: { name: "Hengchun Airport", city: "Hengchung", country: "TW" },
  TXG: { name: "Taichung Airport", city: "Taichung City", country: "TW" },
  KYD: { name: "Lanyu Airport", city: "Orchid Island", country: "TW" },
  RMQ: { name: "Taichung Ching Chuang Kang Airport", city: "Taichung City", country: "TW" },
  MFK: { name: "Matsu Beigan Airport", city: "Beigan Island", country: "TW" },
  TNN: { name: "Tainan Airport", city: "Tainan City", country: "TW" },
  HSZ: { name: "Hsinchu Air Base", city: "Hsinchu City", country: "TW" },
  MZG: { name: "Makung Airport", city: "Makung City", country: "TW" },
  PIF: { name: "Pingtung North Airport", city: "Pingtung", country: "TW" },
  TSA: { name: "Taipei Songshan Airport", city: "Taipei City", country: "TW" },
  TPE: { name: "Taiwan Taoyuan International Airport", city: "Taipei", country: "TW" },
  WOT: { name: "Wang-an Airport", city: "Wang-an", country: "TW" },
  HUN: { name: "Hualien Airport", city: "Hualien City", country: "TW" },
  NRT: { name: "Narita International Airport", city: "Tokyo", country: "JP" },
  MMJ: { name: "Matsumoto Airport", city: "Matsumoto", country: "JP" },
  IBR: { name: "Hyakuri Airport", city: "Omitama", country: "JP" },
  MUS: { name: "Minami Torishima Airport", city: "", country: "JP" },
  IHA: { name: "Niijima Airport", city: "", country: "JP" },
  IWO: { name: "Iwo Jima Airport", city: "", country: "JP" },
  KIX: { name: "Kansai International Airport", city: "Osaka", country: "JP" },
  SHM: { name: "Nanki Shirahama Airport", city: "Shirahama", country: "JP" },
  UKB: { name: "Kobe Airport", city: "Kobe", country: "JP" },
  TJH: { name: "Tajima Airport", city: "Tajima", country: "JP" },
  OBO: { name: "Tokachi-Obihiro Airport", city: "Obihiro", country: "JP" },
  CTS: { name: "New Chitose Airport", city: "Chitose / Tomakomai", country: "JP" },
  HKD: { name: "Hakodate Airport", city: "Hakodate", country: "JP" },
  KUH: { name: "Kushiro Airport", city: "Kushiro", country: "JP" },
  MMB: { name: "Memanbetsu Airport", city: "Ozora", country: "JP" },
  SHB: { name: "Nakashibetsu Airport", city: "Nakashibetsu", country: "JP" },
  OKD: { name: "Okadama Airport", city: "Sapporo", country: "JP" },
  WKJ: { name: "Wakkanai Airport", city: "Wakkanai", country: "JP" },
  AXJ: { name: "Amakusa Airport", city: "", country: "JP" },
  IKI: { name: "Iki Airport", city: "Iki", country: "JP" },
  UBJ: { name: "Yamaguchi Ube Airport", city: "Ube", country: "JP" },
  TSJ: { name: "Tsushima Airport", city: "Tsushima", country: "JP" },
  MBE: { name: "Monbetsu Airport", city: "Monbetsu", country: "JP" },
  AKJ: { name: "Asahikawa Airport", city: "Asahikawa", country: "JP" },
  OIR: { name: "Okushiri Airport", city: "", country: "JP" },
  RIS: { name: "Rishiri Airport", city: "Rishiri", country: "JP" },
  KUM: { name: "Yakushima Airport", city: "", country: "JP" },
  FUJ: { name: "Fukue Airport", city: "Goto", country: "JP" },
  FUK: { name: "Fukuoka Airport", city: "Fukuoka", country: "JP" },
  TNE: { name: "New Tanegashima Airport", city: "", country: "JP" },
  KOJ: { name: "Kagoshima Airport", city: "Kagoshima", country: "JP" },
  KMI: { name: "Miyazaki Airport", city: "Miyazaki", country: "JP" },
  OIT: { name: "Oita Airport", city: "Oita", country: "JP" },
  KKJ: { name: "Kitakyushu Airport", city: "Kitakyushu", country: "JP" },
  HSG: { name: "Saga Airport", city: "Saga", country: "JP" },
  KMJ: { name: "Kumamoto Airport", city: "Kumamoto", country: "JP" },
  NGS: { name: "Nagasaki Airport", city: "Nagasaki", country: "JP" },
  NGO: { name: "Chubu Centrair International Airport", city: "Tokoname", country: "JP" },
  ASJ: { name: "Amami Airport", city: "Amami", country: "JP" },
  OKE: { name: "Okierabu Airport", city: "", country: "JP" },
  KKX: { name: "Kikai Airport", city: "", country: "JP" },
  TKN: { name: "Tokunoshima Airport", city: "Tokunoshima", country: "JP" },
  NKM: { name: "Nagoya Airport", city: "Nagoya", country: "JP" },
  FKJ: { name: "Fukui Airport", city: "", country: "JP" },
  QGU: { name: "Gifu Airport", city: "Gifu", country: "JP" },
  KMQ: { name: "Komatsu Airport", city: "Kanazawa", country: "JP" },
  OKI: { name: "Oki Airport", city: "Okinoshima", country: "JP" },
  FSZ: { name: "Mt. Fuji Shizuoka Airport", city: "", country: "JP" },
  TOY: { name: "Toyama Airport", city: "Toyama", country: "JP" },
  NTQ: { name: "Noto Airport", city: "Wajima", country: "JP" },
  HIJ: { name: "Hiroshima Airport", city: "Hiroshima", country: "JP" },
  OKJ: { name: "Okayama Airport", city: "Okayama City", country: "JP" },
  IZO: { name: "Izumo Airport", city: "Izumo", country: "JP" },
  YGJ: { name: "Miho Yonago Airport", city: "Yonago", country: "JP" },
  IWK: { name: "Iwakuni Marine Corps Air Station", city: "Iwakuni", country: "JP" },
  KCZ: { name: "Kochi Ryoma Airport", city: "Nankoku", country: "JP" },
  MYJ: { name: "Matsuyama Airport", city: "Matsuyama", country: "JP" },
  ITM: { name: "Osaka International Airport", city: "Osaka", country: "JP" },
  TTJ: { name: "Tottori Airport", city: "Tottori", country: "JP" },
  TKS: { name: "Tokushima Airport", city: "Tokushima", country: "JP" },
  TAK: { name: "Takamatsu Airport", city: "Takamatsu", country: "JP" },
  IWJ: { name: "Iwami Airport", city: "Masuda", country: "JP" },
  AOJ: { name: "Aomori Airport", city: "Aomori", country: "JP" },
  GAJ: { name: "Yamagata Airport", city: "Yamagata", country: "JP" },
  SDS: { name: "Sado Airport", city: "", country: "JP" },
  FKS: { name: "Fukushima Airport", city: "Sukagawa", country: "JP" },
  HHE: { name: "Hachinohe Airport", city: "", country: "JP" },
  HNA: { name: "Hanamaki Airport", city: "", country: "JP" },
  AXT: { name: "Akita Airport", city: "Akita", country: "JP" },
  MSJ: { name: "Misawa Air Base", city: "Misawa", country: "JP" },
  KIJ: { name: "Niigata Airport", city: "Niigata", country: "JP" },
  ONJ: { name: "Odate Noshiro Airport", city: "Odate", country: "JP" },
  SDJ: { name: "Sendai Airport", city: "Sendai", country: "JP" },
  SYO: { name: "Shonai Airport", city: "Shonai", country: "JP" },
  NJA: { name: "Atsugi Naval Air Facility", city: "", country: "JP" },
  HAC: { name: "Hachijojima Airport", city: "Hachijojima", country: "JP" },
  OIM: { name: "Oshima Airport", city: "Izu Oshima", country: "JP" },
  MYE: { name: "Miyakejima Airport", city: "Miyakejima", country: "JP" },
  HND: { name: "Tokyo International Airport", city: "Tokyo", country: "JP" },
  QUT: { name: "Utsunomiya Airport", city: "", country: "JP" },
  OKO: { name: "Yokota Air Base", city: "Fussa", country: "JP" },
  MWX: { name: "Muan International Airport", city: "", country: "KR" },
  KWJ: { name: "Gwangju Airport", city: "Gwangju", country: "KR" },
  KUV: { name: "Kunsan Air Base", city: "Kunsan", country: "KR" },
  RSU: { name: "Yeosu Airport", city: "Yeosu", country: "KR" },
  QUN: { name: "A-306 Airport", city: "Chun Chon City", country: "KR" },
  KAG: { name: "Gangneung Airport", city: "", country: "KR" },
  WJU: { name: "Wonju Airport", city: "Wonju", country: "KR" },
  YNY: {
    name: "Yangyang International Airport",
    city: "Sokcho / Gangneung",
    country: "KR"
  },
  CJU: { name: "Jeju International Airport", city: "Jeju City", country: "KR" },
  JDG: { name: "Jeongseok Airport", city: "", country: "KR" },
  CHF: { name: "Jinhae Airport", city: "Jinhae", country: "KR" },
  PUS: { name: "Gimhae International Airport", city: "Busan", country: "KR" },
  HIN: { name: "Sacheon Air Base", city: "Sacheon", country: "KR" },
  USN: { name: "Ulsan Airport", city: "Ulsan", country: "KR" },
  ICN: { name: "Incheon International Airport", city: "Seoul", country: "KR" },
  SSN: { name: "Seoul Air Base", city: "", country: "KR" },
  OSN: { name: "Osan Air Base", city: "", country: "KR" },
  GMP: { name: "Gimpo International Airport", city: "Seoul", country: "KR" },
  SWU: { name: "Suwon Airport", city: "", country: "KR" },
  KPO: { name: "Pohang Airport", city: "Pohang", country: "KR" },
  JWO: { name: "Jungwon Air Base", city: "", country: "KR" },
  TAE: { name: "Daegu Airport", city: "Daegu", country: "KR" },
  HMY: { name: "Seosan Air Base", city: "Seosan", country: "KR" },
  CJJ: { name: "Cheongju International Airport", city: "Cheongju", country: "KR" },
  YEC: { name: "Yecheon Airport", city: "", country: "KR" },
  OKA: { name: "Naha Airport", city: "Naha", country: "JP" },
  DNA: { name: "Kadena Air Base", city: "", country: "JP" },
  ISG: { name: "Ishigaki Airport", city: "Ishigaki", country: "JP" },
  UEO: { name: "Kumejima Airport", city: "", country: "JP" },
  KJP: { name: "Kerama Airport", city: "Kerama", country: "JP" },
  MMD: { name: "Minami Daito Airport", city: "", country: "JP" },
  MMY: { name: "Miyako Airport", city: "Miyako City", country: "JP" },
  AGJ: { name: "Aguni Airport", city: "Aguni", country: "JP" },
  IEJ: { name: "Ie Jima Airport", city: "", country: "JP" },
  HTR: { name: "Hateruma Airport", city: "Hateruma", country: "JP" },
  KTD: { name: "Kitadaito Airport", city: "", country: "JP" },
  SHI: { name: "Shimojishima Airport", city: "", country: "JP" },
  TRA: { name: "Tarama Airport", city: "", country: "JP" },
  RNJ: { name: "Yoron Airport", city: "", country: "JP" },
  OGN: { name: "Yonaguni Airport", city: "", country: "JP" },
  ENI: { name: "El Nido Airport", city: "El Nido", country: "PH" },
  SFS: { name: "Subic Bay International Airport", city: "Olongapo City", country: "PH" },
  CRK: {
    name: "Diosdado Macapagal International Airport",
    city: "Angeles City",
    country: "PH"
  },
  LAO: { name: "Laoag International Airport", city: "Laoag City", country: "PH" },
  DRP: { name: "Legazpi Bicol International Airport", city: "Daraga", country: "PH" },
  MNL: { name: "Ninoy Aquino International Airport", city: "Manila", country: "PH" },
  CYU: { name: "Cuyo Airport", city: "Cuyo", country: "PH" },
  SGL: { name: "Sangley Point Air Base", city: "Cavite City", country: "PH" },
  LBX: { name: "Lubang Airport", city: "", country: "PH" },
  AAV: { name: "Allah Valley Airport", city: "Surallah", country: "PH" },
  CBO: { name: "Awang Airport", city: "Cotabato City", country: "PH" },
  DVO: {
    name: "Francisco Bangoy International Airport",
    city: "Davao City",
    country: "PH"
  },
  BXU: { name: "Bancasi Airport", city: "Butuan City", country: "PH" },
  BPH: { name: "Bislig Airport", city: "", country: "PH" },
  DPL: { name: "Dipolog Airport", city: "Dipolog City", country: "PH" },
  CGM: { name: "Camiguin Airport", city: "", country: "PH" },
  IGN: { name: "Iligan Airport", city: "", country: "PH" },
  JOL: { name: "Jolo Airport", city: "", country: "PH" },
  MLP: { name: "Malabang Airport", city: "Malabang", country: "PH" },
  SGS: { name: "Sanga Sanga Airport", city: "", country: "PH" },
  OZC: { name: "Labo Airport", city: "Ozamiz City", country: "PH" },
  PAG: { name: "Pagadian Airport", city: "Pagadian City", country: "PH" },
  MXI: { name: "Mati National Airport", city: "", country: "PH" },
  GES: {
    name: "General Santos International Airport",
    city: "General Santos",
    country: "PH"
  },
  SUG: { name: "Surigao Airport", city: "Surigao City", country: "PH" },
  CDY: { name: "Cagayan de Sulu Airport", city: "Mapun", country: "PH" },
  IPE: { name: "Ipil Airport", city: "Ipil", country: "PH" },
  TDG: { name: "Tandag Airport", city: "", country: "PH" },
  CGY: { name: "Laguindingan Intl", city: "Laguindingan", country: "PH" },
  ZAM: { name: "Zamboanga International Airport", city: "Zamboanga City", country: "PH" },
  IAO: { name: "Siargao Airport", city: "Del Carmen", country: "PH" },
  RZP: { name: "Cesar Lim Rodriguez Airport", city: "Taytay Airport", country: "PH" },
  TAG: { name: "Panglao Bohol International Airport", city: "Panglao", country: "PH" },
  BAG: { name: "Loakan Airport", city: "Baguio City", country: "PH" },
  DTE: { name: "Daet Airport", city: "Daet", country: "PH" },
  SJI: { name: "San Jose Airport", city: "San Jose", country: "PH" },
  MBO: { name: "Mamburao Airport", city: "", country: "PH" },
  WNP: { name: "Naga Airport", city: "Naga", country: "PH" },
  BSO: { name: "Basco Airport", city: "Basco", country: "PH" },
  BQA: { name: "Dr.Juan C. Angara Airport", city: "Baler", country: "PH" },
  SFE: { name: "San Fernando Airport", city: "", country: "PH" },
  TUG: { name: "Tuguegarao Airport", city: "Tuguegarao City", country: "PH" },
  VRC: { name: "Virac Airport", city: "Virac", country: "PH" },
  MRQ: { name: "Marinduque Airport", city: "Gasan", country: "PH" },
  CYZ: { name: "Cauayan Airport", city: "Cauayan City", country: "PH" },
  TAC: { name: "Daniel Z. Romualdez Airport", city: "Tacloban City", country: "PH" },
  BCD: {
    name: "Bacolod-Silay City International Airport",
    city: "Bacolod City",
    country: "PH"
  },
  CYP: { name: "Calbayog Airport", city: "Calbayog City", country: "PH" },
  DGT: { name: "Sibulan Airport", city: "Dumaguete City", country: "PH" },
  MPH: { name: "Godofredo P. Ramos Airport", city: "Malay", country: "PH" },
  CRM: { name: "Catarman National Airport", city: "Catarman", country: "PH" },
  ILO: { name: "Iloilo International Airport", city: "Iloilo City", country: "PH" },
  MBT: { name: "Moises R. Espinosa Airport", city: "Masbate", country: "PH" },
  KLO: { name: "Kalibo International Airport", city: "Kalibo", country: "PH" },
  CEB: { name: "Mactan Cebu International Airport", city: "Lapu-Lapu City", country: "PH" },
  OMC: { name: "Ormoc Airport", city: "Ormoc City", country: "PH" },
  PPS: { name: "Puerto Princesa Airport", city: "Puerto Princesa City", country: "PH" },
  RXS: { name: "Roxas Airport", city: "Roxas City", country: "PH" },
  EUQ: { name: "Evelio Javier Airport", city: "San Jose", country: "PH" },
  TBH: { name: "Romblon Airport", city: "Romblon", country: "PH" },
  USU: { name: "Francisco B. Reyes Airport", city: "Coron", country: "PH" },
  BPR: { name: "Borongan Airport", city: "Borongan City", country: "PH" },
  CCT: { name: "Colonia Catriel Airport", city: "Colonia Catriel", country: "AR" },
  COC: { name: "Comodoro Pierrestegui Airport", city: "Concordia", country: "AR" },
  GHU: { name: "Gualeguaychu Airport", city: "Gualeguaychu", country: "AR" },
  JNI: { name: "Junin Airport", city: "Junin", country: "AR" },
  PRA: { name: "General Urquiza Airport", city: "Paran\xE1", country: "AR" },
  ROS: { name: "Islas Malvinas Airport", city: "Rosario", country: "AR" },
  SFN: { name: "Sauce Viejo Airport", city: "Santa Fe", country: "AR" },
  AEP: { name: "Jorge Newbery Airpark", city: "Buenos Aires", country: "AR" },
  LCM: { name: "La Cumbre Airport", city: "La Cumbre", country: "AR" },
  COR: { name: "Ingeniero Ambrosio Taravella Airport", city: "Cordoba", country: "AR" },
  FDO: { name: "San Fernando Airport", city: "San Fernando", country: "AR" },
  LPG: { name: "La Plata Airport", city: "La Plata", country: "AR" },
  EPA: { name: "El Palomar Airport", city: "El Palomar", country: "AR" },
  MJR: { name: "Miramar Airport", city: "Miramar", country: "AR" },
  EZE: { name: "Ministro Pistarini International Airport", city: "Ezeiza", country: "AR" },
  RAF: { name: "Rafaela Airport", city: "Rafaela", country: "AR" },
  NCJ: { name: "Sunchales Aeroclub Airport", city: "Sunchales", country: "AR" },
  HOS: { name: "Chos Malal Airport", city: "Chos Malal", country: "AR" },
  CVH: { name: "Caviahue Airport", city: "Lafontaine", country: "AR" },
  GNR: { name: "Dr. Arturo H. Illia Airport", city: "General Roca", country: "AR" },
  RDS: {
    name: "Rincon De Los Sauces Airport",
    city: "Rincon de los Sauces",
    country: "AR"
  },
  APZ: { name: "Zapala Airport", city: "Zapala", country: "AR" },
  MDZ: { name: "El Plumerillo Airport", city: "Mendoza", country: "AR" },
  LGS: { name: "Comodoro D.R. Salomon Airport", city: "Malargue", country: "AR" },
  AFA: {
    name: "Suboficial Ay Santiago Germano Airport",
    city: "San Rafael",
    country: "AR"
  },
  CTC: { name: "Catamarca Airport", city: "Catamarca", country: "AR" },
  SDE: {
    name: "Vicecomodoro Angel D. La Paz Aragones Airport",
    city: "Santiago del Estero",
    country: "AR"
  },
  RHD: { name: "Las Termas Airport", city: "Rio Hondo", country: "AR" },
  IRJ: { name: "Capitan V A Almonacid Airport", city: "La Rioja", country: "AR" },
  TUC: {
    name: "Teniente Benjamin Matienzo Airport",
    city: "San Miguel de Tucuman",
    country: "AR"
  },
  UAQ: { name: "Domingo Faustino Sarmiento Airport", city: "San Juan", country: "AR" },
  CRR: { name: "Ceres Airport", city: "Ceres", country: "AR" },
  RCU: { name: "Area De Material Airport", city: "Rio Cuarto", country: "AR" },
  VDR: { name: "Villa Dolores Airport", city: "Villa Dolores", country: "AR" },
  VME: { name: "Villa Reynolds Airport", city: "Villa Reynolds", country: "AR" },
  RLO: { name: "Valle Del Conlara International Airport", city: "Merlo", country: "AR" },
  LUQ: {
    name: "Brigadier Mayor D Cesar Raul Ojeda Airport",
    city: "San Luis",
    country: "AR"
  },
  CNQ: { name: "Corrientes Airport", city: "Corrientes", country: "AR" },
  RES: { name: "Resistencia International Airport", city: "Resistencia", country: "AR" },
  FMA: { name: "Formosa Airport", city: "Formosa", country: "AR" },
  IGR: {
    name: "Cataratas Del Iguazu International Airport",
    city: "Puerto Iguazu",
    country: "AR"
  },
  AOL: { name: "Paso De Los Libres Airport", city: "Paso de los Libres", country: "AR" },
  MCS: { name: "Monte Caseros Airport", city: "Monte Caseros", country: "AR" },
  PSS: {
    name: "Libertador Gral D Jose De San Martin Airport",
    city: "Posadas",
    country: "AR"
  },
  PRQ: { name: "Termal Airport", city: "Presidencia Roque Saenz Pena", country: "AR" },
  SLA: {
    name: "Martin Miguel De Guemes International Airport",
    city: "Salta",
    country: "AR"
  },
  JUJ: {
    name: "Gobernador Horacio Guzman International Airport",
    city: "San Salvador de Jujuy",
    country: "AR"
  },
  ORA: { name: "Oran Airport", city: "Oran", country: "AR" },
  TTG: { name: "General Enrique Mosconi Airport", city: "Tartagal", country: "AR" },
  CLX: { name: "Clorinda Airport", city: "Clorinda", country: "AR" },
  ELO: { name: "El Dorado Airport", city: "El Dorado", country: "AR" },
  OYA: { name: "Goya Airport", city: "Goya", country: "AR" },
  LLS: { name: "Alferez Armando Rodriguez Airport", city: "Las Lomitas", country: "AR" },
  MDX: { name: "Mercedes Airport", city: "Mercedes", country: "AR" },
  RCQ: { name: "Reconquista Airport", city: "Reconquista", country: "AR" },
  UZU: { name: "Curuzu Cuatia Airport", city: "Curuzu Cuatia", country: "AR" },
  EHL: { name: "El Bolson Airport", city: "El Bolson", country: "AR" },
  CRD: { name: "General E. Mosconi Airport", city: "Comodoro Rivadavia", country: "AR" },
  EMX: { name: "El Maiten Airport", city: "El Maiten", country: "AR" },
  EQS: { name: "Brigadier Antonio Parodi Airport", city: "Esquel", country: "AR" },
  LHS: { name: "Las Heras Airport", city: "Las Heras", country: "AR" },
  IGB: {
    name: "Cabo F.A.A. H. R. Bordon Airport",
    city: "Ingeniero Jacobacci",
    country: "AR"
  },
  OLN: { name: "Lago Musters Airport", city: "Sarmiento", country: "AR" },
  OES: { name: "Antoine De St Exupery Airport", city: "San Antonio Oeste", country: "AR" },
  MQD: { name: "Maquinchao Airport", city: "Maquinchao", country: "AR" },
  ARR: { name: "D. Casimiro Szlapelis Airport", city: "Alto Rio Senguerr", country: "AR" },
  SGV: { name: "Sierra Grande Airport", city: "Sierra Grande", country: "AR" },
  REL: { name: "Almirante Marco Andres Zar Airport", city: "Rawson", country: "AR" },
  VDM: {
    name: "Gobernador Castello Airport",
    city: "Viedma / Carmen de Patagones",
    country: "AR"
  },
  PMY: { name: "El Tehuelche Airport", city: "Puerto Madryn", country: "AR" },
  ING: { name: "Lago Argentino Airport", city: "El Calafate", country: "AR" },
  FTE: { name: "El Calafate Airport", city: "El Calafate", country: "AR" },
  PUD: { name: "Puerto Deseado Airport", city: "Puerto Deseado", country: "AR" },
  RGA: { name: "Hermes Quijada International Airport", city: "Rio Grande", country: "AR" },
  RGL: { name: "Piloto Civil N. Fernandez Airport", city: "Rio Gallegos", country: "AR" },
  USH: { name: "Malvinas Argentinas Airport", city: "Ushuahia", country: "AR" },
  ULA: { name: "Capitan D Daniel Vazquez Airport", city: "San Julian", country: "AR" },
  ROY: { name: "Rio Mayo Airport", city: "Rio Mayo", country: "AR" },
  PMQ: { name: "Perito Moreno Airport", city: "Perito Moreno", country: "AR" },
  GGS: { name: "Gobernador Gregores Airport", city: "Gobernador Gregores", country: "AR" },
  JSM: { name: "Jose De San Martin Airport", city: "Chubut", country: "AR" },
  RYO: { name: "28 De Noviembre Airport", city: "El Turbio", country: "AR" },
  RZA: { name: "Santa Cruz Airport", city: "Santa Cruz", country: "AR" },
  BHI: { name: "Comandante Espora Airport", city: "Bahia Blanca", country: "AR" },
  CSZ: { name: "Brigadier D.H.E. Ruiz Airport", city: "Coronel Suarez", country: "AR" },
  OVR: { name: "Olavarria Airport", city: "Olavarria", country: "AR" },
  GPO: { name: "General Pico Airport", city: "General Pico", country: "AR" },
  OYO: { name: "Tres Arroyos Airport", city: "Tres Arroyos", country: "AR" },
  SST: { name: "Santa Teresita Airport", city: "Santa Teresita", country: "AR" },
  MDQ: {
    name: "Astor Piazzola International Airport",
    city: "Mar del Plata",
    country: "AR"
  },
  NQN: { name: "Presidente Peron Airport", city: "Neuquen", country: "AR" },
  NEC: { name: "Necochea Airport", city: "Necochea", country: "AR" },
  PEH: { name: "Comodoro Pedro Zanni Airport", city: "Pehuajo", country: "AR" },
  RSA: { name: "Santa Rosa Airport", city: "Santa Rosa", country: "AR" },
  BRC: {
    name: "San Carlos De Bariloche Airport",
    city: "San Carlos de Bariloche",
    country: "AR"
  },
  TDL: { name: "Heroes De Malvinas Airport", city: "Tandil", country: "AR" },
  VLG: { name: "Villa Gesell Airport", city: "Villa Gesell", country: "AR" },
  CUT: { name: "Cutral-Co Airport", city: "Cutral-Co", country: "AR" },
  CPC: {
    name: "Aviador C. Campos Airport",
    city: "Chapelco/San Martin de los Andes",
    country: "AR"
  },
  CDJ: {
    name: "Conceicao do Araguaia Airport",
    city: "Conceicao Do Araguaia",
    country: "BR"
  },
  JTC: { name: "Bauru-Arealva Airport", city: "Bauru", country: "BR" },
  AQA: { name: "Araraquara Airport", city: "Araraquara", country: "BR" },
  AJU: { name: "Santa Maria Airport", city: "Aracaju", country: "BR" },
  AIF: { name: "Marcelo Pires Halzhausen Airport", city: "Assis", country: "BR" },
  AFL: { name: "Alta Floresta Airport", city: "Alta Floresta", country: "BR" },
  ARU: { name: "Aracatuba Airport", city: "Aracatuba", country: "BR" },
  AAX: { name: "Araxa Airport", city: "Araxa", country: "BR" },
  BEL: {
    name: "Val de Cans/Julio Cezar Ribeiro International Airport",
    city: "Belem",
    country: "BR"
  },
  BGX: { name: "Comandante Gustavo Kraemer Airport", city: "Bage", country: "BR" },
  PLU: {
    name: "Pampulha - Carlos Drummond de Andrade Airport",
    city: "Belo Horizonte",
    country: "BR"
  },
  BFH: { name: "Bacacheri Airport", city: "Curitiba", country: "BR" },
  BJP: {
    name: "Aeroporto Estadual Arthur Siqueira Airport",
    city: "Braganca Paulista",
    country: "BR"
  },
  QAK: {
    name: "Major Brigadeiro Doorgal Borges Airport",
    city: "Barbacena",
    country: "BR"
  },
  BSB: {
    name: "Presidente Juscelino Kubistschek International Airport",
    city: "Brasilia",
    country: "BR"
  },
  BAT: { name: "Chafei Amsei Airport", city: "Barretos", country: "BR" },
  BAU: { name: "Bauru Airport", city: "Bauru", country: "BR" },
  BVB: { name: "Atlas Brasil Cantanhede Airport", city: "Boa Vista", country: "BR" },
  BPG: { name: "Barra do Garcas Airport", city: "Barra Do Garcas", country: "BR" },
  BZC: { name: "Umberto Modiano Airport", city: "Cabo Frio", country: "BR" },
  CAC: { name: "Cascavel Airport", city: "Cascavel", country: "BR" },
  CFB: { name: "Cabo Frio Airport", city: "Cabo Frio", country: "BR" },
  CFC: { name: "Ca\xE7ador Airport", city: "Ca\xE7ador", country: "BR" },
  CNF: {
    name: "Tancredo Neves International Airport",
    city: "Belo Horizonte",
    country: "BR"
  },
  CGR: { name: "Campo Grande Airport", city: "Campo Grande", country: "BR" },
  XAP: { name: "Chapeco Airport", city: "Chapeco", country: "BR" },
  CLN: { name: "Brig. Lysias Augusto Rodrigues Airport", city: "Carolina", country: "BR" },
  CKS: { name: "Carajas Airport", city: "Carajas", country: "BR" },
  CCM: { name: "Forquilhinha - Criciuma Airport", city: "Criciuma", country: "BR" },
  CLV: { name: "Caldas Novas Airport", city: "Caldas Novas", country: "BR" },
  QNS: { name: "Canoas Airport", city: "Porto Alegre", country: "BR" },
  CAW: {
    name: "Bartolomeu Lisandro Airport",
    city: "Campos Dos Goytacazes",
    country: "BR"
  },
  CMG: { name: "Corumba International Airport", city: "Corumba", country: "BR" },
  CWB: { name: "Afonso Pena Airport", city: "Curitiba", country: "BR" },
  CRQ: { name: "Caravelas Airport", city: "Caravelas", country: "BR" },
  CXJ: { name: "Campo dos Bugres Airport", city: "Caxias Do Sul", country: "BR" },
  CGB: { name: "Marechal Rondon Airport", city: "Cuiaba", country: "BR" },
  CZS: { name: "Cruzeiro do Sul Airport", city: "Cruzeiro Do Sul", country: "BR" },
  BYO: { name: "Bonito Airport", city: "Bonito", country: "BR" },
  PPB: { name: "Presidente Prudente Airport", city: "Presidente Prudente", country: "BR" },
  MAO: { name: "Eduardo Gomes International Airport", city: "Manaus", country: "BR" },
  JCR: { name: "Jacareacanga Airport", city: "Jacareacanga", country: "BR" },
  ESI: { name: "Espinosa Airport", city: "Espinosa", country: "BR" },
  IGU: { name: "Cataratas International Airport", city: "Foz Do Iguacu", country: "BR" },
  FLN: { name: "Hercilio Luz International Airport", city: "Florianopolis", country: "BR" },
  FEN: { name: "Fernando de Noronha Airport", city: "Fernando De Noronha", country: "BR" },
  FOR: { name: "Pinto Martins International Airport", city: "Fortaleza", country: "BR" },
  GIG: {
    name: "Galeao - Antonio Carlos Jobim International Airport",
    city: "Rio De Janeiro",
    country: "BR"
  },
  GJM: { name: "Guajara-Mirim Airport", city: "Guajara-Mirim", country: "BR" },
  GYN: { name: "Santa Genoveva Airport", city: "Goiania", country: "BR" },
  GRU: {
    name: "Guarulhos - Governador Andre Franco Montoro International Airport",
    city: "Sao Paulo",
    country: "BR"
  },
  GPB: { name: "Tancredo Thomas de Faria Airport", city: "Guarapuava", country: "BR" },
  GVR: {
    name: "Governador Valadares Airport",
    city: "Governador Valadares",
    country: "BR"
  },
  GUJ: { name: "Guaratingueta Airport", city: "Guaratingueta", country: "BR" },
  JHF: {
    name: "S\xE3o Paulo Catarina Executive Airport",
    city: "S\xE3o Roque",
    country: "BR"
  },
  ATM: { name: "Altamira Airport", city: "Altamira", country: "BR" },
  ITA: { name: "Itacoatiara Airport", city: "Itacoatiara", country: "BR" },
  ITB: { name: "Itaituba Airport", city: "Itaituba", country: "BR" },
  IOS: { name: "Bahia - Jorge Amado Airport", city: "Ilheus", country: "BR" },
  IPN: { name: "Usiminas Airport", city: "Ipatinga", country: "BR" },
  IMP: { name: "Prefeito Renato Moreira Airport", city: "Imperatriz", country: "BR" },
  JJD: {
    name: "Comandante Ariston Pessoa Airport",
    city: "Jijoca de Jericoacoara (Cruz)",
    country: "BR"
  },
  JDF: { name: "Francisco de Assis Airport", city: "Juiz De Fora", country: "BR" },
  JPA: { name: "Presidente Castro Pinto Airport", city: "Joao Pessoa", country: "BR" },
  JDO: {
    name: "Orlando Bezerra de Menezes Airport",
    city: "Juazeiro Do Norte",
    country: "BR"
  },
  JOI: { name: "Lauro Carneiro de Loyola Airport", city: "Joinville", country: "BR" },
  CPV: { name: "Presidente Joao Suassuna Airport", city: "Campina Grande", country: "BR" },
  VCP: { name: "Viracopos International Airport", city: "Campinas", country: "BR" },
  LEC: { name: "Chapada Diamantina Airport", city: "Lencois", country: "BR" },
  LAJ: { name: "Lages Airport", city: "Lages", country: "BR" },
  LIP: { name: "Lins Airport", city: "Lins", country: "BR" },
  LDB: { name: "Governador Jose Richa Airport", city: "Londrina", country: "BR" },
  LAZ: { name: "Bom Jesus da Lapa Airport", city: "Bom Jesus Da Lapa", country: "BR" },
  MAB: { name: "Maraba Airport", city: "Maraba", country: "BR" },
  MQH: { name: "Minacu Airport", city: "Minacu", country: "BR" },
  MEU: { name: "Monte Dourado Airport", city: "Almeirim", country: "BR" },
  MEA: { name: "Macae Airport", city: "Macae", country: "BR" },
  MGF: {
    name: "Regional de Maringa - Silvio Nane Junior Airport",
    city: "Maringa",
    country: "BR"
  },
  MOC: { name: "Mario Ribeiro Airport", city: "Montes Claros", country: "BR" },
  MII: { name: "Marilia Airport", city: "Marilia", country: "BR" },
  PLL: { name: "Ponta Pelada Airport", city: "Manaus", country: "BR" },
  MCZ: { name: "Zumbi dos Palmares Airport", city: "Maceio", country: "BR" },
  MCP: { name: "Alberto Alcolumbre Airport", city: "Macapa", country: "BR" },
  MVF: { name: "Dix-Sept Rosado Airport", city: "Mossoro", country: "BR" },
  SAO: { name: "Campo de Marte Airport", city: "Sao Paulo", country: "BR" },
  MNX: { name: "Manicore Airport", city: "Manicore", country: "BR" },
  NVT: {
    name: "Ministro Victor Konder International Airport",
    city: "Navegantes",
    country: "BR"
  },
  GEL: { name: "Santo Angelo Airport", city: "Santo Angelo", country: "BR" },
  OYK: { name: "Oiapoque Airport", city: "Oiapoque", country: "BR" },
  POA: { name: "Salgado Filho Airport", city: "Porto Alegre", country: "BR" },
  PHB: {
    name: "Prefeito Doutor Joao Silva Filho Airport",
    city: "Parnaiba",
    country: "BR"
  },
  POO: { name: "Pocos de Caldas Airport", city: "Pocos De Caldas", country: "BR" },
  PFB: { name: "Lauro Kurtz Airport", city: "Passo Fundo", country: "BR" },
  PMW: { name: "Brigadeiro Lysias Rodrigues Airport", city: "Palmas", country: "BR" },
  PET: { name: "Pelotas Airport", city: "Pelotas", country: "BR" },
  PNZ: { name: "Senador Nilo Coelho Airport", city: "Petrolina", country: "BR" },
  PNB: { name: "Porto Nacional Airport", city: "Porto Nacional", country: "BR" },
  PMG: { name: "Ponta Pora Airport", city: "Ponta Pora", country: "BR" },
  BPS: { name: "Porto Seguro Airport", city: "Porto Seguro", country: "BR" },
  PVH: {
    name: "Governador Jorge Teixeira de Oliveira Airport",
    city: "Porto Velho",
    country: "BR"
  },
  RBR: { name: "Placido de Castro Airport", city: "Rio Branco", country: "BR" },
  REC: {
    name: "Guararapes - Gilberto Freyre International Airport",
    city: "Recife",
    country: "BR"
  },
  SDU: { name: "Santos Dumont Airport", city: "Rio De Janeiro", country: "BR" },
  RAO: { name: "Leite Lopes Airport", city: "Ribeirao Preto", country: "BR" },
  BRB: { name: "Barreirinhas Airport", city: "", country: "BR" },
  SNZ: { name: "Santa Cruz Airport", city: "Rio De Janeiro", country: "BR" },
  NAT: {
    name: "Greater Natal International Airport",
    city: "S\xE3o Gon\xE7alo do Amarante",
    country: "BR"
  },
  SJK: {
    name: "Professor Urbano Ernesto Stumpf Airport",
    city: "Sao Jose Dos Campos",
    country: "BR"
  },
  SLZ: {
    name: "Marechal Cunha Machado International Airport",
    city: "Sao Luis",
    country: "BR"
  },
  RIA: { name: "Santa Maria Airport", city: "Santa Maria", country: "BR" },
  STM: { name: "Maestro Wilson Fonseca Airport", city: "Santarem", country: "BR" },
  CGH: { name: "Congonhas Airport", city: "Sao Paulo", country: "BR" },
  SJP: {
    name: "Sao Jose do Rio Preto Airport",
    city: "Sao Jose Do Rio Preto",
    country: "BR"
  },
  SSZ: { name: "Base Aerea de Santos Airport", city: "Guaruja", country: "BR" },
  SSA: {
    name: "Deputado Luiz Eduardo Magalhaes International Airport",
    city: "Salvador",
    country: "BR"
  },
  QHP: { name: "Base de Aviacao de Taubate Airport", city: "Taubate", country: "BR" },
  TMT: { name: "Trombetas Airport", city: "Oriximina", country: "BR" },
  UNA: { name: "Hotel Transamerica Airport", city: "Una", country: "BR" },
  TOW: { name: "Toledo Airport", city: "Toledo", country: "BR" },
  THE: { name: "Senador Petronio Portela Airport", city: "Teresina", country: "BR" },
  TFF: { name: "Tefe Airport", city: "Tefe", country: "BR" },
  TJL: { name: "Plinio Alarcom Airport", city: "Tres Lagoas", country: "BR" },
  TRQ: { name: "Tarauaca Airport", city: "Tarauaca", country: "BR" },
  TEC: { name: "Telemaco Borba Airport", city: "Telemaco Borba", country: "BR" },
  TBT: { name: "Tabatinga Airport", city: "Tabatinga", country: "BR" },
  TUR: { name: "Tucurui Airport", city: "Tucurui", country: "BR" },
  SJL: {
    name: "Sao Gabriel da Cachoeira Airport",
    city: "Sao Gabriel Da Cachoeira",
    country: "BR"
  },
  PAV: { name: "Paulo Afonso Airport", city: "Paulo Afonso", country: "BR" },
  URG: { name: "Rubem Berta Airport", city: "Uruguaiana", country: "BR" },
  UDI: {
    name: "Ten. Cel. Aviador Cesar Bombonato Airport",
    city: "Uberlandia",
    country: "BR"
  },
  UBA: { name: "Mario de Almeida Franco Airport", city: "Uberaba", country: "BR" },
  VDC: {
    name: "Glauber de Andrade Rocha Airport",
    city: "Vit\xF3ria da Conquista",
    country: "BR"
  },
  VAG: { name: "Major Brigadeiro Trompowsky Airport", city: "Varginha", country: "BR" },
  BVH: { name: "Vilhena Airport", city: "Vilhena", country: "BR" },
  VIX: { name: "Eurico de Aguiar Salles Airport", city: "Vitoria", country: "BR" },
  QPS: { name: "Campo Fontenelle Airport", city: "Pirassununga", country: "BR" },
  IZA: { name: "Zona da Mata Regional Airport", city: "Juiz De Fora", country: "BR" },
  ZUD: { name: "Pupelde Airport", city: "Ancud", country: "CL" },
  LOB: { name: "San Rafael Airport", city: "Los Andes", country: "CL" },
  WAP: { name: "Alto Palena Airport", city: "Alto Palena", country: "CL" },
  ARI: { name: "Chacalluta Airport", city: "Arica", country: "CL" },
  WPA: { name: "Cabo 1\xB0 Juan Roman Airport", city: "Puerto Aysen", country: "CL" },
  CPO: { name: "Desierto de Atacama Airport", city: "Copiapo", country: "CL" },
  BBA: { name: "Balmaceda Airport", city: "Balmaceda", country: "CL" },
  TOQ: { name: "Barriles Airport", city: "Tocopilla", country: "CL" },
  DPB: { name: "Pampa Guanaco Airport", city: "Bahia Inutil", country: "CL" },
  CCH: { name: "Chile Chico Airport", city: "Chile Chico", country: "CL" },
  CJC: { name: "El Loa Airport", city: "Calama", country: "CL" },
  YAI: { name: "Gral. Bernardo O\xB4Higgins Airport", city: "Chillan", country: "CL" },
  PUQ: {
    name: "Pdte. Carlos Ibanez del Campo Airport",
    city: "Punta Arenas",
    country: "CL"
  },
  COW: { name: "Tambillos Airport", city: "Coquimbo", country: "CL" },
  GXQ: { name: "Teniente Vidal Airport", city: "Coyhaique", country: "CL" },
  IQQ: { name: "Diego Aracena Airport", city: "Iquique", country: "CL" },
  SCL: {
    name: "Comodoro Arturo Merino Benitez International Airport",
    city: "Santiago",
    country: "CL"
  },
  ESR: { name: "Ricardo Garcia Posada Airport", city: "El Salvador", country: "CL" },
  ANF: { name: "Cerro Moreno Airport", city: "Antofagasta", country: "CL" },
  WPR: {
    name: "Capitan Fuentes Martinez Airport Airport",
    city: "Porvenir",
    country: "CL"
  },
  FRT: { name: "Frutillar Airport", city: "Frutillar", country: "CL" },
  FFU: { name: "Futaleufu Airport", city: "Futaleufu", country: "CL" },
  UGL: { name: "Union Glacier Blue-Ice Runway", city: "Antartica", country: "AQ" },
  LSQ: { name: "Maria Dolores Airport", city: "Los Angeles", country: "CL" },
  WPU: { name: "Guardiamarina Zanartu Airport", city: "Puerto Williams", country: "CL" },
  LGR: { name: "Cochrane Airport", city: "Cochrane", country: "CL" },
  CCP: { name: "Carriel Sur Airport", city: "Concepcion", country: "CL" },
  IPC: { name: "Mataveri Airport", city: "Isla De Pascua", country: "CL" },
  ZOS: { name: "Canal Bajo Carlos - Hott Siebert Airport", city: "Osorno", country: "CL" },
  CPP: { name: "Coposa Airport", city: "Pica", country: "CL" },
  VLR: { name: "Vallenar Airport", city: "Vallenar", country: "CL" },
  ZLR: { name: "Municipal de Linares Airport", city: "Linares", country: "CL" },
  PNT: { name: "Tte. Julio Gallardo Airport", city: "Puerto Natales", country: "CL" },
  OVL: { name: "El Tuqui Airport", city: "Ovalle", country: "CL" },
  ZPC: { name: "Pucon Airport", city: "Pucon", country: "CL" },
  MHC: { name: "Mocopulli Airport", city: "Dalcahue", country: "CL" },
  PUX: { name: "El Mirador Airport", city: "Puerto Varas", country: "CL" },
  ZCO: { name: "La Araucan\xEDa Airport (Temuco)", city: "Freire", country: "CL" },
  CNR: { name: "Chanaral Airport", city: "Chanaral", country: "CL" },
  VAP: { name: "Rodelillo Airport", city: "Vina Del Mar", country: "CL" },
  QRC: { name: "De La Independencia Airport", city: "Rancagua", country: "CL" },
  TNM: {
    name: "Teniente Rodolfo Marsh Martin Base",
    city: "Isla Rey Jorge",
    country: "AQ"
  },
  SMB: { name: "Franco Bianco Airport", city: "Cerro Sombrero", country: "CL" },
  LSC: { name: "La Florida Airport", city: "La Serena-Coquimbo", country: "CL" },
  SSD: { name: "Victor Lafon Airport", city: "San Felipe", country: "CL" },
  WCA: { name: "Gamboa Airport", city: "Castro", country: "CL" },
  PMC: { name: "El Tepual Airport", city: "Puerto Montt", country: "CL" },
  TLX: { name: "Panguilemo Airport", city: "Talca", country: "CL" },
  WCH: { name: "Chaiten Airport", city: "Chaiten", country: "CL" },
  ZIC: { name: "Victoria Airport", city: "Victoria", country: "CL" },
  TTC: { name: "Las Breas Airport", city: "Taltal", country: "CL" },
  ZAL: { name: "Pichoy Airport", city: "Valdivia", country: "CL" },
  KNA: { name: "Vina del mar Airport", city: "Vina Del Mar", country: "CL" },
  CPQ: { name: "Amarais Airport", city: "Campinas", country: "BR" },
  QCJ: { name: "Botucatu Airport", city: "Botucatu", country: "BR" },
  OLC: {
    name: "Senadora Eunice Micheles Airport",
    city: "Sao Paulo De Olivenca",
    country: "BR"
  },
  SOD: { name: "Sorocaba Airport", city: "Sorocaba", country: "BR" },
  QDC: { name: "Dracena Airport", city: "Dracena", country: "BR" },
  JLS: { name: "Jales Airport", city: "Jales", country: "BR" },
  QOA: { name: "Mococa Airport", city: "Mococa", country: "BR" },
  PBA: { name: "Fazenda Pontal Airport", city: "Cairu", country: "BR" },
  QGC: { name: "Lencois Paulista Airport", city: "Lencois Paulista", country: "BR" },
  QNV: { name: "Aeroclube Airport", city: "Nova Iguacu", country: "BR" },
  OUS: { name: "Ourinhos Airport", city: "Ourinhos", country: "BR" },
  OIA: { name: "Ourilandia do Norte Airport", city: "Ourilandia Do Norte", country: "BR" },
  QHB: { name: "Piracicaba Airport", city: "Piracicaba", country: "BR" },
  QIQ: { name: "Rio Claro Airport", city: "Rio Claro", country: "BR" },
  QVP: { name: "Avare-Arandu Airport", city: "Avare", country: "BR" },
  QRZ: { name: "Resende Airport", city: "Resende", country: "BR" },
  QSC: { name: "Sao Carlos Airport", city: "Sao Carlos", country: "BR" },
  UBT: { name: "Ubatuba Airport", city: "Ubatuba", country: "BR" },
  ITP: { name: "Itaperuna Airport", city: "Itaperuna", country: "BR" },
  QGS: { name: "Alagoinhas Airport", city: "Alagoinhas", country: "BR" },
  VOT: { name: "Votuporanga Airport", city: "Votuporanga", country: "BR" },
  ALT: { name: "Alenquer Airport", city: "Alenquer", country: "BR" },
  QGB: { name: "Limeira Airport", city: "Limeira", country: "BR" },
  ATF: { name: "Chachoan Airport", city: "Ambato", country: "EC" },
  OCC: { name: "Francisco De Orellana Airport", city: "Coca", country: "EC" },
  CUE: { name: "Mariscal Lamar Airport", city: "Cuenca", country: "EC" },
  GPS: { name: "Seymour Airport", city: "Baltra", country: "EC" },
  GYE: { name: "Simon Bolivar International Airport", city: "Guayaquil", country: "EC" },
  IBB: { name: "General Villamil Airport", city: "Isabela", country: "EC" },
  JIP: { name: "Jipijapa Airport", city: "Jipijapa", country: "EC" },
  LTX: { name: "Cotopaxi International Airport", city: "Latacunga", country: "EC" },
  MRR: { name: "Jose Maria Velasco Ibarra Airport", city: "Macara", country: "EC" },
  XMS: { name: "Coronel E Carvajal Airport", city: "Macas", country: "EC" },
  MCH: { name: "General Manuel Serrano Airport", city: "Machala", country: "EC" },
  MEC: { name: "Eloy Alfaro International Airport", city: "Manta", country: "EC" },
  LGQ: { name: "Nueva Loja Airport", city: "Lago Agrio", country: "EC" },
  PYO: { name: "Putumayo Airport", city: "Puerto Putumayo", country: "EC" },
  PVO: { name: "Reales Tamarindos Airport", city: "Portoviejo", country: "EC" },
  UIO: {
    name: "Nuevo Aeropuerto Internacional Mariscal Sucre",
    city: "Quito",
    country: "EC"
  },
  ETR: {
    name: "Coronel Artilleria Victor Larrea Airport",
    city: "Santa Rosa",
    country: "EC"
  },
  SNC: { name: "General Ulpiano Paez Airport", city: "Salinas", country: "EC" },
  SUQ: { name: "Sucua Airport", city: "Sucua", country: "EC" },
  PTZ: { name: "Rio Amazonas Airport", city: "Shell Mera", country: "EC" },
  SCY: { name: "San Cristobal Airport", city: "San Cristobal", country: "EC" },
  BHA: { name: "Los Perales Airport", city: "Bahia de Caraquez", country: "EC" },
  TSC: { name: "Taisha Airport", city: "Taisha", country: "EC" },
  TPN: { name: "Tiputini Airport", city: "Tiputini", country: "EC" },
  LOH: { name: "Camilo Ponce Enriquez Airport", city: "La Toma (Catamayo)", country: "EC" },
  ESM: { name: "General Rivadeneira Airport", city: "Tachina", country: "EC" },
  TPC: { name: "Tarapoa Airport", city: "Tarapoa", country: "EC" },
  TUA: { name: "Teniente Coronel Luis a Mantilla Airport", city: "Tulcan", country: "EC" },
  PSY: { name: "Stanley Airport", city: "Stanley", country: "FK" },
  ASU: { name: "Silvio Pettirossi International Airport", city: "Asuncion", country: "PY" },
  AYO: { name: "Juan De Ayolas Airport", city: "Ayolas", country: "PY" },
  BFA: { name: "Bahia Negra Airport", city: "Bahia Negra", country: "PY" },
  CIO: { name: "Teniente Col Carmelo Peralta Airport", city: "Concepcion", country: "PY" },
  ENO: { name: "Encarnacion Airport", city: "Encarnacion", country: "PY" },
  AGT: { name: "Guarani International Airport", city: "Ciudad del Este", country: "PY" },
  FLM: { name: "Filadelfia Airport", city: "Filadelfia", country: "PY" },
  ESG: {
    name: "Dr. Luis Maria Argana International Airport",
    city: "Mariscal Estigarribia",
    country: "PY"
  },
  OLK: { name: "Fuerte Olimpo Airport", city: "Fuerte Olimpo", country: "PY" },
  PIL: { name: "Carlos Miguel Gimenez Airport", city: "Pilar", country: "PY" },
  PJC: {
    name: "Dr Augusto Roberto Fuster International Airport",
    city: "Pedro Juan Caballero",
    country: "PY"
  },
  LVR: { name: "Municipal Bom Futuro Airport", city: "Lucas do Rio Verde", country: "BR" },
  FRC: { name: "Franca Airport", city: "Franca", country: "BR" },
  JUA: { name: "Juara Sul Airport", city: "Juara", country: "BR" },
  CFO: { name: "Confresa Airport", city: "Confresa", country: "BR" },
  NPR: { name: "Novo Progresso Airport", city: "Novo Progresso", country: "BR" },
  RIG: { name: "Rio Grande Airport", city: "Rio Grande", country: "BR" },
  ACR: { name: "Araracuara Airport", city: "Araracuara", country: "CO" },
  ACD: { name: "Alcides Fernandez Airport", city: "Acandi", country: "CO" },
  HAY: { name: "Aguachica Airport", city: "Aguachica", country: "CO" },
  AFI: { name: "Amalfi Airport", city: "Amalfi", country: "CO" },
  API: { name: "Gomez Nino Apiay Air Base", city: "Apiay", country: "CO" },
  AXM: { name: "El Eden Airport", city: "Armenia", country: "CO" },
  PUU: { name: "Tres De Mayo Airport", city: "Puerto Asis", country: "CO" },
  ELB: { name: "Las Flores Airport", city: "El Banco", country: "CO" },
  BGA: { name: "Palonegro Airport", city: "Bucaramanga", country: "CO" },
  BOG: { name: "El Dorado International Airport", city: "Bogota", country: "CO" },
  BAQ: {
    name: "Ernesto Cortissoz International Airport",
    city: "Barranquilla",
    country: "CO"
  },
  BSC: { name: "Jose Celestino Mutis Airport", city: "Bahia Solano", country: "CO" },
  BUN: { name: "Gerardo Tobar Lopez Airport", city: "Buenaventura", country: "CO" },
  CPB: { name: "Capurgana Airport", city: "Capurgana", country: "CO" },
  CUC: { name: "Camilo Daza International Airport", city: "Cucuta", country: "CO" },
  COG: { name: "Mandinga Airport", city: "Condoto", country: "CO" },
  CTG: { name: "Rafael Nunez International Airport", city: "Cartagena", country: "CO" },
  CCO: { name: "Carimagua Airport", city: "Puerto Lopez", country: "CO" },
  CLO: {
    name: "Alfonso Bonilla Aragon International Airport",
    city: "Cali",
    country: "CO"
  },
  CIM: { name: "Cimitarra Airport", city: "Cimitarra", country: "CO" },
  RAV: { name: "Cravo Norte Airport", city: "Cravo Norte", country: "CO" },
  TCO: { name: "La Florida Airport", city: "Tumaco", country: "CO" },
  BHF: { name: "Cupica Airport", city: "Bahia Solano", country: "CO" },
  CUO: { name: "Caruru Airport", city: "Caruru", country: "CO" },
  CAQ: { name: "Juan H White Airport", city: "Caucasia", country: "CO" },
  CVE: { name: "Covenas Airport", city: "Covenas", country: "CO" },
  CZU: { name: "Las Brujas Airport", city: "Corozal", country: "CO" },
  EBG: { name: "El Bagre Airport", city: "El Bagre", country: "CO" },
  EJA: { name: "Yariguies Airport", city: "Barrancabermeja", country: "CO" },
  FLA: { name: "Gustavo Artunduaga Paredes Airport", city: "Florencia", country: "CO" },
  FDA: { name: "Fundacion Airport", city: "Fundacion", country: "CO" },
  LGT: { name: "La Gaviota Airport", city: "", country: "CO" },
  GIR: { name: "Santiago Vila Airport", city: "Girardot", country: "CO" },
  CRC: { name: "Santa Ana Airport", city: "Cartago", country: "CO" },
  GPI: { name: "Juan Casiano Airport", city: "Guapi", country: "CO" },
  GLJ: { name: "Garzon La Jagua Airport", city: "Garzon", country: "CO" },
  CPL: { name: "Chaparral Airport", city: "Chaparral", country: "CO" },
  HTZ: { name: "Hato Corozal Airport", city: "Hato Corozal", country: "CO" },
  IBE: { name: "Perales Airport", city: "Ibague", country: "CO" },
  IGO: { name: "Chigorodo Airport", city: "Chigorodo", country: "CO" },
  IPI: { name: "San Luis Airport", city: "Ipiales", country: "CO" },
  APO: { name: "Antonio Roldan Betancourt Airport", city: "Carepa", country: "CO" },
  LQM: { name: "Caucaya Airport", city: "Puerto Leguizamo", country: "CO" },
  MCJ: { name: "Jorge Isaac Airport", city: "La Mina-Maicao", country: "CO" },
  LPD: { name: "La Pedrera Airport", city: "La Pedrera", country: "CO" },
  LET: {
    name: "Alfredo Vasquez Cobo International Airport",
    city: "Leticia",
    country: "CO"
  },
  EOH: { name: "Enrique Olaya Herrera Airport", city: "Medellin", country: "CO" },
  MFS: { name: "Miraflores Airport", city: "Miraflores", country: "CO" },
  MGN: { name: "Baracoa Airport", city: "Magangue", country: "CO" },
  MTB: { name: "Montelibano Airport", city: "Montelibano", country: "CO" },
  MMP: { name: "San Bernardo Airport", city: "Mompos", country: "CO" },
  MTR: { name: "Los Garzones Airport", city: "Monteria", country: "CO" },
  MVP: { name: "Fabio Alberto Leon Bentley Airport", city: "Mitu", country: "CO" },
  MZL: { name: "La Nubia Airport", city: "Manizales", country: "CO" },
  NCI: { name: "Necocli Airport", city: "Necocli", country: "CO" },
  NQU: { name: "Reyes Murillo Airport", city: "Nuqui", country: "CO" },
  NVA: { name: "Benito Salas Airport", city: "Neiva", country: "CO" },
  OCV: { name: "Aguas Claras Airport", city: "Ocana", country: "CO" },
  ORC: { name: "Orocue Airport", city: "Orocue", country: "CO" },
  OTU: { name: "Otu Airport", city: "El Rhin", country: "CO" },
  RON: { name: "Juan Jose Rondon Airport", city: "Paipa", country: "CO" },
  PCR: { name: "German Olano Airport", city: "Puerto Carreno", country: "CO" },
  PDA: { name: "Obando Airport", city: "Puerto Inirida", country: "CO" },
  PEI: { name: "Matecana International Airport", city: "Pereira", country: "CO" },
  PTX: { name: "Pitalito Airport", city: "Pitalito", country: "CO" },
  PLT: { name: "Plato Airport", city: "Plato", country: "CO" },
  NAR: { name: "Puerto Nare Airport", city: "Armenia", country: "CO" },
  PPN: { name: "Guillermo Leon Valencia Airport", city: "Popayan", country: "CO" },
  PQE: { name: "German Olano Air Base", city: "La Dorada", country: "CO" },
  PBE: { name: "Puerto Berrio Airport", city: "Puerto Berrio", country: "CO" },
  PSO: { name: "Antonio Narino Airport", city: "Pasto", country: "CO" },
  PVA: { name: "El Embrujo Airport", city: "Providencia", country: "CO" },
  PZA: { name: "Paz De Ariporo Airport", city: "Paz De Ariporo", country: "CO" },
  MQU: { name: "Jose Celestino Mutis Airport", city: "Mariquita", country: "CO" },
  MDE: {
    name: "Jose Maria Cordova International Airport",
    city: "Rionegro",
    country: "CO"
  },
  RCH: { name: "Almirante Padilla Airport", city: "Riohacha", country: "CO" },
  RVE: { name: "Los Colonizadores Airport", city: "Saravena", country: "CO" },
  LPZ: { name: "San Gil Airport", city: "San Gil", country: "CO" },
  SJE: {
    name: "Jorge E. Gonzalez Torres Airport",
    city: "San Jose Del Guaviare",
    country: "CO"
  },
  SMR: { name: "Simon Bolivar International Airport", city: "Santa Marta", country: "CO" },
  SOX: { name: "Alberto Lleras Camargo Airport", city: "Sogamoso", country: "CO" },
  ADZ: {
    name: "Gustavo Rojas Pinilla International Airport",
    city: "San Andres",
    country: "CO"
  },
  SVI: {
    name: "Eduardo Falla Solano Airport",
    city: "San Vicente Del Caguan",
    country: "CO"
  },
  TAU: { name: "Tauramena Airport", city: "Tauramena", country: "CO" },
  TIB: { name: "Tibu Airport", city: "Tibu", country: "CO" },
  TDA: { name: "Trinidad Airport", city: "Trinidad", country: "CO" },
  TLU: { name: "Tolu Airport", city: "Tolu", country: "CO" },
  TME: { name: "Gustavo Vargas Airport", city: "Tame", country: "CO" },
  TQS: { name: "Tres Esquinas Air Base", city: "Tres Esquinas", country: "CO" },
  TRB: { name: "Gonzalo Mejia Airport", city: "Turbo", country: "CO" },
  AUC: { name: "Santiago Perez Airport", city: "Arauca", country: "CO" },
  UIB: { name: "El Carano Airport", city: "Quibdo", country: "CO" },
  ULQ: { name: "Farfan Airport", city: "Tulua", country: "CO" },
  URR: { name: "Urrao Airport", city: "Urrao", country: "CO" },
  VGZ: { name: "Villagarzon Airport", city: "Villagarzon", country: "CO" },
  PYA: { name: "Velasquez Airport", city: "Velasquez", country: "CO" },
  VUP: { name: "Alfonso Lopez Pumarejo Airport", city: "Valledupar", country: "CO" },
  VVC: { name: "Vanguardia Airport", city: "Villavicencio", country: "CO" },
  AYG: { name: "Yaguara Airport", city: "San Vicente Del Caguan", country: "CO" },
  EYP: { name: "El Yopal Airport", city: "El Yopal", country: "CO" },
  MHW: { name: "Monteagudo Airport", city: "El Banado", country: "BO" },
  SRE: {
    name: "Alcantar\xED International Airport",
    city: "Yampar\xE1ez (Sucre)",
    country: "BO"
  },
  APB: { name: "Apolo Airport", city: "Apolo", country: "BO" },
  ASC: {
    name: "Ascencion De Guarayos Airport",
    city: "Ascension de Guarayos",
    country: "BO"
  },
  BVL: { name: "Baures Airport", city: "Baures", country: "BO" },
  BJO: { name: "Bermejo Airport", city: "Bermejo", country: "BO" },
  CAM: { name: "Camiri Airport", city: "Camiri", country: "BO" },
  CBB: {
    name: "Jorge Wilsterman International Airport",
    city: "Cochabamba",
    country: "BO"
  },
  CIJ: { name: "Capitan Anibal Arab Airport", city: "Cobija", country: "BO" },
  CEP: { name: "Concepcion Airport", city: "Concepcion", country: "BO" },
  SRZ: { name: "El Trompillo Airport", city: "Santa Cruz", country: "BO" },
  GYA: {
    name: "Capitan de Av. Emilio Beltran Airport",
    city: "Guayaramerin",
    country: "BO"
  },
  BVK: { name: "Huacaraje Airport", city: "Itenes", country: "BO" },
  SJS: {
    name: "San Jose De Chiquitos Airport",
    city: "San Jose de Chiquitos",
    country: "BO"
  },
  SJB: { name: "San Joaquin Airport", city: "San Joaquin", country: "BO" },
  SJV: { name: "San Javier Airport", city: "San Javier", country: "BO" },
  LPB: { name: "El Alto International Airport", city: "La Paz / El Alto", country: "BO" },
  MGD: { name: "Magdalena Airport", city: "Magdalena", country: "BO" },
  ORU: { name: "Juan Mendoza Airport", city: "Oruro", country: "BO" },
  POI: { name: "Capitan Nicolas Rojas Airport", city: "Potosi", country: "BO" },
  PUR: { name: "Puerto Rico Airport", city: "Puerto Rico/Manuripi", country: "BO" },
  PSZ: {
    name: "Capitan Av. Salvador Ogaya G. airport",
    city: "Puerto Suarez",
    country: "BO"
  },
  SRD: { name: "San Ramon Airport", city: "San Ramon / Mamore", country: "BO" },
  RBO: { name: "Robore Airport", city: "Robore", country: "BO" },
  RIB: { name: "Capitan Av. Selin Zeitun Lopez Airport", city: "Riberalta", country: "BO" },
  RBQ: { name: "Rurenabaque Airport", city: "Rurenabaque", country: "BO" },
  REY: { name: "Reyes Airport", city: "Reyes", country: "BO" },
  SBL: {
    name: "Santa Ana Del Yacuma Airport",
    city: "Santa Ana del Yacuma",
    country: "BO"
  },
  SRJ: { name: "Capitan Av. German Quiroga G. Airport", city: "San Borja", country: "BO" },
  SNG: {
    name: "Capitan Av. Juan Cochamanidis S. Airport",
    city: "San Ignacio de Velasco",
    country: "BO"
  },
  SNM: {
    name: "San Ignacio de Moxos Airport",
    city: "San Ignacio de Moxos",
    country: "BO"
  },
  SRB: { name: "Santa Rosa De Yacuma Airport", city: "Santa Rosa", country: "BO" },
  MQK: { name: "San Matias Airport", city: "San Matias", country: "BO" },
  TJA: { name: "Capitan Oriel Lea Plaza Airport", city: "Tarija", country: "BO" },
  TDD: {
    name: "Teniente Av. Jorge Henrich Arauz Airport",
    city: "Trinidad",
    country: "BO"
  },
  UYU: { name: "Uyuni Airport", city: "Quijarro", country: "BO" },
  VAH: {
    name: "Capitan Av. Vidal Villagomez Toledo Airport",
    city: "Vallegrande",
    country: "BO"
  },
  VLM: {
    name: "Teniente Coronel Rafael Pabon Airport",
    city: "Villamontes",
    country: "BO"
  },
  VVI: { name: "Viru Viru International Airport", city: "Santa Cruz", country: "BO" },
  BYC: { name: "Yacuiba Airport", city: "Yacuiba", country: "BO" },
  BTO: { name: "Botopasi Airport", city: "Botopasi", country: "SR" },
  AAJ: { name: "Cayana Airstrip", city: "Awaradam", country: "SR" },
  TOT: { name: "Totness Airport", city: "Totness", country: "SR" },
  DRJ: { name: "Drietabbetje Airport", city: "Drietabbetje", country: "SR" },
  DOE: { name: "Djumu-Djomoe Airport", city: "Djumu-Djomoe", country: "SR" },
  LDO: { name: "Ladouanie Airport", city: "Aurora", country: "SR" },
  EAX: {
    name: "Eduard Alexander Gummels International Airport",
    city: "Paramaribo",
    country: "SR"
  },
  PBM: { name: "Johan Adolf Pengel International Airport", city: "Zandery", country: "SR" },
  MOJ: { name: "Moengo Airstrip", city: "Moengo", country: "SR" },
  ICK: { name: "Nieuw Nickerie Airport", city: "Nieuw Nickerie", country: "SR" },
  OEM: { name: "Vincent Fayks Airport", city: "Paloemeu", country: "SR" },
  SMZ: { name: "Stoelmanseiland Airport", city: "Stoelmanseiland", country: "SR" },
  KCB: { name: "Tepoe Airstrip", city: "Kasikasima", country: "SR" },
  AGI: { name: "Wageningen Airport Airport", city: "Wageningen Airport", country: "SR" },
  WSO: { name: "Washabo Airport", city: "Washabo", country: "SR" },
  ORG: { name: "Zorg en Hoop Airport", city: "Paramaribo", country: "SR" },
  JAW: { name: "Araripina Airport", city: "Araripina", country: "BR" },
  APY: { name: "Alto Parnaiba Airport", city: "Alto Parnaiba", country: "BR" },
  APQ: { name: "Arapiraca Airport", city: "Arapiraca", country: "BR" },
  AMJ: { name: "Cirilo Queiroz Airport", city: "Almenara", country: "BR" },
  BDC: { name: "Barra do Corda Airport", city: "Barra Do Corda", country: "BR" },
  BVM: { name: "Belmonte Airport", city: "Belmonte", country: "BR" },
  BRA: { name: "Barreiras Airport", city: "Barreiras", country: "BR" },
  BSS: { name: "Balsas Airport", city: "Balsas", country: "BR" },
  BMS: { name: "Socrates Mariani Bittencourt Airport", city: "Brumado", country: "BR" },
  BQQ: { name: "Barra Airport", city: "Barra", country: "BR" },
  MXQ: { name: "Lorenzo Airport", city: "Cairu", country: "BR" },
  CTP: { name: "Carutapera Airport", city: "Carutapera", country: "BR" },
  CPU: { name: "Cururupu Airport", city: "Cururupu", country: "BR" },
  QCH: { name: "Colatina Airport", city: "Colatina", country: "BR" },
  RDC: { name: "Redencao Airport", city: "Redencao", country: "BR" },
  LEP: { name: "Leopoldina Airport", city: "Leopoldina", country: "BR" },
  DTI: { name: "Diamantina Airport", city: "Diamantina", country: "BR" },
  DIQ: { name: "Divinopolis Airport", city: "Divinopolis", country: "BR" },
  CNV: { name: "Canavieiras Airport", city: "Canavieiras", country: "BR" },
  SXX: { name: "Sao Felix do Xingu Airport", city: "Sao Felix Do Xingu", country: "BR" },
  GUZ: { name: "Guarapari Airport", city: "Guarapari", country: "BR" },
  GDP: { name: "Guadalupe Airport", city: "Guadalupe", country: "BR" },
  GNM: { name: "Guanambi Airport", city: "Guanambi", country: "BR" },
  GMS: { name: "Fazenda Canada Airport", city: "Uberlandia", country: "BR" },
  QGP: { name: "Garanhuns Airport", city: "Garanhuns", country: "BR" },
  IRE: { name: "Irece Airport", city: "Irece", country: "BR" },
  QIG: { name: "Iguatu Airport", city: "Iguatu", country: "BR" },
  QIT: { name: "Itapetinga Airport", city: "Itapetinga", country: "BR" },
  IPU: { name: "Ipiau Airport", city: "Ipiau", country: "BR" },
  JCM: { name: "Jacobina Airport", city: "Jacobina", country: "BR" },
  FEC: { name: "Joao Durval Carneiro Airport", city: "Feira De Santana", country: "BR" },
  JEQ: { name: "Jequie Airport", city: "Jequie", country: "BR" },
  JNA: { name: "Januaria Airport", city: "Januaria", country: "BR" },
  JDR: {
    name: "Prefeito Octavio de Almeida Neves Airport",
    city: "Sao Joao Del Rei",
    country: "BR"
  },
  CMP: { name: "Santana do Araguaia Airport", city: "Santana Do Araguaia", country: "BR" },
  QDF: {
    name: "Conselheiro Lafaiete Airport",
    city: "Conselheiro Lafaiete",
    country: "BR"
  },
  CDI: {
    name: "Cachoeiro do Itapemirim Airport",
    city: "Cachoeiro Do Itapemirim",
    country: "BR"
  },
  QCP: { name: "Currais Novos Airport", city: "Currais Novos", country: "BR" },
  SSO: { name: "Sao Lourenco Airport", city: "Sao Lourenco", country: "BR" },
  MTE: { name: "Monte Alegre Airport", city: "Monte Alegre", country: "BR" },
  MVS: { name: "Mucuri Airport", city: "Mucuri", country: "BR" },
  SBJ: { name: "Sao Mateus Airport", city: "Sao Mateus", country: "BR" },
  PTQ: { name: "Porto de Moz Airport", city: "Porto De Moz", country: "BR" },
  NNU: { name: "Nanuque Airport", city: "Nanuque", country: "BR" },
  QBX: { name: "Sobral Airport", city: "Sobral", country: "BR" },
  PSW: { name: "Municipal Jose Figueiredo Airport", city: "Passos", country: "BR" },
  FEJ: { name: "Feij\xF3 Airport", city: "Feij\xF3", country: "BR" },
  ORX: { name: "Oriximina Airport", city: "Oriximina", country: "BR" },
  PCS: { name: "Picos Airport", city: "Picos", country: "BR" },
  POJ: { name: "Patos de Minas Airport", city: "Patos De Minas", country: "BR" },
  PIV: { name: "Pirapora Airport", city: "Pirapora", country: "BR" },
  FLB: { name: "Cangapara Airport", city: "Floriano", country: "BR" },
  PDF: { name: "Prado Airport", city: "Prado", country: "BR" },
  CAU: { name: "Caruaru Airport", city: "Caruaru", country: "BR" },
  OPP: { name: "Salinopolis Airport", city: "Salinopolis", country: "BR" },
  SFK: { name: "Soure Airport", city: "Soure", country: "BR" },
  TXF: { name: "Teixeira de Freitas Airport", city: "Teixeira De Freitas", country: "BR" },
  OBI: { name: "Obidos Airport", city: "Obidos", country: "BR" },
  TFL: { name: "Juscelino Kubitscheck Airport", city: "Teofilo Otoni", country: "BR" },
  VAL: { name: "Valenca Airport", city: "Valenca", country: "BR" },
  QID: { name: "Melio Viana Airport", city: "Tres Coracoes", country: "BR" },
  BVS: { name: "Breves Airport", city: "Breves", country: "BR" },
  CMC: { name: "Camocim Airport", city: "Camocim", country: "BR" },
  QXC: { name: "Fazenda Sao Braz Airport", city: "Barra De Santo Antonio", country: "BR" },
  GGF: { name: "Almeirim Airport", city: "Almeirim", country: "BR" },
  PHI: { name: "Pinheiro Airport", city: "Pinheiro", country: "BR" },
  ITI: { name: "Agropecuaria Castanhais Airport", city: "Cumaru Do Norte", country: "BR" },
  PPY: { name: "Pouso Alegre Airport", city: "Pouso Alegre", country: "BR" },
  ITE: { name: "Itubera Airport", city: "Itubera", country: "BR" },
  CAY: { name: "Cayenne-Rochambeau Airport", city: "Cayenne / Rochambeau", country: "GF" },
  GSI: { name: "Grand-Santi Airport", city: "Grand-Santi", country: "GF" },
  MPY: { name: "Maripasoula Airport", city: "Maripasoula", country: "GF" },
  OXP: {
    name: "Saint-Georges-de-l'Oyapock Airport",
    city: "Saint-Georges-de-l'Oyapock Airport",
    country: "GF"
  },
  LDX: {
    name: "Saint-Laurent-du-Maroni Airport",
    city: "Saint-Laurent-du-Maroni",
    country: "GF"
  },
  REI: { name: "Regina Airport", city: "Regina", country: "GF" },
  XAU: { name: "Saul Airport", city: "Saul", country: "GF" },
  APE: { name: "San Juan Aposento Airport", city: "San Juan Aposento", country: "PE" },
  ALD: { name: "Alerta Airport", city: "Fortaleza", country: "PE" },
  AOP: {
    name: "Alferez FAP Alfredo Vladimir Sara Bauer Airport",
    city: "Andoas",
    country: "PE"
  },
  AYX: {
    name: "Teniente General Gerardo Perez Pinedo Airport",
    city: "Atalaya",
    country: "PE"
  },
  MBP: { name: "Moyobamba Airport", city: "Moyobamba", country: "PE" },
  BLP: { name: "Huallaga Airport", city: "Bellavista", country: "PE" },
  IBP: { name: "Iberia Airport", city: "Iberia", country: "PE" },
  PCL: {
    name: "Cap FAP David Abenzur Rengifo International Airport",
    city: "Pucallpa",
    country: "PE"
  },
  TDP: { name: "Trompeteros Airport", city: "Corrientes", country: "PE" },
  CHM: {
    name: "Teniente FAP Jaime A De Montreuil Morales Airport",
    city: "Chimbote",
    country: "PE"
  },
  CGL: { name: "Chagual Airport", city: "Chagual", country: "PE" },
  TGI: { name: "Tingo Maria Airport", city: "Tingo Maria", country: "PE" },
  CIX: {
    name: "Capitan FAP Jose A Quinones Gonzales International Airport",
    city: "Chiclayo",
    country: "PE"
  },
  AYP: {
    name: "Coronel FAP Alfredo Mendivil Duarte Airport",
    city: "Ayacucho",
    country: "PE"
  },
  ANS: { name: "Andahuaylas Airport", city: "Andahuaylas", country: "PE" },
  ATA: {
    name: "Comandante FAP German Arias Graziani Airport",
    city: "Anta",
    country: "PE"
  },
  UMI: { name: "Quince Air Base", city: "Quince Mil", country: "PE" },
  PYZ: { name: "Pias Airport", city: "Pataz", country: "PE" },
  UCZ: { name: "Uchiza Airport", city: "Uchiza", country: "PE" },
  RIJ: { name: "Juan Simons Vela Airport", city: "Rioja", country: "PE" },
  LIM: { name: "Jorge Chavez International Airport", city: "Lima", country: "PE" },
  JAE: { name: "Shumba Airport", city: "Jaen", country: "PE" },
  JJI: { name: "Juanjui Airport", city: "Juanjui", country: "PE" },
  JAU: { name: "Francisco Carle Airport", city: "Jauja", country: "PE" },
  JUL: { name: "Inca Manco Capac International Airport", city: "Juliaca", country: "PE" },
  SJA: { name: "San Juan de Marcona Airport", city: "San Juan de Marcona", country: "PE" },
  CJA: {
    name: "Mayor General FAP Armando Revoredo Iglesias Airport",
    city: "Cajamarca",
    country: "PE"
  },
  RIM: { name: "San Nicolas Airport", city: "Rodriguez de Mendoza", country: "PE" },
  ILQ: { name: "Ilo Airport", city: "Ilo", country: "PE" },
  TBP: { name: "Capitan FAP Pedro Canga Rodriguez Airport", city: "Tumbes", country: "PE" },
  MZA: { name: "Manuel Prado Ugarteche Airport", city: "Mazamari", country: "PE" },
  SMG: { name: "Santa Maria Airport", city: "Santa Maria", country: "PE" },
  YMS: { name: "Moises Benzaquen Rengifo Airport", city: "Yurimaguas", country: "PE" },
  HUU: {
    name: "Alferez Fap David Figueroa Fernandini Airport",
    city: "Huanuco",
    country: "PE"
  },
  PNM: { name: "Nuevo Mundo Airport", city: "Nuevo Mundo", country: "PE" },
  SQU: { name: "Saposoa Airport", city: "Plaza Saposoa", country: "PE" },
  CHH: { name: "Chachapoyas Airport", city: "Chachapoyas", country: "PE" },
  REQ: { name: "Requena Airport", city: "Requena", country: "PE" },
  IQT: {
    name: "Coronel FAP Francisco Secada Vignetta International Airport",
    city: "Iquitos",
    country: "PE"
  },
  AQP: { name: "Rodriguez Ballon International Airport", city: "Arequipa", country: "PE" },
  TRU: {
    name: "Capitan FAP Carlos Martinez De Pinillos International Airport",
    city: "Trujillo",
    country: "PE"
  },
  PIO: {
    name: "Capitan FAP Renan Elias Olivera International Airport",
    city: "Pisco",
    country: "PE"
  },
  TPP: {
    name: "Cadete FAP Guillermo Del Castillo Paredes Airport",
    city: "Tarapoto",
    country: "PE"
  },
  SYC: { name: "Shiringayoc Airport", city: "Shiringayoc", country: "PE" },
  TCQ: {
    name: "Coronel FAP Carlos Ciriani Santa Rosa International Airport",
    city: "Tacna",
    country: "PE"
  },
  PEM: {
    name: "Padre Aldamiz International Airport",
    city: "Puerto Maldonado",
    country: "PE"
  },
  PIU: {
    name: "Capitan FAP Guillermo Concha Iberico International Airport",
    city: "Piura",
    country: "PE"
  },
  TYL: { name: "Capitan Montes Airport", city: "", country: "PE" },
  NZC: { name: "Maria Reiche Neuman Airport", city: "", country: "PE" },
  CUZ: {
    name: "Alejandro Velasco Astete International Airport",
    city: "Cusco",
    country: "PE"
  },
  APU: { name: "Apucarana Airport", city: "Apucarana", country: "BR" },
  BGV: {
    name: "Aeroclube de Bento Goncalves Airport",
    city: "Bento Goncalves",
    country: "BR"
  },
  BNU: { name: "Blumenau Airport", city: "Blumenau", country: "BR" },
  CCI: { name: "Concordia Airport", city: "Concordia", country: "BR" },
  CSS: { name: "Cassilandia Airport", city: "Cassilandia", country: "BR" },
  CEL: { name: "Canela Airport", city: "Canela", country: "BR" },
  CKO: { name: "Cornelio Procopio Airport", city: "Cornelio Procopio", country: "BR" },
  GGH: { name: "Cianorte Airport", city: "Cianorte", country: "BR" },
  DOU: { name: "Dourados Airport", city: "Dourados", country: "BR" },
  ERM: { name: "Erechim Airport", city: "Erechim", country: "BR" },
  FBE: { name: "Francisco Beltrao Airport", city: "Francisco Beltrao", country: "BR" },
  QGA: { name: "Guaira Airport", city: "Guaira", country: "BR" },
  HRZ: { name: "Horizontina Airport", city: "Horizontina", country: "BR" },
  IJU: { name: "Ijui Airport", city: "Ijui", country: "BR" },
  ITQ: { name: "Itaqui Airport", city: "Itaqui", country: "BR" },
  JCB: { name: "Santa Terezinha Airport", city: "Joacaba", country: "BR" },
  CBW: { name: "Campo Mourao Airport", city: "Campo Mourao", country: "BR" },
  QDB: { name: "Cachoeira do Sul Airport", city: "Cachoeira Do Sul", country: "BR" },
  QCR: { name: "Curitibanos Airport", city: "Curitibanos", country: "BR" },
  OAL: { name: "Cacoal Airport", city: "Cacoal", country: "BR" },
  LOI: { name: "Helmuth Baungarten Airport", city: "Lontras", country: "BR" },
  ALQ: { name: "Alegrete Novo Airport", city: "Alegrete", country: "BR" },
  QMF: { name: "Mafra Airport", city: "Mafra", country: "BR" },
  QGF: { name: "Montenegro Airport", city: "Montenegro", country: "BR" },
  QHV: { name: "Novo Hamburgo Airport", city: "Novo Hamburgo", country: "BR" },
  SQX: { name: "Sao Miguel do Oeste Airport", city: "Sao Miguel Do Oeste", country: "BR" },
  APX: { name: "Arapongas Airport", city: "Arapongas", country: "BR" },
  AIR: { name: "Aripuan\xE3 Airport", city: "Aripuan\xE3", country: "BR" },
  PTO: { name: "Pato Branco Airport", city: "Pato Branco", country: "BR" },
  PNG: { name: "Paranagua Airport", city: "Paranagua", country: "BR" },
  PVI: { name: "Paranavai Airport", city: "Paranavai", country: "BR" },
  PBB: { name: "Paranaiba Airport", city: "Paranaiba", country: "BR" },
  QAC: { name: "Castro Airport", city: "Castro", country: "BR" },
  SQY: { name: "Sao Lourenco do Sul Airport", city: "Sao Lourenco Do Sul", country: "BR" },
  QOJ: { name: "Sao Borja Airport", city: "Sao Borja", country: "BR" },
  CSU: { name: "Santa Cruz do Sul Airport", city: "Santa Cruz Do Sul", country: "BR" },
  TSQ: { name: "Torres Airport", city: "Torres", country: "BR" },
  UMU: { name: "Umuarama Airport", city: "Umuarama", country: "BR" },
  QVB: { name: "Uniao da Vitoria Airport", city: "Uniao Da Vitoria", country: "BR" },
  VIA: { name: "Videira Airport", city: "Videira", country: "BR" },
  CTQ: {
    name: "Santa Vitoria do Palmar Airport",
    city: "Santa Vitoria Do Palmar",
    country: "BR"
  },
  AXE: { name: "Xanxere Airport", city: "Xanxere", country: "BR" },
  AAG: { name: "Arapoti Airport", city: "Arapoti", country: "BR" },
  SRA: { name: "Santa Rosa Airport", city: "Santa Rosa", country: "BR" },
  PGZ: { name: "Ponta Grossa Airport", city: "Ponta Grossa", country: "BR" },
  ATI: { name: "Artigas International Airport", city: "Artigas", country: "UY" },
  CYR: {
    name: "Laguna de Los Patos International Airport",
    city: "Colonia",
    country: "UY"
  },
  DZO: { name: "Santa Bernardina International Airport", city: "Durazno", country: "UY" },
  PDP: {
    name: "Capitan Corbeta CA Curbelo International Airport",
    city: "Punta del Este",
    country: "UY"
  },
  MLZ: { name: "Cerro Largo International Airport", city: "Melo", country: "UY" },
  MVD: {
    name: "Carrasco International /General C L Berisso Airport",
    city: "Montevideo",
    country: "UY"
  },
  PDU: { name: "Tydeo Larre Borges Airport", city: "Paysandu", country: "UY" },
  RVY: {
    name: "Presidente General Don Oscar D. Gestido International Airport",
    city: "Rivera",
    country: "UY"
  },
  STY: { name: "Nueva Hesperides International Airport", city: "Salto", country: "UY" },
  TAW: { name: "Tacuarembo Airport", city: "Tacuarembo", country: "UY" },
  TYT: { name: "Treinta y Tres Airport", city: "Treinta y Tres", country: "UY" },
  VCH: { name: "Vichadero Airport", city: "Vichadero", country: "UY" },
  AGV: { name: "Oswaldo Guevara Mujica Airport", city: "Acarigua", country: "VE" },
  AAO: { name: "Anaco Airport", city: "Anaco", country: "VE" },
  LPJ: { name: "Armando Schwarck Airport", city: "Guayabal", country: "VE" },
  BLA: {
    name: "General Jose Antonio Anzoategui International Airport",
    city: "Barcelona",
    country: "VE"
  },
  BNS: { name: "Barinas Airport", city: "Barinas", country: "VE" },
  BRM: { name: "Barquisimeto International Airport", city: "Barquisimeto", country: "VE" },
  MYC: { name: "Escuela Mariscal Sucre Airport", city: "Maracay", country: "VE" },
  CBL: { name: "Ciudad Bolivar Airport", city: "", country: "VE" },
  CXA: { name: "Caicara del Orinoco Airport", city: "", country: "VE" },
  CUV: { name: "Casigua El Cubo Airport", city: "Casigua El Cubo", country: "VE" },
  CLZ: { name: "Calabozo Airport", city: "Guarico", country: "VE" },
  CAJ: { name: "Canaima Airport", city: "Canaima", country: "VE" },
  VCR: { name: "Carora Airport", city: "Carora", country: "VE" },
  CUP: { name: "General Francisco Bermudez Airport", city: "Carupano", country: "VE" },
  CZE: { name: "Jose Leonardo Chirinos Airport", city: "Coro", country: "VE" },
  CUM: { name: "Cumana (Antonio Jose de Sucre) Airport", city: "", country: "VE" },
  EOR: { name: "El Dorado Airport", city: "Bolivar", country: "VE" },
  EOZ: { name: "Elorza Airport", city: "", country: "VE" },
  GDO: { name: "Guasdalito Airport", city: "", country: "VE" },
  GUI: { name: "Guiria Airport", city: "", country: "VE" },
  GUQ: { name: "Guanare Airport", city: "Guanare", country: "VE" },
  HGE: { name: "Higuerote Airport", city: "", country: "VE" },
  ICA: { name: "Icabaru Airport", city: "", country: "VE" },
  ICC: {
    name: "Andres Miguel Salazar Marcano Airport",
    city: "Isla de Coche",
    country: "VE"
  },
  LSP: { name: "Josefa Camejo International Airport", city: "Paraguana", country: "VE" },
  KAV: { name: "Kavanayen Airport", city: "", country: "VE" },
  LFR: { name: "La Fria Airport", city: "", country: "VE" },
  MAR: { name: "La Chinita International Airport", city: "Maracaibo", country: "VE" },
  MRD: { name: "Alberto Carnevalli Airport", city: "Merida", country: "VE" },
  PMV: {
    name: "Del Caribe Santiago Marino International Airport",
    city: "Isla Margarita",
    country: "VE"
  },
  CCS: {
    name: "Maiquetia (Simon Bolivar Internacional) Airport",
    city: "Caracas",
    country: "VE"
  },
  MUN: { name: "Maturin Airport", city: "", country: "VE" },
  CBS: { name: "Oro Negro Airport", city: "Cabimas", country: "VE" },
  PYH: { name: "Cacique Aramare Airport", city: "", country: "VE" },
  PBL: { name: "General Bartolome Salom International Airport", city: "", country: "VE" },
  PDZ: { name: "Pedernales Airport", city: "", country: "VE" },
  PPH: { name: "Perai Tepuy Airport", city: "", country: "VE" },
  SCI: { name: "Paramillo Airport", city: "", country: "VE" },
  PZO: {
    name: "General Manuel Carlos Piar International Airport",
    city: "Puerto Ordaz-Ciudad Guayana",
    country: "VE"
  },
  PTM: { name: "Palmarito Airport", city: "Palmarito", country: "VE" },
  LRV: { name: "Gran Roque Airport", city: "Los Roques", country: "VE" },
  SVZ: { name: "San Antonio Del Tachira Airport", city: "", country: "VE" },
  SBB: { name: "Santa Barbara de Barinas Airport", city: "Santa Barbara", country: "VE" },
  SNV: { name: "Santa Elena de Uairen Airport", city: "", country: "VE" },
  STD: {
    name: "Mayor Buenaventura Vivas International Airport",
    city: "Santo Domingo",
    country: "VE"
  },
  SNF: { name: "Sub Teniente Nestor Arias Airport", city: "San Felipe", country: "VE" },
  SFD: { name: "San Fernando De Apure Airport", city: "Inglaterra", country: "VE" },
  SOM: { name: "San Tome Airport", city: "", country: "VE" },
  STB: { name: "Santa Barbara del Zulia Airport", city: "", country: "VE" },
  TUV: { name: "Tucupita Airport", city: "Tucupita", country: "VE" },
  TMO: { name: "Tumeremo Airport", city: "", country: "VE" },
  URM: { name: "Uriman Airport", city: "", country: "VE" },
  VLN: { name: "Arturo Michelena International Airport", city: "Valencia", country: "VE" },
  VIG: { name: "Juan Pablo Perez Alfonso Airport", city: "El Vigia", country: "VE" },
  VLV: { name: "Dr. Antonio Nicolas Briceno Airport", city: "Valera", country: "VE" },
  VDP: { name: "Valle de La Pascua Airport", city: "", country: "VE" },
  BAZ: { name: "Barcelos Airport", city: "Barcelos", country: "BR" },
  RBB: { name: "Borba Airport", city: "Borba", country: "BR" },
  CAF: { name: "Carauari Airport", city: "Carauari", country: "BR" },
  CQS: { name: "Costa Marques Airport", city: "Costa Marques", country: "BR" },
  DMT: { name: "Diamantino Airport", city: "Diamantino", country: "BR" },
  DNO: { name: "Dianopolis Airport", city: "Dianopolis", country: "BR" },
  ARS: { name: "Estancia das Cascatas Airport", city: "Aragarcas", country: "BR" },
  ERN: { name: "Eirunepe Airport", city: "Eirunepe", country: "BR" },
  CQA: { name: "Canarana Airport", city: "Canarana", country: "BR" },
  SXO: {
    name: "Sao Felix do Araguaia Airport",
    city: "Sao Felix Do Araguaia",
    country: "BR"
  },
  GRP: { name: "Gurupi Airport", city: "Gurupi", country: "BR" },
  AUX: { name: "Araguaina Airport", city: "Araguaina", country: "BR" },
  GGB: { name: "Fazenda Olhos D`agua Airport", city: "Agua Boa", country: "BR" },
  HUW: { name: "Humaita Airport", city: "Humaita", country: "BR" },
  IPG: { name: "Ipiranga Airport", city: "Santo Antonio Do Ica", country: "BR" },
  IDO: { name: "Santa Izabel do Morro Airport", city: "Cristalandia", country: "BR" },
  JPR: { name: "Ji-Parana Airport", city: "Ji-Parana", country: "BR" },
  JIA: { name: "Juina Airport", city: "Juina", country: "BR" },
  JRN: { name: "Juruena Airport", city: "Juruena", country: "BR" },
  JTI: { name: "Jatai Airport", city: "Jatai", country: "BR" },
  CCX: { name: "Caceres Airport", city: "Caceres", country: "BR" },
  CIZ: { name: "Coari Airport", city: "Coari", country: "BR" },
  NSR: { name: "Serra da Capivara Airport", city: "Sao Raimundo Nonato", country: "BR" },
  TLZ: { name: "Catalao Airport", city: "Catalao", country: "BR" },
  LBR: { name: "Labrea Airport", city: "Labrea", country: "BR" },
  RVD: { name: "General Leite de Castro Airport", city: "Rio Verde", country: "BR" },
  MBZ: { name: "Maues Airport", city: "Maues", country: "BR" },
  NVP: { name: "Novo Aripuana Airport", city: "Novo Aripuana", country: "BR" },
  AQM: { name: "Nova Vida Airport", city: "Ariquemes", country: "BR" },
  BCR: { name: "Novo Campo Airport", city: "Boca Do Acre", country: "BR" },
  NQL: { name: "Niquelandia Airport", city: "Niquelandia", country: "BR" },
  APS: { name: "Anapolis Airport", city: "Anapolis", country: "BR" },
  FBA: { name: "Fonte Boa Airport", city: "Fonte Boa", country: "BR" },
  PBV: { name: "Porto dos Gauchos Airport", city: "Porto Dos Gauchos", country: "BR" },
  PIN: { name: "Parintins Airport", city: "Parintins", country: "BR" },
  PBQ: { name: "Pimenta Bueno Airport", city: "Pimenta Bueno", country: "BR" },
  PBX: { name: "Fazenda Piraguassu Airport", city: "Porto Alegre Do Norte", country: "BR" },
  AAI: { name: "Arraias Airport", city: "Arraias", country: "BR" },
  ROO: { name: "Rondonopolis Airport", city: "Rondonopolis", country: "BR" },
  OPS: { name: "Presidente Joao Batista Figueiredo Airport", city: "Sinop", country: "BR" },
  STZ: { name: "Santa Terezinha Airport", city: "Santa Terezinha", country: "BR" },
  IRZ: { name: "Tapuruquara Airport", city: "Santa Isabel Do Rio Negro", country: "BR" },
  TGQ: { name: "Tangara da Serra Airport", city: "Tangara Da Serra", country: "BR" },
  AZL: { name: "Fazenda Tucunare Airport", city: "Sapezal", country: "BR" },
  QHN: { name: "Taguatinga Airport", city: "Taguatinga", country: "BR" },
  SQM: {
    name: "Sao Miguel do Araguaia Airport",
    city: "Sao Miguel Do Araguaia",
    country: "BR"
  },
  MTG: {
    name: "Vila Bela da Santissima Trindade Airport",
    city: "Vila Bela Da Santissima Trindade",
    country: "BR"
  },
  VLP: { name: "Vila Rica Airport", city: "Vila Rica", country: "BR" },
  MBK: { name: "Regional Orlando Villas Boas Airport", city: "Matupa", country: "BR" },
  NOK: { name: "Xavantina Airport", city: "Nova Xavantina", country: "BR" },
  AHL: { name: "Aishalton Airport", city: "Aishalton", country: "GY" },
  NAI: { name: "Annai Airport", city: "Annai", country: "GY" },
  BCG: { name: "Bemichi Airport", city: "Bemichi", country: "GY" },
  BMJ: { name: "Baramita Airport", city: "Baramita", country: "GY" },
  GFO: { name: "Bartica A Airport", city: "Bartica", country: "GY" },
  GEO: { name: "Cheddi Jagan International Airport", city: "Georgetown", country: "GY" },
  OGL: { name: "Ogle Airport", city: "Ogle", country: "GY" },
  IMB: { name: "Imbaimadai Airport", city: "Imbaimadai", country: "GY" },
  KAR: { name: "Kamarang Airport", city: "Kamarang", country: "GY" },
  KRM: { name: "Karanambo Airport", city: "Karanambo", country: "GY" },
  KRG: { name: "Karasabai Airport", city: "Karasabai", country: "GY" },
  KTO: { name: "Kato Airport", city: "Kato", country: "GY" },
  LUB: { name: "Lumid Pau Airport", city: "Lumid Pau", country: "GY" },
  LTM: { name: "Lethem Airport", city: "Lethem", country: "GY" },
  USI: { name: "Mabaruma Airport", city: "Mabaruma", country: "GY" },
  MHA: { name: "Mahdia Airport", city: "Mahdia", country: "GY" },
  MYM: { name: "Monkey Mountain Airport", city: "Monkey Mountain", country: "GY" },
  MWJ: { name: "Matthews Ridge Airport", city: "Matthews Ridge", country: "GY" },
  QSX: { name: "New Amsterdam Airport", city: "New Amsterdam", country: "GY" },
  ORJ: { name: "Orinduik Airport", city: "Orinduik", country: "GY" },
  PRR: { name: "Paruma Airport", city: "Paruma", country: "GY" },
  ANU: { name: "V.C. Bird International Airport", city: "St. George", country: "AG" },
  BGI: {
    name: "Sir Grantley Adams International Airport",
    city: "Bridgetown",
    country: "BB"
  },
  DCF: { name: "Canefield Airport", city: "Canefield", country: "DM" },
  DOM: { name: "Melville Hall Airport", city: "Marigot", country: "DM" },
  DSD: { name: "La Desirade Airport", city: "Grande Anse", country: "GP" },
  BBR: { name: "Baillif Airport", city: "Basse Terre", country: "GP" },
  SFC: { name: "St-Francois Airport", city: "St-Francois", country: "GP" },
  FDF: {
    name: "Martinique Aime Cesaire International Airport",
    city: "Fort-de-France",
    country: "MQ"
  },
  SFG: { name: "L'Esperance Airport", city: "Grand Case", country: "MF" },
  SBH: { name: "Gustaf III Airport", city: "Gustavia", country: "BL" },
  GBJ: { name: "Les Bases Airport", city: "Grand Bourg", country: "GP" },
  PTP: {
    name: "Pointe-a-Pitre Le Raizet",
    city: "Pointe-a-Pitre Le Raizet",
    country: "GP"
  },
  LSS: { name: "Terre-de-Haut Airport", city: "Les Saintes", country: "GP" },
  GND: {
    name: "Point Salines International Airport",
    city: "Saint George's",
    country: "GD"
  },
  CRU: { name: "Lauriston Airport", city: "Carriacou Island", country: "GD" },
  STT: { name: "Cyril E King Airport", city: "Charlotte Amalie", country: "US" },
  STX: { name: "Henry E Rohlsen Airport", city: "Christiansted", country: "US" },
  ARE: { name: "Antonio/Nery/Juarbe Pol Airport", city: "Arecibo", country: "US" },
  BQN: { name: "Rafael Hernandez Airport", city: "Aguadilla", country: "US" },
  CPX: { name: "Benjamin Rivera Noriega Airport", city: "Isla De Culebra", country: "US" },
  SIG: { name: "Fernando Luis Ribas Dominicci Airport", city: "San Juan", country: "US" },
  MAZ: { name: "Eugenio Maria De Hostos Airport", city: "Mayaguez", country: "US" },
  PSE: { name: "Mercedita Airport", city: "Ponce", country: "US" },
  NRR: { name: "Jose Aponte De La Torre Airport", city: "Ceiba", country: "US" },
  SJU: { name: "Luis Munoz Marin International Airport", city: "San Juan", country: "US" },
  VQS: { name: "Antonio Rivera Rodriguez Airport", city: "Isla De Vieques", country: "US" },
  SKB: {
    name: "Robert L. Bradshaw International Airport",
    city: "Basseterre",
    country: "KN"
  },
  NEV: { name: "Vance W. Amory International Airport", city: "Charlestown", country: "KN" },
  SLU: { name: "George F. L. Charles Airport", city: "Castries", country: "LC" },
  UVF: { name: "Hewanorra International Airport", city: "Vieux Fort", country: "LC" },
  AUA: { name: "Queen Beatrix International Airport", city: "Oranjestad", country: "AW" },
  BON: { name: "Flamingo International Airport", city: "Kralendijk", country: "BQ" },
  CUR: { name: "Hato International Airport", city: "Willemstad", country: "CW" },
  EUX: { name: "F. D. Roosevelt Airport", city: "Sint Eustatius", country: "BQ" },
  SXM: {
    name: "Princess Juliana International Airport",
    city: "Saint Martin",
    country: "SX"
  },
  SAB: { name: "Juancho E. Yrausquin Airport", city: "Saba", country: "BQ" },
  AXA: { name: "Wallblake Airport", city: "The Valley", country: "AI" },
  MNI: { name: "John A. Osborne Airport", city: "Gerald's Park", country: "MS" },
  TAB: { name: "Tobago-Crown Point Airport", city: "Scarborough", country: "TT" },
  POS: { name: "Piarco International Airport", city: "Port of Spain", country: "TT" },
  NGD: { name: "Captain Auguste George Airport", city: "Anegada", country: "VG" },
  EIS: {
    name: "Terrance B. Lettsome International Airport",
    city: "Road Town",
    country: "VG"
  },
  VIJ: { name: "Virgin Gorda Airport", city: "Spanish Town", country: "VG" },
  SVD: { name: "Argyle International Airport", city: "Argyle", country: "VC" },
  BQU: { name: "J F Mitchell Airport", city: "Bequia", country: "VC" },
  CIW: { name: "Canouan Airport", city: "Canouan", country: "VC" },
  MQS: { name: "Mustique Airport", city: "Mustique Island", country: "VC" },
  UNI: { name: "Union Island International Airport", city: "Union Island", country: "VC" },
  BDA: {
    name: "L.F. Wade International International Airport",
    city: "Hamilton",
    country: "BM"
  },
  ALA: { name: "Almaty International Airport", city: "Almaty", country: "KZ" },
  BXH: { name: "Balkhash Airport", city: "Balkhash", country: "KZ" },
  USJ: { name: "Usharal Airport", city: "Usharal", country: "KZ" },
  BXJ: { name: "Boralday Airport", city: "Aima Ata", country: "KZ" },
  TDK: { name: "Taldykorgan Airport", city: "Taldy Kurgan", country: "KZ" },
  NQZ: {
    name: "Nursultan Nazarbayev International Airport",
    city: "Astana",
    country: "KZ"
  },
  KOV: { name: "Kokshetau Airport", city: "Kokshetau", country: "KZ" },
  PPK: { name: "Petropavlosk International Airport", city: "Petropavlosk", country: "KZ" },
  DMB: { name: "Aulie-ata International Airport", city: "Taraz", country: "KZ" },
  CIT: { name: "Shymkent Airport", city: "Shymkent", country: "KZ" },
  HSA: { name: "Turkistan International Airport", city: "Turkistan", country: "KZ" },
  DZN: { name: "Zhezkazgan Airport", city: "Zhezkazgan", country: "KZ" },
  KGF: { name: "Sary-Arka International Airport", city: "Karaganda", country: "KZ" },
  BXY: { name: "Krainiy Airport", city: "Baikonur", country: "KZ" },
  KZO: { name: "Korkyt Ata Airport", city: "Kzyl-Orda", country: "KZ" },
  URA: { name: "Oral Ak Zhol International Airport", city: "Uralsk", country: "KZ" },
  UKK: { name: "Ust-Kamennogorsk Airport", city: "Ust Kamenogorsk", country: "KZ" },
  PWQ: { name: "Pavlodar International Airport", city: "Pavlodar", country: "KZ" },
  PLX: { name: "Semey International Airport", city: "Semey", country: "KZ" },
  SCO: { name: "Aktau International Airport", city: "Aktau", country: "KZ" },
  GUW: { name: "Atyrau International Airport", city: "Atyrau", country: "KZ" },
  AKX: {
    name: "Aktobe Aliya Moldagulova International Airport",
    city: "Aktyubinsk",
    country: "KZ"
  },
  KSN: { name: "Kostanay International Airport", city: "Kostanay", country: "KZ" },
  GYD: { name: "Heydar Aliyev International Airport", city: "Baku", country: "AZ" },
  GNJ: { name: "Ganja Airport", city: "Ganja", country: "AZ" },
  LLK: { name: "Lankaran International Airport", city: "Lankaran", country: "AZ" },
  NAJ: { name: "Nakhchivan Airport", city: "Nakhchivan", country: "AZ" },
  GBB: { name: "Gabala International Airport", city: "Gabala", country: "AZ" },
  ZTU: { name: "Zaqatala International Airport", city: "Zaqatala", country: "AZ" },
  ZZE: { name: "Zangilan International Airport", city: "Zangilan", country: "AZ" },
  YLV: { name: "Yevlakh Airport", city: "Yevlakh", country: "AZ" },
  ZXT: { name: "Zabrat Airport", city: "Baku", country: "AZ" },
  IKU: { name: "Issyk-Kul International Airport", city: "Tamchy", country: "KG" },
  BSZ: { name: "Manas International Airport", city: "Bishkek", country: "KG" },
  OSS: { name: "Osh Airport", city: "Osh", country: "KG" },
  IKG: { name: "Karakol Airport", city: "Karakol", country: "KG" },
  LWN: { name: "Gyumri Shirak Airport", city: "Gyumri", country: "AM" },
  EVN: { name: "Zvartnots International Airport", city: "Yerevan", country: "AM" },
  UKG: { name: "Ust-Kuyga Airport", city: "Ust-Kuyga", country: "RU" },
  TLK: { name: "Talakan Airport", city: "Lenskiy Ulus", country: "RU" },
  ADH: { name: "Aldan Airport", city: "Aldan", country: "RU" },
  YKS: { name: "Yakutsk Airport", city: "Yakutsk", country: "RU" },
  NER: { name: "Chulman Neryungri Airport", city: "Chulman", country: "RU" },
  MQJ: { name: "Moma Airport", city: "Honuu", country: "RU" },
  KDY: { name: "Tyopliy Klyuch Airport", city: "Tyopliy Klyuch", country: "RU" },
  GYG: { name: "Magan Airport", city: "Magan", country: "RU" },
  OLZ: { name: "Olyokminsk Airport", city: "Olyokminsk", country: "RU" },
  USR: { name: "Ust-Nera Airport", city: "Ust-Nera", country: "RU" },
  UMS: { name: "Ust-Maya Airport", city: "Ust-Maya", country: "RU" },
  VHV: { name: "Verkhnevilyuisk Airport", city: "Verkhnevilyuisk", country: "RU" },
  NYR: { name: "Nyurba Airport", city: "Nyurba", country: "RU" },
  SUY: { name: "Suntar Airport", city: "Suntar", country: "RU" },
  VYI: { name: "Vilyuisk Airport", city: "Vilyuisk", country: "RU" },
  ULK: { name: "Lensk Airport", city: "Lensk", country: "RU" },
  ONK: { name: "Olenyok Airport", city: "Olenyok", country: "RU" },
  PYJ: { name: "Polyarny Airport", city: "Yakutia", country: "RU" },
  MJZ: { name: "Mirny Airport", city: "Mirny", country: "RU" },
  SYS: { name: "Saskylakh Airport", city: "Saskylakh", country: "RU" },
  BGN: { name: "Belaya Gora Airport", city: "Belaya Gora", country: "RU" },
  CKH: { name: "Chokurdakh Airport", city: "Chokurdah", country: "RU" },
  CYX: { name: "Cherskiy Airport", city: "Cherskiy", country: "RU" },
  IKS: { name: "Tiksi Airport", city: "Tiksi", country: "RU" },
  ZKP: { name: "Zyryanka Airport", city: "Zyryanka", country: "RU" },
  ZIX: { name: "Zhigansk Airport", city: "Zhigansk", country: "RU" },
  KUT: { name: "Kopitnari Airport", city: "Kutaisi", country: "GE" },
  BUS: { name: "Batumi International Airport", city: "Batumi", country: "GE" },
  SUI: { name: "Sukhumi Dranda Airport", city: "Sukhumi", country: "GE" },
  TBS: { name: "Tbilisi International Airport", city: "Tbilisi", country: "GE" },
  BQS: { name: "Ignatyevo Airport", city: "Blagoveschensk", country: "RU" },
  GDG: { name: "Magdagachi Airport", city: "Magdagachi", country: "RU" },
  TYD: { name: "Tynda Airport", city: "Tynda", country: "RU" },
  KHV: { name: "Khabarovsk-Novy Airport", city: "Khabarovsk", country: "RU" },
  KXK: { name: "Komsomolsk-on-Amur Airport", city: "Komsomolsk-on-Amur", country: "RU" },
  GVN: { name: "Maygatka Airport.", city: "Sovetskaya Gavan", country: "RU" },
  DYR: { name: "Ugolny Airport", city: "Anadyr", country: "RU" },
  PVS: { name: "Provideniya Bay Airport", city: "Chukotka", country: "RU" },
  KPW: { name: "Keperveem Airport", city: "Keperveem", country: "RU" },
  GDX: { name: "Sokol Airport", city: "Magadan", country: "RU" },
  KVM: { name: "Markovo Airport", city: "Markovo", country: "RU" },
  PWE: { name: "Pevek Airport", city: "Pevek", country: "RU" },
  SWV: { name: "Severo-Evensk Airport", city: "Evensk", country: "RU" },
  BQG: { name: "Bogorodskoye Airport", city: "Bogorodskoye", country: "RU" },
  NLI: {
    name: "Nikolayevsk-na-Amure Airport",
    city: "Nikolayevsk-na-Amure Airport",
    country: "RU"
  },
  OHO: { name: "Okhotsk Airport", city: "Okhotsk", country: "RU" },
  PKC: { name: "Yelizovo Airport", city: "Petropavlovsk-Kamchatsky", country: "RU" },
  BVV: { name: "Burevestnik Airport", city: "Iturup Island", country: "RU" },
  OHH: { name: "Okha Airport", city: "Okha", country: "RU" },
  EKS: { name: "Shakhtyorsk Airport", city: "Shakhtersk", country: "RU" },
  DEE: { name: "Mendeleyevo Airport", city: "Kunashir Island", country: "RU" },
  ZZO: { name: "Zonalnoye Airport", city: "Tymovskoye", country: "RU" },
  UUS: { name: "Yuzhno-Sakhalinsk Airport", city: "Yuzhno-Sakhalinsk", country: "RU" },
  AEM: { name: "Amgu Airport", city: "Amgu", country: "RU" },
  TLY: { name: "Plastun Airport", city: "Plastun", country: "RU" },
  VVO: { name: "Vladivostok International Airport", city: "Vladivostok", country: "RU" },
  HTA: { name: "Chita-Kadala Airport", city: "Chita", country: "RU" },
  BTK: { name: "Bratsk Airport", city: "Bratsk", country: "RU" },
  UIK: { name: "Ust-Ilimsk Airport", city: "Ust-Ilimsk", country: "RU" },
  IKT: { name: "Irkutsk Airport", city: "Irkutsk", country: "RU" },
  ODO: { name: "Bodaybo Airport", city: "Bodaybo", country: "RU" },
  ERG: { name: "Yerbogachen Airport", city: "Erbogachen", country: "RU" },
  KCK: { name: "Kirensk Airport", city: "Kirensk", country: "RU" },
  UKX: { name: "Ust-Kut Airport", city: "Ust-Kut", country: "RU" },
  UUD: { name: "Ulan-Ude Airport (Mukhino)", city: "Ulan Ude", country: "RU" },
  KBP: { name: "Boryspil International Airport", city: "Kyiv", country: "UA" },
  MXR: { name: "Myrhorod Air Base", city: "Myrhorod", country: "UA" },
  DOK: { name: "Donetsk International Airport", city: "Donetsk", country: "UA" },
  KRQ: { name: "Kramatorsk Airport", city: "Kramatorsk", country: "UA" },
  MPW: { name: "Mariupol International Airport", city: "Mariupol", country: "UA" },
  SEV: { name: "Sievierodonetsk Airport", city: "Sievierodonetsk", country: "UA" },
  VSG: { name: "Luhansk International Airport", city: "Luhansk", country: "UA" },
  ERD: { name: "Berdyansk Airport", city: "Berdiansk", country: "UA" },
  DNK: { name: "Dnipro International Airport", city: "Dnipro", country: "UA" },
  OZH: { name: "Zaporizhzhia International Airport", city: "Zaporizhzhia", country: "UA" },
  KWG: { name: "Kryvyi Rih International Airport", city: "Kryvyi Rih", country: "UA" },
  SIP: { name: "Simferopol International Airport", city: "Simferopol", country: "UA" },
  KHC: { name: "Kerch Airport", city: "Kerch", country: "UA" },
  HRK: { name: "Kharkiv International Airport", city: "Kharkiv", country: "UA" },
  PLV: { name: "Poltava International Airport", city: "Poltava", country: "UA" },
  UMY: { name: "Sumy Airport", city: "Sumy", country: "UA" },
  CKC: { name: "Cherkasy International Airport", city: "Cherkasy", country: "UA" },
  KGO: { name: "Kropyvnytskyi Airport", city: "Kropyvnytskyi", country: "UA" },
  IEV: { name: "Kyiv Zhuliany International Airport", city: "Kyiv", country: "UA" },
  ZTR: { name: "Zhytomyr International Airport", city: "Zhytomyr", country: "UA" },
  UCK: { name: "Lutsk Airport", city: "Lutsk", country: "UA" },
  HMJ: { name: "Khmelnytskyi Airport", city: "Khmelnytskyi", country: "UA" },
  IFO: {
    name: "Ivano-Frankivsk International Airport",
    city: "Ivano-Frankivsk",
    country: "UA"
  },
  LWO: { name: "Lviv International Airport", city: "Lviv", country: "UA" },
  CWC: { name: "Chernivtsi International Airport", city: "Chernivtsi", country: "UA" },
  RWN: { name: "Rivne International Airport", city: "Rivne", country: "UA" },
  TNL: { name: "Ternopil International Airport", city: "Ternopil", country: "UA" },
  UDJ: { name: "Uzhhorod International Airport", city: "Uzhhorod", country: "UA" },
  ODS: { name: "Odesa International Airport", city: "Odesa", country: "UA" },
  VIN: {
    name: "Havryshivka Vinnytsia International Airport",
    city: "Vinnitsa",
    country: "UA"
  },
  ARH: { name: "Talagi Airport", city: "Archangelsk", country: "RU" },
  LDG: { name: "Leshukonskoye Airport", city: "Leshukonskoye", country: "RU" },
  NNM: { name: "Naryan Mar Airport", city: "Naryan Mar", country: "RU" },
  CSH: { name: "Solovki Airport", city: "Solovetsky Islands", country: "RU" },
  AMV: { name: "Amderma Airport", city: "Amderma", country: "RU" },
  VRI: { name: "Varandey Airport", city: "", country: "RU" },
  KSZ: { name: "Kotlas Airport", city: "Kotlas", country: "RU" },
  LED: { name: "Pulkovo Airport", city: "St. Petersburg", country: "RU" },
  KVK: { name: "Kirovsk-Apatity Airport", city: "Apatity", country: "RU" },
  MMK: { name: "Murmansk Airport", city: "Murmansk", country: "RU" },
  VLU: { name: "Velikiye Luki Airport", city: "Velikiye Luki", country: "RU" },
  PKV: { name: "Pskov Airport", city: "Pskov", country: "RU" },
  PES: { name: "Petrozavodsk Airport", city: "Petrozavodsk", country: "RU" },
  CEE: { name: "Cherepovets Airport", city: "Cherepovets", country: "RU" },
  VUS: { name: "Velikiy Ustyug Airport", city: "Velikiy Ustyug", country: "RU" },
  VGD: { name: "Vologda Airport", city: "Vologda", country: "RU" },
  BQT: { name: "Brest Airport", city: "Brest", country: "BY" },
  GME: { name: "Gomel Airport", city: "Gomel", country: "BY" },
  VTB: { name: "Vitebsk East Airport", city: "Vitebsk", country: "BY" },
  KGD: { name: "Khrabrovo Airport", city: "Kaliningrad", country: "RU" },
  GNA: { name: "Hrodna Airport", city: "Hrodna", country: "BY" },
  MSQ: { name: "Minsk International Airport", city: "Minsk", country: "BY" },
  MVQ: { name: "Mogilev Airport", city: "Mogilev", country: "BY" },
  ABA: { name: "Abakan Airport", city: "Abakan", country: "RU" },
  BAX: { name: "Barnaul Airport", city: "Barnaul", country: "RU" },
  RGK: { name: "Gorno-Altaysk Airport", city: "Gorno-Altaysk", country: "RU" },
  KEJ: { name: "Kemerovo Airport", city: "Kemerovo", country: "RU" },
  EIE: { name: "Yeniseysk Airport", city: "Yeniseysk", country: "RU" },
  TGP: { name: "Podkamennaya Tunguska Airport", city: "Bor", country: "RU" },
  KJA: { name: "Yemelyanovo Airport", city: "Krasnoyarsk", country: "RU" },
  ACS: { name: "Achinsk Airport", city: "Achinsk", country: "RU" },
  KYZ: { name: "Kyzyl Airport", city: "Kyzyl", country: "RU" },
  OVB: { name: "Tolmachevo Airport", city: "Novosibirsk", country: "RU" },
  OMS: { name: "Omsk Central Airport", city: "Omsk", country: "RU" },
  SWT: { name: "Strezhevoy Airport", city: "Strezhevoy", country: "RU" },
  TOF: { name: "Bogashevo Airport", city: "Tomsk", country: "RU" },
  NOZ: { name: "Spichenkovo Airport", city: "Novokuznetsk", country: "RU" },
  DKS: { name: "Dikson Airport", city: "Dikson", country: "RU" },
  HTG: { name: "Khatanga Airport", city: "Khatanga", country: "RU" },
  IAA: { name: "Igarka Airport", city: "Igarka", country: "RU" },
  NSK: { name: "Norilsk-Alykel Airport", city: "Norilsk", country: "RU" },
  THX: { name: "Turukhansk Airport", city: "Turukhansk", country: "RU" },
  UKS: { name: "Sevastopol International Airport", city: "Sevastopol", country: "UA" },
  AAQ: { name: "Anapa Airport", city: "Anapa", country: "RU" },
  EIK: { name: "Yeysk Airport", city: "Yeysk", country: "RU" },
  GDZ: { name: "Gelendzhik Airport", city: "Gelendzhik", country: "RU" },
  KRR: { name: "Krasnodar International Airport", city: "Krasnodar", country: "RU" },
  GRV: { name: "Grozny North Airport", city: "Grozny", country: "RU" },
  MCX: { name: "Uytash Airport", city: "Makhachkala", country: "RU" },
  MRV: { name: "Mineralnyye Vody Airport", city: "Mineralnyye Vody", country: "RU" },
  NAL: { name: "Nalchik Airport", city: "Nalchik", country: "RU" },
  OGZ: { name: "Beslan Airport", city: "Beslan", country: "RU" },
  IGT: { name: "Magas Airport", city: "Magas", country: "RU" },
  STW: { name: "Stavropol Shpakovskoye Airport", city: "Stavropol", country: "RU" },
  ROV: { name: "Platov International Airport", city: "Rostov-on-Don", country: "RU" },
  RVI: { name: "Rostov-na-Donu Airport", city: "Rostov-on-Don", country: "RU" },
  TGK: { name: "Taganrog Yuzhny Airport", city: "Taganrog", country: "RU" },
  AER: { name: "Sochi International Airport", city: "Sochi", country: "RU" },
  ASF: { name: "Astrakhan Airport", city: "Astrakhan", country: "RU" },
  ESL: { name: "Elista Airport", city: "Elista", country: "RU" },
  VOG: { name: "Volgograd International Airport", city: "Volgograd", country: "RU" },
  CEK: { name: "Chelyabinsk Balandino Airport", city: "Chelyabinsk", country: "RU" },
  MQF: { name: "Magnitogorsk International Airport", city: "Magnitogorsk", country: "RU" },
  SBT: { name: "Sabetta Airport", city: "Sabetta", country: "RU" },
  BVJ: { name: "Bovanenkovo", city: "Bovanenkovo", country: "RU" },
  SLY: { name: "Salekhard Airport", city: "Salekhard", country: "RU" },
  YMK: { name: "Mys Kamenny Airport", city: "Mys Kamennyi", country: "RU" },
  KKQ: { name: "Krasnoselkup Airport", city: "Krasnoselkup", country: "RU" },
  TQL: { name: "Tarko-Sale Airport", city: "Tarko-Sale", country: "RU" },
  UEN: { name: "Urengoy Airport", city: "Urengoy", country: "RU" },
  EZV: { name: "Berezovo Airport", city: "", country: "RU" },
  HMA: { name: "Khanty Mansiysk Airport", city: "Khanty-Mansiysk", country: "RU" },
  IRM: { name: "Igrim Airport", city: "", country: "RU" },
  KXD: { name: "Kondinskoye Airport", city: "Kondinskoye", country: "RU" },
  NYA: { name: "Nyagan Airport", city: "Nyagan", country: "RU" },
  OVS: { name: "Sovetskiy Airport", city: "Sovetskiy", country: "RU" },
  URJ: { name: "Uray Airport", city: "Uray", country: "RU" },
  IJK: { name: "Izhevsk Airport", city: "Izhevsk", country: "RU" },
  KVX: { name: "Pobedilovo Airport", city: "Kirov", country: "RU" },
  NYM: { name: "Nadym Airport", city: "Nadym", country: "RU" },
  NUX: { name: "Novy Urengoy Airport", city: "Novy Urengoy", country: "RU" },
  NJC: { name: "Nizhnevartovsk Airport", city: "Nizhnevartovsk", country: "RU" },
  PEE: { name: "Bolshoye Savino Airport", city: "Perm", country: "RU" },
  KGP: { name: "Kogalym International Airport", city: "Kogalym", country: "RU" },
  NFG: { name: "Nefteyugansk Airport", city: "Nefteyugansk", country: "RU" },
  NOJ: { name: "Noyabrsk Airport", city: "Noyabrsk", country: "RU" },
  SGC: { name: "Surgut Airport", city: "Surgut", country: "RU" },
  SVX: { name: "Koltsovo Airport", city: "Yekaterinburg", country: "RU" },
  TOX: { name: "Tobolsk Airport", city: "Tobolsk", country: "RU" },
  TJM: { name: "Roshchino International Airport", city: "Tyumen", country: "RU" },
  KRO: { name: "Kurgan Airport", city: "Kurgan", country: "RU" },
  GMV: { name: "Monument Valley Airport", city: "Monument Valley", country: "US" },
  ASB: { name: "Ashgabat Airport", city: "Ashgabat", country: "TM" },
  KEA: { name: "Kerki International Airport", city: "Kerki", country: "TM" },
  KRW: { name: "Turkmenbashi Airport", city: "Krasnovodsk", country: "TM" },
  MYP: { name: "Mary Airport", city: "Mary", country: "TM" },
  BKN: { name: "Balkanabat International Airport", city: "Jebel", country: "TM" },
  TAZ: { name: "Dashoguz Airport", city: "Dashoguz", country: "TM" },
  CRZ: { name: "Turkmenabat International Airport", city: "Turkmenabat", country: "TM" },
  DYU: { name: "Dushanbe Airport", city: "Dushanbe", country: "TJ" },
  TJU: { name: "Kulob Airport", city: "Kulyab", country: "TJ" },
  LBD: { name: "Khudzhand Airport", city: "Khudzhand", country: "TJ" },
  KQT: { name: "Qurghonteppa International Airport", city: "Kurgan-Tyube", country: "TJ" },
  KMW: { name: "Kostroma Sokerkino Airport", city: "Kostroma", country: "RU" },
  BKA: { name: "Bykovo Airport", city: "Moscow", country: "RU" },
  KLF: { name: "Grabtsevo Airport", city: "Kaluga", country: "RU" },
  IWA: { name: "Ivanovo South Airport", city: "Ivanovo", country: "RU" },
  RYB: { name: "Staroselye Airport", city: "Rybinsk", country: "RU" },
  BZK: { name: "Bryansk Airport", city: "Bryansk", country: "RU" },
  LNX: { name: "Smolensk South Airport", city: "Smolensk", country: "RU" },
  ZIA: { name: "Ramenskoye Airport", city: "Zhukovsky", country: "RU" },
  DME: { name: "Domodedovo International Airport", city: "Moscow", country: "RU" },
  IAR: { name: "Tunoshna Airport", city: "", country: "RU" },
  SVO: { name: "Sheremetyevo International Airport", city: "Moscow", country: "RU" },
  KLD: { name: "Migalovo Air Base", city: "Tver", country: "RU" },
  OSF: { name: "Ostafyevo International Airport", city: "Moscow", country: "RU" },
  CKL: { name: "Chkalovskiy Airport", city: "Moscow", country: "RU" },
  EGO: { name: "Belgorod International Airport", city: "Belgorod", country: "RU" },
  URS: { name: "Kursk East Airport", city: "Kursk", country: "RU" },
  LPK: { name: "Lipetsk Airport", city: "Lipetsk", country: "RU" },
  VOZ: { name: "Voronezh International Airport", city: "Voronezh", country: "RU" },
  OEL: { name: "Oryol Yuzhny Airport", city: "Orel", country: "RU" },
  TBW: { name: "Donskoye Airport", city: "Tambov", country: "RU" },
  RZN: { name: "Turlatovo Airport", city: "Ryazan", country: "RU" },
  VKO: { name: "Vnukovo International Airport", city: "Moscow", country: "RU" },
  UCT: { name: "Ukhta Airport", city: "Ukhta", country: "RU" },
  INA: { name: "Inta Airport", city: "Inta", country: "RU" },
  PEX: { name: "Pechora Airport", city: "Pechora", country: "RU" },
  USK: { name: "Usinsk Airport", city: "Usinsk", country: "RU" },
  VKT: { name: "Vorkuta Airport", city: "Vorkuta", country: "RU" },
  UTS: { name: "Ust-Tsylma Airport", city: "Ust-Tsylma", country: "RU" },
  SCW: { name: "Syktyvkar Airport", city: "Syktyvkar", country: "RU" },
  GOJ: {
    name: "Nizhny Novgorod International Airport",
    city: "Nizhny Novgorod",
    country: "RU"
  },
  UUA: { name: "Bugulma Airport", city: "Bugulma", country: "RU" },
  KZN: { name: "Kazan International Airport", city: "Kazan", country: "RU" },
  NBC: { name: "Begishevo Airport", city: "Nizhnekamsk", country: "RU" },
  CSY: { name: "Cheboksary Airport", city: "Cheboksary", country: "RU" },
  ULV: { name: "Ulyanovsk Baratayevka Airport", city: "Ulyanovsk", country: "RU" },
  ULY: { name: "Ulyanovsk East Airport", city: "Ulyanovsk", country: "RU" },
  REN: { name: "Orenburg Central Airport", city: "Orenburg", country: "RU" },
  OSW: { name: "Orsk Airport", city: "Orsk", country: "RU" },
  PEZ: { name: "Penza Airport", city: "Penza", country: "RU" },
  SKX: { name: "Saransk Airport", city: "Saransk", country: "RU" },
  BWO: { name: "Balakovo Airport", city: "Balakovo", country: "RU" },
  GSV: { name: "Gagarin Airport", city: "Saratov", country: "RU" },
  BCX: { name: "Beloretsk Airport", city: "Beloretsk", country: "RU" },
  NEF: { name: "Neftekamsk Airport", city: "Neftekamsk", country: "RU" },
  OKT: { name: "Oktyabrskiy Airport", city: "Kzyl-Yar", country: "RU" },
  UFA: { name: "Ufa International Airport", city: "Ufa", country: "RU" },
  KUF: { name: "Kurumoch International Airport", city: "Samara", country: "RU" },
  AZN: { name: "Andizhan Airport", city: "Andizhan", country: "UZ" },
  FEG: { name: "Fergana Airport", city: "Fergana", country: "UZ" },
  OQN: { name: "Kokand Airport", city: "Kokand", country: "UZ" },
  NMA: { name: "Namangan Airport", city: "Namangan", country: "UZ" },
  NCU: { name: "Nukus Airport", city: "Nukus", country: "UZ" },
  UGC: { name: "Urgench Airport", city: "Urgench", country: "UZ" },
  NVI: { name: "Navoi Airport", city: "Navoi", country: "UZ" },
  BHK: { name: "Bukhara Airport", city: "Bukhara", country: "UZ" },
  KSQ: { name: "Karshi Airport", city: "Karshi", country: "UZ" },
  AFS: { name: "Sugraly Airport", city: "Zarafshan", country: "UZ" },
  SKD: { name: "Samarkand Airport", city: "Samarkand", country: "UZ" },
  TMJ: { name: "Termez Airport", city: "Termez", country: "UZ" },
  TAS: { name: "Tashkent International Airport", city: "Tashkent", country: "UZ" },
  OMN: { name: "Zomin Airport", city: "Lyaylyakul", country: "UZ" },
  DIU: { name: "Diu Airport", city: "Diu", country: "IN" },
  AMD: {
    name: "Sardar Vallabhbhai Patel International Airport",
    city: "Ahmedabad",
    country: "IN"
  },
  AKD: { name: "Akola Airport", city: "", country: "IN" },
  IXU: { name: "Aurangabad Airport", city: "Aurangabad", country: "IN" },
  BOM: { name: "Chhatrapati Shivaji International Airport", city: "Mumbai", country: "IN" },
  PAB: { name: "Bilaspur Airport", city: "", country: "IN" },
  BHJ: { name: "Bhuj Airport", city: "Bhuj", country: "IN" },
  IXG: { name: "Belgaum Airport", city: "", country: "IN" },
  BDQ: { name: "Vadodara Airport", city: "Vadodara", country: "IN" },
  BHO: { name: "Bhopal Airport", city: "Bhopal", country: "IN" },
  BHU: { name: "Bhavnagar Airport", city: "Bhavnagar", country: "IN" },
  NMB: { name: "Daman Airport", city: "", country: "IN" },
  GUX: { name: "Guna Airport", city: "", country: "IN" },
  HBX: { name: "Hubli Airport", city: "Hubli", country: "IN" },
  HSR: { name: "Rajkot International Airport", city: "Rajkot", country: "IN" },
  IDR: { name: "Devi Ahilyabai Holkar Airport", city: "Indore", country: "IN" },
  JLR: { name: "Jabalpur Airport", city: "", country: "IN" },
  JGA: { name: "Jamnagar Airport", city: "Jamnagar", country: "IN" },
  IXY: { name: "Kandla Airport", city: "Kandla", country: "IN" },
  HJR: { name: "Khajuraho Airport", city: "Khajuraho", country: "IN" },
  KLH: { name: "Kolhapur Airport", city: "", country: "IN" },
  IXK: { name: "Keshod Airport", city: "", country: "IN" },
  LTU: { name: "Murod Kond Airport", city: "Latur", country: "IN" },
  NDC: { name: "Nanded Airport", city: "Nanded", country: "IN" },
  NMI: { name: "Navi Mumbai International Airport", city: "Navi Mumbai", country: "IN" },
  NAG: {
    name: "Dr. Babasaheb Ambedkar International Airport",
    city: "Naqpur",
    country: "IN"
  },
  ISK: { name: "Ozar Airport", city: "Nasik", country: "IN" },
  PNQ: { name: "Pune Airport", city: "Pune", country: "IN" },
  PBD: { name: "Porbandar Airport", city: "Porbandar", country: "IN" },
  RTC: { name: "Ratnagiri Airport", city: "", country: "IN" },
  RPR: { name: "Raipur Airport", city: "Raipur", country: "IN" },
  SSE: { name: "Solapur Airport", city: "Solapur", country: "IN" },
  STV: { name: "Surat Airport", city: "", country: "IN" },
  UDR: { name: "Maharana Pratap Airport", city: "Udaipur", country: "IN" },
  CMB: {
    name: "Bandaranaike International Apt Colombo Airport",
    city: "Colombo",
    country: "LK"
  },
  ACJ: { name: "Anuradhapura Airport", city: "Anuradhapura", country: "LK" },
  BTC: { name: "Batticaloa Airport", city: "Batticaloa", country: "LK" },
  RML: { name: "Colombo Int Arpt Ratmalana Airport", city: "Colombo", country: "LK" },
  GOY: { name: "Amparai Airport", city: "Amparai", country: "LK" },
  HIM: { name: "Minneriya Airport", city: "Hingurakgoda", country: "LK" },
  JAF: { name: "Jaffna International Airport", city: "Jaffna", country: "LK" },
  KCT: { name: "Koggala Airport", city: "Galle", country: "LK" },
  KTY: { name: "Katukurunda Airport", city: "Kalutara", country: "LK" },
  GIU: { name: "Sigiriya Airport", city: "Sigiriya", country: "LK" },
  TRR: { name: "China-Bay Airport", city: "Trincomalee", country: "LK" },
  WRZ: { name: "Wirawila Airport", city: "Weerawila", country: "LK" },
  HRI: {
    name: "Mattala Rajapaksa International Airport",
    city: "Hambantota",
    country: "LK"
  },
  BBM: { name: "Battambang Airport", city: "Battambang", country: "KH" },
  RBE: { name: "Ratanakiri Airport", city: "Ratanakiri", country: "KH" },
  SAI: { name: "Siem Reap Angkor International Airport", city: "Siem Reap", country: "KH" },
  KOS: { name: "Sihanoukville International Airport", city: "Sihanukville", country: "KH" },
  KTI: { name: "Techo International Airport", city: "Krong Ta Khmau", country: "KH" },
  AZH: { name: "Azamgarh Airport", city: "Azamgarh", country: "IN" },
  IXV: { name: "Along Airport", city: "", country: "IN" },
  AHA: { name: "Maa Mahamaya Airport", city: "Ambikapur", country: "IN" },
  IXA: { name: "Agartala Airport", city: "Agartala", country: "IN" },
  AYJ: { name: "Maharishi Valmiki International Airport", city: "Ayodhya", country: "IN" },
  IXB: { name: "Bagdogra Airport", city: "Siliguri", country: "IN" },
  RGH: { name: "Balurghat Airport", city: "Balurghat", country: "IN" },
  SHL: { name: "Shillong Airport", city: "Shillong", country: "IN" },
  VNS: { name: "Lal Bahadur Shastri Airport", city: "Varanasi", country: "IN" },
  BBI: { name: "Biju Patnaik Airport", city: "Bhubaneswar", country: "IN" },
  CCU: {
    name: "Netaji Subhash Chandra Bose International Airport",
    city: "Kolkata",
    country: "IN"
  },
  COH: { name: "Cooch Behar Airport", city: "", country: "IN" },
  CWK: { name: "Chitrakoot Airport", city: "Chitrakoot", country: "IN" },
  DBD: { name: "Dhanbad Airport", city: "", country: "IN" },
  DBR: { name: "Darbhanga Airport", city: "", country: "IN" },
  DGH: { name: "Deoghar Airport", city: "Deoghar", country: "IN" },
  DEP: { name: "Daporijo Airport", city: "Daporijo", country: "IN" },
  GOP: { name: "Gorakhpur Airport", city: "Gorakhpur", country: "IN" },
  GAU: {
    name: "Lokpriya Gopinath Bordoloi International Airport",
    city: "Guwahati",
    country: "IN"
  },
  GAY: { name: "Gaya Airport", city: "", country: "IN" },
  HGI: { name: "Donyi Polo Airport", city: "Itanagar", country: "IN" },
  IMF: { name: "Imphal Airport", city: "Imphal", country: "IN" },
  JRG: { name: "Jharsuguda Airport", city: "Veer Surendra Sai", country: "IN" },
  PYB: { name: "Jeypore Airport", city: "Jeypore", country: "IN" },
  IXW: { name: "Jamshedpur Airport", city: "", country: "IN" },
  JRH: { name: "Jorhat Airport", city: "Jorhat", country: "IN" },
  KBK: { name: "Kushinagar Airport", city: "", country: "IN" },
  IXQ: { name: "Kamalpur Airport", city: "", country: "IN" },
  IXH: { name: "Kailashahar Airport", city: "", country: "IN" },
  IXS: { name: "Silchar Airport", city: "Silchar", country: "IN" },
  IXN: { name: "Khowai Airport", city: "Khowai", country: "IN" },
  AJL: { name: "Lengpui Airport", city: "Aizawl", country: "IN" },
  IXI: { name: "North Lakhimpur Airport", city: "Lilabari", country: "IN" },
  LDA: { name: "Malda Airport", city: "Malda", country: "IN" },
  DIB: { name: "Dibrugarh Airport", city: "Dibrugarh", country: "IN" },
  DMU: { name: "Dimapur Airport", city: "Dimapur", country: "IN" },
  MZU: { name: "Muzaffarpur Airport", city: "", country: "IN" },
  IXT: { name: "Pasighat Airport", city: "Pasighat", country: "IN" },
  PAT: { name: "Lok Nayak Jayaprakash Airport", city: "Patna", country: "IN" },
  PYG: { name: "Pakyong Airport", city: "Pakyong", country: "IN" },
  IXR: { name: "Birsa Munda Airport", city: "Ranchi", country: "IN" },
  RRK: { name: "Rourkela Airport", city: "", country: "IN" },
  RUP: { name: "Rupsi India Airport", city: "", country: "IN" },
  TEI: { name: "Tezu Airport", city: "Tezu", country: "IN" },
  TEZ: { name: "Tezpur Airport", city: "", country: "IN" },
  ZER: { name: "Zero Airport", city: "", country: "IN" },
  BZL: { name: "Barisal Airport", city: "Barisal", country: "BD" },
  CXB: { name: "Cox's Bazar Airport", city: "Cox's Bazar", country: "BD" },
  CGP: { name: "Shah Amanat International Airport", city: "Chittagong", country: "BD" },
  DAC: {
    name: "Dhaka / Hazrat Shahjalal International Airport",
    city: "Dhaka",
    country: "BD"
  },
  JSR: { name: "Jessore Airport", city: "Jashahor", country: "BD" },
  RJH: { name: "Shah Mokhdum Airport", city: "Rajshahi", country: "BD" },
  SPD: { name: "Saidpur Airport", city: "Saidpur", country: "BD" },
  ZYL: { name: "Osmany International Airport", city: "Sylhet", country: "BD" },
  HKG: { name: "Chek Lap Kok International Airport", city: "Hong Kong", country: "HK" },
  AGR: { name: "Agra Airport", city: "", country: "IN" },
  IXD: { name: "Allahabad Airport", city: "Allahabad", country: "IN" },
  ATQ: {
    name: "Sri Guru Ram Dass Jee International Airport Amritsar",
    city: "Amritsar",
    country: "IN"
  },
  AIP: { name: "Adampur Air Force Station", city: "", country: "IN" },
  BKB: { name: "Nal Airport", city: "Bikaner", country: "IN" },
  KUU: { name: "Kullu Manali Airport", city: "", country: "IN" },
  BUP: { name: "Bhatinda Air Force Station", city: "", country: "IN" },
  BEK: { name: "Bareilly Air Force Station", city: "", country: "IN" },
  IXC: { name: "Chandigarh Airport", city: "Chandigarh", country: "IN" },
  KNU: { name: "Kanpur Chakeri Airport", city: "Kanpur", country: "IN" },
  DED: { name: "Dehradun Airport", city: "Dehradun", country: "IN" },
  DEL: { name: "Indira Gandhi International Airport", city: "New Delhi", country: "IN" },
  DHM: { name: "Kangra Airport", city: "", country: "IN" },
  GWL: { name: "Gwalior Airport", city: "Gwalior", country: "IN" },
  HSS: { name: "Hissar Airport", city: "", country: "IN" },
  HWR: { name: "Halwara International Airport", city: "Ludhiana", country: "IN" },
  JDH: { name: "Jodhpur Airport", city: "Jodhpur", country: "IN" },
  JAI: { name: "Jaipur International Airport", city: "Jaipur", country: "IN" },
  JSA: { name: "Jaisalmer Airport", city: "", country: "IN" },
  IXJ: { name: "Jammu Airport", city: "Jammu", country: "IN" },
  KQH: { name: "Kishangarh Airport, Ajmer", city: "Kishangarh", country: "IN" },
  KTU: { name: "Kota Airport", city: "", country: "IN" },
  LUH: { name: "Ludhiana Airport", city: "Ludhiana", country: "IN" },
  IXL: { name: "Leh Kushok Bakula Rimpochee Airport", city: "Leh", country: "IN" },
  LKO: {
    name: "Chaudhary Charan Singh International Airport",
    city: "Lucknow",
    country: "IN"
  },
  DXN: { name: "Noida International Airport", city: "Jewar", country: "IN" },
  IXP: { name: "Pathankot Air Force Station", city: "", country: "IN" },
  PGH: { name: "Pantnagar Airport", city: "Pantnagar", country: "IN" },
  SLV: { name: "Shimla Airport", city: "", country: "IN" },
  SXR: { name: "Sheikh ul Alam Airport", city: "Srinagar", country: "IN" },
  TNI: { name: "Satna Airport", city: "", country: "IN" },
  VSV: { name: "Shravasti Airport", city: "Shravasti", country: "IN" },
  PCQ: { name: "Boun Neau Airport", city: "Boun Neau", country: "LA" },
  OUI: { name: "Ban Huoeisay Airport", city: "", country: "LA" },
  LPQ: {
    name: "Luang Phabang International Airport",
    city: "Luang Phabang",
    country: "LA"
  },
  LXG: { name: "Luang Namtha Airport", city: "Luang Namtha", country: "LA" },
  NEU: { name: "Nong Khang Airport", city: "Nong Khang", country: "LA" },
  ODY: { name: "Oudomsay Airport", city: "Oudomsay", country: "LA" },
  PKZ: { name: "Pakse International Airport", city: "Pakse", country: "LA" },
  ZBY: { name: "Sayaboury Airport", city: "Sayaboury", country: "LA" },
  ZVK: { name: "Savannakhet Airport", city: "", country: "LA" },
  THK: { name: "Thakhek Airport", city: "Thakhek", country: "LA" },
  VTE: { name: "Wattay International Airport", city: "Vientiane", country: "LA" },
  XKH: { name: "Xieng Khouang Airport", city: "Xieng Khouang", country: "LA" },
  MFM: { name: "Macau International Airport", city: "Taipa", country: "MO" },
  BHP: { name: "Bhojpur Airport", city: "Bhojpur", country: "NP" },
  BHR: { name: "Bharatpur Airport", city: "Bharatpur", country: "NP" },
  BJU: { name: "Bajura Airport", city: "Bajura", country: "NP" },
  BIT: { name: "Baitadi Airport", city: "Baitadi", country: "NP" },
  BWA: { name: "Bhairahawa Airport", city: "Bhairawa", country: "NP" },
  BDP: { name: "Bhadrapur Airport", city: "Bhadrapur", country: "NP" },
  DNP: { name: "Tulsipur Airport", city: "Dang", country: "NP" },
  DHI: { name: "Dhangarhi Airport", city: "Dhangarhi", country: "NP" },
  DOP: { name: "Dolpa Airport", city: "Dolpa", country: "NP" },
  SIH: { name: "Silgadi Doti Airport", city: "Silgadi Doti", country: "NP" },
  JIR: { name: "Jiri Airport", city: "Jiri", country: "NP" },
  JUM: { name: "Jumla Airport", city: "Jumla", country: "NP" },
  JKR: { name: "Janakpur Airport", city: "Janakpur", country: "NP" },
  JMO: { name: "Jomsom Airport", city: "Jomsom", country: "NP" },
  KTM: { name: "Tribhuvan International Airport", city: "Kathmandu", country: "NP" },
  LDN: { name: "Lamidanda Airport", city: "Lamidanda", country: "NP" },
  LUA: { name: "Lukla Airport", city: "Lukla", country: "NP" },
  LTG: { name: "Langtang Airport", city: "Langtang", country: "NP" },
  MEY: { name: "Meghauli Airport", city: "Meghauli", country: "NP" },
  KEP: { name: "Nepalgunj Airport", city: "Nepalgunj", country: "NP" },
  PKR: { name: "Pokhara Airport", city: "Pokhara", country: "NP" },
  PPL: { name: "Phaplu Airport", city: "Phaplu", country: "NP" },
  RJB: { name: "Rajbiraj Airport", city: "Rajbiraj", country: "NP" },
  RHP: { name: "Ramechhap Airport", city: "Ramechhap", country: "NP" },
  RUK: { name: "Rukumkot Airport", city: "Rukumkot", country: "NP" },
  RUM: { name: "Rumjatar Airport", city: "Rumjatar", country: "NP" },
  SIF: { name: "Simara Airport", city: "Simara", country: "NP" },
  SKH: { name: "Surkhet Airport", city: "Surkhet", country: "NP" },
  FEB: { name: "Sanfebagar Airport", city: "Sanfebagar", country: "NP" },
  IMK: { name: "Simikot Airport", city: "Simikot", country: "NP" },
  TPJ: { name: "Suketar Airport", city: "Taplejung", country: "NP" },
  TPU: { name: "Tikapur Airport", city: "Tikapur", country: "NP" },
  TMI: { name: "Tumling Tar Airport", city: "Tumling Tar", country: "NP" },
  BIR: { name: "Biratnagar Airport", city: "Biratnagar", country: "NP" },
  AGX: { name: "Agatti Airport", city: "", country: "IN" },
  BEP: { name: "Bellary Airport", city: "Bellary", country: "IN" },
  BLR: { name: "Bengaluru International Airport", city: "Bangalore", country: "IN" },
  VGA: { name: "Vijayawada Airport", city: "", country: "IN" },
  CJB: { name: "Coimbatore International Airport", city: "Coimbatore", country: "IN" },
  COK: { name: "Cochin International Airport", city: "Cochin", country: "IN" },
  CCJ: { name: "Calicut International Airport", city: "Calicut", country: "IN" },
  CDP: { name: "Cuddapah Airport", city: "", country: "IN" },
  CBD: { name: "Car Nicobar Air Force Station", city: "", country: "IN" },
  GOX: { name: "Manohar International Airport", city: "Mopa", country: "IN" },
  GBI: { name: "Kalaburagi", city: "Gulbarga", country: "IN" },
  GOI: { name: "Dabolim Airport", city: "Dabolim", country: "IN" },
  HYD: {
    name: "Rajiv Gandhi International Airport Shamshabad",
    city: "Hyderabad",
    country: "IN"
  },
  BPM: { name: "Begumpet Airport", city: "Hyderabad", country: "IN" },
  VDY: { name: "Vijayanagar Aerodrome (JSW)", city: "", country: "IN" },
  CNN: { name: "Kannur International Airport", city: "Mattannur", country: "IN" },
  KJB: { name: "Kurnool Airport", city: "Kurnool", country: "IN" },
  IXM: { name: "Madurai Airport", city: "Madurai", country: "IN" },
  IXE: { name: "Mangalore International Airport", city: "Mangalore", country: "IN" },
  MAA: { name: "Chennai International Airport", city: "Chennai", country: "IN" },
  MYQ: { name: "Mysore Airport", city: "Mysore", country: "IN" },
  IXZ: { name: "Vir Savarkar International Airport", city: "Port Blair", country: "IN" },
  PNY: { name: "Pondicherry Airport", city: "", country: "IN" },
  RJA: { name: "Rajahmundry Airport", city: "Rajahmundry", country: "IN" },
  RQY: { name: "Shivamogga Airport", city: "Shimoga", country: "IN" },
  SXV: { name: "Salem Airport", city: "", country: "IN" },
  TJV: { name: "Tanjore Air Force Base", city: "Thanjavur", country: "IN" },
  TCR: { name: "Tuticorin Southwest Airport", city: "", country: "IN" },
  TIR: { name: "Tirupati Airport", city: "Tirupati", country: "IN" },
  TRZ: {
    name: "Tiruchirapally Civil Airport Airport",
    city: "Tiruchirappally",
    country: "IN"
  },
  TRV: { name: "Trivandrum International Airport", city: "Trivandrum", country: "IN" },
  VTZ: { name: "Vishakhapatnam Airport", city: "Visakhapatnam", country: "IN" },
  WGC: { name: "Warangal Airport", city: "Warrangal", country: "IN" },
  BUT: { name: "Bathbalathang Domestic Airport", city: "Jakar", country: "BT" },
  GLU: { name: "Gelephu Airport", city: "Gelephu", country: "BT" },
  PBH: { name: "Paro Airport", city: "Paro", country: "BT" },
  HRF: { name: "Hoarafushi Airport", city: "Hoarafushi", country: "MV" },
  HDK: { name: "Kulhudhuffushi Airport", city: "Kulhudhuffushi", country: "MV" },
  FND: { name: "Funadhoo Airport", city: "Funadhoo", country: "MV" },
  NMF: { name: "Maafaru International Airport", city: "Maafaru", country: "MV" },
  IFU: { name: "Ifuru Airport", city: "Ifuru", country: "MV" },
  LMV: { name: "Madivaru Airport", city: "Madivaru", country: "MV" },
  DRV: { name: "Dharavandhoo Airport", city: "Dharavandhoo", country: "MV" },
  FVM: { name: "Fuvahmulah Airport", city: "Fuvahmulah Island", country: "MV" },
  GAN: { name: "Gan International Airport", city: "Gan", country: "MV" },
  HAQ: { name: "Hanimaadhoo International Airport", city: "Haa Dhaalu", country: "MV" },
  KDO: { name: "Kadhdhoo Airport", city: "Kadhdhoo", country: "MV" },
  MLE: { name: "Velana International Airport", city: "Mal\xE9", country: "MV" },
  GKK: { name: "Kooddoo Airport", city: "Kooddoo", country: "MV" },
  KDM: { name: "Kaadedhdhoo Airport", city: "Huvadhu Atoll", country: "MV" },
  DDD: { name: "Kudahuvadhoo Dhaalu Airport", city: "Dhaalu Atoll", country: "MV" },
  VAM: { name: "Villa International Airport", city: "Maamigili", country: "MV" },
  TMF: { name: "Thimarafushi Airport", city: "Thimarafushi", country: "MV" },
  RUL: { name: "Maavaarulaa Airport", city: "Gadhdhoo", country: "MV" },
  DMK: { name: "Don Mueang International Airport", city: "Bangkok", country: "TH" },
  KDT: { name: "Kamphaeng Saen Airport", city: "Nakhon Pathom", country: "TH" },
  KKM: { name: "Khok Kathiam Airport", city: "", country: "TH" },
  TDX: { name: "Trat Airport", city: "", country: "TH" },
  BKK: { name: "Suvarnabhumi Airport", city: "Bangkok", country: "TH" },
  UTP: { name: "U-Tapao International Airport", city: "Rayong", country: "TH" },
  CNX: { name: "Chiang Mai International Airport", city: "Chiang Mai", country: "TH" },
  HGN: { name: "Mae Hong Son Airport", city: "", country: "TH" },
  PYY: { name: "Mae Hong Son Airport", city: "Mae Hong Son", country: "TH" },
  LPT: { name: "Lampang Airport", city: "", country: "TH" },
  NNT: { name: "Nan Airport", city: "", country: "TH" },
  PRH: { name: "Phrae Airport", city: "", country: "TH" },
  CEI: { name: "Chiang Rai International Airport", city: "Chiang Rai", country: "TH" },
  BAO: { name: "Udorn Air Base", city: "Ban Mak Khaen", country: "TH" },
  PHY: { name: "Phetchabun Airport", city: "", country: "TH" },
  HHQ: { name: "Hua Hin Airport", city: "Hua Hin", country: "TH" },
  TKH: { name: "Takhli Airport", city: "", country: "TH" },
  MAQ: { name: "Mae Sot Airport", city: "", country: "TH" },
  THS: { name: "Sukhothai Airport", city: "", country: "TH" },
  PHS: { name: "Phitsanulok Airport", city: "", country: "TH" },
  TKT: { name: "Tak Airport", city: "", country: "TH" },
  UTR: { name: "Uttaradit Airport", city: "Uttaradit", country: "TH" },
  URT: { name: "Surat Thani Airport", city: "Surat Thani", country: "TH" },
  NAW: { name: "Narathiwat Airport", city: "", country: "TH" },
  CJM: { name: "Chumphon Airport", city: "", country: "TH" },
  NST: { name: "Nakhon Si Thammarat Airport", city: "Nakhon Si Thammarat", country: "TH" },
  KBV: { name: "Krabi Airport", city: "Krabi", country: "TH" },
  SGZ: { name: "Songkhla Airport", city: "", country: "TH" },
  PAN: { name: "Pattani Airport", city: "", country: "TH" },
  USM: { name: "Samui Airport", city: "Na Thon (Ko Samui Island)", country: "TH" },
  HKT: { name: "Phuket International Airport", city: "Phuket", country: "TH" },
  UNN: { name: "Ranong Airport", city: "", country: "TH" },
  HDY: { name: "Hat Yai International Airport", city: "Hat Yai", country: "TH" },
  TST: { name: "Trang Airport", city: "", country: "TH" },
  UTH: { name: "Udon Thani Airport", city: "Udon Thani", country: "TH" },
  SNO: { name: "Sakon Nakhon Airport", city: "", country: "TH" },
  PXR: { name: "Surin Airport", city: "", country: "TH" },
  KKC: { name: "Khon Kaen Airport", city: "Khon Kaen", country: "TH" },
  LOE: { name: "Loei Airport", city: "", country: "TH" },
  BFV: { name: "Buri Ram Airport", city: "", country: "TH" },
  NAK: { name: "Nakhon Ratchasima Airport", city: "", country: "TH" },
  UBP: { name: "Ubon Ratchathani Airport", city: "Ubon Ratchathani", country: "TH" },
  ROI: { name: "Roi Et Airport", city: "", country: "TH" },
  KOP: { name: "Nakhon Phanom Airport", city: "", country: "TH" },
  BMV: { name: "Buon Ma Thuot Airport", city: "Buon Ma Thuot", country: "VN" },
  VCL: { name: "Chu Lai International Airport", city: "Dung Quat Bay", country: "VN" },
  HPH: { name: "Cat Bi International Airport", city: "Haiphong", country: "VN" },
  CAH: { name: "Ca Mau Airport", city: "Ca Mau City", country: "VN" },
  CXR: { name: "Cam Ranh Airport", city: "Nha Trang", country: "VN" },
  VCS: { name: "Co Ong Airport", city: "Con Ong", country: "VN" },
  VCA: { name: "Tra Noc Airport", city: "Can Tho", country: "VN" },
  DIN: { name: "Dien Bien Phu Airport", city: "Dien Bien Phu", country: "VN" },
  VDH: { name: "Dong Hoi Airport", city: "Dong Hoi", country: "VN" },
  DLI: { name: "Lien Khuong Airport", city: "Dalat", country: "VN" },
  DAD: { name: "Da Nang International Airport", city: "Da Nang", country: "VN" },
  HAN: { name: "Noi Bai International Airport", city: "Hanoi", country: "VN" },
  SQH: { name: "Na-San Airport", city: "Son-La", country: "VN" },
  HUI: { name: "Phu Bai Airport", city: "Hue", country: "VN" },
  UIH: { name: "Phu Cat Airport", city: "Quy Nohn", country: "VN" },
  PXU: { name: "Pleiku Airport", city: "Pleiku", country: "VN" },
  PQC: { name: "Phu Quoc Airport", city: "Duong Dong", country: "VN" },
  PHA: { name: "Phan Rang Airport", city: "Phan Rang", country: "VN" },
  PHH: { name: "Phan Thiet Airport", city: "Phan Thiet", country: "VN" },
  VKG: { name: "Rach Gia Airport", city: "Rach Gia", country: "VN" },
  TBB: { name: "Dong Tac Airport", city: "Tuy Hoa", country: "VN" },
  SGN: {
    name: "Tan Son Nhat International Airport",
    city: "Ho Chi Minh City",
    country: "VN"
  },
  THD: { name: "Th\u1ECD Xu\xE2n Airport", city: "Thanh H\xF3a", country: "VN" },
  VDO: {
    name: "Van Don International Airport",
    city: "V\xE2n \u0110\u1ED3n",
    country: "VN"
  },
  VII: { name: "Vinh Airport", city: "Vinh", country: "VN" },
  VTG: { name: "Vung Tau Airport", city: "Vung Tau", country: "VN" },
  VBA: { name: "Ann Airport", city: "Aeng", country: "MM" },
  NYU: { name: "Bagan Airport", city: "Nyaung U", country: "MM" },
  BMO: { name: "Banmaw Airport", city: "Banmaw", country: "MM" },
  VBP: { name: "Bokpyinn Airport", city: "Bokpyinn", country: "MM" },
  TVY: { name: "Dawei Airport", city: "Dawei", country: "MM" },
  NYT: { name: "Naypyidaw Airport", city: "Pyinmana", country: "MM" },
  GAW: { name: "Gangaw Airport", city: "Gangaw", country: "MM" },
  GWA: { name: "Gwa Airport", city: "Gwa", country: "MM" },
  HEH: { name: "Heho Airport", city: "Heho", country: "MM" },
  HOX: { name: "Hommalinn Airport", city: "Hommalinn", country: "MM" },
  TIO: { name: "Tilin Airport", city: "Tilin", country: "MM" },
  KET: { name: "Kengtung Airport", city: "Kengtung", country: "MM" },
  KHM: { name: "Kanti Airport", city: "Kanti", country: "MM" },
  KMV: { name: "Kalay Airport", city: "Kalemyo", country: "MM" },
  KYP: { name: "Kyaukpyu Airport", city: "Kyaukpyu", country: "MM" },
  KAW: { name: "Kawthoung Airport", city: "Kawthoung", country: "MM" },
  KYT: { name: "Kyauktu Airport", city: "Kyauktu", country: "MM" },
  LIW: { name: "Loikaw Airport", city: "Loikaw", country: "MM" },
  LSH: { name: "Lashio Airport", city: "Lashio", country: "MM" },
  MDL: { name: "Mandalay International Airport", city: "Mandalay", country: "MM" },
  MGZ: { name: "Myeik Airport", city: "Mkeik", country: "MM" },
  MYT: { name: "Myitkyina Airport", city: "Myitkyina", country: "MM" },
  MNU: { name: "Mawlamyine Airport", city: "Mawlamyine", country: "MM" },
  MGU: { name: "Manaung Airport", city: "Manaung", country: "MM" },
  MOE: { name: "Momeik Airport", city: "", country: "MM" },
  MOG: { name: "Mong Hsat Airport", city: "Mong Hsat", country: "MM" },
  MGK: { name: "Mong Tong Airport", city: "Mong Tong", country: "MM" },
  MWQ: { name: "Magway Airport", city: "Magway", country: "MM" },
  NYW: { name: "Monywar Airport", city: "Monywar", country: "MM" },
  NMS: { name: "Namsang Airport", city: "Namsang", country: "MM" },
  PAU: { name: "Pauk Airport", city: "Pauk", country: "MM" },
  BSX: { name: "Pathein Airport", city: "Pathein", country: "MM" },
  PPU: { name: "Hpapun Airport", city: "Pa Pun", country: "MM" },
  PBU: { name: "Putao Airport", city: "Putao", country: "MM" },
  PKK: { name: "Pakhokku Airport", city: "Pakhokku", country: "MM" },
  PRU: { name: "Pyay Airport", city: "Pye", country: "MM" },
  AKY: { name: "Sittwe Airport", city: "Sittwe", country: "MM" },
  SNW: { name: "Thandwe Airport", city: "Thandwe", country: "MM" },
  THL: { name: "Tachileik Airport", city: "Tachileik", country: "MM" },
  RGN: { name: "Yangon International Airport", city: "Yangon", country: "MM" },
  TQQ: { name: "Maranggo Airport", city: "Waha-Tomea Island", country: "ID" },
  UPG: {
    name: "Hasanuddin International Airport",
    city: "Ujung Pandang-Celebes Island",
    country: "ID"
  },
  BIK: { name: "Frans Kaisiepo Airport", city: "Biak-Supiori Island", country: "ID" },
  ONI: { name: "Moanamani Airport", city: "Moanamani-Papua Island", country: "ID" },
  FOO: { name: "Kornasoren Airfield", city: "Kornasoren-Numfoor Island", country: "ID" },
  WET: { name: "Wagethe Airport", city: "Wagethe-Papua Island", country: "ID" },
  NBX: { name: "Nabire Airport", city: "Nabire-Papua Island", country: "ID" },
  ILA: { name: "Illaga Airport", city: "Illaga-Papua Island", country: "ID" },
  KOX: { name: "Kokonau Airport", city: "Kokonau-Papua Island", country: "ID" },
  ZRI: { name: "Serui Airport", city: "Serui-Japen Island", country: "ID" },
  TIM: { name: "Moses Kilangin Airport", city: "Timika-Papua Island", country: "ID" },
  EWI: { name: "Enarotali Airport", city: "Enarotali-Papua Island", country: "ID" },
  BMU: { name: "Muhammad Salahuddin Airport", city: "Bima-Sumbawa Island", country: "ID" },
  DPS: {
    name: "Ngurah Rai (Bali) International Airport",
    city: "Denpasar-Bali Island",
    country: "ID"
  },
  LOP: { name: "Bandara International Lombok Airport", city: "Mataram", country: "ID" },
  SWQ: { name: "Sumbawa Besar Airport", city: "Sumbawa Island", country: "ID" },
  TMC: { name: "Tambolaka Airport", city: "Waikabubak-Sumba Island", country: "ID" },
  WGP: { name: "Waingapu Airport", city: "Waingapu-Sumba Island", country: "ID" },
  GXM: { name: "Kuala Kurun", city: "Kuala Kurun", country: "ID" },
  YIA: {
    name: "Yogyakarta International Airport",
    city: "Yogyakarta, Java Island",
    country: "ID"
  },
  ARJ: { name: "Arso Airport", city: "Arso-Papua Island", country: "ID" },
  BUI: { name: "Bokondini Airport", city: "Bokondini-Papua Island", country: "ID" },
  ZRM: { name: "Sarmi Airport", city: "Sarmi-Papua Island", country: "ID" },
  DJJ: {
    name: "Sentani International Airport",
    city: "Jayapura-Papua Island",
    country: "ID"
  },
  LHI: { name: "Lereh Airport", city: "Lereh-Papua Island", country: "ID" },
  LII: { name: "Mulia Airport", city: "Mulia-Papua Island", country: "ID" },
  OKL: { name: "Oksibil Airport", city: "Oksibil-Papua Island", country: "ID" },
  WAR: { name: "Waris Airport", city: "Waris-Papua Island", country: "ID" },
  SEH: { name: "Senggeh Airport", city: "Senggeh-Papua Island", country: "ID" },
  UBR: { name: "Ubrub Airport", city: "Ubrub-Papua Island", country: "ID" },
  WMX: { name: "Wamena Airport", city: "Wamena-Papua Island", country: "ID" },
  MDP: { name: "Mindiptana Airport", city: "Mindiptana-Papua Island", country: "ID" },
  BXD: { name: "Bade Airport", city: "Bade-Papua Island", country: "ID" },
  MKQ: { name: "Mopah Airport", city: "Merauke-Papua Island", country: "ID" },
  OKQ: { name: "Okaba Airport", city: "Okaba-Papua Island", country: "ID" },
  KEI: { name: "Kepi Airport", city: "Kepi-Papua Island", country: "ID" },
  TMH: { name: "Tanah Merah Airport", city: "Tanah Merah-Papua Island", country: "ID" },
  TJS: {
    name: "Tanjung Harapan Airport",
    city: "Tanjung Selor, Borneo Island",
    country: "ID"
  },
  DTD: { name: "Datadawai Airport", city: "Datadawai, Borneo Island", country: "ID" },
  BEJ: {
    name: "Barau(Kalimaru) Airport",
    city: "Tanjung Redep, Borneo Island",
    country: "ID"
  },
  BPN: {
    name: "Sepinggan International Airport",
    city: "Balikpapan, Borneo Island",
    country: "ID"
  },
  TRK: { name: "Juwata Airport", city: "Tarakan Island", country: "ID" },
  AAP: {
    name: "Aji Pangeran Tumenggung Pranoto International Airport",
    city: "Samarinda, Borneo Island",
    country: "ID"
  },
  TSX: { name: "Tanjung Santan Airport", city: "Santan, Borneo Island", country: "ID" },
  GLX: { name: "Gamarmalamo Airport", city: "Galela-Celebes Island", country: "ID" },
  GTO: { name: "Jalaluddin Airport", city: "Gorontalo-Celebes Island", country: "ID" },
  NAH: { name: "Naha Airport", city: "Tahuna-Sangihe Island", country: "ID" },
  TLI: { name: "Toli Toli Airport", city: "Toli Toli-Celebes Island", country: "ID" },
  GEB: { name: "Gebe Airport", city: "Gebe Island", country: "ID" },
  KAZ: { name: "Kao Airport", city: "Kao-Celebes Island", country: "ID" },
  PLW: { name: "Mutiara Airport", city: "Palu-Celebes Island", country: "ID" },
  MDC: { name: "Sam Ratulangi Airport", city: "Manado-Celebes Island", country: "ID" },
  MNA: { name: "Melangguane Airport", city: "Karakelong Island", country: "ID" },
  PSJ: { name: "Kasiguncu Airport", city: "Poso-Celebes Island", country: "ID" },
  OTI: { name: "Pitu Airport", city: "Gotalalamo-Morotai Island", country: "ID" },
  TTE: {
    name: "Sultan Khairun Babullah Airport",
    city: "Sango-Ternate Island",
    country: "ID"
  },
  LUW: { name: "Bubung Airport", city: "Luwok-Celebes Island", country: "ID" },
  UOL: { name: "Buol Airport", city: "Buol-Celebes Island", country: "ID" },
  BTW: { name: "Batu Licin Airport", city: "Batu Licin, Borneo Island", country: "ID" },
  PKN: { name: "Iskandar Airport", city: "Pangkalanbun, Borneo Island", country: "ID" },
  KBU: { name: "Stagen Airport", city: "Laut Island", country: "ID" },
  TJG: { name: "Warukin Airport", city: "Tanta-Tabalong, Borneo Island", country: "ID" },
  BDJ: {
    name: "Syamsudin Noor Airport",
    city: "Banjarmasin, Borneo Island",
    country: "ID"
  },
  PKY: {
    name: "Tjilik Riwut Airport",
    city: "Palangkaraya-Kalimantan Tengah",
    country: "ID"
  },
  SMQ: { name: "Sampit(Hasan) Airport", city: "Sampit, Borneo Island", country: "ID" },
  AHI: { name: "Amahai Airport", city: "Amahai-Seram Island", country: "ID" },
  NDA: { name: "Banda Airport Kepulauan", city: "Banda Island", country: "ID" },
  DOB: { name: "Dobo Airport", city: "Dobo-Kobror Island", country: "ID" },
  MAL: { name: "Mangole Airport Falabisahaya", city: "Mangole Island", country: "ID" },
  NRE: { name: "Namrole Airport", city: "Namrole-Buru Island", country: "ID" },
  LAH: {
    name: "Oesman Sadik Airport Labuha",
    city: "Labuha-Halmahera Island",
    country: "ID"
  },
  SXK: { name: "Saumlaki Airport", city: "Saumlaki-Yamdena Island", country: "ID" },
  BJK: { name: "Nangasuri Airport", city: "Maikoor Island", country: "ID" },
  LUV: { name: "Dumatumbun Airport", city: "Langgur-Seram Island", country: "ID" },
  SQN: { name: "Emalamo Sanana Airport", city: "Sanana-Seram Island", country: "ID" },
  AMQ: { name: "Pattimura Airport Ambon", city: "Ambon", country: "ID" },
  NAM: { name: "Namlea Airport", city: "Namlea-Buru Island", country: "ID" },
  TAX: { name: "Taliabu Island Airport", city: "Tikong-Taliabu Island", country: "ID" },
  WBA: { name: "WahaiSeram Island", city: "Seram Island", country: "ID" },
  RTU: { name: "Maratua Airport", city: "Maratua Island", country: "ID" },
  MLG: { name: "Abdul Rachman Saleh Airport", city: "Malang, Java Island", country: "ID" },
  CPF: { name: "Cepu Airport", city: "Tjepu, Java Island", country: "ID" },
  JOG: {
    name: "Adi Sutjipto International Airport",
    city: "Yogyakarta, Java Island",
    country: "ID"
  },
  SOC: {
    name: "Adi Sumarmo Wiryokusumo Airport",
    city: "Sukarata(Solo), Java Island",
    country: "ID"
  },
  SUB: { name: "Juanda International Airport", city: "Surabaya", country: "ID" },
  SRG: { name: "Achmad Yani Airport", city: "Semarang, Java Island", country: "ID" },
  SUP: { name: "Trunojoyo Airport", city: "Sumenep-Madura Island", country: "ID" },
  NTI: { name: "Stenkol Airport", city: "Bintuni-Papua Island", country: "ID" },
  RSK: { name: "Abresso Airport", city: "Ransiki-Papua Island", country: "ID" },
  KEQ: { name: "Kebar Airport", city: "Kebar-Papua Island", country: "ID" },
  FKQ: { name: "Fakfak Airport", city: "Fakfak-Papua Island", country: "ID" },
  INX: { name: "Inanwatan Airport", city: "Inanwatan Airport-Papua Island", country: "ID" },
  KNG: { name: "Kaimana Airport", city: "Kaimana-Papua Island", country: "ID" },
  RDE: { name: "Merdei Airport", city: "Merdei-Papua Island", country: "ID" },
  BXB: { name: "Babo Airport", city: "Babo-Papua Island", country: "ID" },
  MKW: { name: "Rendani Airport", city: "Manokwari-Papua Island", country: "ID" },
  SOQ: { name: "Sorong (Jefman) Airport", city: "Sorong-Papua Island", country: "ID" },
  TXM: { name: "Teminabuan Airport", city: "Atinjoe-Papua Island", country: "ID" },
  WSR: { name: "Wasior Airport", city: "Wasior-Papua Island", country: "ID" },
  BJW: { name: "Soa Airport", city: "Bajawa", country: "ID" },
  MOF: { name: "Maumere(Wai Oti) Airport", city: "Maumere-Flores Island", country: "ID" },
  ENE: {
    name: "Ende (H Hasan Aroeboesman) Airport",
    city: "Ende-Flores Island",
    country: "ID"
  },
  RTG: { name: "Satar Tacik Airport", city: "Satar Tacik-Flores Island", country: "ID" },
  ARD: { name: "Mali Airport", city: "Alor Island", country: "ID" },
  LBJ: {
    name: "Komodo (Mutiara II) Airport",
    city: "Labuan Bajo-Flores Island",
    country: "ID"
  },
  KOE: { name: "El Tari Airport", city: "Kupang-Timor Island", country: "ID" },
  BUW: { name: "Betoambari Airport", city: "Bau Bau-Butung Island", country: "ID" },
  MJU: { name: "Tampa Padang Airport", city: "Mamuju-Celebes Island", country: "ID" },
  MXB: { name: "Andi Jemma Airport", city: "Masamba-Celebes Island", country: "ID" },
  KXB: { name: "Sangia Nibandera Airport", city: "Kolaka", country: "ID" },
  SQR: { name: "Soroako Airport", city: "Soroako-Celebes Island", country: "ID" },
  KDI: { name: "Wolter Monginsidi Airport", city: "Kendari-Celebes Island", country: "ID" },
  BTU: { name: "Bintulu Airport", city: "Bintulu", country: "MY" },
  BLG: { name: "Belaga Airport", city: "Belaga", country: "MY" },
  LSM: { name: "Long Semado Airport", city: "Long Semado", country: "MY" },
  LGL: { name: "Long Lellang Airport", city: "Long Datih", country: "MY" },
  KCH: { name: "Kuching International Airport", city: "Kuching", country: "MY" },
  ODN: { name: "Long Seridan Airport", city: "Long Seridan", country: "MY" },
  LMN: { name: "Limbang Airport", city: "Limbang", country: "MY" },
  MKM: { name: "Mukah Airport", city: "Mukah", country: "MY" },
  LKH: { name: "Long Akah Airport", city: "Long Akah", country: "MY" },
  MUR: { name: "Marudi Airport", city: "Marudi", country: "MY" },
  BSE: { name: "Sematan Airport", city: "Sematan", country: "MY" },
  KPI: { name: "Kapit Airport", city: "Kapit", country: "MY" },
  BKM: { name: "Bakalalan Airport", city: "Bakalalan", country: "MY" },
  MYY: { name: "Miri Airport", city: "Miri", country: "MY" },
  SBW: { name: "Sibu Airport", city: "Sibu", country: "MY" },
  TGC: { name: "Tanjung Manis Airport", city: "Tanjung Manis", country: "MY" },
  LSU: { name: "Long Sukang Airport", city: "Long Sukang", country: "MY" },
  LWY: { name: "Lawas Airport", city: "Lawas", country: "MY" },
  SGG: { name: "Simanggang Airport", city: "Simanggang", country: "MY" },
  BBN: { name: "Bario Airport", city: "Bario", country: "MY" },
  SMM: { name: "Semporna Airport", city: "Semporna", country: "MY" },
  LDU: { name: "Lahad Datu Airport", city: "Lahad Datu", country: "MY" },
  TEL: { name: "Telupid Airport", city: "Telupid", country: "MY" },
  KGU: { name: "Keningau Airport", city: "Keningau", country: "MY" },
  SXS: { name: "Sahabat [Sahabat 16] Airport", city: "Sahabat", country: "MY" },
  BKI: {
    name: "Kota Kinabalu International Airport",
    city: "Kota Kinabalu",
    country: "MY"
  },
  LBU: { name: "Labuan Airport", city: "Labuan", country: "MY" },
  TMG: { name: "Tomanggong Airport", city: "Tomanggong", country: "MY" },
  GSA: { name: "Long Pasia Airport", city: "Long Miau", country: "MY" },
  SPE: { name: "Sepulot Airport", city: "Sepulot", country: "MY" },
  PAY: { name: "Pamol Airport", city: "Pamol", country: "MY" },
  RNU: { name: "Ranau Airport", city: "Ranau", country: "MY" },
  SDK: { name: "Sandakan Airport", city: "Sandakan", country: "MY" },
  KUD: { name: "Kudat Airport", city: "Kudat", country: "MY" },
  TWU: { name: "Tawau Airport", city: "Tawau", country: "MY" },
  MZV: { name: "Mulu Airport", city: "Mulu", country: "MY" },
  BWN: { name: "Brunei International Airport", city: "Bandar Seri Begawan", country: "BN" },
  AKQ: { name: "Menggala Airport", city: "Menggala, Sumatra Island", country: "ID" },
  PKU: {
    name: "Sultan Syarif Kasim Ii (Simpang Tiga) Airport",
    city: "Pekanbaru, Sumatra Island",
    country: "ID"
  },
  DUM: { name: "Pinang Kampai Airport", city: "Dumai, Sumatra Island", country: "ID" },
  RKO: { name: "Rokot Airport", city: "Sipora Island", country: "ID" },
  TJB: { name: "Tanjung Balai Airport", city: "Karinmunbesar Island", country: "ID" },
  KJT: {
    name: "Kertajati International Airport",
    city: "Bandung, Majalengka Regency",
    country: "ID"
  },
  BDO: {
    name: "Husein Sastranegara International Airport",
    city: "Bandung, Java Island",
    country: "ID"
  },
  CBN: { name: "Penggung Airport", city: "Cirebon, Java Island", country: "ID" },
  TSY: { name: "Cibeureum Airport", city: "Tasikmalaya, Java Island", country: "ID" },
  TKG: {
    name: "Radin Inten II (Branti) Airport",
    city: "Bandar Lampung, Sumatra Island",
    country: "ID"
  },
  BTH: { name: "Hang Nadim Airport", city: "Batam, Batam Island", country: "ID" },
  PPR: {
    name: "Pasir Pangaraan Airport",
    city: "Pasir Pengarayan, Sumatra Island",
    country: "ID"
  },
  TNJ: { name: "Kijang Airport", city: "Tanjung Pinang-Bintan Island", country: "ID" },
  SIQ: { name: "Dabo Airport", city: "Pasirkuning-Singkep Island", country: "ID" },
  PDG: {
    name: "Minangkabau Airport",
    city: "Ketaping/Padang, Sumatra Island",
    country: "ID"
  },
  HLP: {
    name: "Halim Perdanakusuma International Airport",
    city: "Jakarta",
    country: "ID"
  },
  CXP: { name: "Tunggul Wulung Airport", city: "Cilacap, Java Island", country: "ID" },
  PCB: { name: "Pondok Cabe Air Base", city: "Jakarta", country: "ID" },
  CGK: { name: "Soekarno-Hatta International Airport", city: "Jakarta", country: "ID" },
  KRC: { name: "Depati Parbo Airport", city: "Sungai Penuh", country: "ID" },
  GNS: { name: "Binaka Airport", city: "Gunung Sitoli, Nias Island", country: "ID" },
  AEG: {
    name: "Aek Godang Airport",
    city: "Padang Sidempuan, Sumatra Island",
    country: "ID"
  },
  MES: { name: "Soewondo Air Force Base", city: "Medan, Sumatra Island", country: "ID" },
  KNO: {
    name: "Polonia International Airport",
    city: "Medan, Sumatra Island",
    country: "ID"
  },
  DTB: { name: "Silangit Airport", city: "Tingkeum, Sumatra Island", country: "ID" },
  SIW: { name: "Parapat Airport", city: "Parapat, Sumatra Island", country: "ID" },
  FLZ: {
    name: "Dr Ferdinand Lumban Tobing Airport",
    city: "Sibolga, Sumatra Island",
    country: "ID"
  },
  TJQ: {
    name: "Buluh Tumbang (H A S Hanandjoeddin) Airport",
    city: "Tanjung Pandan, Belitung Island",
    country: "ID"
  },
  NPO: { name: "Nanga Pinoh I Airport", city: "Nanga Pinoh, Borneo Island", country: "ID" },
  KTG: {
    name: "Ketapang (Rahadi Usman) Airport",
    city: "Ketapang, Borneo Island",
    country: "ID"
  },
  MWK: { name: "Tarempa Airport", city: "Matak Island", country: "ID" },
  NTX: { name: "Ranai Airport", city: "Ranai, Natuna Besar Island", country: "ID" },
  PNK: { name: "Supadio Airport", city: "Pontianak, Borneo Island", country: "ID" },
  PSU: { name: "Pangsuma Airport", city: "Putussibau, Borneo Island", country: "ID" },
  DJB: { name: "Sultan Thaha Airport", city: "Jambi, Sumatra Island", country: "ID" },
  LLJ: { name: "Silampari", city: "Lubuk Linggau, Sumatra Island", country: "ID" },
  PGK: {
    name: "Pangkal Pinang (Depati Amir) Airport",
    city: "Pangkal Pinang, Palaubangka Island",
    country: "ID"
  },
  BKS: {
    name: "Padang Kemiling (Fatmawati Soekarno) Airport",
    city: "Bengkulu, Sumatra Island",
    country: "ID"
  },
  WYK: { name: "Gatot Subrato Airport", city: "Batu Raja, Sumatra Island", country: "ID" },
  PLM: {
    name: "Sultan Mahmud Badaruddin Ii Airport",
    city: "Palembang, Sumatra Island",
    country: "ID"
  },
  PDO: { name: "Pendopo Airport", city: "Talang Gudang, Sumatra Island", country: "ID" },
  RGT: { name: "Japura Airport", city: "Rengat, Sumatra Island", country: "ID" },
  MPC: { name: "Muko Muko Airport", city: "Muko Muko, Sumatra Island", country: "ID" },
  KLQ: { name: "Keluang Airport", city: "Keluang, Sumatra Island", country: "ID" },
  TPK: { name: "Teuku Cut Ali Airport", city: "Tapak Tuan, Sumatra Island", country: "ID" },
  MEQ: { name: "Cut Nyak Dien Airport", city: "Peureumeue, Sumatra Island", country: "ID" },
  LSX: { name: "Lhok Sukon Airport", city: "Lhok Sukon, Sumatra Island", country: "ID" },
  LSW: {
    name: "Malikus Saleh Airport",
    city: "Lhok Seumawe, Sumatra Island",
    country: "ID"
  },
  SBG: { name: "Maimun Saleh Airport", city: "Sabang, We Island", country: "ID" },
  BTJ: {
    name: "Sultan Iskandarmuda Airport",
    city: "Banda Aceh, Sumatra Island",
    country: "ID"
  },
  SXT: { name: "Sungai Tiang Airport", city: "Taman Negara", country: "MY" },
  MEP: { name: "Mersing Airport", city: "Mersing", country: "MY" },
  SWY: { name: "Sitiawan Airport", city: "Sitiawan", country: "MY" },
  TPG: { name: "Taiping (Tekah) Airport", city: "Taiping", country: "MY" },
  TOD: { name: "Pulau Tioman Airport", city: "Pulau Tioman", country: "MY" },
  AOR: { name: "Sultan Abdul Halim Airport", city: "Alor Satar", country: "MY" },
  BWH: { name: "Butterworth Airport", city: "Butterworth", country: "MY" },
  KBR: { name: "Sultan Ismail Petra Airport", city: "Kota Baharu", country: "MY" },
  KUA: { name: "Kuantan Airport", city: "Kuantan", country: "MY" },
  KTE: { name: "Kerteh Airport", city: "Kerteh", country: "MY" },
  IPH: { name: "Sultan Azlan Shah Airport", city: "Ipoh", country: "MY" },
  JHB: { name: "Senai International Airport", city: "Senai", country: "MY" },
  KUL: { name: "Kuala Lumpur International Airport", city: "Kuala Lumpur", country: "MY" },
  LGK: { name: "Langkawi International Airport", city: "Langkawi", country: "MY" },
  MKZ: { name: "Malacca Airport", city: "Malacca", country: "MY" },
  TGG: { name: "Sultan Mahmud Airport", city: "Kuala Terengganu", country: "MY" },
  PEN: { name: "Penang International Airport", city: "Penang", country: "MY" },
  PKG: { name: "Pulau Pangkor Airport", city: "Pangkor Island", country: "MY" },
  RDN: { name: "LTS Pulau Redang Airport", city: "Redang", country: "MY" },
  SZB: {
    name: "Sultan Abdul Aziz Shah International Airport",
    city: "Subang",
    country: "MY"
  },
  DTR: { name: "Decatur Shores Airport", city: "Anacortes", country: "US" },
  AUT: { name: "Atauro Airport", city: "Atauro", country: "TL" },
  UAI: { name: "Suai Airport", city: "Suai", country: "TL" },
  DIL: {
    name: "Presidente Nicolau Lobato International Airport",
    city: "Dili",
    country: "TL"
  },
  BCH: { name: "Cakung Airport", city: "Baucau", country: "TL" },
  MPT: { name: "Maliana Airport", city: "Maliana", country: "TL" },
  OEC: { name: "Oecussi Airport", city: "Oecussi-Ambeno", country: "TL" },
  VIQ: { name: "Viqueque Airport", city: "Viqueque", country: "TL" },
  ABU: { name: "Haliwen Airport", city: "Atambua-Timor Island", country: "ID" },
  LKA: { name: "Gewayentana Airport", city: "Larantuka-Flores Island", country: "ID" },
  SAU: { name: "Sawu Airport", city: "Sawu-Sawu Island", country: "ID" },
  SGQ: { name: "Sanggata Airport", city: "Sanggata-Timor Island", country: "ID" },
  LBW: { name: "Long Bawan Airport", city: "Long Bawan, Borneo Island", country: "ID" },
  BXT: { name: "Bontang Airport", city: "Bontang, Borneo Island", country: "ID" },
  NNX: { name: "Nunukan Airport", city: "Nunukan-Nunukan Island", country: "ID" },
  TNB: { name: "Tanah Grogot Airport", city: "Tanah Grogot, Borneo Island", country: "ID" },
  LPU: { name: "Long Apung Airport", city: "Long Apung, Borneo Island", country: "ID" },
  QPG: { name: "Paya Lebar Air Base", city: "", country: "SG" },
  TGA: { name: "Tengah Air Base", city: "", country: "SG" },
  XSP: { name: "Seletar Airport", city: "Seletar", country: "SG" },
  SIN: { name: "Singapore Changi International Airport", city: "Singapore", country: "SG" },
  SKL: { name: "Skye Bridge Ashaig Airport", city: "Broadford", country: "GB" },
  ALH: { name: "Albany Airport", city: "Albany", country: "AU" },
  ABG: { name: "Abingdon Downs Airport", city: "", country: "AU" },
  AWN: { name: "Alton Downs Airport", city: "", country: "AU" },
  AUD: { name: "Augustus Downs Airport", city: "", country: "AU" },
  MRP: { name: "Marla Airport", city: "", country: "AU" },
  AXL: { name: "Alexandria Homestead Airport", city: "", country: "AU" },
  AXC: { name: "Aramac Airport", city: "", country: "AU" },
  ADO: { name: "Andamooka Airport", city: "", country: "AU" },
  AMX: { name: "Ammaroo Airport", city: "", country: "AU" },
  AMT: { name: "Amata Airport", city: "", country: "AU" },
  WLP: { name: "West Angelas Airport", city: "", country: "AU" },
  AYL: { name: "Anthony Lagoon Airport", city: "", country: "AU" },
  ABH: { name: "Alpha Airport", city: "", country: "AU" },
  ARY: { name: "Ararat Airport", city: "", country: "AU" },
  GYL: { name: "Argyle Airport", city: "", country: "AU" },
  ARM: { name: "Armidale Airport", city: "Armidale", country: "AU" },
  AAB: { name: "Arrabury Airport", city: "", country: "AU" },
  AUU: { name: "Aurukun Airport", city: "", country: "AU" },
  AWP: { name: "Austral Downs Airport", city: "", country: "AU" },
  AVG: { name: "Auvergne Airport", city: "", country: "AU" },
  AYQ: { name: "Ayers Rock Connellan Airport", city: "Ayers Rock", country: "AU" },
  AYR: { name: "Ayr Airport", city: "", country: "AU" },
  ABM: { name: "Bamaga Injinoo Airport", city: "", country: "AU" },
  BCI: { name: "Barcaldine Airport", city: "Barcaldine", country: "AU" },
  ASP: { name: "Alice Springs Airport", city: "Alice Springs", country: "AU" },
  BDD: { name: "Badu Island Airport", city: "", country: "AU" },
  BKP: { name: "Barkly Downs Airport", city: "", country: "AU" },
  BNE: { name: "Brisbane International Airport", city: "Brisbane", country: "AU" },
  OOL: { name: "Gold Coast Airport", city: "Gold Coast", country: "AU" },
  BKQ: { name: "Blackall Airport", city: "Blackall", country: "AU" },
  CNS: { name: "Cairns International Airport", city: "Cairns", country: "AU" },
  CTL: { name: "Charleville Airport", city: "Charleville", country: "AU" },
  BDW: { name: "Bedford Downs Airport", city: "", country: "AU" },
  BXG: { name: "Bendigo Airport", city: "", country: "AU" },
  BVI: { name: "Birdsville Airport", city: "", country: "AU" },
  BXF: { name: "Pumululu National Park", city: "Bellburn", country: "AU" },
  BTX: { name: "Betoota Airport", city: "", country: "AU" },
  OCM: { name: "Boolgeeda Airport", city: "", country: "AU" },
  BQW: { name: "Balgo Hill Airport", city: "", country: "AU" },
  BHQ: { name: "Broken Hill Airport", city: "Broken Hill", country: "AU" },
  HTI: { name: "Hamilton Island Airport", city: "Hamilton Island", country: "AU" },
  BEU: { name: "Bedourie Airport", city: "", country: "AU" },
  BIW: { name: "Billiluna Airport", city: "", country: "AU" },
  BZP: { name: "Bizant Airport", city: "Lakefield National Park", country: "AU" },
  BRK: { name: "Bourke Airport", city: "", country: "AU" },
  BUC: { name: "Burketown Airport", city: "", country: "AU" },
  BLN: { name: "Benalla Airport", city: "", country: "AU" },
  LCN: { name: "Balcanoona Airport", city: "", country: "AU" },
  BLS: { name: "Bollon Airport", city: "", country: "AU" },
  BQB: { name: "Busselton Regional Airport", city: "Busselton", country: "AU" },
  ISA: { name: "Mount Isa Airport", city: "Mount Isa", country: "AU" },
  MCY: { name: "Sunshine Coast Airport", city: "Maroochydore", country: "AU" },
  MKY: { name: "Mackay Airport", city: "Mackay", country: "AU" },
  BNK: { name: "Ballina Byron Gateway Airport", city: "Ballina", country: "AU" },
  BSJ: { name: "Bairnsdale Airport", city: "", country: "AU" },
  GIC: { name: "Boigu Airport", city: "", country: "AU" },
  OKY: { name: "Oakey Airport", city: "", country: "AU" },
  BQL: { name: "Boulia Airport", city: "", country: "AU" },
  BMP: { name: "Brampton Island Airport", city: "", country: "AU" },
  PPP: { name: "Proserpine Whitsunday Coast Airport", city: "Proserpine", country: "AU" },
  ROK: { name: "Rockhampton Airport", city: "Rockhampton", country: "AU" },
  BOX: { name: "Borroloola Airport", city: "", country: "AU" },
  BME: { name: "Broome International Airport", city: "Broome", country: "AU" },
  BZD: { name: "Balranald Airport", city: "", country: "AU" },
  BTD: { name: "Brunette Downs Airport", city: "", country: "AU" },
  BWQ: { name: "Brewarrina Airport", city: "", country: "AU" },
  BYP: { name: "Barimunya Airport", city: "", country: "AU" },
  BHS: { name: "Bathurst Airport", city: "Bathurst", country: "AU" },
  BRT: { name: "Bathurst Island Airport", city: "", country: "AU" },
  TSV: { name: "Townsville Airport", city: "Townsville", country: "AU" },
  BLT: { name: "Blackwater Airport", city: "", country: "AU" },
  BDB: { name: "Bundaberg Airport", city: "Bundaberg", country: "AU" },
  BUY: { name: "Bunbury Airport", city: "", country: "AU" },
  BIP: { name: "Bulimba Airport", city: "", country: "AU" },
  ZBO: { name: "Bowen Airport", city: "", country: "AU" },
  WEI: { name: "Weipa Airport", city: "Weipa", country: "AU" },
  WTB: { name: "Toowoomba Wellcamp Airport", city: "Wellcamp", country: "AU" },
  BWB: { name: "Barrow Island Airport", city: "", country: "AU" },
  BVZ: { name: "Beverley Springs Airport", city: "", country: "AU" },
  CGV: { name: "Caiguna Airport", city: "", country: "AU" },
  CLH: { name: "Coolah Airport", city: "", country: "AU" },
  CVQ: { name: "Carnarvon Airport", city: "", country: "AU" },
  CSI: { name: "Casino Airport", city: "", country: "AU" },
  CAZ: { name: "Cobar Airport", city: "", country: "AU" },
  COJ: { name: "Coonabarabran Airport", city: "", country: "AU" },
  CBY: { name: "Canobie Airport", city: "Canobie", country: "AU" },
  CBI: { name: "Cape Barren Island Airport", city: "", country: "AU" },
  CPD: { name: "Coober Pedy Airport", city: "", country: "AU" },
  CRB: { name: "Collarenebri Airport", city: "", country: "AU" },
  CCL: { name: "Chinchilla Airport", city: "", country: "AU" },
  CNC: { name: "Coconut Island Airport", city: "", country: "AU" },
  CNJ: { name: "Cloncurry Airport", city: "Cloncurry", country: "AU" },
  CBX: { name: "Condobolin Airport", city: "", country: "AU" },
  CUD: { name: "Caloundra Airport", city: "", country: "AU" },
  CED: { name: "Ceduna Airport", city: "", country: "AU" },
  CVC: { name: "Cleve Airport", city: "", country: "AU" },
  CFI: { name: "Camfield Airport", city: "", country: "AU" },
  CFH: {
    name: "Clifton Hills Landing Strip",
    city: "Clifton Hills Station",
    country: "AU"
  },
  LLG: { name: "Chillagoe Airport", city: "", country: "AU" },
  CKW: { name: "Graeme Rowley Aerodrome", city: "Christmas Creek mine", country: "AU" },
  CXT: { name: "Charters Towers Airport", city: "", country: "AU" },
  DCN: { name: "RAAF Base Curtin", city: "", country: "AU" },
  CKI: { name: "Croker Island Airport", city: "", country: "AU" },
  CTN: { name: "Cooktown Airport", city: "", country: "AU" },
  CMQ: { name: "Clermont Airport", city: "", country: "AU" },
  CMA: { name: "Cunnamulla Airport", city: "", country: "AU" },
  CML: { name: "Camooweal Airport", city: "", country: "AU" },
  NIF: { name: "Camp Nifty Airport", city: "", country: "AU" },
  CES: { name: "Cessnock Airport", city: "", country: "AU" },
  CNB: { name: "Coonamble Airport", city: "", country: "AU" },
  ODL: { name: "Cordillo Downs Airport", city: "Cordillo Downs", country: "AU" },
  CUQ: { name: "Coen Airport", city: "", country: "AU" },
  CIE: { name: "Collie Airport", city: "", country: "AU" },
  OOM: { name: "Cooma Snowy Mountains Airport", city: "Cooma", country: "AU" },
  CDA: { name: "Cooinda Airport", city: "", country: "AU" },
  CWW: { name: "Corowa Airport", city: "", country: "AU" },
  CYG: { name: "Corryong Airport", city: "", country: "AU" },
  CXQ: { name: "Christmas Creek Station Airport", city: "", country: "AU" },
  CDQ: { name: "Croydon Airport", city: "", country: "AU" },
  KCE: { name: "Collinsville Airport", city: "", country: "AU" },
  CMD: { name: "Cootamundra Airport", city: "", country: "AU" },
  CUG: { name: "Cudal Airport", city: "", country: "AU" },
  CUY: { name: "Cue Airport", city: "", country: "AU" },
  CJF: { name: "Coondewanna Airport", city: "", country: "AU" },
  CWR: { name: "Cowarie Airport", city: "", country: "AU" },
  CCW: { name: "Cowell Airport", city: "", country: "AU" },
  CWT: { name: "Cowra Airport", city: "", country: "AU" },
  COY: { name: "Coolawanyah Airport", city: "", country: "AU" },
  DBY: { name: "Dalby Airport", city: "", country: "AU" },
  DRN: { name: "Dirranbandi Airport", city: "", country: "AU" },
  DNB: { name: "Dunbar Airport", city: "", country: "AU" },
  DRB: { name: "Derby Airport", city: "", country: "AU" },
  DFP: { name: "Drumduff Airport", city: "Drumduff", country: "AU" },
  DGD: { name: "Dalgaranga Gold Mine Airport", city: "", country: "AU" },
  DXD: { name: "Dixie Airport", city: "New Dixie", country: "AU" },
  DKI: { name: "Dunk Island Airport", city: "", country: "AU" },
  DLK: { name: "Dulkaninna Airport", city: "Dulkaninna", country: "AU" },
  DNQ: { name: "Deniliquin Airport", city: "", country: "AU" },
  DDN: { name: "Delta Downs Airport", city: "", country: "AU" },
  DLV: { name: "Delissaville Airport", city: "", country: "AU" },
  DYW: { name: "Daly Waters Airport", city: "Daly Waters", country: "AU" },
  DMD: { name: "Doomadgee Airport", city: "", country: "AU" },
  DVR: { name: "Daly River Airport", city: "", country: "AU" },
  NLF: { name: "Darnley Island Airport", city: "Darnley Island", country: "AU" },
  DRD: { name: "Dorunda Airport", city: "", country: "AU" },
  DVP: { name: "Davenport Downs Airport", city: "", country: "AU" },
  DPO: { name: "Devonport Airport", city: "Devonport", country: "AU" },
  DOX: { name: "Dongara Airport", city: "", country: "AU" },
  DRY: { name: "Drysdale River Airport", city: "", country: "AU" },
  DHD: { name: "Durham Downs Airport", city: "", country: "AU" },
  DRR: { name: "Durrie Airport", city: "", country: "AU" },
  DKV: { name: "Docker River Airport", city: "", country: "AU" },
  DYA: { name: "Dysart Airport", city: "", country: "AU" },
  ECH: { name: "Echuca Airport", city: "", country: "AU" },
  EUC: { name: "Eucla Airport", city: "", country: "AU" },
  ETD: { name: "Etadunna Airport", city: "Etadunna", country: "AU" },
  ENB: { name: "Eneabba Airport", city: "Eneabba", country: "AU" },
  EIH: { name: "Einasleigh Airport", city: "Einasleigh", country: "AU" },
  ELC: { name: "Elcho Island Airport", city: "Elcho Island", country: "AU" },
  EMD: { name: "Emerald Airport", city: "Emerald", country: "AU" },
  ERB: { name: "Ernabella Airport", city: "", country: "AU" },
  EPR: { name: "Esperance Airport", city: "", country: "AU" },
  EVD: { name: "Eva Downs Airport", city: "Eva Downs", country: "AU" },
  EVH: { name: "Evans Head Aerodrome", city: "", country: "AU" },
  EXM: { name: "Exmouth Airport", city: "", country: "AU" },
  FRB: { name: "Forbes Airport", city: "Forbes", country: "AU" },
  KFE: {
    name: "Fortescue - Dave Forrest Aerodrome",
    city: "Cloudbreak Village",
    country: "AU"
  },
  FLY: { name: "Finley Airport", city: "", country: "AU" },
  FLS: { name: "Flinders Island Airport", city: "", country: "AU" },
  FVL: { name: "Flora Valley Airport", city: "", country: "AU" },
  FIK: { name: "Finke Airport", city: "Finke", country: "AU" },
  FOS: { name: "Forrest Airport", city: "", country: "AU" },
  FOT: { name: "Forster (Wallis Is) Airport", city: "", country: "AU" },
  FIZ: { name: "Fitzroy Crossing Airport", city: "", country: "AU" },
  GBP: { name: "Gamboola Airport", city: "", country: "AU" },
  GAH: { name: "Gayndah Airport", city: "", country: "AU" },
  GBL: { name: "South Goulburn Is Airport", city: "", country: "AU" },
  GUH: { name: "Gunnedah Airport", city: "", country: "AU" },
  GOO: { name: "Goondiwindi Airport", city: "", country: "AU" },
  GDD: { name: "Gordon Downs Airport", city: "Gordon Downs", country: "AU" },
  GGD: { name: "Gregory Downs Airport", city: "", country: "AU" },
  GET: { name: "Geraldton Airport", city: "", country: "AU" },
  GFN: { name: "Grafton Airport", city: "", country: "AU" },
  GBW: { name: "Ginbata", city: "Ginbata", country: "AU" },
  GBV: { name: "Gibb River Airport", city: "", country: "AU" },
  GKL: { name: "Great Keppel Is Airport", city: "", country: "AU" },
  GLT: { name: "Gladstone Airport", city: "Gladstone", country: "AU" },
  GUL: { name: "Goulburn Airport", city: "", country: "AU" },
  GLG: { name: "Glengyle Airport", city: "", country: "AU" },
  GLI: { name: "Glen Innes Airport", city: "", country: "AU" },
  GLM: { name: "Glenormiston Airport", city: "", country: "AU" },
  GVP: { name: "Greenvale Airport", city: "", country: "AU" },
  GPN: { name: "Garden Point Airport", city: "", country: "AU" },
  GYZ: { name: "Gruyere Airport", city: "", country: "AU" },
  GSC: { name: "Gascoyne Junction Airport", city: "", country: "AU" },
  GTE: { name: "Groote Eylandt Airport", city: "Groote Eylandt", country: "AU" },
  GFF: { name: "Griffith Airport", city: "Griffith", country: "AU" },
  GTT: { name: "Georgetown Airport", city: "", country: "AU" },
  GEE: { name: "Georgetown (Tas) Airport", city: "", country: "AU" },
  GYP: { name: "Gympie Airport", city: "", country: "AU" },
  HWK: { name: "Wilpena Pound Airport", city: "Hawker", country: "AU" },
  HXX: { name: "Hay Airport", city: "", country: "AU" },
  HVB: { name: "Hervey Bay Airport", city: "Hervey Bay", country: "AU" },
  HUB: { name: "Humbert River Airport", city: "", country: "AU" },
  HRY: { name: "Henbury Airport", city: "", country: "AU" },
  HIP: { name: "Headingly Airport", city: "", country: "AU" },
  HIG: { name: "Highbury Airport", city: "", country: "AU" },
  HID: { name: "Horn Island Airport", city: "Horn Island", country: "AU" },
  HLL: { name: "Hillside Airport", city: "", country: "AU" },
  HCQ: { name: "Halls Creek Airport", city: "", country: "AU" },
  HMG: { name: "Hermannsburg Airport", city: "", country: "AU" },
  HLT: { name: "Hamilton Airport", city: "", country: "AU" },
  HOK: { name: "Hooker Creek Airport", city: "", country: "AU" },
  MHU: { name: "Mount Hotham Airport", city: "Mount Hotham", country: "AU" },
  HTU: { name: "Hopetoun Airport", city: "", country: "AU" },
  HSM: { name: "Horsham Airport", city: "", country: "AU" },
  HAT: { name: "Heathlands Airport", city: "", country: "AU" },
  HGD: { name: "Hughenden Airport", city: "", country: "AU" },
  IDK: { name: "Indulkana Airport", city: "", country: "AU" },
  IFL: { name: "Innisfail Airport", city: "", country: "AU" },
  IFF: { name: "Iffley Airport", city: "", country: "AU" },
  IGH: { name: "Ingham Airport", city: "", country: "AU" },
  IKP: { name: "Inkerman Airport", city: "", country: "AU" },
  INJ: { name: "Injune Airport", city: "", country: "AU" },
  INM: { name: "Innamincka Airport", city: "", country: "AU" },
  IVW: { name: "Inverway Airport", city: "Inverway", country: "AU" },
  ISI: { name: "Isisford Airport", city: "", country: "AU" },
  IVR: { name: "Inverell Airport", city: "", country: "AU" },
  JAB: { name: "Jabiru Airport", city: "", country: "AU" },
  JUN: { name: "Jundah Airport", city: "", country: "AU" },
  JCK: { name: "Julia Creek Airport", city: "", country: "AU" },
  JUR: { name: "Jurien Bay Airport", city: "", country: "AU" },
  UBU: { name: "Kalumburu Airport", city: "", country: "AU" },
  KDB: { name: "Kambalda Airport", city: "", country: "AU" },
  KAX: { name: "Kalbarri Airport", city: "", country: "AU" },
  KBY: { name: "Streaky Bay Airport", city: "", country: "AU" },
  KBJ: { name: "Kings Canyon Airport", city: "", country: "AU" },
  KCS: { name: "Kings Creek Airport", city: "", country: "AU" },
  KRA: { name: "Kerang Airport", city: "", country: "AU" },
  KNS: { name: "King Island Airport", city: "", country: "AU" },
  KBB: { name: "Kirkimbie Station Airport", city: "Kirkimbie", country: "AU" },
  KFG: { name: "Kalkgurung Airport", city: "", country: "AU" },
  KOH: { name: "Koolatah Airport", city: "", country: "AU" },
  KKP: { name: "Koolburra Airport", city: "Koolburra", country: "AU" },
  KRB: { name: "Karumba Airport", city: "", country: "AU" },
  KML: { name: "Kamileroi Airport", city: "", country: "AU" },
  KPS: { name: "Kempsey Airport", city: "", country: "AU" },
  KNI: { name: "Katanning Airport", city: "", country: "AU" },
  KWM: { name: "Kowanyama Airport", city: "Kowanyama", country: "AU" },
  KPP: { name: "Kalpowar Airport", city: "", country: "AU" },
  KGY: { name: "Kingaroy Airport", city: "", country: "AU" },
  KGC: { name: "Kingscote Airport", city: "", country: "AU" },
  KUG: { name: "Kubin Airport", city: "", country: "AU" },
  LWH: { name: "Lawn Hill Airport", city: "", country: "AU" },
  LGH: { name: "Leigh Creek Airport", city: "", country: "AU" },
  LNO: { name: "Leonora Airport", city: "Leonora", country: "AU" },
  LEL: { name: "Lake Evella Airport", city: "", country: "AU" },
  LFP: { name: "Lakefield Airport", city: "", country: "AU" },
  LDH: { name: "Lord Howe Island Airport", city: "Lord Howe Island", country: "AU" },
  IRG: { name: "Lockhart River Airport", city: "", country: "AU" },
  LTP: { name: "Lyndhurst Airport", city: "Lyndhurst", country: "AU" },
  LIB: { name: "Limbunya Station Airport", city: "", country: "AU" },
  LDC: { name: "Lindeman Island Airport", city: "Lindeman Island", country: "AU" },
  LSY: { name: "Lismore Airport", city: "Lismore", country: "AU" },
  LNH: { name: "Lake Nash Airport", city: "", country: "AU" },
  BBL: { name: "Ballera Airport", city: "", country: "AU" },
  LKD: { name: "Lakeland Airport", city: "", country: "AU" },
  LOC: { name: "Lock Airport", city: "Lock", country: "AU" },
  LOA: { name: "Lorraine Airport", city: "", country: "AU" },
  LTV: { name: "Lotus Vale Airport", city: "Lotus Vale", country: "AU" },
  LUU: { name: "Laura Airport", city: "", country: "AU" },
  LHG: { name: "Lightning Ridge Airport", city: "", country: "AU" },
  LRE: { name: "Longreach Airport", city: "Longreach", country: "AU" },
  LUT: { name: "New Laura Airport", city: "", country: "AU" },
  LER: { name: "Leinster Airport", city: "", country: "AU" },
  LVO: { name: "Laverton Airport", city: "", country: "AU" },
  TGN: { name: "Latrobe Valley Airport", city: "", country: "AU" },
  LZR: { name: "Lizard Island Airport", city: "", country: "AU" },
  UBB: { name: "Mabuiag Island Airport", city: "Mabuiag Island", country: "AU" },
  AVV: { name: "Avalon Airport", city: "Melbourne", country: "AU" },
  ABX: { name: "Albury Airport", city: "Albury", country: "AU" },
  MRG: { name: "Mareeba Airport", city: "", country: "AU" },
  MBB: { name: "Marble Bar Airport", city: "", country: "AU" },
  XMC: { name: "Mallacoota Airport", city: "", country: "AU" },
  MFP: { name: "Manners Creek Airport", city: "", country: "AU" },
  MLR: { name: "Millicent Airport", city: "", country: "AU" },
  DGE: { name: "Mudgee Airport", city: "Mudgee", country: "AU" },
  MQA: { name: "Mandora Airport", city: "Mandora", country: "AU" },
  MNW: { name: "Macdonald Downs Airport", city: "", country: "AU" },
  MKR: { name: "Meekatharra Airport", city: "", country: "AU" },
  MEB: { name: "Melbourne Essendon Airport", city: "", country: "AU" },
  MIM: { name: "Merimbula Airport", city: "Merimbula", country: "AU" },
  MLV: { name: "Merluna Airport", city: "", country: "AU" },
  MGT: { name: "Milingimbi Airport", city: "Milingimbi Island", country: "AU" },
  MNG: { name: "Maningrida Airport", city: "Maningrida", country: "AU" },
  GSN: { name: "Mount Gunson Airport", city: "Mount Gunson", country: "AU" },
  MGV: { name: "Margaret River (Station) Airport", city: "", country: "AU" },
  MQZ: { name: "Margaret River Airport", city: "", country: "AU" },
  MVU: { name: "Musgrave Airport", city: "", country: "AU" },
  HBA: { name: "Hobart International Airport", city: "Hobart", country: "AU" },
  MHO: { name: "Mount House Airport", city: "", country: "AU" },
  MCV: { name: "McArthur River Mine Airport", city: "McArthur River Mine", country: "AU" },
  MQL: { name: "Mildura Airport", city: "Mildura", country: "AU" },
  XML: { name: "Minlaton Airport", city: "", country: "AU" },
  MIH: { name: "Mitchell Plateau Airport", city: "Mitchell Plateau", country: "AU" },
  MWY: { name: "Miralwyn Airport", city: "", country: "AU" },
  MTQ: { name: "Mitchell Airport", city: "", country: "AU" },
  MJP: { name: "Manjimup Airport", city: "", country: "AU" },
  WLE: { name: "Miles Airport", city: "", country: "AU" },
  LST: { name: "Launceston Airport", city: "Launceston", country: "AU" },
  MBW: { name: "Melbourne Moorabbin Airport", city: "Melbourne", country: "AU" },
  WUI: { name: "Murrin Murrin Airport", city: "", country: "AU" },
  MEL: { name: "Melbourne International Airport", city: "Melbourne", country: "AU" },
  MMM: { name: "Middlemount Airport", city: "", country: "AU" },
  MTL: { name: "Maitland Airport", city: "", country: "AU" },
  WME: { name: "Mount Keith Airport", city: "", country: "AU" },
  ONR: { name: "Monkira Airport", city: "", country: "AU" },
  MSF: { name: "Mount Swan Airport", city: "", country: "AU" },
  OXY: { name: "Morney Airport", city: "", country: "AU" },
  MMG: { name: "Mount Magnet Airport", city: "", country: "AU" },
  OOR: { name: "Mooraberree Airport", city: "", country: "AU" },
  MRZ: { name: "Moree Airport", city: "Moree", country: "AU" },
  MET: { name: "Moreton Airport", city: "Moreton", country: "AU" },
  MIN: { name: "Minnipa Airport", city: "", country: "AU" },
  MQE: { name: "Marqua Airport", city: "Marqua", country: "AU" },
  MOV: { name: "Moranbah Airport", city: "Moranbah", country: "AU" },
  RRE: { name: "Marree Airport", city: "", country: "AU" },
  MWB: { name: "Morawa Airport", city: "", country: "AU" },
  MYA: { name: "Moruya Airport", city: "Moruya", country: "AU" },
  MTD: { name: "Mount Sanford Station Airport", city: "", country: "AU" },
  UTB: { name: "Muttaburra Airport", city: "", country: "AU" },
  MGB: { name: "Mount Gambier Airport", city: "", country: "AU" },
  ONG: { name: "Mornington Island Airport", city: "", country: "AU" },
  MNQ: { name: "Monto Airport", city: "", country: "AU" },
  MUQ: { name: "Muccan Station Airport", city: "Muccan Station", country: "AU" },
  MNE: { name: "Mungeranie Airport", city: "Mungeranie", country: "AU" },
  MYI: { name: "Murray Island Airport", city: "Murray Island", country: "AU" },
  MVK: { name: "Mulka Airport", city: "Mulka", country: "AU" },
  MUP: { name: "Mulga Park Airport", city: "", country: "AU" },
  MKV: { name: "Mount Cavenagh Airport", city: "", country: "AU" },
  MXU: { name: "Mullewa Airport", city: "", country: "AU" },
  MWT: { name: "Moolawatana Airport", city: "", country: "AU" },
  MXD: { name: "Marion Downs Airport", city: "", country: "AU" },
  MBH: { name: "Maryborough Airport", city: "", country: "AU" },
  MYO: { name: "Myroodan Station Airport", city: "", country: "AU" },
  RTY: { name: "Merty Merty Airport", city: "", country: "AU" },
  NMR: { name: "Nappa Merrie Airport", city: "", country: "AU" },
  NRA: { name: "Narrandera Airport", city: "Narrandera", country: "AU" },
  NAA: { name: "Narrabri Airport", city: "Narrabri", country: "AU" },
  RPM: { name: "Ngukurr Airport", city: "", country: "AU" },
  NBH: { name: "Nambucca Heads Airport", city: "Nambucca Heads", country: "AU" },
  NLS: { name: "Nicholson Airport", city: "", country: "AU" },
  NAC: { name: "Naracoorte Airport", city: "", country: "AU" },
  NRG: { name: "Narrogin Airport", city: "", country: "AU" },
  RVT: { name: "Ravensthorpe Airport", city: "", country: "AU" },
  NSV: { name: "Noosa Airport", city: "", country: "AU" },
  NSM: { name: "Norseman Airport", city: "", country: "AU" },
  NTN: { name: "Normanton Airport", city: "", country: "AU" },
  NUR: { name: "Nullabor Motel Airport", city: "", country: "AU" },
  NLL: { name: "Nullagine Airport", city: "", country: "AU" },
  NUB: { name: "Numbulwar Airport", city: "", country: "AU" },
  ZNE: { name: "Newman Airport", city: "Newman", country: "AU" },
  NYN: { name: "Nyngan Airport", city: "", country: "AU" },
  OPI: { name: "Oenpelli Airport", city: "", country: "AU" },
  XCO: { name: "Colac Airport", city: "", country: "AU" },
  OLP: { name: "Olympic Dam Airport", city: "Olympic Dam", country: "AU" },
  ONS: { name: "Onslow Airport", city: "", country: "AU" },
  ODD: { name: "Oodnadatta Airport", city: "", country: "AU" },
  MOO: { name: "Moomba Airport", city: "", country: "AU" },
  RBS: { name: "Orbost Airport", city: "", country: "AU" },
  OAG: { name: "Orange Airport", city: "Orange", country: "AU" },
  ODR: { name: "Ord River Airport", city: "Ord River", country: "AU" },
  OSO: { name: "Osborne Mine Airport", city: "", country: "AU" },
  OYN: { name: "Ouyen Airport", city: "", country: "AU" },
  ADL: { name: "Adelaide International Airport", city: "Adelaide", country: "AU" },
  PUG: { name: "Port Augusta Airport", city: "", country: "AU" },
  PMK: { name: "Palm Island Airport", city: "", country: "AU" },
  PBO: { name: "Paraburdoo Airport", city: "Paraburdoo", country: "AU" },
  CCK: {
    name: "Cocos (Keeling) Islands Airport",
    city: "Cocos (Keeling) Islands",
    country: "CC"
  },
  PDN: { name: "Parndana Airport", city: "Parndana", country: "AU" },
  PDE: { name: "Pandie Pandie Airport", city: "", country: "AU" },
  DRW: { name: "Darwin International Airport", city: "Darwin", country: "AU" },
  PRD: { name: "Pardoo Airport", city: "Pardoo", country: "AU" },
  BEO: { name: "Aeropelican Airport", city: "", country: "AU" },
  GOV: { name: "Gove Airport", city: "Nhulunbuy", country: "AU" },
  PPI: { name: "Port Pirie Airport", city: "", country: "AU" },
  JAD: { name: "Perth Jandakot Airport", city: "Perth", country: "AU" },
  KTA: { name: "Karratha Airport", city: "Karratha", country: "AU" },
  KGI: { name: "Kalgoorlie-Boulder Airport", city: "Kalgoorlie", country: "AU" },
  PKE: { name: "Parkes Airport", city: "Parkes", country: "AU" },
  PKT: { name: "Port Keats Airport", city: "", country: "AU" },
  KNX: { name: "Kununurra Airport", city: "Kununurra", country: "AU" },
  PLO: { name: "Port Lincoln Airport", city: "Port Lincoln", country: "AU" },
  LEA: { name: "Learmonth Airport", city: "Exmouth", country: "AU" },
  EDR: { name: "Pormpuraaw Airport", city: "", country: "AU" },
  PQQ: { name: "Port Macquarie Airport", city: "Port Macquarie", country: "AU" },
  PTJ: { name: "Portland Airport", city: "", country: "AU" },
  MBF: { name: "Porepunkah Airport", city: "", country: "AU" },
  PHE: { name: "Port Hedland International Airport", city: "Port Hedland", country: "AU" },
  PER: { name: "Perth International Airport", city: "Perth", country: "AU" },
  PEA: { name: "Penneshaw Airport", city: "Ironstone", country: "AU" },
  KTR: { name: "Tindal Airport", city: "", country: "AU" },
  UMR: { name: "Woomera Airfield", city: "Woomera", country: "AU" },
  XCH: { name: "Christmas Island Airport", city: "Christmas Island", country: "CX" },
  UIR: { name: "Quirindi Airport", city: "", country: "AU" },
  ULP: { name: "Quilpie Airport", city: "", country: "AU" },
  UEE: { name: "Queenstown Airport", city: "", country: "AU" },
  RMK: { name: "Renmark Airport", city: "", country: "AU" },
  RCM: { name: "Richmond Airport", city: "", country: "AU" },
  RAM: { name: "Ramingining Airport", city: "", country: "AU" },
  ROH: { name: "Robinhood Airport", city: "", country: "AU" },
  RBU: { name: "Roebourne Airport", city: "Roebourne", country: "AU" },
  RBC: { name: "Robinvale Airport", city: "", country: "AU" },
  RMA: { name: "Roma Airport", city: "Roma", country: "AU" },
  RPB: { name: "Roper Bar Airport", city: "", country: "AU" },
  RSB: { name: "Roseberth Airport", city: "", country: "AU" },
  RTS: { name: "Rottnest Island Airport", city: "", country: "AU" },
  RTP: { name: "Rutland Plains Airport", city: "", country: "AU" },
  RHL: { name: "Roy Hill Station Airport", city: "", country: "AU" },
  NDS: { name: "Sandstone Airport", city: "Sandstone", country: "AU" },
  BWU: { name: "Sydney Bankstown Airport", city: "Sydney", country: "AU" },
  CBR: { name: "Canberra International Airport", city: "Canberra", country: "AU" },
  CFS: { name: "Coffs Harbour Airport", city: "Coffs Harbour", country: "AU" },
  CDU: { name: "Camden Airport", city: "", country: "AU" },
  NSO: { name: "Scone Airport", city: "", country: "AU" },
  SQC: { name: "Southern Cross Airport", city: "", country: "AU" },
  DBO: { name: "Dubbo City Regional Airport", city: "Dubbo", country: "AU" },
  SGO: { name: "St George Airport", city: "", country: "AU" },
  SIX: { name: "Singleton Airport", city: "Singleton", country: "AU" },
  ZGL: { name: "South Galway Airport", city: "", country: "AU" },
  SGP: { name: "Shay Gap Airport", city: "Shay Gap", country: "AU" },
  MJK: { name: "Shark Bay Airport", city: "Monkey Mia", country: "AU" },
  SHT: { name: "Shepparton Airport", city: "", country: "AU" },
  SBR: { name: "Saibai Island Airport", city: "Saibai Island", country: "AU" },
  SIO: { name: "Smithton Airport", city: "", country: "AU" },
  SHU: { name: "Smith Point Airport", city: "", country: "AU" },
  STH: { name: "Strathmore Airport", city: "", country: "AU" },
  SNB: { name: "Snake Bay Airport", city: "", country: "AU" },
  NLK: { name: "Norfolk Island International Airport", city: "Burnt Pine", country: "NF" },
  NOA: { name: "Nowra Airport", city: "", country: "AU" },
  SLJ: { name: "Solomon Airport", city: "Karijini National Park", country: "AU" },
  SNH: { name: "Stanthorpe Airport", city: "", country: "AU" },
  SCG: { name: "Spring Creek Airport", city: "", country: "AU" },
  SHQ: { name: "Southport Airport", city: "", country: "AU" },
  KSV: { name: "Springvale Airport", city: "", country: "AU" },
  XRH: { name: "RAAF Base Richmond", city: "Richmond", country: "AU" },
  SRN: { name: "Strahan Airport", city: "", country: "AU" },
  SYD: {
    name: "Sydney Kingsford Smith International Airport",
    city: "Sydney",
    country: "AU"
  },
  HLS: { name: "St Helens Airport", city: "", country: "AU" },
  TMW: { name: "Tamworth Airport", city: "Tamworth", country: "AU" },
  WGA: { name: "Wagga Wagga City Airport", city: "Wagga Wagga", country: "AU" },
  SWH: { name: "Swan Hill Airport", city: "", country: "AU" },
  SWC: { name: "Stawell Airport", city: "", country: "AU" },
  XTR: { name: "Tara Airport", city: "", country: "AU" },
  TBL: { name: "Tableland Homestead Airport", city: "", country: "AU" },
  XTO: { name: "Taroom Airport", city: "", country: "AU" },
  TAQ: { name: "Tarcoola Airport", city: "Tarcoola", country: "AU" },
  TBK: { name: "Timber Creek Airport", city: "", country: "AU" },
  TDR: { name: "Theodore Airport", city: "", country: "AU" },
  TQP: { name: "Trepell Airport", city: "", country: "AU" },
  TEF: { name: "Telfer Airport", city: "", country: "AU" },
  TEM: { name: "Temora Airport", city: "", country: "AU" },
  TAN: { name: "Tangalooma Airport", city: "", country: "AU" },
  XTG: { name: "Thargomindah Airport", city: "", country: "AU" },
  GTS: { name: "The Granites Airport", city: "The Granites", country: "AU" },
  TDN: { name: "Theda Station Airport", city: "", country: "AU" },
  TYG: { name: "Thylungra Airport", city: "", country: "AU" },
  TYB: { name: "Tibooburra Airport", city: "", country: "AU" },
  TKY: { name: "Turkey Creek Airport", city: "Turkey Creek", country: "AU" },
  PHQ: { name: "The Monument Airport", city: "", country: "AU" },
  TPR: { name: "Tom Price Airport", city: "Tom Price", country: "AU" },
  TUM: { name: "Tumut Airport", city: "", country: "AU" },
  TYP: { name: "Tobermorey Airport", city: "Tobermorey", country: "AU" },
  ZBL: { name: "Thangool (Biloela) Airport", city: "Biloela", country: "AU" },
  TCA: { name: "Tennant Creek Airport", city: "Tennant Creek", country: "AU" },
  TCW: { name: "Tocumwal Airport", city: "", country: "AU" },
  TRO: { name: "Taree Airport", city: "Taree", country: "AU" },
  TTX: { name: "Truscott Mungalalu Airport", city: "", country: "AU" },
  TWB: { name: "Toowoomba Airport", city: "", country: "AU" },
  UDA: { name: "Undara Airport", city: "", country: "AU" },
  CZY: { name: "Cluny Airport", city: "", country: "AU" },
  USL: { name: "Useless Loop Airport", city: "", country: "AU" },
  VCD: { name: "Victoria River Downs Airport", city: "", country: "AU" },
  VNR: { name: "Vanrook Station Airport", city: "", country: "AU" },
  WLA: { name: "Wallal Airport", city: "Wallal", country: "AU" },
  WAV: { name: "Wave Hill Airport", city: "", country: "AU" },
  WMB: { name: "Warrnambool Airport", city: "", country: "AU" },
  SYU: { name: "Warraber Island Airport", city: "Sue Islet", country: "AU" },
  WIO: { name: "Wilcannia Airport", city: "", country: "AU" },
  WLC: { name: "Walcha Airport", city: "", country: "AU" },
  WAZ: { name: "Warwick Airport", city: "", country: "AU" },
  WND: { name: "Windarra Airport", city: "", country: "AU" },
  WNR: { name: "Windorah Airport", city: "", country: "AU" },
  WON: { name: "Wondoola Airport", city: "", country: "AU" },
  WGT: { name: "Wangaratta Airport", city: "", country: "AU" },
  WYA: { name: "Whyalla Airport", city: "Whyalla", country: "AU" },
  WIT: { name: "Wittenoom Airport", city: "", country: "AU" },
  WKB: { name: "Warracknabeal Airport", city: "", country: "AU" },
  WGE: { name: "Walgett Airport", city: "", country: "AU" },
  NTL: { name: "Newcastle Airport", city: "Williamtown", country: "AU" },
  WUN: { name: "Wiluna Airport", city: "", country: "AU" },
  WPK: { name: "Wrotham Park Airport", city: "", country: "AU" },
  WDI: { name: "Wondai Airport", city: "", country: "AU" },
  WOL: { name: "Wollongong Airport", city: "", country: "AU" },
  WLL: { name: "Wollogorang Airport", city: "", country: "AU" },
  SXE: { name: "West Sale Airport", city: "West Sale", country: "AU" },
  WLO: { name: "Waterloo Airport", city: "", country: "AU" },
  WIN: { name: "Winton Airport", city: "", country: "AU" },
  WUD: { name: "Wudinna Airport", city: "", country: "AU" },
  WEW: { name: "Wee Waa Airport", city: "", country: "AU" },
  WRW: { name: "Warrawagine Airport", city: "", country: "AU" },
  WWI: { name: "Woodie Woodie Airport", city: "Woodie Woodie", country: "AU" },
  WWY: { name: "West Wyalong Airport", city: "West Wyalong", country: "AU" },
  WYN: { name: "Wyndham Airport", city: "", country: "AU" },
  BWT: { name: "Wynyard Airport", city: "Burnie", country: "AU" },
  YLG: { name: "Yalgoo Airport", city: "Yalgoo", country: "AU" },
  OKR: { name: "Yorke Island Airport", city: "Yorke Island", country: "AU" },
  KYF: { name: "Yeelirrie Airport", city: "", country: "AU" },
  XMY: { name: "Yam Island Airport", city: "Yam Island", country: "AU" },
  YUE: { name: "Yuendumu Airport", city: "", country: "AU" },
  NGA: { name: "Young Airport", city: "", country: "AU" },
  ORR: { name: "Yorketown Airport", city: "", country: "AU" },
  KYI: { name: "Yalata Mission Airport", city: "Yalata Mission", country: "AU" },
  PEK: { name: "Beijing Capital International Airport", city: "Beijing", country: "CN" },
  PKX: { name: "Beijing Daxing International Airport", city: "Beijing", country: "CN" },
  AXF: { name: "Alxa Left Banner Bayanhot Airport", city: "Bayanhot", country: "CN" },
  RHT: { name: "Alxa Right Banner Badanjilin Airport", city: "Badanjilin", country: "CN" },
  CDE: { name: "Chengde Puning Airport", city: "Chengde", country: "CN" },
  CIF: { name: "Chifeng Airport", city: "Chifeng", country: "CN" },
  CIH: { name: "Changzhi Airport", city: "Changzhi", country: "CN" },
  DSN: { name: "Ordos Ejin Horo Airport", city: "Ordos", country: "CN" },
  DAT: { name: "Datong Airport", city: "Datong", country: "CN" },
  EJN: { name: "Ejina Banner Taolai Airport", city: "", country: "CN" },
  ERL: { name: "Erenhot Saiwusu International Airport", city: "Erenhot", country: "CN" },
  YIE: { name: "Aershan Yiershi Airport", city: "Arxan", country: "CN" },
  AEB: { name: "Tian Yang Air Base", city: "Baise", country: "CN" },
  HDG: { name: "Handan Airport", city: "Handan", country: "CN" },
  HET: { name: "Baita International Airport", city: "Hohhot", country: "CN" },
  HUO: { name: "Huolinguole Huolinhe Airport", city: "Holingol", country: "CN" },
  HLD: { name: "Dongshan Airport", city: "Hailar", country: "CN" },
  NZH: { name: "Manzhouli Xijiao Airport", city: "Manzhouli", country: "CN" },
  NAY: { name: "Beijing Nanyuan Airport", city: "Beijing", country: "CN" },
  BAV: { name: "Baotou Airport", city: "Baotou", country: "CN" },
  SZH: { name: "Shuozhou Zirun Airport", city: "Shuozhou", country: "CN" },
  SJW: {
    name: "Shijiazhuang Daguocun International Airport",
    city: "Shijiazhuang",
    country: "CN"
  },
  TSN: { name: "Tianjin Binhai International Airport", city: "Tianjin", country: "CN" },
  TGO: { name: "Tongliao Airport", city: "Tongliao", country: "CN" },
  UCB: { name: "Ulanqab Jining Airport", city: "Ulanqab", country: "CN" },
  WUA: { name: "Wuhai Airport", city: "Wuhai", country: "CN" },
  HLH: { name: "Ulanhot Airport", city: "Ulanhot", country: "CN" },
  XIL: { name: "Xilinhot Airport", city: "Xilinhot", country: "CN" },
  YCU: { name: "Yuncheng Guangong Airport", city: "Yuncheng", country: "CN" },
  TYN: { name: "Taiyuan Wusu Airport", city: "Taiyuan", country: "CN" },
  RLK: { name: "Bayannaoer Tianjitai Airport", city: "Bayannur", country: "CN" },
  NZL: { name: "Zhalantun Chengjisihan Airport", city: "Zalantun", country: "CN" },
  BHY: { name: "Beihai Airport", city: "Beihai", country: "CN" },
  CGD: { name: "Changde Airport", city: "Changde", country: "CN" },
  HJJ: { name: "Zhijiang Airport", city: "Huaihua", country: "CN" },
  HCZ: { name: "Chenzhou Beihu Airport", city: "Chenzhou", country: "CN" },
  DYG: { name: "Dayong Airport", city: "Dayong", country: "CN" },
  FUO: { name: "Foshan Shadi Airport", city: "Foshan", country: "CN" },
  CAN: { name: "Guangzhou Baiyun International Airport", city: "Guangzhou", country: "CN" },
  CSX: { name: "Changsha Huanghua Airport", city: "Changsha", country: "CN" },
  HNI: { name: "Hechi Jinchengjiang Airport", city: "Hechi", country: "CN" },
  HNY: { name: "Hengyang Airport", city: "Hengyang", country: "CN" },
  HUZ: { name: "Huizhou Airport", city: "Huizhou", country: "CN" },
  KWL: {
    name: "Guilin Liangjiang International Airport",
    city: "Guilin City",
    country: "CN"
  },
  LLF: { name: "Lingling Airport", city: "Yongzhou", country: "CN" },
  MXZ: { name: "Meixian Airport", city: "Meixian", country: "CN" },
  NNG: { name: "Nanning Wuxu Airport", city: "Nanning", country: "CN" },
  SWA: { name: "Shantou Waisha Airport", city: "Shantou", country: "CN" },
  ZUH: { name: "Zhuhai Airport", city: "Zhuhai", country: "CN" },
  HSC: { name: "Shaoguan Guitou Airport", city: "Shaoguan", country: "CN" },
  SZX: { name: "Shenzhen Bao'an International Airport", city: "Shenzhen", country: "CN" },
  WUZ: { name: "Wuzhou Xijiang Airport", city: "Wuzhou", country: "CN" },
  XIN: { name: "Xingning Airport", city: "Xingning", country: "CN" },
  YLX: { name: "Yulin Fumian Airport", city: "Yulin", country: "CN" },
  YYA: { name: "Yueyang Sanhe Airport", city: "Yueyang", country: "CN" },
  LZH: { name: "Bailian Airport", city: "Liuzhou", country: "CN" },
  ZHA: { name: "Zhanjiang Wuchuan Airport", city: "Zhanjiang", country: "CN" },
  AYN: { name: "Anyang Airport", city: "Anyang", country: "CN" },
  CGO: { name: "Xinzheng Airport", city: "Zhengzhou", country: "CN" },
  EHU: { name: "Ezhou Huahu Airport", city: "Ezhou", country: "CN" },
  ENH: { name: "Enshi Airport", city: "Enshi", country: "CN" },
  LHK: { name: "Guangzhou MR Air Base", city: "Guanghua", country: "CN" },
  WUH: { name: "Wuhan Tianhe International Airport", city: "Wuhan", country: "CN" },
  LYA: { name: "Luoyang Airport", city: "Luoyang", country: "CN" },
  NNY: { name: "Nanyang Airport", city: "Nanyang", country: "CN" },
  SHS: { name: "Shashi Airport", city: "Shashi", country: "CN" },
  WDS: { name: "Shiyan Wudangshan Airport", city: "Shiyan", country: "CN" },
  XFN: { name: "Xiangfan Airport", city: "Xiangfan", country: "CN" },
  XAI: { name: "Xinyang Minggang Airport", city: "Xinyang", country: "CN" },
  YIH: { name: "Yichang Airport", city: "Yichang", country: "CN" },
  HAK: { name: "Haikou Meilan International Airport", city: "Haikou", country: "CN" },
  BAR: { name: "Qionghai Boao Airport", city: "Qionghai", country: "CN" },
  SYX: { name: "Sanya Phoenix International Airport", city: "Sanya", country: "CN" },
  RGO: { name: "Orang Airport", city: "", country: "KP" },
  FNJ: { name: "Pyongyang International Airport", city: "Pyongyang", country: "KP" },
  DSO: { name: "Sondok Airport", city: "", country: "KP" },
  YJS: { name: "Samjiyon Airport", city: "Samjiyon", country: "KP" },
  AKA: { name: "Ankang Airport", city: "Ankang", country: "CN" },
  DNH: { name: "Dunhuang Airport", city: "Dunhuang", country: "CN" },
  HXD: { name: "Delingha Airport", city: "Delingha", country: "CN" },
  GOQ: { name: "Golmud Airport", city: "Golmud", country: "CN" },
  GYU: { name: "Guyuan Liupanshan Airport", city: "Guyuan", country: "CN" },
  HBQ: { name: "Haibei Qilian Airport", city: "Haibei", country: "CN" },
  HZG: { name: "Hanzhong Airport", city: "Hanzhong", country: "CN" },
  INC: { name: "Yinchuan Hedong International Airport", city: "Yinchuan", country: "CN" },
  JIC: { name: "Jinchuan Airport", city: "Jinchang", country: "CN" },
  JGN: { name: "Jiayuguan Airport", city: "Jiayuguan", country: "CN" },
  LHW: { name: "Lanzhou Zhongchuan Airport", city: "Lanzhou", country: "CN" },
  LNL: { name: "Longnan Chengxian Airport", city: "Longnan", country: "CN" },
  IQN: { name: "Qingyang Airport", city: "Qingyang", country: "CN" },
  THQ: { name: "Tianshui Maijishan Airport", city: "Tianshui", country: "CN" },
  XNN: { name: "Xining Caojiabu Airport", city: "Xining", country: "CN" },
  XIY: { name: "Xi'an Xianyang International Airport", city: "Xianyang", country: "CN" },
  ENY: { name: "Yan'an Airport", city: "Yan'an", country: "CN" },
  UYN: { name: "Yulin Airport", city: "Yulin", country: "CN" },
  ZHY: { name: "Zhongwei Shapotou Airport", city: "Zhongwei", country: "CN" },
  YZY: { name: "Ganzhou", city: "Zhangye", country: "CN" },
  AVK: { name: "Arvaikheer Airport", city: "Arvaikheer", country: "MN" },
  LTI: { name: "Altai Airport", city: "Altai", country: "MN" },
  BYN: { name: "Bayankhongor Airport", city: "Bayankhongor", country: "MN" },
  UGA: { name: "Bulgan Airport", city: "Bulgan", country: "MN" },
  UGT: { name: "Bulagtai Resort Airport", city: "Umnugobitour", country: "MN" },
  HBU: { name: "Bulgan Sum Airport", city: "", country: "MN" },
  UUN: { name: "Baruun Urt Airport", city: "", country: "MN" },
  COQ: { name: "Choibalsan Airport", city: "", country: "MN" },
  UBN: { name: "Chinggis Khaan International Airport", city: "Ulaanbaatar", country: "MN" },
  DLZ: { name: "Dalanzadgad Airport", city: "Dalanzadgad", country: "MN" },
  KHR: { name: "Kharkhorin Airport", city: "", country: "MN" },
  HJT: { name: "Khujirt Airport", city: "", country: "MN" },
  HVD: { name: "Khovd Airport", city: "Khovd", country: "MN" },
  MXV: { name: "Moron Airport", city: "Moron", country: "MN" },
  TNZ: { name: "Tosontsengel Airport", city: "Tosontsengel", country: "MN" },
  ULN: { name: "Buyant-Ukhaa International Airport", city: "Ulan Bator", country: "MN" },
  ULO: { name: "Ulaangom Airport", city: "", country: "MN" },
  ULG: { name: "Ulgii Mongolei Airport", city: "", country: "MN" },
  BSD: { name: "Baoshan Yunduan Airport", city: "", country: "CN" },
  DLU: { name: "Dali Airport", city: "Xiaguan", country: "CN" },
  DIG: { name: "Diqing Airport", city: "Shangri-La", country: "CN" },
  JHG: { name: "Xishuangbanna Gasa Airport", city: "Jinghong", country: "CN" },
  LNJ: { name: "Lincang Airport", city: "Lincang", country: "CN" },
  LJG: { name: "Lijiang Airport", city: "Lijiang", country: "CN" },
  LUM: { name: "Mangshi Airport", city: "Luxi", country: "CN" },
  KMG: { name: "Kunming Wujiaba International Airport", city: "Kunming", country: "CN" },
  SYM: { name: "Simao Airport", city: "Simao", country: "CN" },
  ZAT: { name: "Zhaotong Airport", city: "Zhaotong", country: "CN" },
  XMN: { name: "Xiamen Gaoqi International Airport", city: "Xiamen", country: "CN" },
  AQG: { name: "Anqing Airport", city: "Anqing", country: "CN" },
  BFU: { name: "Bengbu Airport", city: "Bengbu", country: "CN" },
  CZX: { name: "Changzhou Airport", city: "Changzhou", country: "CN" },
  KHN: { name: "Nanchang Changbei International Airport", city: "Nanchang", country: "CN" },
  DOY: { name: "Dongying Shengli Airport", city: "Dongying", country: "CN" },
  FUG: { name: "Fuyang Xiguan Airport", city: "Fuyang", country: "CN" },
  FOC: { name: "Fuzhou Changle International Airport", city: "Fuzhou", country: "CN" },
  JGS: { name: "Jinggangshan Airport", city: "Ji'an", country: "CN" },
  KOW: { name: "Ganzhou Airport", city: "Ganzhou", country: "CN" },
  HGH: { name: "Hangzhou Xiaoshan International Airport", city: "Hangzhou", country: "CN" },
  JDZ: { name: "Jingdezhen Airport", city: "Jingdezhen", country: "CN" },
  JNG: { name: "Jining Da'an Airport", city: "Jining", country: "CN" },
  JIU: { name: "Jiujiang Lushan Airport", city: "Jiujiang", country: "CN" },
  TNA: { name: "Yaoqiang Airport", city: "Jinan", country: "CN" },
  JUZ: { name: "Quzhou Airport", city: "Quzhou", country: "CN" },
  LCX: { name: "Longyan Guanzhishan Airport", city: "Longyan", country: "CN" },
  LYG: { name: "Lianyungang Airport", city: "Lianyungang", country: "CN" },
  HYN: { name: "Huangyan Luqiao Airport", city: "Huangyan", country: "CN" },
  LYI: { name: "Shubuling Airport", city: "Linyi", country: "CN" },
  NGB: { name: "Ningbo Lishe International Airport", city: "Ningbo", country: "CN" },
  NKG: { name: "Nanjing Lukou Airport", city: "Nanjing", country: "CN" },
  NTG: { name: "Nantong Airport", city: "Nantong", country: "CN" },
  HFE: { name: "Hefei Xinqiao International Airport", city: "Hefei", country: "CN" },
  PVG: { name: "Shanghai Pudong International Airport", city: "Shanghai", country: "CN" },
  TAO: { name: "Qingdao/Jiaodong Airport", city: "Qingdao", country: "CN" },
  JJN: { name: "Quanzhou Airport", city: "Quanzhou", country: "CN" },
  RUG: { name: "Rugao Air Base", city: "Rugao", country: "CN" },
  HIA: { name: "Lianshui Airport", city: "Huai'an", country: "CN" },
  SQJ: { name: "Sanming Shaxian Airport", city: "Sanming", country: "CN" },
  SQD: { name: "Sanqingshan", city: "Shangrao", country: "CN" },
  SHA: { name: "Shanghai Hongqiao International Airport", city: "Shanghai", country: "CN" },
  SZV: { name: "Guangfu Airport", city: "Suzhou", country: "CN" },
  TXN: { name: "Tunxi International Airport", city: "Huangshan", country: "CN" },
  WHA: { name: "Wuhu Xuanzhou Airport", city: "Wuhu", country: "CN" },
  WEF: { name: "Weifang Airport", city: "Weifang", country: "CN" },
  WEH: { name: "Weihai Airport", city: "Weihai", country: "CN" },
  WHU: { name: "Wuhu Air Base", city: "Wuhu", country: "CN" },
  WUX: { name: "Sunan Shuofang International Airport", city: "Wuxi", country: "CN" },
  WUS: { name: "Nanping Wuyishan Airport", city: "Wuyishan", country: "CN" },
  WNZ: { name: "Wenzhou Yongqiang Airport", city: "Wenzhou", country: "CN" },
  XUZ: { name: "Xuzhou Guanyin Airport", city: "Xuzhou", country: "CN" },
  YHJ: { name: "Nanchang Yaohu Airport", city: "Nanchang", country: "CN" },
  YNZ: { name: "Yancheng Airport", city: "Yancheng", country: "CN" },
  YNT: { name: "Penglai Intl", city: "Yantai", country: "CN" },
  YIW: { name: "Yiwu Airport", city: "Yiwu", country: "CN" },
  HSN: { name: "Zhoushan Airport", city: "Zhoushan", country: "CN" },
  NGQ: { name: "Ngari Gunsa Airport", city: "Shiquanhe", country: "CN" },
  AVA: { name: "Anshun Huangguoshu Airport", city: "Anshun", country: "CN" },
  BPX: { name: "Qamdo Bangda Airport", city: "Bangda", country: "CN" },
  BFJ: { name: "Bijie Airport", city: "Bijie", country: "CN" },
  BZX: { name: "Bazhong Enyang Airport", city: "Bazhong", country: "CN" },
  CKG: {
    name: "Chongqing Jiangbei International Airport",
    city: "Chongqing",
    country: "CN"
  },
  DZH: { name: "Dazhou Jinya Airport", city: "Dazhou", country: "CN" },
  DCY: { name: "Daocheng Yading Airport", city: "Daocheng County", country: "CN" },
  DDR: { name: "Rikaze Dingri Airport", city: "", country: "CN" },
  GYS: { name: "Guangyuan Airport", city: "Guangyuan", country: "CN" },
  KWE: { name: "Longdongbao Airport", city: "Guiyang", country: "CN" },
  GZG: { name: "Garze Gesar Airport", city: "Garze", country: "CN" },
  AHJ: { name: "Ngawa Hongyuan Airport", city: "Hongyuan", country: "CN" },
  JZH: { name: "Jiuzhai Huanglong Airport", city: "Jiuzhaigou", country: "CN" },
  KJH: { name: "Kaili Huangping Airport", city: "Kaili", country: "CN" },
  LZG: { name: "Langzhong Gucheng Airport", city: "Langzhong", country: "CN" },
  LLB: { name: "Qiannan Libo Airport", city: "", country: "CN" },
  LIA: { name: "Liangping Airport", city: "Liangping", country: "CN" },
  LXA: { name: "Lhasa Gonggar Airport", city: "Lhasa", country: "CN" },
  LZO: { name: "Luzhou Airport", city: "Luzhou", country: "CN" },
  WMT: { name: "Zunyi Maotai Airport", city: "Zunyi", country: "CN" },
  MIG: { name: "Mianyang Airport", city: "Mianyang", country: "CN" },
  NAO: { name: "Nanchong Airport", city: "Nanchong", country: "CN" },
  HZH: { name: "Qiandongnan Liping Airport", city: "", country: "CN" },
  LZY: { name: "Nyingchi Airport", city: "Nyingchi", country: "CN" },
  APJ: { name: "Ali Pulan Airport", city: "Burang", country: "CN" },
  LPF: { name: "Liupanshui Yuezhao Airport", city: "Liupanshui", country: "CN" },
  JIQ: { name: "Qianjiang Wulingshan Airport", city: "Chongqing", country: "CN" },
  TCZ: { name: "Tengchong Tuofeng Airport", city: "Tengchong", country: "CN" },
  TFU: { name: "Chengdu/Tianfu Airport", city: "Tianfu", country: "CN" },
  TEN: { name: "Tongren Fenghuang Airport", city: "", country: "CN" },
  CTU: { name: "Chengdu Shuangliu International Airport", city: "Chengdu", country: "CN" },
  CQW: { name: "Wulong Chongqing Xiannvshan Airport", city: "Wulong", country: "CN" },
  WSK: { name: "Wushan Chongqing Airport", city: "Wushan", country: "CN" },
  WXN: { name: "Wanxian Airport", city: "Wanxian", country: "CN" },
  XIC: { name: "Xichang Qingshan Airport", city: "Xichang", country: "CN" },
  YBP: { name: "Yibin Wuliangye  Airport", city: "Yibin", country: "CN" },
  ACX: { name: "Xingyi Airport", city: "Xingyi", country: "CN" },
  PZI: { name: "Panzhihua Baoanying Airport", city: "Panzhihua", country: "CN" },
  ZYI: { name: "Zunyi Xinzhou Airport", city: "Zunyi", country: "CN" },
  AKU: { name: "Aksu Airport", city: "Aksu", country: "CN" },
  AAT: { name: "Altay Air Base", city: "Altay", country: "CN" },
  BPL: { name: "Alashankou Bole (Bortala) airport", city: "Bole", country: "CN" },
  IQM: { name: "Qiemo Airport", city: "Qiemo", country: "CN" },
  HMI: { name: "Hami Airport", city: "Hami", country: "CN" },
  KCA: { name: "Kuqa Airport", city: "Kuqa", country: "CN" },
  KRL: { name: "Korla Airport", city: "Korla", country: "CN" },
  KRY: { name: "Karamay Airport", city: "Karamay", country: "CN" },
  DHH: { name: "Balikun Dahe Airport", city: "Barkol", country: "CN" },
  RQA: { name: "Ruoqiang Loulan Airport", city: "Ruoqiang", country: "CN" },
  KHG: { name: "Kashgar Airport", city: "Kashgar", country: "CN" },
  SXJ: { name: "Shanshan Airport", city: "Shanshan", country: "CN" },
  TCG: { name: "Tacheng Airport", city: "Tacheng", country: "CN" },
  HQL: { name: "Tashkurgan Khunjerab Airport", city: "Tashkurgan", country: "CN" },
  HTN: { name: "Hotan Airport", city: "Hotan", country: "CN" },
  TLQ: { name: "Turpan Jiaohe Airport", city: "Turpan", country: "CN" },
  TWC: { name: "Tumxuk Tangwangcheng Airport", city: "Tumxuk", country: "CN" },
  URC: { name: "Urumqi Diwopu International Airport", city: "Urumqi", country: "CN" },
  YIN: { name: "Yining Airport", city: "Yining", country: "CN" },
  YTW: { name: "Yutian Wanfang Airport", city: "Yutian", country: "CN" },
  ZFL: { name: "Zhaosu Tianma Airport", city: "Zhaosu", country: "CN" },
  AOG: { name: "Anshan Air Base", city: "Anshan", country: "CN" },
  NBS: { name: "Baishan Changbaishan Airport", city: "Baishan", country: "CN" },
  CGQ: { name: "Longjia Airport", city: "Changchun", country: "CN" },
  CNI: { name: "Changhai Airport", city: "Changhai", country: "CN" },
  CHG: { name: "Chaoyang Airport", city: "Chaoyang", country: "CN" },
  DDG: { name: "Dandong Airport", city: "Dandong", country: "CN" },
  DQA: { name: "Saertu Airport", city: "Daqing Shi", country: "CN" },
  HRB: { name: "Taiping Airport", city: "Harbin", country: "CN" },
  HEK: { name: "Heihe Airport", city: "Heihe", country: "CN" },
  JIL: { name: "Jilin Airport", city: "Jilin", country: "CN" },
  JMU: { name: "Jiamusi Airport", city: "Jiamusi", country: "CN" },
  JXA: { name: "Jixi Xingkaihu Airport", city: "Jixi", country: "CN" },
  JNZ: { name: "Jinzhou Airport", city: "Jinzhou", country: "CN" },
  LDS: { name: "Lindu Airport", city: "Yichun", country: "CN" },
  YUS: { name: "Yushu Batang Airport", city: "Yushu", country: "CN" },
  MDG: {
    name: "Mudanjiang Hailang International Airport",
    city: "Mudanjiang",
    country: "CN"
  },
  OHE: { name: "Gu-Lian Airport", city: "Mohe", country: "CN" },
  NDG: { name: "Qiqihar Sanjiazi Airport", city: "Qiqihar", country: "CN" },
  YSQ: { name: "Songyuan Chaganhu Airport", city: "Songyuan", country: "CN" },
  DLC: { name: "Zhoushuizi Airport", city: "Dalian", country: "CN" },
  TNH: { name: "Tonghua Sanyuanpu Airport", city: "Tonghua", country: "CN" },
  SHE: { name: "Taoxian Airport", city: "Shenyang", country: "CN" },
  XEN: { name: "Xingcheng Air Base", city: "", country: "CN" },
  YNJ: { name: "Yanji Chaoyangchuan Airport", city: "Yanji", country: "CN" },
  YKH: { name: "Yingkou Lanqi Airport", city: "Yingkou", country: "CN" },
  AYM: { name: "Yas Island Seaplane Base", city: "Yas Island", country: "AE" },
  BFY: { name: "Bengbu Tenghu Airport", city: "Bengbu", country: "CN" },
  DEJ: { name: "Tongren Deijan Airport", city: "Deijan", country: "CN" },
  DEQ: { name: "Deqing Moganshan Airport", city: "Deqing", country: "CN" },
  JNH: { name: "Jiaxing Nanhu Airport", city: "Jiaxing", country: "CN" },
  KBH: { name: "Buzwagi Airport", city: "Kahama", country: "TZ" },
  LHL: { name: "Lachin International Airport", city: "Lach\u0131n", country: "AZ" },
  LSG: {
    name: "Leshan Airport (under construction, unknown coordinates)",
    city: "Leshan",
    country: "CN"
  },
  MLH: {
    name: "EuroAirport Basel-Mulhouse-Freiburg Airport",
    city: "Saint-Louis",
    country: "FR"
  },
  MUM: { name: "Muli Airport", city: "Mal\xE9", country: "MV" },
  OUK: { name: "Out Skerries Airstrip", city: "Shetland", country: "GB" },
  WNJ: { name: "Weining Airport (under construction)", city: "Leshan", country: "CN" },
  YEH: { name: "Yinchuan Helanshan Airport", city: "Yinchuan", country: "CN" },
  ZSP: {
    name: "Zhushan Majiadu Airport (under construction, unknown coordinates)",
    city: "Shiyan",
    country: "CN"
  }
};

// src/lib/server/flights/airports.ts
var _airports = airports_default;
var _index = Object.entries(_airports).map(([code, a]) => ({
  text: `${code} ${a.name} ${a.city} ${a.country}`.toLowerCase(),
  code,
  entry: a
}));
function score(search, code, entry) {
  const iata = code.toLowerCase();
  const city = entry.city.toLowerCase();
  if (iata === search)
    return 0;
  if (iata.startsWith(search))
    return 1;
  if (city === search)
    return 2;
  if (city.startsWith(search))
    return 3;
  if (entry.name.toLowerCase().includes(search))
    return 4;
  return 5;
}
function searchAirports(q) {
  const search = q.toLowerCase().trim();
  const matches = _index.filter((a) => a.text.includes(search)).map((a) => ({ a, s: score(search, a.code, a.entry) }));
  matches.sort((x, y) => x.s - y.s || x.a.entry.name.localeCompare(y.a.entry.name));
  const bestScore = matches[0]?.s ?? 5;
  const cutoff = bestScore <= 1 ? 4 : bestScore <= 3 ? 5 : 6;
  const filtered = matches.filter((m) => m.s < cutoff);
  const results = filtered.length > 0 ? filtered : matches;
  return results.slice(0, 20).map(({ a }) => ({
    name: a.entry.name,
    code: a.code,
    city: a.entry.city,
    country: a.entry.country
  }));
}

// src/cli/commands/airports.ts
var airportsCommand = defineCommand({
  meta: { name: "airports", description: "Search airports by name, city, or IATA code" },
  args: {
    query: {
      type: "positional",
      description: "Search query (city, airport name, or IATA code)",
      required: true
    },
    limit: { type: "string", description: "Max results", default: "20" }
  },
  async run({ args }) {
    const limit = Number.parseInt(args.limit);
    const results = searchAirports(args.query).slice(0, limit);
    if (results.length === 0) {
      console.log(JSON.stringify({ err: "NO_MATCH", hint: `No airports matching '${args.query}'.` }));
      return;
    }
    for (const a of results)
      console.log(JSON.stringify(a));
  }
});

// src/cli/config.ts
import { mkdir, readFile, writeFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
var CONFIG_DIR = join(homedir(), ".config", "flt");
var CONFIG_FILE = join(CONFIG_DIR, "config.json");
var VALID_KEYS = new Set(["currency", "fmt", "seat", "pax", "limit"]);
async function loadConfig() {
  try {
    const raw = await readFile(CONFIG_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
async function saveConfig(config) {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(CONFIG_FILE, `${JSON.stringify(config, null, 2)}
`);
}
function isValidKey(key) {
  return VALID_KEYS.has(key);
}
function withDefaults(args, config, keys) {
  const merged = { ...args };
  for (const key of keys) {
    const val = config[key];
    if (val != null && (merged[key] == null || merged[key] === getArgDefault(key))) {
      merged[key] = val;
    }
  }
  return merged;
}
function getArgDefault(key) {
  const defaults = {
    currency: "EUR",
    fmt: "table",
    seat: "economy",
    pax: "1ad",
    limit: "10"
  };
  return defaults[key];
}

// src/cli/commands/config.ts
var configCommand = defineCommand({
  meta: { name: "config", description: "Get/set CLI defaults (currency, fmt, seat, pax, limit)" },
  args: {
    key: { type: "positional", description: "Config key (or omit to list all)", required: false },
    value: { type: "positional", description: "Value to set (omit to read)", required: false },
    unset: { type: "boolean", description: "Remove a key", default: false }
  },
  async run({ args }) {
    const config = await loadConfig();
    if (!args.key) {
      const entries = Object.entries(config).filter(([, v]) => v != null);
      if (entries.length === 0) {
        console.log("No config set. Use `flt config <key> <value>` to set defaults.");
        return;
      }
      for (const [k, v] of entries)
        console.log(`${k} = ${v}`);
      return;
    }
    if (!isValidKey(args.key)) {
      console.log(`Unknown key '${args.key}'. Valid: currency, fmt, seat, pax, limit`);
      return;
    }
    if (args.unset) {
      delete config[args.key];
      await saveConfig(config);
      console.log(`Unset '${args.key}'`);
      return;
    }
    if (!args.value) {
      console.log(config[args.key] ?? "(not set)");
      return;
    }
    config[args.key] = args.value;
    await saveConfig(config);
    console.log(`${args.key} = ${args.value}`);
  }
});

// src/cli/types.ts
var DEFAULT_FIELDS = "id,price,stops,dur,car,dep,arr,date";
var VIEW_FIELDS = {
  min: "id,price,stops,dur",
  std: DEFAULT_FIELDS,
  full: "id,price,stops,dur,car,flt_no,dep,arr,date,best,ret,ahead"
};

// src/cli/format.ts
var FIELD_MAP = {
  id: (o) => o.id,
  price: (o) => o.price,
  stops: (o) => String(o.stops),
  dur: (o) => o.duration,
  car: (o) => o.name,
  dep: (o) => o.departure === "??:??" ? "\u2014" : o.departure,
  arr: (o) => o.arrival === "??:??" ? "\u2014" : o.arrival,
  date: (o) => o.departure_date,
  best: (o) => o.is_best ? "yes" : "",
  ret: (o) => o.return_date ?? "",
  ahead: (o) => o.arrival_time_ahead,
  url: (o) => o.url,
  flt_no: (o) => o.legs.map((l) => l.flight_number).join("/") || ""
};
function resolveFields(fields, view) {
  const raw = fields ?? VIEW_FIELDS[view ?? "std"] ?? DEFAULT_FIELDS;
  return raw.split(",").filter((f) => (f in FIELD_MAP));
}
function getRow(o, fields) {
  const row = {};
  for (const f of fields)
    row[f] = FIELD_MAP[f]?.(o) ?? "";
  return row;
}
function stopsLabel(n) {
  if (n === 0)
    return "direct";
  return `${n} stop${n > 1 ? "s" : ""}`;
}
function formatOffers(offers, fmt, fields, view) {
  const cols = resolveFields(fields, view);
  switch (fmt) {
    case "jsonl":
      return offers.map((o) => JSON.stringify(getRow(o, cols))).join(`
`);
    case "tsv": {
      const header = cols.join("\t");
      const rows = offers.map((o) => cols.map((f) => FIELD_MAP[f]?.(o) ?? "").join("\t"));
      return [header, ...rows].join(`
`);
    }
    case "table": {
      const rows = offers.map((o) => getRow(o, cols));
      const widths = cols.map((c) => Math.max(c.length, ...rows.map((r) => (r[c] ?? "").length)));
      const header = cols.map((c, i) => c.padEnd(widths[i])).join("  ");
      const lines = rows.map((r) => cols.map((c, i) => (r[c] ?? "").padEnd(widths[i])).join("  "));
      return [header, ...lines].join(`
`);
    }
    case "brief":
      return offers.map((o) => `${o.id} ${o.price} ${o.name} ${stopsLabel(o.stops)} ${o.duration} ${o.departure_date} ${o.departure === "??:??" ? "\u2014" : o.departure}\u2192${o.arrival === "??:??" ? "\u2014" : o.arrival}${o.arrival_time_ahead}`).join(`
`);
  }
}
function formatError(err, hint, url) {
  const obj = { err, hint };
  if (url)
    obj.url = url;
  return JSON.stringify(obj);
}

// src/cli/state.ts
import { mkdir as mkdir2, readFile as readFile2, writeFile as writeFile2 } from "fs/promises";
import { join as join2 } from "path";
var SESSION_DIR = join2(process.env.TMPDIR ?? "/tmp", "flt");
var SESSION_FILE = join2(SESSION_DIR, "session.json");
function routeTag(from, to, date) {
  const short = date.slice(5).replace("-", "");
  return `${from}-${to}@${short}`;
}
async function saveSession(state) {
  await mkdir2(SESSION_DIR, { recursive: true });
  await writeFile2(SESSION_FILE, JSON.stringify(state, null, 2));
}
async function loadSession() {
  try {
    const raw = await readFile2(SESSION_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
var THROTTLE_MS = 3000;
var lastRequestTime = 0;
async function throttle() {
  const elapsed = Date.now() - lastRequestTime;
  if (lastRequestTime > 0 && elapsed < THROTTLE_MS) {
    await new Promise((r) => setTimeout(r, THROTTLE_MS - elapsed));
  }
  lastRequestTime = Date.now();
}
function resolveOffer(session, ref) {
  if (ref.includes(":")) {
    const [tag, id] = ref.split(":");
    const entry = session.searches?.[tag.toUpperCase()];
    return entry?.offers.find((o) => o.id === id.toUpperCase()) ?? null;
  }
  return session.offers.find((o) => o.id === ref.toUpperCase()) ?? null;
}
function listAvailableRefs(session) {
  const refs = [];
  if (session.searches) {
    for (const [tag, entry] of Object.entries(session.searches)) {
      for (const o of entry.offers)
        refs.push(`${tag}:${o.id}`);
    }
  }
  return refs;
}

// src/cli/commands/inspect.ts
var inspectCommand = defineCommand({
  meta: { name: "inspect", description: "Show details of a flight offer by ID" },
  args: {
    id: { type: "positional", description: "Offer ID (e.g. O1 or IAO-MNL:O1)", required: true },
    fmt: { type: "string", description: "Output format: json|table", default: "json" }
  },
  async run({ args }) {
    const session = await loadSession();
    if (!session) {
      console.log(formatError("NO_SESSION", "No search results cached. Run `flt search` first."));
      return;
    }
    const offer = resolveOffer(session, args.id);
    if (!offer) {
      const refs = listAvailableRefs(session);
      const ids = refs.length ? refs.join(", ") : session.offers.map((o) => o.id).join(", ");
      console.log(formatError("NOT_FOUND", `Offer '${args.id}' not found. Available: ${ids}`));
      return;
    }
    if (args.fmt === "table") {
      const fmtDur = (m) => {
        const h = Math.floor(m / 60);
        return h ? `${h}h ${m % 60}m` : `${m}m`;
      };
      const entries = [
        ["ID", offer.id],
        ["Price", offer.price],
        ["Airline", offer.name],
        ["Stops", String(offer.stops)],
        ["Duration", offer.duration],
        ["Departure", `${offer.departure_date} ${offer.departure}`],
        ["Arrival", `${offer.arrival}${offer.arrival_time_ahead}`],
        ["Best", offer.is_best ? "yes" : "no"],
        ["URL", offer.url]
      ];
      if (offer.return_date)
        entries.splice(7, 0, ["Return", offer.return_date]);
      for (let i = 0;i < offer.legs.length; i++) {
        const leg = offer.legs[i];
        entries.push([
          `Leg ${i + 1}`,
          `${leg.flight_number} ${leg.departure_airport}\u2192${leg.arrival_airport} ${leg.departure_time}\u2013${leg.arrival_time} ${fmtDur(leg.duration)} ${leg.aircraft}`.trim()
        ]);
        if (i < offer.layovers.length) {
          const lay = offer.layovers[i];
          const warn = lay.duration < 60 ? " \u26A0 tight" : lay.duration > 480 ? " \u2139 long" : "";
          entries.push(["Layover", `${lay.airport} ${fmtDur(lay.duration)}${warn}`]);
        }
      }
      const maxKey = Math.max(...entries.map(([k]) => k.length));
      console.log(entries.map(([k, v]) => `${k.padEnd(maxKey)}  ${v}`).join(`
`));
    } else {
      console.log(JSON.stringify(offer, null, 2));
    }
  }
});

// src/cli/filter.ts
function timeToMin(t) {
  if (!t || t === "??:??")
    return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m))
    return null;
  return h * 60 + m;
}
function parseDur(dur) {
  const h = dur.match(/(\d+)h/)?.[1] ?? "0";
  const m = dur.match(/(\d+)m/)?.[1] ?? "0";
  return Number(h) * 60 + Number(m);
}
function parsePrice(price) {
  const num = price.replace(/[^0-9.]/g, "");
  return num ? Number.parseFloat(num) : Number.POSITIVE_INFINITY;
}
function applyFilters(offers, opts) {
  return offers.filter((o) => {
    if (opts.direct && o.stops > 0)
      return false;
    if (opts.maxStops != null && o.stops > opts.maxStops)
      return false;
    if (opts.carrier) {
      const c = opts.carrier.toLowerCase();
      const nameMatch = o.name.toLowerCase().includes(c);
      const codeMatch = c.length === 2 && o.legs.some((l) => l.flight_number.toLowerCase().startsWith(c));
      if (!nameMatch && !codeMatch)
        return false;
    }
    const dep = timeToMin(o.departure);
    const arr = timeToMin(o.arrival);
    if (opts.depAfter && (dep == null || dep < (timeToMin(opts.depAfter) ?? 0)))
      return false;
    if (opts.depBefore && (dep == null || dep > (timeToMin(opts.depBefore) ?? 1440)))
      return false;
    if (opts.arrAfter && (arr == null || arr < (timeToMin(opts.arrAfter) ?? 0)))
      return false;
    if (opts.arrBefore && (arr == null || arr > (timeToMin(opts.arrBefore) ?? 1440)))
      return false;
    if (opts.maxDur && parseDur(o.duration) > opts.maxDur)
      return false;
    return true;
  });
}
function sortOffers(offers, key) {
  const sorted = [...offers];
  sorted.sort((a, b) => {
    switch (key) {
      case "price":
        return parsePrice(a.price) - parsePrice(b.price);
      case "dur":
        return parseDur(a.duration) - parseDur(b.duration);
      case "stops":
        return a.stops - b.stops;
      case "dep":
        return (timeToMin(a.departure) ?? 9999) - (timeToMin(b.departure) ?? 9999);
    }
  });
  return sorted;
}

// src/cli/commands/itinerary.ts
function stopsLabel2(n) {
  if (n === 0)
    return "direct";
  return `${n} stop${n > 1 ? "s" : ""}`;
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function formatGap(minutes) {
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const sign = minutes < 0 ? "-" : "";
  if (h && m)
    return `${sign}${h}h ${m}m`;
  return h ? `${sign}${h}h` : `${sign}${m}m`;
}
function isKnownTime(t) {
  return !!t && t !== "??:??";
}
function connectionGapMin(curr, next) {
  if (!isKnownTime(curr.arrival) || !isKnownTime(next.departure))
    return null;
  const arrDate = curr.arrival_time_ahead ? addDays(curr.departure_date, Number.parseInt(curr.arrival_time_ahead)) : curr.departure_date;
  const arrMs = new Date(`${arrDate}T${curr.arrival}`).getTime();
  const depMs = new Date(`${next.departure_date}T${next.departure}`).getTime();
  return Math.round((depMs - arrMs) / 60000);
}
function totalTravelTime(offers) {
  const first = offers[0];
  const last = offers[offers.length - 1];
  if (!isKnownTime(first.departure) || !isKnownTime(last.arrival))
    return null;
  const depMs = new Date(`${first.departure_date}T${first.departure}`).getTime();
  const arrDate = last.arrival_time_ahead ? addDays(last.departure_date, Number.parseInt(last.arrival_time_ahead)) : last.departure_date;
  const arrMs = new Date(`${arrDate}T${last.arrival}`).getTime();
  const totalMin = Math.round((arrMs - depMs) / 60000);
  if (totalMin <= 0)
    return null;
  return formatGap(totalMin);
}
function classifyGap(gap, legIdx) {
  const label = `Leg ${legIdx + 1}\u2192${legIdx + 2}`;
  if (gap < 0)
    return `\u26A0 ${label}: departs before previous arrival (${formatGap(gap)})`;
  if (gap < 120)
    return `\u26A0 ${label}: tight connection (${formatGap(gap)} layover)`;
  if (gap > 1440)
    return `\u2139 ${label}: long layover (${formatGap(gap)})`;
  return null;
}
function checkConnections(offers) {
  const warnings = [];
  for (let i = 0;i < offers.length - 1; i++) {
    const gap = connectionGapMin(offers[i], offers[i + 1]);
    if (gap == null)
      continue;
    const warning = classifyGap(gap, i);
    if (warning)
      warnings.push(warning);
  }
  return warnings;
}
function extractCurrency(price) {
  return price.replace(/[0-9.,\s]/g, "") || "\u20AC";
}
function formatTotal(offers) {
  const total = offers.reduce((sum, o) => sum + parsePrice(o.price), 0);
  const cur = extractCurrency(offers[0]?.price ?? "\u20AC0");
  return `${cur}${Math.round(total)}`;
}
function renderTable(offers, title, note) {
  const cols = ["#", "Date", "Route", "Price", "Dur", "Stops", "Carrier", "Dep", "Arr"];
  const rows = offers.map((o, i) => ({
    "#": String(i + 1),
    Date: o.departure_date,
    Route: o.legs.length >= 2 ? `${o.legs[0].departure_airport}\u2192${o.legs.at(-1)?.arrival_airport}` : `${o.legs[0]?.departure_airport ?? "?"}\u2192${o.legs[0]?.arrival_airport ?? "?"}`,
    Price: o.price,
    Dur: o.duration,
    Stops: stopsLabel2(o.stops),
    Carrier: o.name,
    Dep: o.departure === "??:??" ? "\u2014" : o.departure,
    Arr: `${o.arrival === "??:??" ? "\u2014" : o.arrival}${o.arrival_time_ahead}`
  }));
  const widths = cols.map((c) => Math.max(c.length, ...rows.map((r) => r[c].length)));
  const tableWidth = widths.reduce((a, b) => a + b, 0) + (cols.length - 1) * 2;
  const lines = [];
  if (title) {
    const label = ` ${title} `;
    const pad = Math.max(0, tableWidth - label.length);
    lines.push(`\u2500\u2500${label}${"\u2500".repeat(pad)}`);
  }
  lines.push(cols.map((c, i) => c.padEnd(widths[i])).join("  "));
  for (const row of rows) {
    lines.push(cols.map((c, i) => row[c].padEnd(widths[i])).join("  "));
  }
  const separator = "\u2500".repeat(tableWidth + 2);
  lines.push(separator);
  lines.push(...buildFooter(offers, note));
  return lines.join(`
`);
}
function buildFooter(offers, note) {
  const lines = [];
  const parts = [`Total: ${formatTotal(offers)}`];
  const travelTime = totalTravelTime(offers);
  if (travelTime)
    parts.push(`door-to-door: ${travelTime}`);
  const layoverParts = offers.slice(0, -1).map((o, i) => {
    const gap = connectionGapMin(o, offers[i + 1]);
    if (gap == null)
      return null;
    return `${o.legs.at(-1)?.arrival_airport ?? "?"} ${formatGap(gap)}`;
  }).filter(Boolean);
  if (layoverParts.length)
    parts.push(`layovers: ${layoverParts.join(", ")}`);
  if (note)
    parts.push(note);
  lines.push(parts.join(" \xB7 "));
  for (const [i, o] of offers.entries()) {
    if (o.url)
      lines.push(`Leg ${i + 1}: ${o.url}`);
  }
  return lines;
}
var itineraryCommand = defineCommand({
  meta: { name: "itinerary", description: "Compose a multi-leg itinerary from cached offers" },
  args: {
    refs: {
      type: "positional",
      description: "Offer refs: TAG:ID (e.g. IAO-MNL:O1 MNL-AMS:O3)",
      required: true
    },
    title: { type: "string", description: "Itinerary title" },
    note: { type: "string", description: "Note to display below the table" }
  },
  async run({ args }) {
    const session = await loadSession();
    if (!session) {
      console.log(formatError("NO_SESSION", "No search results cached. Run `flt search` first."));
      return;
    }
    const rawArgs = args._;
    const refs = (rawArgs ?? [args.refs]).filter((r) => r && !r.startsWith("--"));
    const offers = [];
    for (const ref of refs) {
      const offer = resolveOffer(session, ref);
      if (!offer) {
        const available = listAvailableRefs(session);
        console.log(formatError("NOT_FOUND", `Offer '${ref}' not found. Available: ${available.join(", ")}`));
        return;
      }
      offers.push(offer);
    }
    console.log(renderTable(offers, args.title, args.note));
    const warnings = checkConnections(offers);
    if (warnings.length)
      console.log(`
${warnings.join(`
`)}`);
  }
});

// src/lib/server/flights/proto.ts
var SEAT = { economy: 1, "premium-economy": 2, business: 3, first: 4 };
var TRIP = { "round-trip": 1, "one-way": 2, "multi-city": 3 };
var PASSENGER = { adult: 1, child: 2, infant_in_seat: 3, infant_on_lap: 4 };
function varint(n) {
  const buf = [];
  while (n > 127) {
    buf.push(n & 127 | 128);
    n >>>= 7;
  }
  buf.push(n);
  return new Uint8Array(buf);
}
function fieldTag(field, type) {
  return varint(field << 3 | type);
}
function lenDelim(field, bytes) {
  return concat(fieldTag(field, 2), varint(bytes.length), bytes);
}
function int32Field(field, val) {
  return concat(fieldTag(field, 0), varint(val));
}
function stringField(field, val) {
  const encoded = new TextEncoder().encode(val);
  return lenDelim(field, encoded);
}
function concat(...arrays) {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}
function encodeAirport(iata) {
  return stringField(2, iata);
}
function encodeFlightData(leg) {
  const parts = [
    stringField(2, leg.date),
    lenDelim(13, encodeAirport(leg.from)),
    lenDelim(14, encodeAirport(leg.to))
  ];
  if (leg.maxStops !== undefined)
    parts.push(int32Field(5, leg.maxStops));
  return concat(...parts);
}
function encodeInfo(legs, passengers, seat, trip) {
  const parts = [];
  for (const leg of legs) {
    parts.push(lenDelim(3, encodeFlightData(leg)));
  }
  const pList = [
    ...Array(passengers.adults).fill(PASSENGER.adult),
    ...Array(passengers.children).fill(PASSENGER.child),
    ...Array(passengers.infants_in_seat).fill(PASSENGER.infant_in_seat),
    ...Array(passengers.infants_on_lap).fill(PASSENGER.infant_on_lap)
  ];
  for (const p of pList)
    parts.push(int32Field(8, p));
  parts.push(int32Field(9, SEAT[seat]));
  parts.push(int32Field(19, TRIP[trip]));
  return concat(...parts);
}
function encodeFlightFilter(params) {
  const buf = encodeInfo(params.legs, params.passengers, params.seat, params.trip);
  let binary = "";
  for (const byte of buf)
    binary += String.fromCharCode(byte);
  return btoa(binary);
}

// src/lib/server/flights/decode.ts
function readVarint(buf, pos) {
  let result = 0;
  let shift = 0;
  while (pos < buf.length) {
    const byte = buf[pos++];
    result |= (byte & 127) << shift;
    if (!(byte & 128))
      break;
    shift += 7;
  }
  return [result, pos];
}
function readProto(buf) {
  const fields = new Map;
  let pos = 0;
  while (pos < buf.length) {
    const [tag, p1] = readVarint(buf, pos);
    pos = p1;
    const fieldNum = tag >> 3;
    const wireType = tag & 7;
    const list = fields.get(fieldNum) ?? [];
    if (wireType === 0) {
      const [val, p2] = readVarint(buf, pos);
      pos = p2;
      list.push(val);
    } else if (wireType === 2) {
      const [len, p2] = readVarint(buf, pos);
      pos = p2;
      list.push(buf.slice(pos, pos + len));
      pos += len;
    } else if (wireType === 1) {
      pos += 8;
    } else if (wireType === 5) {
      pos += 4;
    }
    fields.set(fieldNum, list);
  }
  return fields;
}
var CURRENCY_SYMBOLS = { EUR: "\u20AC", USD: "$", GBP: "\xA3", JPY: "\xA5" };
function decodeSummary(b64) {
  try {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0;i < bin.length; i++)
      bytes[i] = bin.charCodeAt(i);
    const summary = readProto(bytes);
    const priceBytes = summary.get(3)?.[0];
    if (!(priceBytes instanceof Uint8Array))
      return { priceStr: "" };
    const price = readProto(priceBytes);
    const rawPrice = price.get(1)?.[0];
    const currencyBytes = price.get(3)?.[0];
    const amount = typeof rawPrice === "number" ? Math.round(rawPrice / 100) : 0;
    const currency = currencyBytes instanceof Uint8Array ? new TextDecoder().decode(currencyBytes) : "";
    const symbol = CURRENCY_SYMBOLS[currency] ?? "";
    const priceStr = symbol ? `${symbol}${amount.toLocaleString("en-US")}` : `${amount.toLocaleString("en-US")} ${currency}`;
    return { priceStr };
  } catch {
    return { priceStr: "" };
  }
}
function at(data, ...path) {
  let cur = data;
  for (const i of path) {
    if (!Array.isArray(cur) || i >= cur.length || cur[i] == null)
      return null;
    cur = cur[i];
  }
  return cur;
}
function formatTime(t) {
  if (!Array.isArray(t) || t.length < 2)
    return "??:??";
  const h = t[0];
  const m = t[1];
  if (typeof h !== "number" || typeof m !== "number")
    return "??:??";
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m)
    return `${h}h ${m}m`;
  return h ? `${h}h` : `${m}m`;
}
function daysAhead(dep, arr) {
  if (!dep || !arr)
    return "";
  const diff = Math.round((Date.UTC(arr[0], arr[1] - 1, arr[2]) - Date.UTC(dep[0], dep[1] - 1, dep[2])) / 86400000);
  return diff > 0 ? `+${diff}` : "";
}
function decodeLeg(leg) {
  if (!Array.isArray(leg))
    return null;
  const airline = at(leg, 22, 0) ?? "";
  const airline_name = at(leg, 22, 3) ?? "";
  const flight_number = String(at(leg, 22, 1) ?? "");
  const aircraft = at(leg, 17) ?? "";
  const departure_airport = at(leg, 3) ?? "";
  const arrival_airport = at(leg, 5) ?? "";
  const departure_time = formatTime(leg[8]);
  const arrival_time = formatTime(leg[10]);
  const duration = leg[11] ?? 0;
  const operator = at(leg, 2) || undefined;
  const seat_pitch = at(leg, 14) || undefined;
  return {
    airline,
    airline_name,
    flight_number,
    aircraft,
    departure_airport,
    arrival_airport,
    departure_time,
    arrival_time,
    duration,
    operator,
    seat_pitch
  };
}
function decodeLayover(lay) {
  if (!Array.isArray(lay))
    return null;
  return {
    duration: lay[0] ?? 0,
    airport: at(lay, 1) ?? "",
    airport_name: at(lay, 4) ?? ""
  };
}
function decodeItinerary(el, is_best) {
  try {
    const body = at(el, 0);
    const airlineNames = at(body, 1) ?? [];
    const rawLayovers = at(body, 13) ?? [];
    const rawLegs = at(body, 2) ?? [];
    const depTime = at(body, 5);
    const arrTime = at(body, 8);
    const depDate = at(body, 4);
    const arrDate = at(body, 7);
    const travelTime = at(body, 9) ?? 0;
    const summaryB64 = at(el, 1, 1);
    const { priceStr } = summaryB64 ? decodeSummary(summaryB64) : { priceStr: "" };
    const name = airlineNames.join(", ") || at(body, 0) || "";
    const legs = Array.isArray(rawLegs) ? rawLegs.map(decodeLeg).filter(Boolean) : [];
    const layovers = Array.isArray(rawLayovers) ? rawLayovers.map(decodeLayover).filter(Boolean) : [];
    const firstLeg = legs[0];
    const lastLeg = legs[legs.length - 1];
    return {
      is_best,
      name,
      departure: formatTime(depTime) !== "??:??" ? formatTime(depTime) : firstLeg?.departure_time ?? "??:??",
      arrival: formatTime(arrTime) !== "??:??" ? formatTime(arrTime) : lastLeg?.arrival_time ?? "??:??",
      arrival_time_ahead: daysAhead(depDate, arrDate),
      duration: formatDuration(travelTime),
      stops: layovers.length,
      delay: null,
      price: priceStr,
      legs,
      layovers
    };
  } catch {
    return null;
  }
}
function decodeResult(data) {
  const best = at(data, 2, 0) ?? [];
  const other = at(data, 3, 0) ?? [];
  const flights = [];
  for (const el of best) {
    const f = decodeItinerary(el, true);
    if (f)
      flights.push(f);
  }
  for (const el of other) {
    const f = decodeItinerary(el, false);
    if (f)
      flights.push(f);
  }
  return flights;
}
function extractDataArray(script) {
  const marker = "data:";
  const markerIdx = script.indexOf(marker);
  if (markerIdx === -1)
    return null;
  const start = script.indexOf("[", markerIdx);
  if (start === -1)
    return null;
  let depth = 0;
  let end = start;
  for (;end < script.length; end++) {
    if (script[end] === "[")
      depth++;
    else if (script[end] === "]") {
      depth--;
      if (depth === 0)
        break;
    }
  }
  if (depth !== 0)
    return null;
  try {
    return JSON.parse(script.slice(start, end + 1));
  } catch {
    return null;
  }
}

// src/lib/server/flights/scrape.ts
var CHROME_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Ch-Ua": '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Upgrade-Insecure-Requests": "1",
  Cookie: "CONSENT=PENDING+987; SOCS=CAESHAgBEhJnd3NfMjAyMzA4MTAtMF9SQzIaAmRlIAEaBgiAo_CmBg"
};
var MIN_INTERVAL_MS = 1500;
var lastRequestTime2 = 0;
async function rateLimit() {
  const wait = lastRequestTime2 + MIN_INTERVAL_MS - Date.now();
  if (wait > 0)
    await new Promise((r) => setTimeout(r, wait));
  lastRequestTime2 = Date.now();
}
async function fetchFlights(b64, currency) {
  const params = new URLSearchParams({ tfs: b64, hl: "en", tfu: "EgQIABABIgA", curr: currency });
  await rateLimit();
  const res = await fetch(`https://www.google.com/travel/flights?${params}`, {
    headers: CHROME_HEADERS
  });
  if (!res.ok)
    return { flights: [], error: "http", httpStatus: res.status };
  let scriptText = "";
  const rewriter = new HTMLRewriter;
  rewriter.on('script[class="ds:1"]', {
    text(chunk) {
      scriptText += chunk.text;
    }
  });
  await rewriter.transform(res).text();
  if (!scriptText)
    return { flights: [], error: "no_script" };
  const data = extractDataArray(scriptText);
  if (!data)
    return { flights: [], error: "no_data" };
  const flights = decodeResult(data);
  if (flights.length === 0)
    return { flights: [], error: "no_flights" };
  return { flights };
}
function buildGoogleFlightsUrl(b64, currency) {
  const params = new URLSearchParams({ tfs: b64, hl: "en", curr: currency });
  return `https://www.google.com/travel/flights?${params}`;
}

// src/lib/server/flights/search.ts
var MAX_RANGE_DAYS = 7;
var MAX_TOTAL_SEARCHES = 21;
function dateRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const days = Math.min(Math.round((e.getTime() - s.getTime()) / 86400000), MAX_RANGE_DAYS - 1);
  return Array.from({ length: days + 1 }, (_, i) => {
    const d = new Date(s);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}
function buildDatePairs(q) {
  const depDates = q.date_end ? dateRange(q.date, q.date_end) : [q.date];
  const retDates = q.return_date ? q.return_date_end ? dateRange(q.return_date, q.return_date_end) : [q.return_date] : null;
  if (!retDates)
    return depDates.map((d) => [d, null]);
  const pairs = [];
  for (const d of depDates) {
    for (const r of retDates) {
      if (r >= d)
        pairs.push([d, r]);
    }
  }
  return pairs.slice(0, MAX_TOTAL_SEARCHES);
}
async function searchSingle(dep_date, ret_date, q) {
  const passengers = {
    adults: q.adults,
    children: q.children,
    infants_in_seat: q.infants_in_seat,
    infants_on_lap: q.infants_on_lap
  };
  const legs = [{ date: dep_date, from: q.from_airport, to: q.to_airport, maxStops: q.max_stops }];
  const trip = ret_date ? "round-trip" : "one-way";
  if (ret_date) {
    legs.push({ date: ret_date, from: q.to_airport, to: q.from_airport, maxStops: q.max_stops });
  }
  const b64 = encodeFlightFilter({ legs, passengers, seat: q.seat, trip });
  const url = buildGoogleFlightsUrl(b64, q.currency);
  const result = await fetchFlights(b64, q.currency);
  if (result.error)
    return { dep_date, ret_date, flights: [], url, error: result.error };
  const flights = result.flights.map((f) => ({
    ...f,
    departure_date: dep_date,
    return_date: ret_date,
    countries: []
  }));
  return { dep_date, ret_date, flights, url };
}

// src/lib/utils/dates.ts
var ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
var DMY_SLASH = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
var RELATIVE = { today: 0, tomorrow: 1, overmorrow: 2 };
function parseFlexDate(input) {
  const trimmed = input.trim().toLowerCase();
  if (trimmed in RELATIVE) {
    const d = new Date;
    d.setDate(d.getDate() + RELATIVE[trimmed]);
    return d.toISOString().slice(0, 10);
  }
  if (ISO_RE.test(trimmed)) {
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : trimmed;
  }
  const m = trimmed.match(DMY_SLASH);
  if (m) {
    const iso = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : iso;
  }
  return null;
}

// src/cli/validate.ts
var _airports2 = airports_default;
function normalizeDate(d, label) {
  const iso = parseFlexDate(d);
  if (!iso) {
    console.log(JSON.stringify({
      err: "BAD_DATE",
      hint: `${label} '${d}' is not a valid date. Use YYYY-MM-DD, DD/MM/YYYY, or 'tomorrow'.`
    }));
    process.exit(1);
  }
  const today = new Date().toISOString().slice(0, 10);
  if (iso < today) {
    console.log(JSON.stringify({
      err: "PAST_DATE",
      hint: `${label} ${iso} is in the past (today: ${today}).`
    }));
    process.exit(1);
  }
  return iso;
}
function validateAirport(code, label) {
  if (!(code in _airports2)) {
    console.log(JSON.stringify({ err: "BAD_AIRPORT", hint: `${label} '${code}' is not a known IATA code.` }));
    process.exit(1);
  }
}
function parsePax(s) {
  const ad = Number.parseInt(s.match(/(\d+)ad/)?.[1] ?? "1");
  const ch = Number.parseInt(s.match(/(\d+)ch/)?.[1] ?? "0");
  const ins = Number.parseInt(s.match(/(\d+)is/)?.[1] ?? "0");
  const inl = Number.parseInt(s.match(/(\d+)il/)?.[1] ?? "0");
  const inf = Number.parseInt(s.match(/(\d+)in(?![sl])/)?.[1] ?? "0");
  return { adults: ad, children: ch, infants_in_seat: ins, infants_on_lap: inl || inf };
}

// src/cli/commands/matrix.ts
function dateRange2(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const days = Math.round((e.getTime() - s.getTime()) / 86400000);
  return Array.from({ length: days + 1 }, (_, i) => {
    const d = new Date(s);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}
function pickCheapest(offers, maxDur) {
  let flights = offers;
  if (maxDur)
    flights = flights.filter((f) => parseDur(f.duration) <= maxDur);
  if (flights.length === 0)
    return null;
  let best = flights[0];
  for (const f of flights) {
    if (parsePrice(f.price) < parsePrice(best.price))
      best = f;
  }
  return {
    dep: best.departure_date,
    ret: best.return_date,
    cheapest: best.price,
    carrier: best.name,
    stops: best.stops,
    duration: best.duration
  };
}
async function fetchAndCache(dep, ret, query, session) {
  await throttle();
  const result = await searchSingle(dep, ret, query);
  const offers = result.flights.map((f, i) => ({
    ...f,
    id: `O${i + 1}`,
    url: result.url
  }));
  const tag = routeTag(query.from_airport, query.to_airport, dep);
  const queryStr = `${query.from_airport} ${query.to_airport} ${dep}`;
  session.searches = {
    ...session.searches,
    [tag]: { offers, query: queryStr, timestamp: Date.now() }
  };
  return offers;
}
function printOneWay(cells, fmt) {
  if (fmt === "jsonl") {
    for (const c of cells)
      console.log(JSON.stringify({
        date: c.dep,
        cheapest: c.cheapest,
        carrier: c.carrier,
        stops: c.stops,
        duration: c.duration
      }));
    return;
  }
  if (fmt === "tsv") {
    console.log("date\tcheapest\tcarrier\tstops\tduration");
    for (const c of cells)
      console.log(`${c.dep}	${c.cheapest}	${c.carrier}	${c.stops}	${c.duration}`);
    return;
  }
  const rows = cells.map((c) => [c.dep, c.cheapest, c.carrier, String(c.stops), c.duration]);
  const headers = ["date", "cheapest", "carrier", "stops", "duration"];
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
  console.log(headers.map((h, i) => h.padEnd(widths[i])).join("  "));
  for (const r of rows)
    console.log(r.map((v, i) => v.padEnd(widths[i])).join("  "));
}
function printGrid(depDates, retDates, cells, fmt) {
  if (fmt === "jsonl") {
    for (const c of cells)
      console.log(JSON.stringify({ dep: c.dep, ret: c.ret, cheapest: c.cheapest }));
    return;
  }
  const grid = new Map;
  for (const c of cells)
    grid.set(`${c.dep}|${c.ret}`, c.cheapest);
  const retLabels = retDates.map((r) => r.slice(5));
  const header = `${"out\\back".padEnd(12)}${retLabels.map((r) => r.padEnd(8)).join("")}`;
  console.log(header);
  for (const d of depDates) {
    const vals = retDates.map((r) => (grid.get(`${d}|${r}`) ?? "-").padEnd(8));
    console.log(`${d.padEnd(12)}${vals.join("")}`);
  }
}
var EMPTY_CELL = {
  dep: "",
  ret: null,
  cheapest: "-",
  carrier: "-",
  stops: -1,
  duration: "-"
};
var matrixCommand = defineCommand({
  meta: { name: "matrix", description: "Date-flex price grid" },
  args: {
    from: { type: "positional", description: "Origin airport (IATA)", required: true },
    to: { type: "positional", description: "Destination airport (IATA)", required: true },
    dateStart: { type: "positional", description: "Start date (YYYY-MM-DD)", required: true },
    dateEnd: { type: "positional", description: "End date (YYYY-MM-DD)", required: true },
    returnStart: { type: "positional", description: "Return start date", required: false },
    returnEnd: { type: "positional", description: "Return end date", required: false },
    seat: { type: "string", default: "economy" },
    pax: { type: "string", default: "1ad" },
    "max-stops": { type: "string" },
    "max-dur": { type: "string", description: "Max duration in minutes (filters before cheapest)" },
    currency: { type: "string", default: "EUR" },
    fmt: { type: "string", description: "Output format: table|tsv|jsonl", default: "table" }
  },
  async run({ args: rawArgs }) {
    const config = await loadConfig();
    const args = withDefaults(rawArgs, config, ["currency", "fmt", "seat", "pax"]);
    validateAirport(args.from.toUpperCase(), "Origin");
    validateAirport(args.to.toUpperCase(), "Destination");
    const dateStart = normalizeDate(args.dateStart, "Start date");
    const dateEnd = normalizeDate(args.dateEnd, "End date");
    const returnStart = args.returnStart ? normalizeDate(args.returnStart, "Return start") : undefined;
    const returnEnd = args.returnEnd ? normalizeDate(args.returnEnd, "Return end") : undefined;
    const pax = parsePax(args.pax);
    const maxStops = args["max-stops"] != null ? Number.parseInt(args["max-stops"]) : undefined;
    const maxDur = args["max-dur"] != null ? Number.parseInt(args["max-dur"]) : undefined;
    const query = {
      from_airport: args.from.toUpperCase(),
      to_airport: args.to.toUpperCase(),
      date: dateStart,
      ...pax,
      seat: args.seat,
      max_stops: maxStops,
      currency: args.currency
    };
    const session = await loadSession() ?? {
      offers: [],
      query: "",
      timestamp: Date.now()
    };
    const depDates = dateRange2(dateStart, dateEnd);
    const retDates = returnStart && returnEnd ? dateRange2(returnStart, returnEnd) : null;
    if (!retDates) {
      const cells2 = [];
      for (const d of depDates) {
        const offers = await fetchAndCache(d, null, query, session);
        cells2.push(pickCheapest(offers, maxDur) ?? { ...EMPTY_CELL, dep: d });
      }
      await saveSession(session);
      printOneWay(cells2, args.fmt);
      return;
    }
    const pairs = [];
    for (const d of depDates) {
      for (const r of retDates) {
        if (r >= d)
          pairs.push([d, r]);
      }
    }
    if (pairs.length > 21) {
      console.log(formatError("TOO_MANY", `${pairs.length} combinations exceed max 21. Narrow dates.`));
      return;
    }
    const cells = [];
    for (const [d, r] of pairs) {
      const offers = await fetchAndCache(d, r, query, session);
      cells.push(pickCheapest(offers, maxDur) ?? { ...EMPTY_CELL, dep: d, ret: r });
    }
    await saveSession(session);
    printGrid(depDates, retDates, cells, args.fmt);
  }
});

// src/cli/commands/prime.ts
var PRIMER = `<flt-agent-guide>
<identity>
flt \u2014 Flight Search CLI (Google Flights scraper).
You are operating in Claude Code with access to the \`flt\` CLI. Use it to search flights, compare prices across dates, inspect cached offers, compose itineraries, and look up airports.
</identity>

<scope>
Use \`flt\` ONLY for flight-related requests (routes, dates, prices, comparisons, airports, itineraries).
Do NOT use \`flt\` for hotels, trains, visas, or anything non-flight. For non-flight topics, answer without \`flt\` and say it's outside this tool's scope.
</scope>

<rate-limits priority="critical">
Google Flights blocks rapid scraping. Follow these rules strictly:

<pacing>
- Rate limiting is built-in: the CLI auto-waits 3s between Google requests.
- You do NOT need to run \`sleep 3\` manually between commands.
- Do not run \`flt search\` / \`flt matrix\` in parallel (sequential is fine \u2014 throttling is automatic).
</pacing>

<batching>
- Prefer \`flt matrix\` for date comparisons.
- Keep date ranges small: matrix supports max 21 date combos, but 5\u20137 dates is safer.
</batching>

<on-blocked>
If any command returns: {"err":"BLOCKED", ...}
1. STOP making further \`flt\` requests immediately.
2. Run: \`sleep 60\`
3. Retry with fewer requests (smaller date range, fewer searches).
</on-blocked>

<caching>
- Each search is cached by route + date tag (e.g. \`IAO-MNL@0318\`).
- Searching the same route on different dates creates separate cache entries \u2014 they do NOT overwrite each other.
- Do not re-search the same route/date if results already exist; use \`flt inspect\` and \`flt itinerary\` instead.
- \`flt inspect\`, \`flt itinerary\`, and \`flt airports\` read cached/local data and do not trigger Google scraping; safe to use freely.
</caching>
</rate-limits>

<commands>
<search>
flt search <FROM> <TO> <DATE> [RETURN_DATE] [OPTIONS]
Shortcut: flt AMS NRT 2026-04-10
Round-trip: flt AMS NRT 2026-04-10 2026-04-18

Key options:
--seat economy|premium-economy|business|first
--pax 1ad | 2ad1ch | 1ad1in
--max-stops 0|1|2
--currency EUR|USD|...
--fmt jsonl|tsv|table|brief
--sort price|dur|stops|dep
--limit <N>
--direct
--carrier "<substring>"
--dep-after HH:MM / --dep-before HH:MM
--arr-after HH:MM / --arr-before HH:MM
--max-dur <minutes>
--fields <comma-separated>
--view min|std|full
</search>

<inspect>
flt inspect <ID>
Shortcut: flt O1
Cross-search: flt inspect IAO-MNL@0318:O1
Use \`--fmt table\` for key/value readability.
</inspect>

<matrix>
One-way: flt matrix <FROM> <TO> <DATE_START> <DATE_END>
Round-trip: flt matrix <FROM> <TO> <DEP_START> <DEP_END> <RET_START> <RET_END>
Supports up to 21 date combinations per matrix run.
Default output is table; use \`--fmt jsonl\` for parsing.
</matrix>

<itinerary>
flt itinerary <TAG:ID> [TAG:ID...] [--title "..."] [--note "..."]
Each search is tagged by route+date (e.g. IAO-MNL@0324). Reference offers as TAG:ID when combining legs.
</itinerary>

<airports>
flt airports <QUERY>
Shortcut: flt tokyo  (top results)
Returns objects with code, name, city, country.
</airports>

<takeout>
Export session results to a markdown file for the user to review later.

Export all searches:
  flt takeout

With recommended itineraries (compose from cached offers):
  flt takeout --itin "Option A: Best value" IAO-MNL@0324:O1 MNL-AMS@0324:O1 --note "Same-day, 4h layover" --itin "Option B: Overnight" IAO-MNL@0324:O1 MNL-AMS@0325:O2 --note "Overnight in MNL"

Custom title:
  flt takeout --title "Siargao \u2192 Amsterdam March 2026"

Custom output path:
  flt takeout -o ./my-flights.md

Default output: ~/Desktop/flights-<date>.md

The takeout file includes:
1. Recommended itineraries (if --itin flags provided) with totals
2. All individual search results (top 10 per route, with full details)
</takeout>
</commands>

<workflow description="default \u2014 follow unless user specifies otherwise">
1. Resolve airports if ambiguous:
   - If city could map to multiple airports, run: \`flt airports <query>\`
   - Choose appropriate IATA codes (or present 2\u20133 choices briefly).

2. Choose search strategy:
   - If user wants "cheapest across dates" or is flexible \u2192 start with \`flt matrix\` (small range).
   - If user gave an exact date (and return date if RT) \u2192 run one \`flt search\`.

3. Narrow results only after the first fetch:
   - Apply filters via options (direct/max-stops, time windows, carrier substring, seat, pax, max duration).
   - Keep request count low; prefer refining a single search over many new searches.

4. Inspect details only for shortlisted IDs:
   - Use \`flt O1\` / \`flt inspect O1\` to fetch URLs and full fields.

5. For multi-leg trips:
   - Search each leg separately (e.g., IAO\u2192MNL then MNL\u2192AMS).
   - Compose 1\u20133 itinerary options with \`flt itinerary\` using TAG:ID refs (e.g. IAO-MNL@0324:O1).
   - Minimum connection times: 2h domestic, 3h international (customs/immigration).

6. End of session:
   - Always run \`flt takeout\` with \`--itin\` flags for your recommended options.

Rate limiting is automatic \u2014 no need to manually sleep between commands.
</workflow>

<error-handling>
Errors are JSON: {"err":"CODE","hint":"..."}.
- NO_RESULTS: Relax filters (more stops, wider time window, different dates).
- TOO_MANY: Reduce matrix date range (<=21 combos; prefer 5\u20137).
- NO_SESSION: Run a search before inspect/itinerary.
- BLOCKED: Follow the on-blocked procedure above exactly.
</error-handling>

<limitations note="state these only if relevant to the user's question">
- Scraped data: no fare rules, baggage/seat maps, booking classes, loyalty info.
- Some filters apply post-fetch (after scraping).
- Prices are strings with currency symbols; sorting parses numerically.
</limitations>

<response-format>
When presenting results:
- Start with a compact summary: route(s), dates, constraints (pax/seat/stops), currency.
- Then list top options (usually 3\u20135) with: ID, price, stops, duration, carrier, dep\u2192arr (+day if).
- If comparing dates, summarize the matrix cheapest dates first, then search the best 1\u20132 dates for details.
- If multi-leg, present itineraries using \`flt itinerary\` output and include total price + note on connection sanity.
- End with "adjustable knobs" only if helpful: e.g., "I can widen time window / allow 1 stop / extend dates."

Token efficiency:
- Use \`--fmt brief\` for quick human-readable pulls.
- Use \`--fmt tsv\` when you need compact parsing.
- Default \`--limit 10\` unless the user requests more.
- Multiple searches coexist: each is tagged by route+date (e.g. \`IAO-MNL@0324\`), reference with \`TAG:ID\`.
</response-format>
</flt-agent-guide>`;
var primeCommand = defineCommand({
  meta: { name: "prime", description: "Print agent how-to guide for flt" },
  async run() {
    console.log(PRIMER);
  }
});

// src/cli/commands/search.ts
var searchCommand = defineCommand({
  meta: { name: "search", description: "Search flights" },
  args: {
    from: { type: "positional", description: "Origin airport (IATA)", required: true },
    to: { type: "positional", description: "Destination airport (IATA)", required: true },
    date: { type: "positional", description: "Departure date (YYYY-MM-DD)", required: true },
    returnDate: { type: "positional", description: "Return date (YYYY-MM-DD)", required: false },
    "date-end": { type: "string", description: "Flexible departure end date" },
    "return-date-end": { type: "string", description: "Flexible return end date" },
    seat: { type: "string", description: "Cabin class", default: "economy" },
    pax: { type: "string", description: "Passengers: 1ad, 2ad1ch, etc.", default: "1ad" },
    "max-stops": { type: "string", description: "Max stops (0, 1, 2)" },
    currency: { type: "string", description: "Currency code", default: "EUR" },
    fmt: { type: "string", description: "Output format: jsonl|tsv|table|brief", default: "table" },
    fields: { type: "string", description: "Comma-separated fields" },
    view: { type: "string", description: "Field preset: min|std|full" },
    sort: { type: "string", description: "Sort by: price|dur|stops|dep", default: "price" },
    limit: { type: "string", description: "Max results", default: "10" },
    "dep-after": { type: "string", description: "Depart after HH:MM" },
    "dep-before": { type: "string", description: "Depart before HH:MM" },
    "arr-after": { type: "string", description: "Arrive after HH:MM" },
    "arr-before": { type: "string", description: "Arrive before HH:MM" },
    "max-dur": { type: "string", description: "Max duration in minutes" },
    direct: { type: "boolean", description: "Direct flights only", default: false },
    carrier: { type: "string", description: "Filter by airline name/code" },
    refresh: { type: "boolean", description: "Force fresh fetch (skip cache)", default: false }
  },
  async run({ args: rawArgs }) {
    const config = await loadConfig();
    const args = withDefaults(rawArgs, config, ["currency", "fmt", "seat", "pax", "limit"]);
    validateAirport(args.from.toUpperCase(), "Origin");
    validateAirport(args.to.toUpperCase(), "Destination");
    const date = normalizeDate(args.date, "Departure date");
    const returnDate = args.returnDate ? normalizeDate(args.returnDate, "Return date") : undefined;
    const dateEnd = args["date-end"] ? normalizeDate(args["date-end"], "Departure end date") : undefined;
    const returnDateEnd = args["return-date-end"] ? normalizeDate(args["return-date-end"], "Return end date") : undefined;
    const pax = parsePax(args.pax);
    const maxStops = args["max-stops"] != null ? Number.parseInt(args["max-stops"]) : undefined;
    const query = {
      from_airport: args.from.toUpperCase(),
      to_airport: args.to.toUpperCase(),
      date,
      return_date: returnDate,
      date_end: dateEnd,
      return_date_end: returnDateEnd,
      ...pax,
      seat: args.seat,
      max_stops: maxStops,
      currency: args.currency
    };
    const pairs = buildDatePairs(query);
    const prev = await loadSession();
    const results = [];
    for (const [d, r] of pairs) {
      const tag2 = routeTag(query.from_airport, query.to_airport, d);
      const cached = prev?.searches?.[tag2];
      if (cached && !args.refresh) {
        results.push({ flights: cached.offers, url: cached.offers[0]?.url ?? "" });
      } else {
        await throttle();
        const res = await searchSingle(d, r, query);
        results.push({
          flights: res.flights.map((f) => ({ ...f, url: res.url })),
          url: res.url,
          error: res.error
        });
      }
    }
    const allFlights = results.flatMap((r) => r.flights);
    if (allFlights.length === 0) {
      const err = results.find((r) => r.error)?.error;
      const hints = {
        http: "Google returned an HTTP error (likely rate-limited). Try again in a few minutes.",
        no_script: "Google served a consent/CAPTCHA page. Try again later or from a different IP.",
        no_data: "Page loaded but flight data was missing. Google may have changed the page structure.",
        no_flights: "No flights found for this route/date. Try different dates or fewer stops."
      };
      const code = err === "http" || err === "no_script" ? "BLOCKED" : (err ?? "NO_RESULTS").toUpperCase();
      console.log(formatError(code, hints[err ?? "no_flights"] ?? hints.no_flights, results[0]?.url));
      return;
    }
    const rawOffers = allFlights.map((f, i) => ({ ...f, id: `O${i + 1}` }));
    const tag = routeTag(query.from_airport, query.to_airport, query.date);
    const queryStr = `${query.from_airport} ${query.to_airport} ${query.date}`;
    const rawEntry = { offers: rawOffers, query: queryStr, timestamp: Date.now() };
    let offers = applyFilters(rawOffers, {
      depAfter: args["dep-after"],
      depBefore: args["dep-before"],
      arrAfter: args["arr-after"],
      arrBefore: args["arr-before"],
      maxDur: args["max-dur"] ? Number.parseInt(args["max-dur"]) : undefined,
      maxStops,
      direct: args.direct,
      carrier: args.carrier
    });
    offers = sortOffers(offers, args.sort ?? "price");
    const limit = Number.parseInt(args.limit);
    offers = offers.slice(0, limit);
    offers = offers.map((o, i) => ({ ...o, id: `O${i + 1}` }));
    const displayEntry = { offers, query: queryStr, timestamp: Date.now() };
    await saveSession({
      ...displayEntry,
      searches: { ...prev?.searches, [tag]: rawEntry }
    });
    console.log(formatOffers(offers, args.fmt, args.fields, args.view));
  }
});

// src/cli/commands/takeout.ts
import { writeFile as writeFile3 } from "fs/promises";
import { join as join3 } from "path";
function stopsLabel3(n) {
  if (n === 0)
    return "direct";
  return `${n} stop${n > 1 ? "s" : ""}`;
}
function totalPrice(offers) {
  const total = offers.reduce((sum, o) => sum + parsePrice(o.price), 0);
  const cur = (offers[0]?.price ?? "\u20AC0").replace(/[0-9.,\s]/g, "") || "\u20AC";
  return `${cur}${Math.round(total)}`;
}
function legRoute(o) {
  if (o.legs.length === 0)
    return "?\u2192?";
  const codes = [o.legs[0].departure_airport];
  for (const leg of o.legs)
    codes.push(leg.arrival_airport);
  const unique = codes.filter((c, i) => i === 0 || c !== codes[i - 1]);
  return unique.join("\u2192");
}
function formatItinerary(itin) {
  const lines = [];
  lines.push(`### ${itin.title}`);
  lines.push("");
  lines.push("| # | Date | Route | Price | Duration | Stops | Carrier | Dep\u2192Arr |");
  lines.push("|---|------|-------|------:|----------|-------|---------|---------|");
  for (const [i, o] of itin.legs.entries()) {
    const arr = `${o.arrival}${o.arrival_time_ahead}`;
    lines.push(`| ${i + 1} | ${o.departure_date} | ${legRoute(o)} | ${o.price} | ${o.duration} | ${stopsLabel3(o.stops)} | ${o.name} | ${o.departure}\u2192${arr} |`);
  }
  lines.push("");
  lines.push(`**Total: ${totalPrice(itin.legs)}**`);
  if (itin.note)
    lines.push(`
> ${itin.note}`);
  const urls = itin.legs.filter((o) => o.url);
  if (urls.length) {
    lines.push("");
    for (const [i, o] of urls.entries())
      lines.push(`- [Book leg ${i + 1}](${o.url})`);
  }
  return lines.join(`
`);
}
function formatSearchSection(tag, entry) {
  const lines = [];
  lines.push(`### ${tag}`);
  lines.push("");
  lines.push(`> ${entry.query} \xB7 ${new Date(entry.timestamp).toLocaleString()}`);
  lines.push("");
  lines.push("| ID | Price | Stops | Duration | Carrier | Date | Dep\u2192Arr |");
  lines.push("|----|------:|-------|----------|---------|------|---------|");
  for (const o of entry.offers.slice(0, 10)) {
    const arr = `${o.arrival}${o.arrival_time_ahead}`;
    lines.push(`| ${o.id} | ${o.price} | ${stopsLabel3(o.stops)} | ${o.duration} | ${o.name} | ${o.departure_date} | ${o.departure}\u2192${arr} |`);
  }
  if (entry.offers.length > 10)
    lines.push(`
*\u2026and ${entry.offers.length - 10} more results*`);
  return lines.join(`
`);
}
function buildMarkdown(session, itineraries, title) {
  const sections = [];
  const heading = title ?? "Flight Search Results";
  const date = new Date().toISOString().slice(0, 10);
  sections.push(`# ${heading}`);
  sections.push(`*Generated ${date}*`);
  if (itineraries.length > 0) {
    sections.push(`
## Recommended Options
`);
    for (const itin of itineraries)
      sections.push(formatItinerary(itin));
  }
  if (session.searches && Object.keys(session.searches).length > 0) {
    sections.push(`
## All Searches
`);
    for (const [tag, entry] of Object.entries(session.searches)) {
      sections.push(formatSearchSection(tag, entry));
      sections.push("");
    }
  }
  return sections.join(`
`);
}
function parseOneItin(raw, start) {
  const title = raw[start] ?? "Untitled";
  const refs = [];
  let i = start + 1;
  while (i < raw.length && !raw[i].startsWith("--"))
    refs.push(raw[i++]);
  let note;
  if (raw[i] === "--note") {
    note = raw[++i];
    i++;
  }
  return { itin: { title, note, legs: refs }, next: i };
}
function parseItineraryArgs(raw) {
  const itineraries = [];
  let i = 0;
  while (i < raw.length) {
    if (raw[i] !== "--itin") {
      i++;
      continue;
    }
    const { itin, next } = parseOneItin(raw, i + 1);
    itineraries.push(itin);
    i = next;
  }
  return itineraries;
}
var takeoutCommand = defineCommand({
  meta: {
    name: "takeout",
    description: "Export all search results and itineraries to a markdown file"
  },
  args: {
    output: {
      type: "string",
      alias: "o",
      description: "Output file path (default: ~/Desktop/flights-<date>.md)"
    },
    title: { type: "string", description: "Document title" }
  },
  async run({ args }) {
    const session = await loadSession();
    if (!session) {
      console.log(formatError("NO_SESSION", "No search results cached. Run `flt search` first."));
      return;
    }
    const rawArgs = process.argv.slice(2);
    const itinDefs = parseItineraryArgs(rawArgs);
    const itineraries = [];
    for (const def of itinDefs) {
      const legs = [];
      for (const ref of def.legs) {
        const offer = resolveOffer(session, ref);
        if (!offer) {
          console.log(formatError("NOT_FOUND", `Offer '${ref}' not found in session.`));
          return;
        }
        legs.push(offer);
      }
      itineraries.push({ title: def.title, note: def.note, legs });
    }
    const md = buildMarkdown(session, itineraries, args.title);
    const date = new Date().toISOString().slice(0, 10);
    const defaultPath = join3(process.env.HOME ?? ".", "Desktop", `flights-${date}.md`);
    const outPath = args.output ?? defaultPath;
    await writeFile3(outPath, md, "utf-8");
    console.log(JSON.stringify({
      ok: true,
      path: outPath,
      searches: Object.keys(session.searches ?? {}).length,
      itineraries: itineraries.length
    }));
  }
});

// src/cli/index.ts
var SUB_COMMANDS = {
  search: searchCommand,
  inspect: inspectCommand,
  itinerary: itineraryCommand,
  matrix: matrixCommand,
  airports: airportsCommand,
  prime: primeCommand,
  takeout: takeoutCommand,
  config: configCommand
};
var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
var FLEX_DATE = /^\d{1,2}\/\d{1,2}\/\d{4}$|^(today|tomorrow|overmorrow)$/i;
var main = defineCommand({
  meta: { name: "flt", version: "0.1.0", description: "Flight search CLI" },
  subCommands: SUB_COMMANDS
});
var args = process.argv.slice(2);
var first = args[0];
if (!first || first === "--help" || first === "-h") {
  await showUsage(main);
} else if (first in SUB_COMMANDS) {
  runMain(main);
} else if (first.match(/^O\d+$/i)) {
  runCommand(inspectCommand, { rawArgs: args });
} else if (args.length >= 3 && (DATE_RE.test(args[2]) || FLEX_DATE.test(args[2]))) {
  runCommand(searchCommand, { rawArgs: args });
} else {
  runCommand(airportsCommand, { rawArgs: [args[0], "--limit", "5"] });
}
