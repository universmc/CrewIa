import debug from "debug";
var __defProp$6 = Object.defineProperty, __defNormalProp$6 = (obj, key, value) => key in obj ? __defProp$6(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __publicField$6 = (obj, key, value) => (__defNormalProp$6(obj, typeof key != "symbol" ? key + "" : key, value), value);
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function pathRegExp(pattern) {
  const re = [];
  for (const part of pattern.split("."))
    part === "*" ? re.push("[^.]+") : part === "**" ? re.push(".*") : re.push(escapeRegExp(part));
  return new RegExp(`^${re.join(".")}$`);
}
class Path {
  constructor(pattern) {
    __publicField$6(this, "pattern"), __publicField$6(this, "patternRe"), this.pattern = pattern, this.patternRe = pathRegExp(pattern);
  }
  matches(str) {
    return this.patternRe.test(str);
  }
  toJSON() {
    return this.pattern;
  }
}
var __defProp$5 = Object.defineProperty, __defNormalProp$5 = (obj, key, value) => key in obj ? __defProp$5(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __publicField$5 = (obj, key, value) => (__defNormalProp$5(obj, typeof key != "symbol" ? key + "" : key, value), value);
class StreamValue {
  constructor(generator) {
    __publicField$5(this, "type", "stream"), __publicField$5(this, "generator"), __publicField$5(this, "ticker"), __publicField$5(this, "isDone"), __publicField$5(this, "data"), this.generator = generator, this.ticker = null, this.isDone = !1, this.data = [];
  }
  // eslint-disable-next-line class-methods-use-this
  isArray() {
    return !0;
  }
  async get() {
    const result = [];
    for await (const value of this)
      result.push(await value.get());
    return result;
  }
  async *[Symbol.asyncIterator]() {
    let i = 0;
    for (; ; ) {
      for (; i < this.data.length; i++)
        yield this.data[i];
      if (this.isDone)
        return;
      await this._nextTick();
    }
  }
  _nextTick() {
    if (this.ticker)
      return this.ticker;
    let currentResolver;
    const setupTicker = () => {
      this.ticker = new Promise((resolve) => {
        currentResolver = resolve;
      });
    }, tick = () => {
      currentResolver(), setupTicker();
    }, fetch = async () => {
      for await (const value of this.generator())
        this.data.push(value), tick();
      this.isDone = !0, tick();
    };
    return setupTicker(), fetch(), this.ticker;
  }
}
const RFC3339_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|([-+]\d{2}:\d{2}))$/;
function parseRFC3339(str) {
  return RFC3339_REGEX.test(str) ? new Date(str) : null;
}
function formatRFC3339(d) {
  const year = addLeadingZero(d.getUTCFullYear(), 4), month = addLeadingZero(d.getUTCMonth() + 1, 2), day = addLeadingZero(d.getUTCDate(), 2), hour = addLeadingZero(d.getUTCHours(), 2), minute = addLeadingZero(d.getUTCMinutes(), 2), second = addLeadingZero(d.getUTCSeconds(), 2);
  let fractionalSecond = "";
  const millis = d.getMilliseconds();
  return millis != 0 && (fractionalSecond = `.${addLeadingZero(millis, 3)}`), `${year}-${month}-${day}T${hour}:${minute}:${second}${fractionalSecond}Z`;
}
function addLeadingZero(num, targetLength) {
  let str = num.toString();
  for (; str.length < targetLength; )
    str = `0${str}`;
  return str;
}
var __defProp$4 = Object.defineProperty, __defNormalProp$4 = (obj, key, value) => key in obj ? __defProp$4(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __publicField$4 = (obj, key, value) => (__defNormalProp$4(obj, typeof key != "symbol" ? key + "" : key, value), value);
class StaticValue {
  constructor(data, type) {
    __publicField$4(this, "data"), __publicField$4(this, "type"), this.data = data, this.type = type;
  }
  isArray() {
    return this.type === "array";
  }
  // eslint-disable-next-line require-await
  async get() {
    return this.data;
  }
  [Symbol.asyncIterator]() {
    if (Array.isArray(this.data))
      return function* (data) {
        for (const element of data)
          yield fromJS(element);
      }(this.data);
    throw new Error(`Cannot iterate over: ${this.type}`);
  }
}
const NULL_VALUE = new StaticValue(null, "null"), TRUE_VALUE = new StaticValue(!0, "boolean"), FALSE_VALUE = new StaticValue(!1, "boolean");
class DateTime {
  constructor(date) {
    __publicField$4(this, "date"), this.date = date;
  }
  static parseToValue(str) {
    const date = parseRFC3339(str);
    return date ? new StaticValue(new DateTime(date), "datetime") : NULL_VALUE;
  }
  equals(other) {
    return this.date.getTime() == other.date.getTime();
  }
  add(secs) {
    const copy = new Date(this.date.getTime());
    return copy.setTime(copy.getTime() + secs * 1e3), new DateTime(copy);
  }
  difference(other) {
    return (this.date.getTime() - other.date.getTime()) / 1e3;
  }
  compareTo(other) {
    return this.date.getTime() - other.date.getTime();
  }
  toString() {
    return formatRFC3339(this.date);
  }
  toJSON() {
    return this.toString();
  }
}
function fromNumber(num) {
  return Number.isFinite(num) ? new StaticValue(num, "number") : NULL_VALUE;
}
function fromString(str) {
  return new StaticValue(str, "string");
}
function fromDateTime(dt) {
  return new StaticValue(dt, "datetime");
}
function fromPath(path) {
  return new StaticValue(path, "path");
}
function isIterator(obj) {
  return obj && typeof obj.next == "function";
}
function fromJS(val) {
  return isIterator(val) ? new StreamValue(async function* () {
    for await (const value of val)
      yield fromJS(value);
  }) : val == null ? NULL_VALUE : new StaticValue(val, getType(val));
}
function getType(data) {
  return data === null || typeof data > "u" ? "null" : Array.isArray(data) ? "array" : data instanceof Path ? "path" : data instanceof DateTime ? "datetime" : typeof data;
}
function isEqual(a, b) {
  return a.type === "string" && b.type === "string" || a.type === "boolean" && b.type === "boolean" || a.type === "null" && b.type === "null" || a.type === "number" && b.type === "number" ? a.data === b.data : a.type === "datetime" && b.type === "datetime" ? a.data.equals(b.data) : !1;
}
const CHARS = /([^!@#$%^&*(),\\/?";:{}|[\]+<>\s-])+/g, CHARS_WITH_WILDCARD = /([^!@#$%^&(),\\/?";:{}|[\]+<>\s-])+/g, EDGE_CHARS = /(\b\.+|\.+\b)/g, MAX_TERM_LENGTH = 1024;
function matchText(tokens, patterns) {
  return tokens.length === 0 || patterns.length === 0 ? !1 : patterns.every((pattern) => pattern(tokens));
}
function matchTokenize(text) {
  return text.replace(EDGE_CHARS, "").match(CHARS) || [];
}
function matchAnalyzePattern(text) {
  return matchPatternRegex(text).map((re) => (tokens) => tokens.some((token) => re.test(token)));
}
function matchPatternRegex(text) {
  return (text.replace(EDGE_CHARS, "").match(CHARS_WITH_WILDCARD) || []).map(
    (term) => new RegExp(`^${term.slice(0, MAX_TERM_LENGTH).replace(/\*/g, ".*")}$`, "i")
  );
}
async function gatherText(value, cb) {
  if (value.type === "string")
    return cb(value.data), !0;
  if (value.isArray()) {
    let success = !0;
    for await (const part of value)
      part.type === "string" ? cb(part.data) : success = !1;
    return success;
  }
  return !1;
}
const TYPE_ORDER = {
  datetime: 1,
  number: 2,
  string: 3,
  boolean: 4
};
function partialCompare(a, b) {
  const aType = getType(a), bType = getType(b);
  if (aType !== bType)
    return null;
  switch (aType) {
    case "number":
    case "boolean":
      return a - b;
    case "string":
      return a < b ? -1 : a > b ? 1 : 0;
    case "datetime":
      return a.compareTo(b);
    default:
      return null;
  }
}
function totalCompare(a, b) {
  const aType = getType(a), bType = getType(b), aTypeOrder = TYPE_ORDER[aType] || 100, bTypeOrder = TYPE_ORDER[bType] || 100;
  if (aTypeOrder !== bTypeOrder)
    return aTypeOrder - bTypeOrder;
  let result = partialCompare(a, b);
  return result === null && (result = 0), result;
}
const operators = {
  "==": function(left, right) {
    return isEqual(left, right) ? TRUE_VALUE : FALSE_VALUE;
  },
  "!=": function(left, right) {
    return isEqual(left, right) ? FALSE_VALUE : TRUE_VALUE;
  },
  ">": function(left, right) {
    if (left.type === "stream" || right.type === "stream")
      return NULL_VALUE;
    const result = partialCompare(left.data, right.data);
    return result === null ? NULL_VALUE : result > 0 ? TRUE_VALUE : FALSE_VALUE;
  },
  ">=": function(left, right) {
    if (left.type === "stream" || right.type === "stream")
      return NULL_VALUE;
    const result = partialCompare(left.data, right.data);
    return result === null ? NULL_VALUE : result >= 0 ? TRUE_VALUE : FALSE_VALUE;
  },
  "<": function(left, right) {
    if (left.type === "stream" || right.type === "stream")
      return NULL_VALUE;
    const result = partialCompare(left.data, right.data);
    return result === null ? NULL_VALUE : result < 0 ? TRUE_VALUE : FALSE_VALUE;
  },
  "<=": function(left, right) {
    if (left.type === "stream" || right.type === "stream")
      return NULL_VALUE;
    const result = partialCompare(left.data, right.data);
    return result === null ? NULL_VALUE : result <= 0 ? TRUE_VALUE : FALSE_VALUE;
  },
  // eslint-disable-next-line func-name-matching
  in: async function(left, right) {
    if (right.type === "path")
      return left.type !== "string" ? NULL_VALUE : right.data.matches(left.data) ? TRUE_VALUE : FALSE_VALUE;
    if (right.isArray()) {
      for await (const b of right)
        if (isEqual(left, b))
          return TRUE_VALUE;
      return FALSE_VALUE;
    }
    return NULL_VALUE;
  },
  match: async function(left, right) {
    let tokens = [], patterns = [];
    return await gatherText(left, (part) => {
      tokens = tokens.concat(matchTokenize(part));
    }), await gatherText(right, (part) => {
      patterns = patterns.concat(matchAnalyzePattern(part));
    }) && matchText(tokens, patterns) ? TRUE_VALUE : FALSE_VALUE;
  },
  "+": function(left, right) {
    return left.type === "datetime" && right.type === "number" ? fromDateTime(left.data.add(right.data)) : left.type === "number" && right.type === "number" ? fromNumber(left.data + right.data) : left.type === "string" && right.type === "string" ? fromString(left.data + right.data) : left.type === "object" && right.type === "object" ? fromJS({ ...left.data, ...right.data }) : left.type === "array" && right.type === "array" ? fromJS(left.data.concat(right.data)) : left.isArray() && right.isArray() ? new StreamValue(async function* () {
      for await (const val of left)
        yield val;
      for await (const val of right)
        yield val;
    }) : NULL_VALUE;
  },
  "-": function(left, right) {
    return left.type === "datetime" && right.type === "number" ? fromDateTime(left.data.add(-right.data)) : left.type === "datetime" && right.type === "datetime" ? fromNumber(left.data.difference(right.data)) : left.type === "number" && right.type === "number" ? fromNumber(left.data - right.data) : NULL_VALUE;
  },
  "*": numericOperator((a, b) => a * b),
  "/": numericOperator((a, b) => a / b),
  "%": numericOperator((a, b) => a % b),
  "**": numericOperator((a, b) => Math.pow(a, b))
};
function numericOperator(impl) {
  return function(left, right) {
    if (left.type === "number" && right.type === "number") {
      const result = impl(left.data, right.data);
      return fromNumber(result);
    }
    return NULL_VALUE;
  };
}
var __defProp$3 = Object.defineProperty, __defNormalProp$3 = (obj, key, value) => key in obj ? __defProp$3(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __publicField$3 = (obj, key, value) => (__defNormalProp$3(obj, typeof key != "symbol" ? key + "" : key, value), value);
let Scope$1 = class Scope {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(params, source, value, context, parent) {
    __publicField$3(this, "params"), __publicField$3(this, "source"), __publicField$3(this, "value"), __publicField$3(this, "parent"), __publicField$3(this, "context"), __publicField$3(this, "isHidden", !1), this.params = params, this.source = source, this.value = value, this.context = context, this.parent = parent;
  }
  createNested(value) {
    return this.isHidden ? new Scope(this.params, this.source, value, this.context, this.parent) : new Scope(this.params, this.source, value, this.context, this);
  }
  createHidden(value) {
    const result = this.createNested(value);
    return result.isHidden = !0, result;
  }
};
function evaluate(node, scope, execute = evaluate) {
  const func = EXECUTORS[node.type];
  return func(node, scope, execute);
}
function promiselessApply(value, cb) {
  return "then" in value ? value.then(cb) : cb(value);
}
const EXECUTORS = {
  This(_, scope) {
    return scope.value;
  },
  Selector() {
    throw new Error("Selectors can not be evaluated");
  },
  Everything(_, scope) {
    return scope.source;
  },
  Parameter({ name }, scope) {
    return fromJS(scope.params[name]);
  },
  Context({ key }, scope) {
    if (key === "before" || key === "after")
      return scope.context[key] || NULL_VALUE;
    throw new Error(`unknown context key: ${key}`);
  },
  Parent({ n }, scope) {
    let current = scope;
    for (let i = 0; i < n; i++) {
      if (!current.parent)
        return NULL_VALUE;
      current = current.parent;
    }
    return current.value;
  },
  OpCall({ op, left, right }, scope, execute) {
    const func = operators[op];
    if (!func)
      throw new Error(`Unknown operator: ${op}`);
    const leftValue = execute(left, scope), rightValue = execute(right, scope);
    return "then" in leftValue || "then" in rightValue ? (async () => func(await leftValue, await rightValue))() : func(leftValue, rightValue);
  },
  async Select({ alternatives, fallback }, scope, execute) {
    for (const alt of alternatives) {
      const altCond = await execute(alt.condition, scope);
      if (altCond.type === "boolean" && altCond.data === !0)
        return execute(alt.value, scope);
    }
    return fallback ? execute(fallback, scope) : NULL_VALUE;
  },
  async InRange({ base, left, right, isInclusive }, scope, execute) {
    const value = await execute(base, scope), leftValue = await execute(left, scope), rightValue = await execute(right, scope), leftCmp = partialCompare(await value.get(), await leftValue.get());
    if (leftCmp === null)
      return NULL_VALUE;
    const rightCmp = partialCompare(await value.get(), await rightValue.get());
    return rightCmp === null ? NULL_VALUE : isInclusive ? leftCmp >= 0 && rightCmp <= 0 ? TRUE_VALUE : FALSE_VALUE : leftCmp >= 0 && rightCmp < 0 ? TRUE_VALUE : FALSE_VALUE;
  },
  async Filter({ base, expr }, scope, execute) {
    const baseValue = await execute(base, scope);
    return baseValue.isArray() ? new StreamValue(async function* () {
      for await (const elem of baseValue) {
        const newScope = scope.createNested(elem), exprValue = await execute(expr, newScope);
        exprValue.type === "boolean" && exprValue.data === !0 && (yield elem);
      }
    }) : NULL_VALUE;
  },
  async Projection({ base, expr }, scope, execute) {
    const baseValue = await execute(base, scope);
    if (baseValue.type !== "object")
      return NULL_VALUE;
    const newScope = scope.createNested(baseValue);
    return execute(expr, newScope);
  },
  FuncCall({ func, args }, scope, execute) {
    return func(args, scope, execute);
  },
  async PipeFuncCall({ func, base, args }, scope, execute) {
    const baseValue = await execute(base, scope);
    return func(baseValue, args, scope, execute);
  },
  async AccessAttribute({ base, name }, scope, execute) {
    let value = scope.value;
    return base && (value = await execute(base, scope)), value.type === "object" && value.data.hasOwnProperty(name) ? fromJS(value.data[name]) : NULL_VALUE;
  },
  async AccessElement({ base, index }, scope, execute) {
    const baseValue = await execute(base, scope);
    if (!baseValue.isArray())
      return NULL_VALUE;
    const data = await baseValue.get(), finalIndex = index < 0 ? index + data.length : index;
    return fromJS(data[finalIndex]);
  },
  async Slice({ base, left, right, isInclusive }, scope, execute) {
    const baseValue = await execute(base, scope);
    if (!baseValue.isArray())
      return NULL_VALUE;
    const array2 = await baseValue.get();
    let leftIdx = left, rightIdx = right;
    return leftIdx < 0 && (leftIdx = array2.length + leftIdx), rightIdx < 0 && (rightIdx = array2.length + rightIdx), isInclusive && rightIdx++, leftIdx < 0 && (leftIdx = 0), rightIdx < 0 && (rightIdx = 0), fromJS(array2.slice(leftIdx, rightIdx));
  },
  async Deref({ base }, scope, execute) {
    const value = await execute(base, scope);
    if (!scope.source.isArray() || value.type !== "object")
      return NULL_VALUE;
    const id = value.data._ref;
    if (typeof id != "string")
      return NULL_VALUE;
    if (scope.context.dereference)
      return fromJS(await scope.context.dereference({ _ref: id }));
    for await (const doc of scope.source)
      if (doc.type === "object" && id === doc.data._id)
        return doc;
    return NULL_VALUE;
  },
  Value({ value }) {
    return fromJS(value);
  },
  Group({ base }, scope, execute) {
    return execute(base, scope);
  },
  async Object({ attributes }, scope, execute) {
    const result = {};
    for (const attr of attributes) {
      const attrType = attr.type;
      switch (attr.type) {
        case "ObjectAttributeValue": {
          const value = await execute(attr.value, scope);
          result[attr.name] = await value.get();
          break;
        }
        case "ObjectConditionalSplat": {
          const cond = await execute(attr.condition, scope);
          if (cond.type !== "boolean" || cond.data === !1)
            continue;
          const value = await execute(attr.value, scope);
          value.type === "object" && Object.assign(result, value.data);
          break;
        }
        case "ObjectSplat": {
          const value = await execute(attr.value, scope);
          value.type === "object" && Object.assign(result, value.data);
          break;
        }
        default:
          throw new Error(`Unknown node type: ${attrType}`);
      }
    }
    return fromJS(result);
  },
  Array({ elements }, scope, execute) {
    return new StreamValue(async function* () {
      for (const element of elements) {
        const value = await execute(element.value, scope);
        if (element.isSplat) {
          if (value.isArray())
            for await (const v of value)
              yield v;
        } else
          yield value;
      }
    });
  },
  Tuple() {
    throw new Error("tuples can not be evaluated");
  },
  async Or({ left, right }, scope, execute) {
    const leftValue = await execute(left, scope), rightValue = await execute(right, scope);
    return leftValue.type === "boolean" && leftValue.data === !0 || rightValue.type === "boolean" && rightValue.data === !0 ? TRUE_VALUE : leftValue.type !== "boolean" || rightValue.type !== "boolean" ? NULL_VALUE : FALSE_VALUE;
  },
  async And({ left, right }, scope, execute) {
    const leftValue = await execute(left, scope), rightValue = await execute(right, scope);
    return leftValue.type === "boolean" && leftValue.data === !1 || rightValue.type === "boolean" && rightValue.data === !1 ? FALSE_VALUE : leftValue.type !== "boolean" || rightValue.type !== "boolean" ? NULL_VALUE : TRUE_VALUE;
  },
  async Not({ base }, scope, execute) {
    const value = await execute(base, scope);
    return value.type !== "boolean" ? NULL_VALUE : value.data ? FALSE_VALUE : TRUE_VALUE;
  },
  Neg({ base }, scope, execute) {
    return promiselessApply(execute(base, scope), (value) => value.type !== "number" ? NULL_VALUE : fromNumber(-value.data));
  },
  Pos({ base }, scope, execute) {
    return promiselessApply(execute(base, scope), (value) => value.type !== "number" ? NULL_VALUE : fromNumber(value.data));
  },
  Asc() {
    return NULL_VALUE;
  },
  Desc() {
    return NULL_VALUE;
  },
  async ArrayCoerce({ base }, scope, execute) {
    const value = await execute(base, scope);
    return value.isArray() ? value : NULL_VALUE;
  },
  async Map({ base, expr }, scope, execute) {
    const value = await execute(base, scope);
    return value.isArray() ? new StreamValue(async function* () {
      for await (const elem of value) {
        const newScope = scope.createHidden(elem);
        yield await execute(expr, newScope);
      }
    }) : NULL_VALUE;
  },
  async FlatMap({ base, expr }, scope, execute) {
    const value = await execute(base, scope);
    return value.isArray() ? new StreamValue(async function* () {
      for await (const elem of value) {
        const newScope = scope.createHidden(elem), innerValue = await execute(expr, newScope);
        if (innerValue.isArray())
          for await (const inner of innerValue)
            yield inner;
        else
          yield innerValue;
      }
    }) : NULL_VALUE;
  }
};
function evaluateQuery(tree, options = {}) {
  const root = fromJS(options.root), dataset = fromJS(options.dataset), params = { ...options.params }, scope = new Scope$1(
    params,
    dataset,
    root,
    {
      timestamp: options.timestamp || /* @__PURE__ */ new Date(),
      identity: options.identity === void 0 ? "me" : options.identity,
      sanity: options.sanity,
      after: options.after ? fromJS(options.after) : null,
      before: options.before ? fromJS(options.before) : null,
      dereference: options.dereference
    },
    null
  );
  return evaluate(tree, scope);
}
function canConstantEvaluate(node) {
  switch (node.type) {
    case "Group":
      return canConstantEvaluate(node.base);
    case "Value":
    case "Parameter":
      return !0;
    case "Pos":
    case "Neg":
      return canConstantEvaluate(node.base);
    case "OpCall":
      switch (node.op) {
        case "+":
        case "-":
        case "*":
        case "/":
        case "%":
        case "**":
          return canConstantEvaluate(node.left) && canConstantEvaluate(node.right);
        default:
          return !1;
      }
    default:
      return !1;
  }
}
const DUMMY_SCOPE = new Scope$1(
  {},
  NULL_VALUE,
  NULL_VALUE,
  { timestamp: /* @__PURE__ */ new Date(0), identity: "me", before: null, after: null },
  null
);
function tryConstantEvaluate(node) {
  return canConstantEvaluate(node) ? constantEvaluate(node) : null;
}
function constantEvaluate(node) {
  const value = evaluate(node, DUMMY_SCOPE, constantEvaluate);
  if ("then" in value)
    throw new Error("BUG: constant evaluate should never return a promise");
  return value;
}
async function portableTextContent(value) {
  if (value.type === "object")
    return blockText(value.data);
  if (value.isArray()) {
    const texts = await arrayText(value);
    if (texts.length > 0)
      return texts.join(`

`);
  }
  return null;
}
async function arrayText(value, result = []) {
  for await (const block of value)
    if (block.type === "object") {
      const text = blockText(block.data);
      text !== null && result.push(text);
    } else
      block.isArray() && await arrayText(block, result);
  return result;
}
function blockText(obj) {
  if (typeof obj._type != "string")
    return null;
  const children = obj.children;
  if (!Array.isArray(children))
    return null;
  let result = "";
  for (const child of children)
    child && typeof child == "object" && typeof child._type == "string" && child._type === "span" && typeof child.text == "string" && (result += child.text);
  return result;
}
const BM25k = 1.2;
async function evaluateScore(node, scope, execute) {
  if (node.type === "OpCall" && node.op === "match")
    return evaluateMatchScore(node.left, node.right, scope, execute);
  if (node.type === "FuncCall" && node.name === "boost") {
    const innerScore = await evaluateScore(node.args[0], scope, execute), boost = await execute(node.args[1], scope);
    return boost.type === "number" && innerScore > 0 ? innerScore + boost.data : 0;
  }
  switch (node.type) {
    case "Or": {
      const leftScore = await evaluateScore(node.left, scope, execute), rightScore = await evaluateScore(node.right, scope, execute);
      return leftScore + rightScore;
    }
    case "And": {
      const leftScore = await evaluateScore(node.left, scope, execute), rightScore = await evaluateScore(node.right, scope, execute);
      return leftScore === 0 || rightScore === 0 ? 0 : leftScore + rightScore;
    }
    default: {
      const res = await execute(node, scope);
      return res.type === "boolean" && res.data === !0 ? 1 : 0;
    }
  }
}
async function evaluateMatchScore(left, right, scope, execute) {
  const text = await execute(left, scope), pattern = await execute(right, scope);
  let tokens = [], terms = [];
  if (await gatherText(text, (part) => {
    tokens = tokens.concat(matchTokenize(part));
  }), !await gatherText(pattern, (part) => {
    terms = terms.concat(matchPatternRegex(part));
  }) || tokens.length === 0 || terms.length === 0)
    return 0;
  let score = 0;
  for (const re of terms) {
    const freq = tokens.reduce((c, token) => c + (re.test(token) ? 1 : 0), 0);
    score += freq * (BM25k + 1) / (freq + BM25k);
  }
  return score;
}
function hasReference(value, pathSet) {
  switch (getType(value)) {
    case "array":
      for (const v of value)
        if (hasReference(v, pathSet))
          return !0;
      break;
    case "object":
      if (value._ref)
        return pathSet.has(value._ref);
      for (const v of Object.values(value))
        if (hasReference(v, pathSet))
          return !0;
      break;
  }
  return !1;
}
function countUTF8(str) {
  let count2 = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    code >= 55296 && code <= 56319 || count2++;
  }
  return count2;
}
const _global = {};
_global.anywhere = async function() {
  throw new Error("not implemented");
};
_global.anywhere.arity = 1;
_global.coalesce = async function(args, scope, execute) {
  for (const arg of args) {
    const value = await execute(arg, scope);
    if (value.type !== "null")
      return value;
  }
  return NULL_VALUE;
};
_global.count = async function(args, scope, execute) {
  const inner = await execute(args[0], scope);
  if (!inner.isArray())
    return NULL_VALUE;
  let num = 0;
  for await (const _ of inner)
    num++;
  return fromNumber(num);
};
_global.count.arity = 1;
_global.dateTime = async function(args, scope, execute) {
  const val = await execute(args[0], scope);
  return val.type === "datetime" ? val : val.type !== "string" ? NULL_VALUE : DateTime.parseToValue(val.data);
};
_global.dateTime.arity = 1;
_global.defined = async function(args, scope, execute) {
  return (await execute(args[0], scope)).type === "null" ? FALSE_VALUE : TRUE_VALUE;
};
_global.defined.arity = 1;
_global.identity = async function(args, scope) {
  return fromString(scope.context.identity);
};
_global.identity.arity = 0;
_global.length = async function(args, scope, execute) {
  const inner = await execute(args[0], scope);
  if (inner.type === "string")
    return fromNumber(countUTF8(inner.data));
  if (inner.isArray()) {
    let num = 0;
    for await (const _ of inner)
      num++;
    return fromNumber(num);
  }
  return NULL_VALUE;
};
_global.length.arity = 1;
_global.path = async function(args, scope, execute) {
  const inner = await execute(args[0], scope);
  return inner.type !== "string" ? NULL_VALUE : fromPath(new Path(inner.data));
};
_global.path.arity = 1;
_global.string = async function(args, scope, execute) {
  const value = await execute(args[0], scope);
  switch (value.type) {
    case "number":
    case "string":
    case "boolean":
    case "datetime":
      return fromString(`${value.data}`);
    default:
      return NULL_VALUE;
  }
};
_global.string.arity = 1;
_global.references = async function(args, scope, execute) {
  const pathSet = /* @__PURE__ */ new Set();
  for (const arg of args) {
    const path2 = await execute(arg, scope);
    if (path2.type === "string")
      pathSet.add(path2.data);
    else if (path2.isArray())
      for await (const elem of path2)
        elem.type === "string" && pathSet.add(elem.data);
  }
  if (pathSet.size === 0)
    return FALSE_VALUE;
  const scopeValue = await scope.value.get();
  return hasReference(scopeValue, pathSet) ? TRUE_VALUE : FALSE_VALUE;
};
_global.references.arity = (c) => c >= 1;
_global.round = async function(args, scope, execute) {
  const value = await execute(args[0], scope);
  if (value.type !== "number")
    return NULL_VALUE;
  const num = value.data;
  let prec = 0;
  if (args.length === 2) {
    const precValue = await execute(args[1], scope);
    if (precValue.type !== "number" || precValue.data < 0 || !Number.isInteger(precValue.data))
      return NULL_VALUE;
    prec = precValue.data;
  }
  return prec === 0 ? num < 0 ? fromNumber(-Math.round(-num)) : fromNumber(Math.round(num)) : fromNumber(Number(num.toFixed(prec)));
};
_global.round.arity = (count2) => count2 >= 1 && count2 <= 2;
_global.now = async function(args, scope) {
  return fromString(scope.context.timestamp.toISOString());
};
_global.now.arity = 0;
_global.boost = async function() {
  throw new Error("unexpected boost call");
};
_global.boost.arity = 2;
const string2 = {};
string2.lower = async function(args, scope, execute) {
  const value = await execute(args[0], scope);
  return value.type !== "string" ? NULL_VALUE : fromString(value.data.toLowerCase());
};
string2.lower.arity = 1;
string2.upper = async function(args, scope, execute) {
  const value = await execute(args[0], scope);
  return value.type !== "string" ? NULL_VALUE : fromString(value.data.toUpperCase());
};
string2.upper.arity = 1;
string2.split = async function(args, scope, execute) {
  const str = await execute(args[0], scope);
  if (str.type !== "string")
    return NULL_VALUE;
  const sep = await execute(args[1], scope);
  return sep.type !== "string" ? NULL_VALUE : str.data.length === 0 ? fromJS([]) : sep.data.length === 0 ? fromJS(Array.from(str.data)) : fromJS(str.data.split(sep.data));
};
string2.split.arity = 2;
_global.lower = string2.lower;
_global.upper = string2.upper;
string2.startsWith = async function(args, scope, execute) {
  const str = await execute(args[0], scope);
  if (str.type !== "string")
    return NULL_VALUE;
  const prefix = await execute(args[1], scope);
  return prefix.type !== "string" ? NULL_VALUE : str.data.startsWith(prefix.data) ? TRUE_VALUE : FALSE_VALUE;
};
string2.startsWith.arity = 2;
const array = {};
array.join = async function(args, scope, execute) {
  const arr = await execute(args[0], scope);
  if (!arr.isArray())
    return NULL_VALUE;
  const sep = await execute(args[1], scope);
  if (sep.type !== "string")
    return NULL_VALUE;
  let buf = "", needSep = !1;
  for await (const elem of arr) {
    switch (needSep && (buf += sep.data), elem.type) {
      case "number":
      case "string":
      case "boolean":
      case "datetime":
        buf += `${elem.data}`;
        break;
      default:
        return NULL_VALUE;
    }
    needSep = !0;
  }
  return fromJS(buf);
};
array.join.arity = 2;
array.compact = async function(args, scope, execute) {
  const arr = await execute(args[0], scope);
  return arr.isArray() ? new StreamValue(async function* () {
    for await (const elem of arr)
      elem.type !== "null" && (yield elem);
  }) : NULL_VALUE;
};
array.compact.arity = 1;
array.unique = async function(args, scope, execute) {
  const value = await execute(args[0], scope);
  return value.isArray() ? new StreamValue(async function* () {
    const added = /* @__PURE__ */ new Set();
    for await (const iter of value)
      switch (iter.type) {
        case "number":
        case "string":
        case "boolean":
        case "datetime":
          added.has(iter.data) || (added.add(iter.data), yield iter);
          break;
        default:
          yield iter;
      }
  }) : NULL_VALUE;
};
array.unique.arity = 1;
const pt = {};
pt.text = async function(args, scope, execute) {
  const value = await execute(args[0], scope), text = await portableTextContent(value);
  return text === null ? NULL_VALUE : fromString(text);
};
pt.text.arity = 1;
const sanity = {};
sanity.projectId = async function(args, scope) {
  return scope.context.sanity ? fromString(scope.context.sanity.projectId) : NULL_VALUE;
};
sanity.dataset = async function(args, scope) {
  return scope.context.sanity ? fromString(scope.context.sanity.dataset) : NULL_VALUE;
};
const pipeFunctions = {};
pipeFunctions.order = async function(base, args, scope, execute) {
  if (await !0, !base.isArray())
    return NULL_VALUE;
  const mappers = [], directions = [];
  let n = 0;
  for (let mapper of args) {
    let direction = "asc";
    mapper.type === "Desc" ? (direction = "desc", mapper = mapper.base) : mapper.type === "Asc" && (mapper = mapper.base), mappers.push(mapper), directions.push(direction), n++;
  }
  const aux = [];
  let idx = 0;
  for await (const value of base) {
    const newScope = scope.createNested(value), tuple = [await value.get(), idx];
    for (let i = 0; i < n; i++) {
      const result = await execute(mappers[i], newScope);
      tuple.push(await result.get());
    }
    aux.push(tuple), idx++;
  }
  return aux.sort((aTuple, bTuple) => {
    for (let i = 0; i < n; i++) {
      let c = totalCompare(aTuple[i + 2], bTuple[i + 2]);
      if (directions[i] === "desc" && (c = -c), c !== 0)
        return c;
    }
    return aTuple[1] - bTuple[1];
  }), fromJS(aux.map((v) => v[0]));
};
pipeFunctions.order.arity = (count2) => count2 >= 1;
pipeFunctions.score = async function(base, args, scope, execute) {
  if (!base.isArray())
    return NULL_VALUE;
  const unknown = [], scored = [];
  for await (const value of base) {
    if (value.type !== "object") {
      unknown.push(await value.get());
      continue;
    }
    const newScope = scope.createNested(value);
    let valueScore = typeof value.data._score == "number" ? value.data._score : 0;
    for (const arg of args)
      valueScore += await evaluateScore(arg, newScope, execute);
    const newObject = Object.assign({}, value.data, { _score: valueScore });
    scored.push(newObject);
  }
  return scored.sort((a, b) => b._score - a._score), fromJS(scored);
};
pipeFunctions.score.arity = (count2) => count2 >= 1;
const delta = {};
delta.operation = async function(args, scope) {
  const hasBefore = scope.context.before !== null, hasAfter = scope.context.after !== null;
  return hasBefore && hasAfter ? fromString("update") : hasAfter ? fromString("create") : hasBefore ? fromString("delete") : NULL_VALUE;
};
delta.changedAny = () => {
  throw new Error("not implemented");
};
delta.changedAny.arity = 1;
delta.changedAny.mode = "delta";
delta.changedOnly = () => {
  throw new Error("not implemented");
};
delta.changedOnly.arity = 1;
delta.changedOnly.mode = "delta";
const diff = {};
diff.changedAny = () => {
  throw new Error("not implemented");
};
diff.changedAny.arity = 3;
diff.changedOnly = () => {
  throw new Error("not implemented");
};
diff.changedOnly.arity = 3;
const math = {};
math.min = async function(args, scope, execute) {
  const arr = await execute(args[0], scope);
  if (!arr.isArray())
    return NULL_VALUE;
  let n;
  for await (const elem of arr)
    if (elem.type !== "null") {
      if (elem.type !== "number")
        return NULL_VALUE;
      (n === void 0 || elem.data < n) && (n = elem.data);
    }
  return fromJS(n);
};
math.min.arity = 1;
math.max = async function(args, scope, execute) {
  const arr = await execute(args[0], scope);
  if (!arr.isArray())
    return NULL_VALUE;
  let n;
  for await (const elem of arr)
    if (elem.type !== "null") {
      if (elem.type !== "number")
        return NULL_VALUE;
      (n === void 0 || elem.data > n) && (n = elem.data);
    }
  return fromJS(n);
};
math.max.arity = 1;
math.sum = async function(args, scope, execute) {
  const arr = await execute(args[0], scope);
  if (!arr.isArray())
    return NULL_VALUE;
  let n = 0;
  for await (const elem of arr)
    if (elem.type !== "null") {
      if (elem.type !== "number")
        return NULL_VALUE;
      n += elem.data;
    }
  return fromJS(n);
};
math.sum.arity = 1;
math.avg = async function(args, scope, execute) {
  const arr = await execute(args[0], scope);
  if (!arr.isArray())
    return NULL_VALUE;
  let n = 0, c = 0;
  for await (const elem of arr)
    if (elem.type !== "null") {
      if (elem.type !== "number")
        return NULL_VALUE;
      n += elem.data, c++;
    }
  return c === 0 ? NULL_VALUE : fromJS(n / c);
};
math.avg.arity = 1;
const dateTime2 = {};
dateTime2.now = async function(args, scope, execute) {
  return fromDateTime(new DateTime(scope.context.timestamp));
};
dateTime2.now.arity = 0;
const namespaces = {
  global: _global,
  string: string2,
  array,
  pt,
  delta,
  diff,
  sanity,
  math,
  dateTime: dateTime2
};
var __defProp$2 = Object.defineProperty, __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __publicField$2 = (obj, key, value) => (__defNormalProp$2(obj, typeof key != "symbol" ? key + "" : key, value), value);
class MarkProcessor {
  constructor(string, marks, parseOptions) {
    __publicField$2(this, "string"), __publicField$2(this, "marks"), __publicField$2(this, "index"), __publicField$2(this, "parseOptions"), __publicField$2(this, "allowBoost", !1), this.string = string, this.marks = marks, this.index = 0, this.parseOptions = parseOptions;
  }
  hasMark(pos = 0) {
    return this.index + pos < this.marks.length;
  }
  getMark(pos = 0) {
    return this.marks[this.index + pos];
  }
  shift() {
    this.index += 1;
  }
  process(visitor) {
    const mark = this.marks[this.index];
    this.shift();
    const func = visitor[mark.name];
    if (!func)
      throw new Error(`Unknown handler: ${mark.name}`);
    return func.call(visitor, this, mark);
  }
  processString() {
    return this.shift(), this.processStringEnd();
  }
  processStringEnd() {
    const prev = this.marks[this.index - 1], curr = this.marks[this.index];
    return this.shift(), this.string.slice(prev.position, curr.position);
  }
  slice(len) {
    const pos = this.marks[this.index].position;
    return this.string.slice(pos, pos + len);
  }
}
const WS = /^([\t\n\v\f\r \u0085\u00A0]|(\/\/[^\n]*\n))+/, NUM = /^\d+/, IDENT = /^[a-zA-Z_][a-zA-Z_0-9]*/;
function parse$1(str) {
  let pos = 0;
  pos = skipWS(str, pos);
  let result = parseExpr(str, pos, 0);
  return result.type === "error" ? result : (pos = skipWS(str, result.position), pos !== str.length ? (result.failPosition && (pos = result.failPosition - 1), { type: "error", position: pos }) : (delete result.position, delete result.failPosition, result));
}
function parseExpr(str, pos, level) {
  let startPos = pos, token = str[pos], marks;
  switch (token) {
    case "+": {
      let rhs = parseExpr(str, skipWS(str, pos + 1), 10);
      if (rhs.type === "error")
        return rhs;
      marks = [{ name: "pos", position: startPos }].concat(rhs.marks), pos = rhs.position;
      break;
    }
    case "-": {
      let rhs = parseExpr(str, skipWS(str, pos + 1), 8);
      if (rhs.type === "error")
        return rhs;
      marks = [{ name: "neg", position: startPos }].concat(rhs.marks), pos = rhs.position;
      break;
    }
    case "(": {
      let rhs = parseExpr(str, skipWS(str, pos + 1), 0);
      if (rhs.type === "error")
        return rhs;
      switch (pos = skipWS(str, rhs.position), str[pos]) {
        case ",": {
          for (marks = [{ name: "tuple", position: startPos }].concat(rhs.marks), pos = skipWS(str, pos + 1); ; ) {
            if (rhs = parseExpr(str, pos, 0), rhs.type === "error")
              return rhs;
            if (pos = skipWS(str, rhs.position), str[pos] !== ",")
              break;
            pos = skipWS(str, pos + 1);
          }
          if (str[pos] !== ")")
            return { type: "error", position: pos };
          pos++, marks.push({ name: "tuple_end", position: pos });
          break;
        }
        case ")": {
          pos++, marks = [{ name: "group", position: startPos }].concat(rhs.marks);
          break;
        }
        default:
          return { type: "error", position: pos };
      }
      break;
    }
    case "!": {
      let rhs = parseExpr(str, skipWS(str, pos + 1), 10);
      if (rhs.type === "error")
        return rhs;
      marks = [{ name: "not", position: startPos }].concat(rhs.marks), pos = rhs.position;
      break;
    }
    case "{": {
      let result = parseObject(str, pos);
      if (result.type === "error")
        return result;
      marks = result.marks, pos = result.position;
      break;
    }
    case "[":
      if (marks = [{ name: "array", position: pos }], pos = skipWS(str, pos + 1), str[pos] !== "]")
        for (; ; ) {
          str.slice(pos, pos + 3) === "..." && (marks.push({ name: "array_splat", position: pos }), pos = skipWS(str, pos + 3));
          let res = parseExpr(str, pos, 0);
          if (res.type === "error")
            return res;
          if (marks = marks.concat(res.marks), pos = res.position, pos = skipWS(str, pos), str[pos] !== "," || (pos = skipWS(str, pos + 1), str[pos] === "]"))
            break;
        }
      if (str[pos] === "]")
        pos++, marks.push({ name: "array_end", position: pos });
      else
        return { type: "error", position: pos };
      break;
    case "'":
    case '"': {
      let result = parseString(str, pos);
      if (result.type === "error")
        return result;
      marks = result.marks, pos = result.position;
      break;
    }
    case "^": {
      for (pos++, marks = []; str[pos] === "." && str[pos + 1] === "^"; )
        marks.push({ name: "dblparent", position: startPos }), pos += 2;
      marks.push({ name: "parent", position: startPos });
      break;
    }
    case "@":
      marks = [{ name: "this", position: startPos }], pos++;
      break;
    case "*":
      marks = [{ name: "everything", position: startPos }], pos++;
      break;
    case "$": {
      let identLen = parseRegex(str, pos + 1, IDENT);
      identLen && (pos += 1 + identLen, marks = [
        { name: "param", position: startPos },
        { name: "ident", position: startPos + 1 },
        { name: "ident_end", position: pos }
      ]);
      break;
    }
    default: {
      let numLen = parseRegex(str, pos, NUM);
      if (numLen) {
        pos += numLen;
        let name = "integer";
        if (str[pos] === ".") {
          let fracLen = parseRegex(str, pos + 1, NUM);
          fracLen && (name = "float", pos += 1 + fracLen);
        }
        if (str[pos] === "e" || str[pos] === "E") {
          name = "sci", pos++, (str[pos] === "+" || str[pos] === "-") && pos++;
          let expLen = parseRegex(str, pos, NUM);
          if (!expLen)
            return { type: "error", position: pos };
          pos += expLen;
        }
        marks = [
          { name, position: startPos },
          { name: name + "_end", position: pos }
        ];
        break;
      }
      let identLen = parseRegex(str, pos, IDENT);
      if (identLen) {
        switch (pos += identLen, str[pos]) {
          case ":":
          case "(": {
            let result = parseFuncCall(str, startPos, pos);
            if (result.type === "error")
              return result;
            marks = result.marks, pos = result.position;
            break;
          }
          default:
            marks = [
              { name: "this_attr", position: startPos },
              { name: "ident", position: startPos },
              { name: "ident_end", position: pos }
            ];
        }
        break;
      }
    }
  }
  if (!marks)
    return { type: "error", position: pos };
  let lhsLevel = 12, trav;
  loop:
    for (; ; ) {
      let innerPos = skipWS(str, pos);
      if (innerPos === str.length) {
        pos = innerPos;
        break;
      }
      if (trav = parseTraversal(str, innerPos), trav.type === "success") {
        for (marks.unshift({ name: "traverse", position: startPos }); trav.type === "success"; )
          marks = marks.concat(trav.marks), pos = trav.position, trav = parseTraversal(str, skipWS(str, pos));
        marks.push({ name: "traversal_end", position: pos });
        continue;
      }
      switch (str[innerPos]) {
        case "=": {
          switch (str[innerPos + 1]) {
            case ">": {
              if (level > 1 || lhsLevel <= 1)
                break loop;
              let rhs = parseExpr(str, skipWS(str, innerPos + 2), 1);
              if (rhs.type === "error")
                return rhs;
              marks = marks.concat(rhs.marks), marks.unshift({ name: "pair", position: startPos }), pos = rhs.position, lhsLevel = 1;
              break;
            }
            case "=": {
              if (level > 4 || lhsLevel <= 4)
                break loop;
              let rhs = parseExpr(str, skipWS(str, innerPos + 2), 5);
              if (rhs.type === "error")
                return rhs;
              marks.unshift({ name: "comp", position: startPos }), marks.push({ name: "op", position: innerPos }, { name: "op_end", position: innerPos + 2 }), marks = marks.concat(rhs.marks), pos = rhs.position, lhsLevel = 4;
              break;
            }
            default:
              break loop;
          }
          break;
        }
        case "+": {
          if (level > 6 || lhsLevel < 6)
            break loop;
          let rhs = parseExpr(str, skipWS(str, innerPos + 1), 7);
          if (rhs.type === "error")
            return rhs;
          marks = marks.concat(rhs.marks), marks.unshift({ name: "add", position: startPos }), pos = rhs.position, lhsLevel = 6;
          break;
        }
        case "-": {
          if (level > 6 || lhsLevel < 6)
            break loop;
          let rhs = parseExpr(str, skipWS(str, innerPos + 1), 7);
          if (rhs.type === "error")
            return rhs;
          marks = marks.concat(rhs.marks), marks.unshift({ name: "sub", position: startPos }), pos = rhs.position, lhsLevel = 6;
          break;
        }
        case "*": {
          if (str[innerPos + 1] === "*") {
            if (level > 8 || lhsLevel <= 8)
              break loop;
            let rhs2 = parseExpr(str, skipWS(str, innerPos + 2), 8);
            if (rhs2.type === "error")
              return rhs2;
            marks = marks.concat(rhs2.marks), marks.unshift({ name: "pow", position: startPos }), pos = rhs2.position, lhsLevel = 8;
            break;
          }
          if (level > 7 || lhsLevel < 7)
            break loop;
          let rhs = parseExpr(str, skipWS(str, innerPos + 1), 8);
          if (rhs.type === "error")
            return rhs;
          marks = marks.concat(rhs.marks), marks.unshift({ name: "mul", position: startPos }), pos = rhs.position, lhsLevel = 7;
          break;
        }
        case "/": {
          if (level > 7 || lhsLevel < 7)
            break loop;
          let rhs = parseExpr(str, skipWS(str, innerPos + 1), 8);
          if (rhs.type === "error")
            return rhs;
          marks = marks.concat(rhs.marks), marks.unshift({ name: "div", position: startPos }), pos = rhs.position, lhsLevel = 7;
          break;
        }
        case "%": {
          if (level > 7 || lhsLevel < 7)
            break loop;
          let rhs = parseExpr(str, skipWS(str, innerPos + 1), 8);
          if (rhs.type === "error")
            return rhs;
          marks = marks.concat(rhs.marks), marks.unshift({ name: "mod", position: startPos }), pos = rhs.position, lhsLevel = 7;
          break;
        }
        case "<":
        case ">": {
          if (level > 4 || lhsLevel <= 4)
            break loop;
          let nextPos = innerPos + 1;
          str[nextPos] === "=" && nextPos++;
          let rhs = parseExpr(str, skipWS(str, nextPos), 5);
          if (rhs.type === "error")
            return rhs;
          marks.unshift({ name: "comp", position: startPos }), marks.push({ name: "op", position: innerPos }, { name: "op_end", position: nextPos }), marks = marks.concat(rhs.marks), pos = rhs.position, lhsLevel = 4;
          break;
        }
        case "|": {
          if (str[innerPos + 1] === "|") {
            if (level > 2 || lhsLevel < 2)
              break loop;
            let rhs = parseExpr(str, skipWS(str, innerPos + 2), 3);
            if (rhs.type === "error")
              return rhs;
            marks = marks.concat(rhs.marks), marks.unshift({ name: "or", position: startPos }), pos = rhs.position, lhsLevel = 2;
          } else {
            if (level > 11 || lhsLevel < 11)
              break loop;
            let identPos = skipWS(str, innerPos + 1), identLen = parseRegex(str, identPos, IDENT);
            if (!identLen)
              return { type: "error", position: identPos };
            if (pos = identPos + identLen, str[pos] === "(" || str[pos] === ":") {
              let result = parseFuncCall(str, identPos, pos);
              if (result.type === "error")
                return result;
              marks = marks.concat(result.marks), marks.unshift({ name: "pipecall", position: startPos }), pos = result.position, lhsLevel = 11;
            }
          }
          break;
        }
        case "&": {
          if (str[innerPos + 1] != "&" || level > 3 || lhsLevel < 3)
            break loop;
          let rhs = parseExpr(str, skipWS(str, innerPos + 2), 4);
          if (rhs.type === "error")
            return rhs;
          marks = marks.concat(rhs.marks), marks.unshift({ name: "and", position: startPos }), pos = rhs.position, lhsLevel = 3;
          break;
        }
        case "!": {
          if (str[innerPos + 1] !== "=" || level > 4 || lhsLevel <= 4)
            break loop;
          let rhs = parseExpr(str, skipWS(str, innerPos + 2), 5);
          if (rhs.type === "error")
            return rhs;
          marks.unshift({ name: "comp", position: startPos }), marks.push({ name: "op", position: innerPos }, { name: "op_end", position: innerPos + 2 }), marks = marks.concat(rhs.marks), pos = rhs.position, lhsLevel = 4;
          break;
        }
        case "d": {
          if (str.slice(innerPos, innerPos + 4) !== "desc" || level > 4 || lhsLevel < 4)
            break loop;
          marks.unshift({ name: "desc", position: startPos }), pos = innerPos + 4, lhsLevel = 4;
          break;
        }
        case "a": {
          if (str.slice(innerPos, innerPos + 3) !== "asc" || level > 4 || lhsLevel < 4)
            break loop;
          marks.unshift({ name: "asc", position: startPos }), pos = innerPos + 3, lhsLevel = 4;
          break;
        }
        default:
          switch (parseRegexStr(str, innerPos, IDENT)) {
            case "in": {
              if (level > 4 || lhsLevel <= 4)
                break loop;
              pos = skipWS(str, innerPos + 2);
              let isGroup = !1;
              str[pos] === "(" && (isGroup = !0, pos = skipWS(str, pos + 1));
              let rangePos = pos, result = parseExpr(str, pos, 5);
              if (result.type === "error")
                return result;
              if (pos = skipWS(str, result.position), str[pos] === "." && str[pos + 1] === ".") {
                let type = "inc_range";
                str[pos + 2] === "." ? (type = "exc_range", pos = skipWS(str, pos + 3)) : pos = skipWS(str, pos + 2);
                let rhs = parseExpr(str, pos, 5);
                if (rhs.type === "error")
                  return rhs;
                marks.unshift({ name: "in_range", position: startPos }), marks = marks.concat({ name: type, position: rangePos }, result.marks, rhs.marks), pos = rhs.position;
              } else
                marks.unshift({ name: "comp", position: startPos }), marks.push({ name: "op", position: innerPos }, { name: "op_end", position: innerPos + 2 }), marks = marks.concat(result.marks);
              if (isGroup) {
                if (pos = skipWS(str, pos), str[pos] !== ")")
                  return { type: "error", position: pos };
                pos++;
              }
              lhsLevel = 4;
              break;
            }
            case "match": {
              if (level > 4 || lhsLevel <= 4)
                break loop;
              let rhs = parseExpr(str, skipWS(str, innerPos + 5), 5);
              if (rhs.type === "error")
                return rhs;
              marks.unshift({ name: "comp", position: startPos }), marks.push({ name: "op", position: innerPos }, { name: "op_end", position: innerPos + 5 }), marks = marks.concat(rhs.marks), pos = rhs.position, lhsLevel = 4;
              break;
            }
            default:
              break loop;
          }
      }
    }
  let failPosition = (trav == null ? void 0 : trav.type) === "error" && trav.position;
  return { type: "success", marks, position: pos, failPosition };
}
function parseTraversal(str, pos) {
  let startPos = pos;
  switch (str[pos]) {
    case ".": {
      pos = skipWS(str, pos + 1);
      let identStart = pos, identLen2 = parseRegex(str, pos, IDENT);
      return identLen2 ? (pos += identLen2, {
        type: "success",
        marks: [
          { name: "attr_access", position: startPos },
          { name: "ident", position: identStart },
          { name: "ident_end", position: pos }
        ],
        position: pos
      }) : { type: "error", position: pos };
    }
    case "-":
      if (str[pos + 1] !== ">")
        return { type: "error", position: pos };
      let marks = [{ name: "deref", position: startPos }];
      pos += 2;
      let identPos = skipWS(str, pos), identLen = parseRegex(str, identPos, IDENT);
      return identLen && (pos = identPos + identLen, marks.push(
        { name: "deref_attr", position: identPos },
        { name: "ident", position: identPos },
        { name: "ident_end", position: pos }
      )), {
        type: "success",
        marks,
        position: pos
      };
    case "[": {
      if (pos = skipWS(str, pos + 1), str[pos] === "]")
        return {
          type: "success",
          marks: [{ name: "array_postfix", position: startPos }],
          position: pos + 1
        };
      let rangePos = pos, result = parseExpr(str, pos, 0);
      if (result.type === "error")
        return result;
      if (pos = skipWS(str, result.position), str[pos] === "." && str[pos + 1] === ".") {
        let type = "inc_range";
        str[pos + 2] === "." ? (type = "exc_range", pos += 3) : pos += 2, pos = skipWS(str, pos);
        let rhs = parseExpr(str, pos, 0);
        return rhs.type === "error" ? rhs : (pos = skipWS(str, rhs.position), str[pos] !== "]" ? { type: "error", position: pos } : {
          type: "success",
          marks: [
            { name: "slice", position: startPos },
            { name: type, position: rangePos }
          ].concat(result.marks, rhs.marks),
          position: pos + 1
        });
      }
      return str[pos] !== "]" ? { type: "error", position: pos } : {
        type: "success",
        marks: [{ name: "square_bracket", position: startPos }].concat(result.marks),
        position: pos + 1
      };
    }
    case "|": {
      if (pos = skipWS(str, pos + 1), str[pos] === "{") {
        let result = parseObject(str, pos);
        return result.type === "error" || result.marks.unshift({ name: "projection", position: startPos }), result;
      }
      break;
    }
    case "{": {
      let result = parseObject(str, pos);
      return result.type === "error" || result.marks.unshift({ name: "projection", position: startPos }), result;
    }
  }
  return { type: "error", position: pos };
}
function parseFuncCall(str, startPos, pos) {
  let marks = [];
  if (marks.push({ name: "func_call", position: startPos }), str[pos] === ":" && str[pos + 1] === ":") {
    marks.push({ name: "namespace", position: startPos }), marks.push({ name: "ident", position: startPos }, { name: "ident_end", position: pos }), pos = skipWS(str, pos + 2);
    let nameLen = parseRegex(str, pos, IDENT);
    if (!nameLen)
      return { type: "error", position: pos };
    if (marks.push({ name: "ident", position: pos }, { name: "ident_end", position: pos + nameLen }), pos = skipWS(str, pos + nameLen), str[pos] !== "(")
      return { type: "error", position: pos };
    pos++, pos = skipWS(str, pos);
  } else
    marks.push({ name: "ident", position: startPos }, { name: "ident_end", position: pos }), pos = skipWS(str, pos + 1);
  let lastPos = pos;
  if (str[pos] !== ")")
    for (; ; ) {
      let result = parseExpr(str, pos, 0);
      if (result.type === "error")
        return result;
      if (marks = marks.concat(result.marks), lastPos = result.position, pos = skipWS(str, result.position), str[pos] !== "," || (pos = skipWS(str, pos + 1), str[pos] === ")"))
        break;
    }
  return str[pos] !== ")" ? { type: "error", position: pos } : (marks.push({ name: "func_args_end", position: lastPos }), {
    type: "success",
    marks,
    position: pos + 1
  });
}
function parseObject(str, pos) {
  let marks = [{ name: "object", position: pos }];
  for (pos = skipWS(str, pos + 1); str[pos] !== "}"; ) {
    let pairPos = pos;
    if (str.slice(pos, pos + 3) === "...")
      if (pos = skipWS(str, pos + 3), str[pos] !== "}" && str[pos] !== ",") {
        let expr = parseExpr(str, pos, 0);
        if (expr.type === "error")
          return expr;
        marks.push({ name: "object_splat", position: pairPos }), marks = marks.concat(expr.marks), pos = expr.position;
      } else
        marks.push({ name: "object_splat_this", position: pairPos });
    else {
      let expr = parseExpr(str, pos, 0);
      if (expr.type === "error")
        return expr;
      let nextPos = skipWS(str, expr.position);
      if (expr.marks[0].name === "str" && str[nextPos] === ":") {
        let value = parseExpr(str, skipWS(str, nextPos + 1), 0);
        if (value.type === "error")
          return value;
        marks.push({ name: "object_pair", position: pairPos }), marks = marks.concat(expr.marks, value.marks), pos = value.position;
      } else
        marks = marks.concat({ name: "object_expr", position: pos }, expr.marks), pos = expr.position;
    }
    if (pos = skipWS(str, pos), str[pos] !== ",")
      break;
    pos = skipWS(str, pos + 1);
  }
  return str[pos] !== "}" ? { type: "error", position: pos } : (pos++, marks.push({ name: "object_end", position: pos }), { type: "success", marks, position: pos });
}
function parseString(str, pos) {
  let token = str[pos];
  pos = pos + 1;
  const marks = [{ name: "str", position: pos }];
  str:
    for (; ; pos++) {
      if (pos > str.length)
        return { type: "error", position: pos };
      switch (str[pos]) {
        case token: {
          marks.push({ name: "str_end", position: pos }), pos++;
          break str;
        }
        case "\\":
          marks.push({ name: "str_pause", position: pos }), str[pos + 1] === "u" ? str[pos + 2] === "{" ? (marks.push({ name: "unicode_hex", position: pos + 3 }), pos = str.indexOf("}", pos + 3), marks.push({ name: "unicode_hex_end", position: pos })) : (marks.push({ name: "unicode_hex", position: pos + 2 }), marks.push({ name: "unicode_hex_end", position: pos + 6 }), pos += 5) : (marks.push({ name: "single_escape", position: pos + 1 }), pos += 1), marks.push({ name: "str_start", position: pos + 1 });
      }
    }
  return { type: "success", marks, position: pos };
}
function skipWS(str, pos) {
  return pos + parseRegex(str, pos, WS);
}
function parseRegex(str, pos, re) {
  let m = re.exec(str.slice(pos));
  return m ? m[0].length : 0;
}
function parseRegexStr(str, pos, re) {
  let m = re.exec(str.slice(pos));
  return m ? m[0] : null;
}
function join(a, b) {
  return (base) => b(a(base));
}
function map(inner) {
  return (base) => ({ type: "Map", base, expr: inner({ type: "This" }) });
}
function flatMap(inner) {
  return (base) => ({ type: "FlatMap", base, expr: inner({ type: "This" }) });
}
function traverseArray(build, right) {
  if (!right)
    return {
      type: "a-a",
      build
    };
  switch (right.type) {
    case "a-a":
      return {
        type: "a-a",
        build: join(build, right.build)
      };
    case "a-b":
      return {
        type: "a-b",
        build: join(build, right.build)
      };
    case "b-b":
      return {
        type: "a-a",
        build: join(build, map(right.build))
      };
    case "b-a":
      return {
        type: "a-a",
        build: join(build, flatMap(right.build))
      };
    default:
      throw new Error(`unknown type: ${right.type}`);
  }
}
function traversePlain(mapper, right) {
  if (!right)
    return {
      type: "b-b",
      build: mapper
    };
  switch (right.type) {
    case "a-a":
    case "b-a":
      return {
        type: "b-a",
        build: join(mapper, right.build)
      };
    case "a-b":
    case "b-b":
      return {
        type: "b-b",
        build: join(mapper, right.build)
      };
    default:
      throw new Error(`unknown type: ${right.type}`);
  }
}
function traverseElement(mapper, right) {
  if (!right)
    return {
      type: "a-b",
      build: mapper
    };
  switch (right.type) {
    case "a-a":
    case "b-a":
      return {
        type: "a-a",
        build: join(mapper, right.build)
      };
    case "a-b":
    case "b-b":
      return {
        type: "a-b",
        build: join(mapper, right.build)
      };
    default:
      throw new Error(`unknown type: ${right.type}`);
  }
}
function traverseProjection(mapper, right) {
  if (!right)
    return {
      type: "b-b",
      build: mapper
    };
  switch (right.type) {
    case "a-a":
      return {
        type: "a-a",
        build: join(map(mapper), right.build)
      };
    case "a-b":
      return {
        type: "a-b",
        build: join(map(mapper), right.build)
      };
    case "b-a":
      return {
        type: "b-a",
        build: join(mapper, right.build)
      };
    case "b-b":
      return {
        type: "b-b",
        build: join(mapper, right.build)
      };
    default:
      throw new Error(`unknown type: ${right.type}`);
  }
}
var __defProp$1 = Object.defineProperty, __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __publicField$1 = (obj, key, value) => (__defNormalProp$1(obj, typeof key != "symbol" ? key + "" : key, value), value);
const ESCAPE_SEQUENCE = {
  "'": "'",
  '"': '"',
  "\\": "\\",
  "/": "/",
  b: "\b",
  f: "\f",
  n: `
`,
  r: "\r",
  t: "	"
};
function expandHex(str) {
  const charCode = parseInt(str, 16);
  return String.fromCharCode(charCode);
}
class GroqQueryError extends Error {
  constructor() {
    super(...arguments), __publicField$1(this, "name", "GroqQueryError");
  }
}
const EXPR_BUILDER = {
  group(p) {
    return {
      type: "Group",
      base: p.process(EXPR_BUILDER)
    };
  },
  everything() {
    return { type: "Everything" };
  },
  this() {
    return { type: "This" };
  },
  parent() {
    return {
      type: "Parent",
      n: 1
    };
  },
  dblparent(p) {
    return {
      type: "Parent",
      n: p.process(EXPR_BUILDER).n + 1
    };
  },
  traverse(p) {
    const base = p.process(EXPR_BUILDER), traversalList = [];
    for (; p.getMark().name !== "traversal_end"; )
      traversalList.push(p.process(TRAVERSE_BUILDER));
    p.shift();
    let traversal = null;
    for (let i = traversalList.length - 1; i >= 0; i--)
      traversal = traversalList[i](traversal);
    if ((base.type === "Everything" || base.type === "Array" || base.type === "PipeFuncCall") && (traversal = traverseArray((val) => val, traversal)), traversal === null)
      throw new Error("BUG: unexpected empty traversal");
    return traversal.build(base);
  },
  this_attr(p) {
    const name = p.processString();
    return name === "null" ? { type: "Value", value: null } : name === "true" ? { type: "Value", value: !0 } : name === "false" ? { type: "Value", value: !1 } : {
      type: "AccessAttribute",
      name
    };
  },
  neg(p) {
    return {
      type: "Neg",
      base: p.process(EXPR_BUILDER)
    };
  },
  pos(p) {
    return {
      type: "Pos",
      base: p.process(EXPR_BUILDER)
    };
  },
  add(p) {
    const left = p.process(EXPR_BUILDER), right = p.process(EXPR_BUILDER);
    return {
      type: "OpCall",
      op: "+",
      left,
      right
    };
  },
  sub(p) {
    const left = p.process(EXPR_BUILDER), right = p.process(EXPR_BUILDER);
    return {
      type: "OpCall",
      op: "-",
      left,
      right
    };
  },
  mul(p) {
    const left = p.process(EXPR_BUILDER), right = p.process(EXPR_BUILDER);
    return {
      type: "OpCall",
      op: "*",
      left,
      right
    };
  },
  div(p) {
    const left = p.process(EXPR_BUILDER), right = p.process(EXPR_BUILDER);
    return {
      type: "OpCall",
      op: "/",
      left,
      right
    };
  },
  mod(p) {
    const left = p.process(EXPR_BUILDER), right = p.process(EXPR_BUILDER);
    return {
      type: "OpCall",
      op: "%",
      left,
      right
    };
  },
  pow(p) {
    const left = p.process(EXPR_BUILDER), right = p.process(EXPR_BUILDER);
    return {
      type: "OpCall",
      op: "**",
      left,
      right
    };
  },
  comp(p) {
    const left = p.process(EXPR_BUILDER), op = p.processString(), right = p.process(EXPR_BUILDER);
    return {
      type: "OpCall",
      op,
      left,
      right
    };
  },
  in_range(p) {
    const base = p.process(EXPR_BUILDER), isInclusive = p.getMark().name === "inc_range";
    p.shift();
    const left = p.process(EXPR_BUILDER), right = p.process(EXPR_BUILDER);
    return {
      type: "InRange",
      base,
      left,
      right,
      isInclusive
    };
  },
  str(p) {
    let value = "";
    loop:
      for (; p.hasMark(); ) {
        const mark = p.getMark();
        switch (mark.name) {
          case "str_end":
            value += p.processStringEnd();
            break loop;
          case "str_pause":
            value += p.processStringEnd();
            break;
          case "str_start":
            p.shift();
            break;
          case "single_escape": {
            const char = p.slice(1);
            p.shift(), value += ESCAPE_SEQUENCE[char];
            break;
          }
          case "unicode_hex":
            p.shift(), value += expandHex(p.processStringEnd());
            break;
          default:
            throw new Error(`unexpected mark: ${mark.name}`);
        }
      }
    return { type: "Value", value };
  },
  integer(p) {
    const strValue = p.processStringEnd();
    return {
      type: "Value",
      value: Number(strValue)
    };
  },
  float(p) {
    const strValue = p.processStringEnd();
    return {
      type: "Value",
      value: Number(strValue)
    };
  },
  sci(p) {
    const strValue = p.processStringEnd();
    return {
      type: "Value",
      value: Number(strValue)
    };
  },
  object(p) {
    const attributes = [];
    for (; p.getMark().name !== "object_end"; )
      attributes.push(p.process(OBJECT_BUILDER));
    return p.shift(), {
      type: "Object",
      attributes
    };
  },
  array(p) {
    const elements = [];
    for (; p.getMark().name !== "array_end"; ) {
      let isSplat = !1;
      p.getMark().name === "array_splat" && (isSplat = !0, p.shift());
      const value = p.process(EXPR_BUILDER);
      elements.push({
        type: "ArrayElement",
        value,
        isSplat
      });
    }
    return p.shift(), {
      type: "Array",
      elements
    };
  },
  tuple(p) {
    const members = [];
    for (; p.getMark().name !== "tuple_end"; )
      members.push(p.process(EXPR_BUILDER));
    return p.shift(), {
      type: "Tuple",
      members
    };
  },
  func_call(p) {
    let namespace = "global";
    p.getMark().name === "namespace" && (p.shift(), namespace = p.processString());
    const name = p.processString();
    if (namespace === "global" && name === "select") {
      const result = {
        type: "Select",
        alternatives: []
      };
      for (; p.getMark().name !== "func_args_end"; )
        if (p.getMark().name === "pair") {
          if (result.fallback)
            throw new GroqQueryError("unexpected argument to select()");
          p.shift();
          const condition = p.process(EXPR_BUILDER), value = p.process(EXPR_BUILDER);
          result.alternatives.push({
            type: "SelectAlternative",
            condition,
            value
          });
        } else {
          if (result.fallback)
            throw new GroqQueryError("unexpected argument to select()");
          const value = p.process(EXPR_BUILDER);
          result.fallback = value;
        }
      return p.shift(), result;
    }
    const args = [];
    for (; p.getMark().name !== "func_args_end"; )
      argumentShouldBeSelector(namespace, name, args.length) ? (p.process(SELECTOR_BUILDER), args.push({ type: "Selector" })) : args.push(p.process(EXPR_BUILDER));
    if (p.shift(), namespace === "global" && (name === "before" || name === "after") && p.parseOptions.mode === "delta")
      return {
        type: "Context",
        key: name
      };
    if (namespace === "global" && name === "boost" && !p.allowBoost)
      throw new GroqQueryError("unexpected boost");
    const funcs = namespaces[namespace];
    if (!funcs)
      throw new GroqQueryError(`Undefined namespace: ${namespace}`);
    const func = funcs[name];
    if (!func)
      throw new GroqQueryError(`Undefined function: ${name}`);
    if (func.arity !== void 0 && validateArity(name, func.arity, args.length), func.mode !== void 0 && func.mode !== p.parseOptions.mode)
      throw new GroqQueryError(`Undefined function: ${name}`);
    return {
      type: "FuncCall",
      func,
      namespace,
      name,
      args
    };
  },
  pipecall(p) {
    const base = p.process(EXPR_BUILDER);
    p.shift();
    let namespace = "global";
    if (p.getMark().name === "namespace" && (p.shift(), namespace = p.processString()), namespace !== "global")
      throw new GroqQueryError(`Undefined namespace: ${namespace}`);
    const name = p.processString(), args = [], oldAllowBoost = p.allowBoost;
    for (name === "score" && (p.allowBoost = !0); ; ) {
      const markName = p.getMark().name;
      if (markName === "func_args_end")
        break;
      if (name === "order") {
        if (markName === "asc") {
          p.shift(), args.push({ type: "Asc", base: p.process(EXPR_BUILDER) });
          continue;
        } else if (markName === "desc") {
          p.shift(), args.push({ type: "Desc", base: p.process(EXPR_BUILDER) });
          continue;
        }
      }
      args.push(p.process(EXPR_BUILDER));
    }
    p.shift(), p.allowBoost = oldAllowBoost;
    const func = pipeFunctions[name];
    if (!func)
      throw new GroqQueryError(`Undefined pipe function: ${name}`);
    return func.arity && validateArity(name, func.arity, args.length), {
      type: "PipeFuncCall",
      func,
      base,
      name,
      args
    };
  },
  pair(p) {
    throw new GroqQueryError("unexpected =>");
  },
  and(p) {
    const left = p.process(EXPR_BUILDER), right = p.process(EXPR_BUILDER);
    return {
      type: "And",
      left,
      right
    };
  },
  or(p) {
    const left = p.process(EXPR_BUILDER), right = p.process(EXPR_BUILDER);
    return {
      type: "Or",
      left,
      right
    };
  },
  not(p) {
    return {
      type: "Not",
      base: p.process(EXPR_BUILDER)
    };
  },
  asc(p) {
    throw new GroqQueryError("unexpected asc");
  },
  desc(p) {
    throw new GroqQueryError("unexpected desc");
  },
  param(p) {
    const name = p.processString();
    return p.parseOptions.params && p.parseOptions.params.hasOwnProperty(name) ? {
      type: "Value",
      value: p.parseOptions.params[name]
    } : {
      type: "Parameter",
      name
    };
  }
}, OBJECT_BUILDER = {
  object_expr(p) {
    if (p.getMark().name === "pair") {
      p.shift();
      const condition = p.process(EXPR_BUILDER), value2 = p.process(EXPR_BUILDER);
      return {
        type: "ObjectConditionalSplat",
        condition,
        value: value2
      };
    }
    const value = p.process(EXPR_BUILDER);
    return {
      type: "ObjectAttributeValue",
      name: extractPropertyKey(value),
      value
    };
  },
  object_pair(p) {
    const name = p.process(EXPR_BUILDER);
    if (name.type !== "Value")
      throw new Error("name must be string");
    const value = p.process(EXPR_BUILDER);
    return {
      type: "ObjectAttributeValue",
      name: name.value,
      value
    };
  },
  object_splat(p) {
    return {
      type: "ObjectSplat",
      value: p.process(EXPR_BUILDER)
    };
  },
  object_splat_this() {
    return {
      type: "ObjectSplat",
      value: { type: "This" }
    };
  }
}, TRAVERSE_BUILDER = {
  square_bracket(p) {
    const expr = p.process(EXPR_BUILDER), value = tryConstantEvaluate(expr);
    return value && value.type === "number" ? (right) => traverseElement((base) => ({ type: "AccessElement", base, index: value.data }), right) : value && value.type === "string" ? (right) => traversePlain((base) => ({ type: "AccessAttribute", base, name: value.data }), right) : (right) => traverseArray(
      (base) => ({
        type: "Filter",
        base,
        expr
      }),
      right
    );
  },
  slice(p) {
    const isInclusive = p.getMark().name === "inc_range";
    p.shift();
    const left = p.process(EXPR_BUILDER), right = p.process(EXPR_BUILDER), leftValue = tryConstantEvaluate(left), rightValue = tryConstantEvaluate(right);
    if (!leftValue || !rightValue || leftValue.type !== "number" || rightValue.type !== "number")
      throw new GroqQueryError("slicing must use constant numbers");
    return (rhs) => traverseArray(
      (base) => ({
        type: "Slice",
        base,
        left: leftValue.data,
        right: rightValue.data,
        isInclusive
      }),
      rhs
    );
  },
  projection(p) {
    const obj = p.process(EXPR_BUILDER);
    return (right) => traverseProjection((base) => ({ type: "Projection", base, expr: obj }), right);
  },
  attr_access(p) {
    const name = p.processString();
    return (right) => traversePlain((base) => ({ type: "AccessAttribute", base, name }), right);
  },
  deref(p) {
    let attr = null;
    p.getMark().name === "deref_attr" && (p.shift(), attr = p.processString());
    const wrap = (base) => attr ? { type: "AccessAttribute", base, name: attr } : base;
    return (right) => traversePlain(
      (base) => wrap({
        type: "Deref",
        base
      }),
      right
    );
  },
  array_postfix(p) {
    return (right) => traverseArray((base) => ({ type: "ArrayCoerce", base }), right);
  }
}, SELECTOR_BUILDER = {
  group(p) {
    return p.process(SELECTOR_BUILDER), null;
  },
  everything() {
    throw new Error("Invalid selector syntax");
  },
  this() {
    throw new Error("Invalid selector syntax");
  },
  parent() {
    throw new Error("Invalid selector syntax");
  },
  dblparent(p) {
    throw new Error("Invalid selector syntax");
  },
  traverse(p) {
    for (p.process(SELECTOR_BUILDER); p.getMark().name !== "traversal_end"; )
      p.process(TRAVERSE_BUILDER);
    return p.shift(), null;
  },
  this_attr(p) {
    return p.processString(), null;
  },
  neg(p) {
    throw new Error("Invalid selector syntax");
  },
  pos(p) {
    throw new Error("Invalid selector syntax");
  },
  add(p) {
    throw new Error("Invalid selector syntax");
  },
  sub(p) {
    throw new Error("Invalid selector syntax");
  },
  mul(p) {
    throw new Error("Invalid selector syntax");
  },
  div(p) {
    throw new Error("Invalid selector syntax");
  },
  mod(p) {
    throw new Error("Invalid selector syntax");
  },
  pow(p) {
    throw new Error("Invalid selector syntax");
  },
  comp(p) {
    throw new Error("Invalid selector syntax");
  },
  in_range(p) {
    throw new Error("Invalid selector syntax");
  },
  str(p) {
    throw new Error("Invalid selector syntax");
  },
  integer(p) {
    throw new Error("Invalid selector syntax");
  },
  float(p) {
    throw new Error("Invalid selector syntax");
  },
  sci(p) {
    throw new Error("Invalid selector syntax");
  },
  object(p) {
    throw new Error("Invalid selector syntax");
  },
  array(p) {
    throw new Error("Invalid selector syntax");
  },
  tuple(p) {
    throw new Error("Invalid selector syntax");
  },
  func_call(p, mark) {
    const func = EXPR_BUILDER.func_call(p, mark);
    if (func.name === "anywhere" && func.args.length === 1)
      return null;
    throw new Error("Invalid selector syntax");
  },
  pipecall(p) {
    throw new Error("Invalid selector syntax");
  },
  pair(p) {
    throw new Error("Invalid selector syntax");
  },
  and(p) {
    throw new Error("Invalid selector syntax");
  },
  or(p) {
    throw new Error("Invalid selector syntax");
  },
  not(p) {
    throw new Error("Invalid selector syntax");
  },
  asc(p) {
    throw new Error("Invalid selector syntax");
  },
  desc(p) {
    throw new Error("Invalid selector syntax");
  },
  param(p) {
    throw new Error("Invalid selector syntax");
  }
};
function extractPropertyKey(node) {
  if (node.type === "AccessAttribute" && !node.base)
    return node.name;
  if (node.type === "Deref" || node.type === "Map" || node.type === "Projection" || node.type === "Slice" || node.type === "Filter" || node.type === "AccessElement" || node.type === "ArrayCoerce")
    return extractPropertyKey(node.base);
  throw new GroqQueryError(`Cannot determine property key for type: ${node.type}`);
}
function validateArity(name, arity, count) {
  if (typeof arity == "number") {
    if (count !== arity)
      throw new GroqQueryError(
        `Incorrect number of arguments to function ${name}(). Expected ${arity}, got ${count}.`
      );
  } else if (arity && !arity(count))
    throw new GroqQueryError(`Incorrect number of arguments to function ${name}().`);
}
function argumentShouldBeSelector(namespace, functionName, argCount) {
  const functionsRequiringSelectors = ["changedAny", "changedOnly"];
  return namespace == "diff" && argCount == 2 && functionsRequiringSelectors.includes(functionName);
}
class GroqSyntaxError extends Error {
  constructor(position) {
    super(`Syntax error in GROQ query at position ${position}`), __publicField$1(this, "position"), __publicField$1(this, "name", "GroqSyntaxError"), this.position = position;
  }
}
function parse(input, options = {}) {
  const result = parse$1(input);
  if (result.type === "error")
    throw new GroqSyntaxError(result.position);
  return new MarkProcessor(input, result.marks, options).process(EXPR_BUILDER);
}
function unionWithoutNull(unionTypeNode) {
  return unionTypeNode.type === "union" ? {
    type: "union",
    of: unionTypeNode.of.filter((type) => type.type !== "null")
  } : unionTypeNode;
}
function handleFuncCallNode(node, scope) {
  switch (`${node.namespace}.${node.name}`) {
    case "global.defined":
      return { type: "boolean" };
    case "global.coalesce": {
      if (node.args.length === 0)
        return { type: "null" };
      const typeNodes = [];
      let canBeNull = !0;
      for (const arg of node.args) {
        const type = walk({ node: arg, scope });
        typeNodes.push(unionWithoutNull(type)), canBeNull = type.type === "null" || type.type === "union" && type.of.some((t) => t.type === "null");
      }
      return canBeNull && typeNodes.push({ type: "null" }), {
        type: "union",
        of: typeNodes
      };
    }
    case "pt.text":
      return node.args.length === 0 ? { type: "null" } : {
        type: "string"
      };
    default:
      return { type: "unknown" };
  }
}
function hashField(field) {
  switch (field.type) {
    case "string":
    case "number":
    case "boolean":
      return field.value !== void 0 ? `${field.type}:${field.value}` : `${field.type}`;
    case "null":
    case "unknown":
      return field.type;
    case "array":
      return `${field.type}:${hashField(field.of)}`;
    case "object":
      return `${field.type}:ref-${field.dereferencesTo}:${Object.entries(field.attributes).map(([key, value]) => `${key}:${hashField(value.value)}`).join(",")}:${field.rest ? hashField(field.rest) : "no-rest"}`;
    case "union":
      return `${field.type}:${field.of.map(hashField).join(",")}`;
    case "inline":
      return `${field.type}:${field.name}`;
    default:
      return field.type;
  }
}
function removeDuplicateTypeNodes(typeNodes) {
  const seenTypes = /* @__PURE__ */ new Set(), newTypeNodes = [];
  for (const typeNode of typeNodes) {
    const hash = hashField(typeNode);
    if (hash === null) {
      newTypeNodes.push(typeNode);
      continue;
    }
    seenTypes.has(hash) || (seenTypes.add(hash), newTypeNodes.push(typeNode));
  }
  return newTypeNodes;
}
function optimizeUnions(field) {
  if (field.type === "union") {
    if (field.of = removeDuplicateTypeNodes(field.of), field.of.length === 1)
      return optimizeUnions(field.of[0]);
    for (let idx = 0; field.of.length > idx; idx++) {
      const subField = field.of[idx];
      if (subField.type === "union") {
        field.of.splice(idx, 1, ...subField.of), idx--;
        continue;
      }
      field.of[idx] = optimizeUnions(subField);
    }
    const compare = new Intl.Collator("en").compare;
    return field.of.sort((a, b) => a.type === "null" ? 1 : compare(hashField(a), hashField(b))), field;
  }
  if (field.type === "array")
    return field.of = optimizeUnions(field.of), field;
  if (field.type === "object") {
    for (const idx in field.attributes)
      Object.hasOwn(field.attributes, idx) && (field.attributes[idx].value = optimizeUnions(field.attributes[idx].value));
    return field;
  }
  return field;
}
var __defProp = Object.defineProperty, __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __publicField = (obj, key, value) => (__defNormalProp(obj, typeof key != "symbol" ? key + "" : key, value), value);
const $trace$1 = debug("typeEvaluator:scope:trace");
$trace$1.log = console.log.bind(console);
class Context {
  constructor(schema) {
    __publicField(this, "schema"), this.schema = schema;
  }
  lookupRef(refTo) {
    for (const val of this.schema)
      if (val.type === "document" && val.name === refTo)
        return {
          type: "object",
          attributes: val.attributes
        };
    return { type: "null" };
  }
  lookupTypeDeclaration(alias) {
    for (const val of this.schema)
      if (val.type === "type" && val.name === alias.name)
        return val.value;
    return { type: "null" };
  }
}
class Scope2 {
  constructor(value, parent, context) {
    __publicField(this, "value"), __publicField(this, "parent"), __publicField(this, "context"), __publicField(this, "isHidden"), this.value = { type: "union", of: value }, this.parent = parent, this.context = context || (parent == null ? void 0 : parent.context) || new Context([]), this.isHidden = !1;
  }
  createNested(value) {
    return this.isHidden ? new Scope2(value, this.parent, this.context) : new Scope2(value, this, this.context);
  }
  createHidden(value) {
    const result = this.createNested(value);
    return result.isHidden = !0, result;
  }
}
function createReferenceTypeNode(name, inArray = !1) {
  const attributes = {
    _ref: {
      type: "objectAttribute",
      value: {
        type: "string"
      }
    },
    _type: {
      type: "objectAttribute",
      value: {
        type: "string",
        value: "reference"
      }
    },
    _weak: {
      type: "objectAttribute",
      value: {
        type: "boolean"
      },
      optional: !0
    }
  };
  return inArray && (attributes._key = {
    type: "objectAttribute",
    value: {
      type: "string"
    }
  }), {
    type: "object",
    attributes,
    dereferencesTo: name
  };
}
function nullUnion(node) {
  return node.type === "union" ? {
    type: "union",
    of: [...node.of, { type: "null" }]
  } : {
    type: "union",
    of: [node, { type: "null" }]
  };
}
const $trace = debug("typeEvaluator:evaluate:trace");
$trace.log = console.log.bind(console);
const $debug = debug("typeEvaluator:evaluate:debug");
$debug.log = console.log.bind(console);
const $warn = debug("typeEvaluator:evaluate::warn");
function typeEvaluate(ast, schema) {
  $debug("evaluateQueryType.ast %O", ast);
  const parsed = walk({
    node: ast,
    scope: new Scope2([], void 0, new Context(schema))
  });
  $trace("evaluateQueryType.parsed %O", parsed);
  const optimized = optimizeUnions(parsed);
  return $debug("evaluateQueryType.optimized %O", optimized), optimized;
}
function mapDeref(base, scope) {
  return base.type === "union" ? {
    type: "union",
    of: base.of.map((node) => mapDeref(node, scope))
  } : base.type === "array" ? {
    type: "array",
    of: mapDeref(base.of, scope)
  } : base.type === "object" && base.dereferencesTo !== void 0 ? scope.context.lookupRef(base.dereferencesTo) : { type: "null" };
}
function handleDerefNode(node, scope) {
  $trace("deref.node %O", node);
  const base = walk({ node: node.base, scope });
  if ($trace("deref.base %O", base), base.type === "null" || base.type === "unknown")
    return { type: "null" };
  const derefedNode = mapDeref(base, scope);
  return $trace("deref.derefedNode %O", derefedNode), derefedNode;
}
function mapObjectSplat(node, scope, mapper) {
  if (node.type === "union")
    for (const scoped of node.of)
      mapObjectSplat(scoped, scope, mapper);
  node.type === "object" && mapper(node);
}
function handleObjectNode(node, scope) {
  $trace("object.node %O", node), $trace("object.scope %O", scope);
  const attributes = {};
  for (const attr of node.attributes) {
    if (attr.type === "ObjectAttributeValue") {
      const field = walk({ node: attr.value, scope });
      attributes[attr.name] = {
        type: "objectAttribute",
        value: field
      };
    }
    if (attr.type === "ObjectSplat") {
      const value = walk({ node: attr.value, scope });
      $trace("object.splat.value %O", value), mapObjectSplat(value, scope, (node2) => {
        for (const name in node2.attributes)
          Object.hasOwn(node2.attributes, name) && (attributes[name] = node2.attributes[name]);
      });
    }
    if (attr.type === "ObjectConditionalSplat") {
      const condition = resolveCondition(attr.condition, scope);
      if ($trace("object.conditional.splat.condition %O", condition), condition) {
        const value = walk({ node: attr.value, scope });
        mapObjectSplat(value, scope, (node2) => {
          for (const name in node2.attributes)
            Object.hasOwn(node2.attributes, name) && (attributes[name] = node2.attributes[name]);
        });
      }
    }
  }
  return {
    type: "object",
    attributes
  };
}
function handleOpCallNode(node, scope) {
  const lhs = walk({ node: node.left, scope }), rhs = walk({ node: node.right, scope });
  return mapUnion(
    lhs,
    (left) => (
      // eslint-disable-next-line complexity
      mapUnion(rhs, (right) => {
        if ($trace('opCallNode "%s" %O', node.op, { left, right }), left.type === "unknown" || right.type === "unknown")
          return { type: "unknown" };
        switch (node.op) {
          case "==":
          case "!=":
            return {
              type: "boolean",
              value: resolveCondition(node, scope)
            };
          case ">":
          case ">=":
          case "<":
          case "<=":
            return left.type !== right.type ? { type: "null" } : isPrimitiveTypeNode(left) ? {
              type: "boolean",
              value: resolveCondition(node, scope)
            } : { type: "null" };
          case "in":
            return right.type === "array" ? {
              type: "boolean",
              value: resolveCondition(node, scope)
            } : { type: "null" };
          case "match":
            return {
              type: "boolean",
              value: resolveCondition(node, scope)
            };
          case "+":
            return left.type === "string" && right.type === "string" ? {
              type: "string",
              value: left.value !== void 0 && right.value !== void 0 ? left.value + right.value : void 0
            } : left.type === "number" && right.type === "number" ? {
              type: "number",
              value: left.value !== void 0 && right.value !== void 0 ? left.value + right.value : void 0
            } : left.type === "array" && right.type === "array" ? {
              type: "array",
              of: {
                type: "union",
                of: [left.of, right.of]
              }
            } : left.type === "object" && right.type === "object" ? {
              type: "object",
              attributes: { ...left.attributes, ...right.attributes }
            } : { type: "null" };
          case "-":
            return left.type === "number" && right.type === "number" ? {
              type: "number",
              value: left.value !== void 0 && right.value !== void 0 ? left.value - right.value : void 0
            } : { type: "null" };
          case "*":
            return left.type === "number" && right.type === "number" ? {
              type: "number",
              value: left.value !== void 0 && right.value !== void 0 ? left.value * right.value : void 0
            } : { type: "null" };
          case "/":
            return left.type === "number" && right.type === "number" ? {
              type: "number",
              value: left.value !== void 0 && right.value !== void 0 ? left.value / right.value : void 0
            } : { type: "null" };
          case "**":
            return left.type === "number" && right.type === "number" ? {
              type: "number",
              value: left.value !== void 0 && right.value !== void 0 ? left.value ** right.value : void 0
            } : { type: "null" };
          case "%":
            return left.type === "number" && right.type === "number" ? {
              type: "number",
              value: left.value !== void 0 && right.value !== void 0 ? left.value % right.value : void 0
            } : { type: "null" };
          default:
            return {
              type: "unknown"
            };
        }
      })
    )
  );
}
function handleSelectNode(node, scope) {
  const values = [];
  let guaranteed = !1;
  for (const alternative of node.alternatives) {
    const conditionValue = walk({ node: alternative.condition, scope }), conditionScope = resolveFilter(alternative.condition, scope);
    conditionScope.type === "union" && conditionScope.of.length > 0 && values.push(walk({ node: alternative.value, scope: scope.createHidden(conditionScope.of) })), conditionValue.type === "boolean" && conditionValue.value === !0 && (guaranteed = !0);
  }
  return node.fallback && !guaranteed && values.push(walk({ node: node.fallback, scope })), values.length === 0 ? { type: "null" } : {
    type: "union",
    of: values
  };
}
function handleArrayCoerceNode(node, scope) {
  const base = walk({ node: node.base, scope });
  return $trace("arrayCoerce.base %O", base), mapArray(base, scope, (base2) => base2);
}
function handleFlatMap(node, scope) {
  const base = walk({ node: node.base, scope });
  return mapArray(base, scope, (base2) => {
    const inner = walk({ node: node.expr, scope: scope.createHidden([base2.of]) });
    return mapConcrete(
      inner,
      scope,
      (inner2) => inner2.type === "array" ? inner2 : { type: "array", of: inner2 },
      (nodes) => {
        const inner2 = [];
        for (const node2 of nodes) {
          if (node2.type === "unknown")
            return { type: "array", of: node2 };
          if (node2.type !== "array")
            throw new Error(`Unexpected type: ${node2.type}`);
          inner2.push(node2.of);
        }
        return {
          type: "array",
          of: optimizeUnions({ type: "union", of: inner2 })
        };
      }
    );
  });
}
function handleMap(node, scope) {
  const base = walk({ node: node.base, scope });
  return $trace("map.base %O", base), mapArray(base, scope, (base2) => ({
    type: "array",
    of: walk({ node: node.expr, scope: scope.createHidden([base2.of]) })
  }));
}
function handleProjectionNode(node, scope) {
  const base = walk({ node: node.base, scope });
  return $trace("projection.base %O", base), mapObject(
    base,
    scope,
    (base2) => walk({ node: node.expr, scope: scope.createNested([base2]) })
  );
}
function createFilterScope(base, scope) {
  return base.type === "array" ? base.of.type === "union" ? scope.createNested(base.of.of) : scope.createNested([base.of]) : scope.createNested([base]);
}
function handleFilterNode(node, scope) {
  const base = walk({ node: node.base, scope });
  $trace("filter.base %O", base), $trace("filter.resolving %O", base);
  const resolved = resolveFilter(node.expr, createFilterScope(base, scope));
  return $trace("filter.resolved %O", resolved), {
    type: "array",
    of: resolved
  };
}
function handleAccessAttributeNode(node, scope) {
  let attributeBase = scope.value;
  return node.base && (attributeBase = walk({ node: node.base, scope })), $trace("accessAttribute.base %s %O", node.name, attributeBase), handleAccessAttributeBase(attributeBase, node.name, scope);
}
function handleAccessAttributeBase(base, name, scope) {
  return mapObject(base, scope, (base2) => {
    $trace('Looking for attribute "%s" in object %O', name, base2);
    const attribute = base2.attributes[name];
    return attribute !== void 0 ? ($debug(`accessAttribute.attribute found ${name} %O`, attribute), attribute.optional ? nullUnion(attribute.value) : attribute.value) : base2.rest ? handleAccessAttributeBase(base2.rest, name, scope) : ($warn(`attribute "${name}" not found in object`), { type: "null" });
  });
}
function handleAccessElementNode(node, scope) {
  const base = walk({ node: node.base, scope });
  return $trace("accessElement.base %O", base), mapArray(base, scope, (base2) => nullUnion(base2.of));
}
function handleArrayNode(node, scope) {
  const of = [];
  for (const el of node.elements) {
    const node2 = walk({ node: el.value, scope });
    node2 !== null && of.push(node2);
  }
  return {
    type: "array",
    of: {
      type: "union",
      of
    }
  };
}
function handleValueNode(node, scope) {
  if (node.value === null)
    return { type: "null" };
  switch (typeof node.value) {
    case "string":
      return {
        type: "string",
        value: node.value
      };
    case "number":
      return {
        type: "number",
        value: node.value
      };
    case "boolean":
      return {
        type: "boolean",
        value: node.value
      };
    case "object":
      return node.value === null ? { type: "null" } : Array.isArray(node.value) ? {
        type: "array",
        of: {
          type: "union",
          of: node.value.map((value) => walk({ node: { type: "Value", value }, scope }))
        }
      } : {
        type: "object",
        attributes: Object.fromEntries(
          Object.entries(node.value).map(([key, value]) => [
            key,
            {
              type: "objectAttribute",
              value: walk({ node: { type: "Value", value }, scope })
            }
          ])
        )
      };
    default:
      return { type: "unknown" };
  }
}
function handleSlice(node, scope) {
  $trace("slice.node %O", node);
  const base = walk({ node: node.base, scope });
  return mapArray(base, scope, (base2) => base2);
}
function handleParentNode({ n }, scope) {
  let current = scope;
  for (let i = 0; i < n; i++) {
    if (!current.parent)
      return { type: "null" };
    current = current.parent;
  }
  return $trace("parent.scope %d %O", n, current.value), current.value.of.length === 0 ? { type: "null" } : current.value;
}
function handleNotNode(node, scope) {
  const base = walk({ node: node.base, scope });
  return base.type === "boolean" && base.value !== void 0 ? { type: "boolean", value: base.value === !1 } : { type: "boolean" };
}
function handleEverythingNode(_, scope) {
  return {
    type: "array",
    of: {
      type: "union",
      of: scope.context.schema.filter((obj) => obj.type === "document").map((doc) => ({
        type: "object",
        attributes: doc.attributes
      }))
    }
  };
}
const OVERRIDE_TYPE_SYMBOL = Symbol("groq-js.type");
function walk({ node, scope }) {
  if (OVERRIDE_TYPE_SYMBOL in node)
    return node[OVERRIDE_TYPE_SYMBOL];
  switch (node.type) {
    case "Map":
      return handleMap(node, scope);
    case "Projection":
      return handleProjectionNode(node, scope);
    case "Filter":
      return handleFilterNode(node, scope);
    case "AccessAttribute":
      return optimizeUnions(handleAccessAttributeNode(node, scope));
    case "AccessElement":
      return handleAccessElementNode(node, scope);
    case "ArrayCoerce":
      return handleArrayCoerceNode(node, scope);
    case "FlatMap":
      return handleFlatMap(node, scope);
    case "OpCall":
      return handleOpCallNode(node, scope);
    case "And":
    case "Or":
      return {
        type: "boolean",
        value: resolveCondition(node, scope)
      };
    case "Select":
      return handleSelectNode(node, scope);
    case "PipeFuncCall":
      return walk({ node: node.base, scope });
    case "Deref":
      return handleDerefNode(node, scope);
    case "Object":
      return handleObjectNode(node, scope);
    case "Value":
      return handleValueNode(node, scope);
    case "Array":
      return handleArrayNode(node, scope);
    case "Everything":
      return handleEverythingNode(node, scope);
    case "This":
      return $trace("this %O", scope.value), scope.value;
    case "Parent":
      return handleParentNode(node, scope);
    case "FuncCall":
      return handleFuncCallNode(node, scope);
    case "Group":
      return walk({ node: node.base, scope });
    case "Not":
      return handleNotNode(node, scope);
    case "Parameter":
      return {
        type: "unknown"
      };
    case "Slice":
      return handleSlice(node, scope);
    case "Asc":
    case "Desc":
    case "Neg":
    case "Pos":
    case "Context":
    case "Tuple":
    case "Selector":
    case "InRange":
      return { type: "unknown" };
    default:
      throw new Error(`unknown node type ${node.type}`);
  }
}
function isPrimitiveTypeNode(node) {
  return node.type === "string" || node.type === "number" || node.type === "boolean";
}
function evaluateEquality(left, right) {
  if ($trace("evaluateEquality %O", { left, right }), left.type === "null" && right.type === "null")
    return !0;
  if (isPrimitiveTypeNode(left) && isPrimitiveTypeNode(right) && left.value !== void 0 && right.value !== void 0)
    return left.value === right.value;
  if (left.type === "union" && isPrimitiveTypeNode(right))
    return left.of.some((node) => isPrimitiveTypeNode(node) ? node.value === void 0 || right.value === void 0 || node.value === right.value : !1);
  if (left.type !== right.type)
    return !1;
}
function resolveCondition(expr, scope) {
  switch ($trace("resolveCondition.expr %O", expr), expr.type) {
    case "Value": {
      const value = walk({ node: expr, scope });
      return value.type === "boolean" && value.value !== !1;
    }
    case "And": {
      const left = resolveCondition(expr.left, scope);
      if ($trace("resolveCondition.and.left %O", left), left === !1)
        return !1;
      const right = resolveCondition(expr.right, scope);
      return $trace("resolveCondition.and.right %O", right), right === !1 ? !1 : left === void 0 || right === void 0 ? void 0 : !0;
    }
    case "Or": {
      $trace("resolveCondition.or.expr %O", expr);
      const left = resolveCondition(expr.left, scope);
      if ($trace("resolveCondition.or.left %O", left), left === !0)
        return !0;
      const right = resolveCondition(expr.right, scope);
      return $trace("resolveCondition.or.right %O", right), right === !0 ? !0 : left === void 0 || right === void 0 ? void 0 : !1;
    }
    case "OpCall": {
      const left = walk({ node: expr.left, scope }), right = walk({ node: expr.right, scope });
      if ($trace('opcall "%s" %O', expr.op, { left, right }), left.type === "unknown" || right.type === "unknown")
        return;
      switch (expr.op) {
        case "==":
          return evaluateEquality(left, right);
        case "!=": {
          const result = evaluateEquality(left, right);
          return result === void 0 ? void 0 : !result;
        }
        case "in": {
          if (right.type === "array") {
            if (left.type === "null" && right.of.type === "unknown")
              return;
            if (left.type === "null" && right.of.type === "null")
              return !0;
            if (isPrimitiveTypeNode(left)) {
              if (right.of.type === "unknown" || left.value === void 0)
                return;
              if (isPrimitiveTypeNode(right.of))
                return right.of.value === void 0 ? void 0 : left.value === right.of.value;
              if (right.of.type === "union")
                for (const node of right.of.of) {
                  if (node.type === "unknown")
                    return;
                  if (isPrimitiveTypeNode(node) && left.value === node.value)
                    return !0;
                  if (left.type === node.type && node.value === void 0)
                    return;
                }
            }
          }
          return !1;
        }
        case "match": {
          let tokens = [], patterns = [];
          if (left.type === "string") {
            if (left.value === void 0)
              return;
            tokens = tokens.concat(matchTokenize(left.value));
          }
          if (left.type === "array") {
            if (left.of.type === "unknown")
              return;
            if (left.of.type === "string") {
              if (left.of.value === void 0)
                return;
              tokens = tokens.concat(matchTokenize(left.of.value));
            }
            if (left.of.type === "union")
              for (const node of left.of.of)
                node.type === "string" && node.value !== void 0 && (tokens = tokens.concat(matchTokenize(node.value)));
          }
          if (right.type === "string") {
            if (right.value === void 0)
              return;
            patterns = patterns.concat(matchAnalyzePattern(right.value));
          }
          if (right.type === "array") {
            if (right.of.type === "unknown")
              return;
            if (right.of.type === "string") {
              if (right.of.value === void 0)
                return;
              patterns = patterns.concat(matchAnalyzePattern(right.of.value));
            }
            if (right.of.type === "union")
              for (const node of right.of.of) {
                if (node.type === "string") {
                  if (node.value === void 0)
                    return;
                  patterns = patterns.concat(matchAnalyzePattern(node.value));
                }
                if (node.type !== "string")
                  return !1;
              }
          }
          return matchText(tokens, patterns);
        }
        case "<":
          return isPrimitiveTypeNode(left) && isPrimitiveTypeNode(right) ? left.value === void 0 || right.value === void 0 ? void 0 : left.value < right.value : void 0;
        case "<=":
          return isPrimitiveTypeNode(left) && isPrimitiveTypeNode(right) ? left.value === void 0 || right.value === void 0 ? void 0 : left.value <= right.value : void 0;
        case ">":
          return isPrimitiveTypeNode(left) && isPrimitiveTypeNode(right) ? left.value === void 0 || right.value === void 0 ? void 0 : left.value > right.value : void 0;
        case ">=":
          return isPrimitiveTypeNode(left) && isPrimitiveTypeNode(right) ? left.value === void 0 || right.value === void 0 ? void 0 : left.value >= right.value : void 0;
        default:
          return;
      }
    }
    case "Group":
      return resolveCondition(expr.base, scope);
    default:
      return !0;
  }
}
function resolveFilter(expr, scope) {
  $trace("resolveFilter.expr %O", expr);
  const filtered = scope.value.of.filter(
    (node) => (
      // create a new scope with the current scopes parent as the parent. It's only a temporary scope since we only want to resolve the condition
      // check if the result is true or undefined. Undefined means that the condition can't be resolved, and we should keep the node
      resolveCondition(expr, scope.createHidden([node])) !== !1
    )
  );
  return $trace(
    `resolveFilter ${expr.type === "OpCall" ? `${expr.type}/${expr.op}` : expr.type} %O`,
    filtered
  ), { type: "union", of: filtered };
}
function mapUnion(node, mapper) {
  return node.type === "union" ? optimizeUnions({
    type: "union",
    of: node.of.map((subNode) => mapUnion(subNode, mapper))
  }) : mapper(node);
}
function mapConcrete(node, scope, mapper, mergeUnions = (nodes) => optimizeUnions({ type: "union", of: nodes })) {
  switch (node.type) {
    case "boolean":
    case "array":
    case "null":
    case "object":
    case "string":
    case "number":
      return mapper(node);
    case "unknown":
      return node;
    case "union":
      return mergeUnions(node.of.map((inner) => mapConcrete(inner, scope, mapper), mergeUnions));
    case "inline": {
      const resolvedInline = scope.context.lookupTypeDeclaration(node);
      return mapConcrete(resolvedInline, scope, mapper, mergeUnions);
    }
    default:
      throw new Error(`Unknown type: ${node.type}`);
  }
}
function mapArray(node, scope, mapper) {
  return mapConcrete(node, scope, (base) => base.type === "array" ? mapper(base) : { type: "null" });
}
function mapObject(node, scope, mapper) {
  return mapConcrete(
    node,
    scope,
    (base) => base.type === "object" ? mapper(base) : { type: "null" }
  );
}
export {
  DateTime,
  Path,
  createReferenceTypeNode,
  evaluateQuery as evaluate,
  parse,
  typeEvaluate
};
//# sourceMappingURL=index.mjs.map
