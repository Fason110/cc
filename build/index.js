var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var express = require("express");
var import_compression = __toESM(require("compression"));
var import_helmet = __toESM(require("helmet"));
var app = express();

//var import_express = __toESM(require("express"));
//var import_compression = __toESM(require("compression"));
//var import_helmet = __toESM(require("helmet"));
//var app = (0, import_express.default)();

app.set('trust proxy', true);
var router = import_express.default.Router();

// 允许访问的IP地址列表
var allowed_ips = ['183.63.121.10', '172.247.129.124', '192.168.1.3'];

app.use(function(req, res, next) {
    var user_ip = req.connection.remoteAddress;
//app.use(function(req, res, next) {
//    var user_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // 打印出每个请求的IP地址
    console.log('Request IP:', user_ip);

    if(allowed_ips.indexOf(user_ip) !== -1){
       next();
    }
    else{
       res.status(403).send("Forbidden");
    }
});

app.use(import_express.default.static("public"));
app.use(import_express.default.json());
app.use((0, import_compression.default)());
app.use((0, import_helmet.default)());
app.all("*", (_, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "authorization, Content-Type");
  res.header("Access-Control-Allow-Methods", "*");
  next();
});




// src/chatgpt/index.ts
var dotenv = __toESM(require("dotenv"));
var import_isomorphic_fetch = require("isomorphic-fetch");
var import_chatgpt = require("chatgpt");
var import_socks_proxy_agent = require("socks-proxy-agent");
var import_https_proxy_agent = require("https-proxy-agent");
var import_node_fetch = __toESM(require("node-fetch"));
var import_axios = __toESM(require("axios"));

// src/utils/index.ts
function sendResponse(options) {
  if (options.type === "Success") {
    return Promise.resolve({
      message: options.message ?? null,
      data: options.data ?? null,
      status: options.type
    });
  }
  return Promise.reject({
    message: options.message ?? "Failed",
    data: options.data ?? null,
    status: options.type
  });
}

// src/utils/is.ts
function isNotEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

// src/chatgpt/index.ts
var ErrorCodeMessage = {
  401: "[OpenAI] \u63D0\u4F9B\u9519\u8BEF\u7684API\u5BC6\u94A5 | Incorrect API key provided",
  403: "[OpenAI] \u670D\u52A1\u5668\u62D2\u7EDD\u8BBF\u95EE\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5 | Server refused to access, please try again later",
  502: "[OpenAI] \u9519\u8BEF\u7684\u7F51\u5173 |  Bad Gateway",
  503: "[OpenAI] \u670D\u52A1\u5668\u7E41\u5FD9\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5 | Server is busy, please try again later",
  504: "[OpenAI] \u7F51\u5173\u8D85\u65F6 | Gateway Time-out",
  500: "[OpenAI] \u670D\u52A1\u5668\u7E41\u5FD9\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5 | Internal Server Error"
};
dotenv.config();
var timeoutMs = !isNaN(+process.env.TIMEOUT_MS) ? +process.env.TIMEOUT_MS : 30 * 1e3;
var apiModel;
if (!process.env.OPENAI_API_KEY && !process.env.OPENAI_ACCESS_TOKEN)
  throw new Error("Missing OPENAI_API_KEY or OPENAI_ACCESS_TOKEN environment variable");
var api;
(async () => {
  if (process.env.OPENAI_API_KEY) {
    const OPENAI_API_MODEL = process.env.OPENAI_API_MODEL;
    const model = isNotEmptyString(OPENAI_API_MODEL) ? OPENAI_API_MODEL : "gpt-3.5-turbo";
    const options = {
      apiKey: process.env.OPENAI_API_KEY,
      completionParams: { model },
      debug: true
    };
    if (isNotEmptyString(process.env.OPENAI_API_BASE_URL))
      options.apiBaseUrl = process.env.OPENAI_API_BASE_URL;
    setupProxy(options);
    api = new import_chatgpt.ChatGPTAPI({ ...options });
    apiModel = "ChatGPTAPI";
  } else {
    const options = {
      accessToken: process.env.OPENAI_ACCESS_TOKEN,
      debug: true
    };
    if (isNotEmptyString(process.env.API_REVERSE_PROXY))
      options.apiReverseProxyUrl = process.env.API_REVERSE_PROXY;
    setupProxy(options);
    api = new import_chatgpt.ChatGPTUnofficialProxyAPI({ ...options });
    apiModel = "ChatGPTUnofficialProxyAPI";
  }
})();
async function chatReplyProcess(message, lastContext, process2) {
  try {
    let options = { timeoutMs };
    if (lastContext) {
      if (apiModel === "ChatGPTAPI")
        options = { parentMessageId: lastContext.parentMessageId };
      else
        options = { ...lastContext };
    }
    const response = await api.sendMessage(message, {
      ...options,
      onProgress: (partialResponse) => {
        process2?.(partialResponse);
      }
    });
    return sendResponse({ type: "Success", data: response });
  } catch (error) {
    const code = error.statusCode;
    global.console.log(error);
    if (Reflect.has(ErrorCodeMessage, code))
      return sendResponse({ type: "Fail", message: ErrorCodeMessage[code] });
    return sendResponse({ type: "Fail", message: error.message ?? "Please check the back-end console" });
  }
}
async function fetchBalance() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_API_BASE_URL = process.env.OPENAI_API_BASE_URL;
  if (!isNotEmptyString(OPENAI_API_KEY))
    return Promise.resolve("-");
  const API_BASE_URL = isNotEmptyString(OPENAI_API_BASE_URL) ? OPENAI_API_BASE_URL : "https://api.openai.com";
  try {
    const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` };
    const response = await import_axios.default.get(`${API_BASE_URL}/dashboard/billing/credit_grants`, { headers });
    const balance = response.data.total_available ?? 0;
    return Promise.resolve(balance.toFixed(3));
  } catch {
    return Promise.resolve("-");
  }
}
async function chatConfig() {
  const balance = await fetchBalance();
  const reverseProxy = process.env.API_REVERSE_PROXY ?? "-";
  const httpsProxy = (process.env.HTTPS_PROXY || process.env.ALL_PROXY) ?? "-";
  const socksProxy = process.env.SOCKS_PROXY_HOST && process.env.SOCKS_PROXY_PORT ? `${process.env.SOCKS_PROXY_HOST}:${process.env.SOCKS_PROXY_PORT}` : "-";
  return sendResponse({
    type: "Success",
    data: { apiModel, reverseProxy, timeoutMs, socksProxy, httpsProxy, balance }
  });
}
function setupProxy(options) {
  if (process.env.SOCKS_PROXY_HOST && process.env.SOCKS_PROXY_PORT) {
    const agent = new import_socks_proxy_agent.SocksProxyAgent({
      hostname: process.env.SOCKS_PROXY_HOST,
      port: process.env.SOCKS_PROXY_PORT
    });
    options.fetch = (url, options2) => {
      return (0, import_node_fetch.default)(url, { agent, ...options2 });
    };
  } else {
    if (process.env.HTTPS_PROXY || process.env.ALL_PROXY) {
      const httpsProxy = process.env.HTTPS_PROXY || process.env.ALL_PROXY;
      if (httpsProxy) {
        const agent = new import_https_proxy_agent.HttpsProxyAgent(httpsProxy);
        options.fetch = (url, options2) => {
          return (0, import_node_fetch.default)(url, { agent, ...options2 });
        };
      }
    }
  }
}
function currentModel() {
  return apiModel;
}

// src/middleware/auth.ts
var auth = async (req, res, next) => {
  const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY;
  if (isNotEmptyString(AUTH_SECRET_KEY)) {
    try {
      const Authorization = req.header("Authorization");
      if (!Authorization || Authorization.replace("Bearer ", "").trim() !== AUTH_SECRET_KEY.trim())
        throw new Error("Error: \u65E0\u8BBF\u95EE\u6743\u9650 | No access rights");
      next();
    } catch (error) {
      res.send({ status: "Unauthorized", message: error.message ?? "Please authenticate.", data: null });
    }
  } else {
    next();
  }
};

// src/middleware/limiter.ts
//var import_express_rate_limit = require("express-rate-limit");
//var MAX_REQUEST_PER_HOUR = process.env.MAX_REQUEST_PER_HOUR;
//var maxCount = isNotEmptyString(MAX_REQUEST_PER_HOUR) && !isNaN(Number(MAX_REQUEST_PER_HOUR)) ? parseInt(MAX_REQUEST_PER_HOUR) : 0;
//var limiter = (0, import_express_rate_limit.rateLimit)({
//  windowMs: 60 * 60 * 1e3,
  // Maximum number of accesses within an hour
//  max: maxCount,
//  statusCode: 200,
  // 200 means success，but the message is 'Too many request from this IP in 1 hour'
//  message: async (req, res) => {
//    res.send({ status: "Fail", message: "Too many request from this IP in 1 hour", data: null });
//  }
//});

// src/middleware/limiter.ts
var import_express_rate_limit = require("express-rate-limit");
var MAX_REQUEST_PER_15_MINUTES = process.env.MAX_REQUEST_PER_15_MINUTES;
var maxCount = 10;//isNotEmptyString(MAX_REQUEST_PER_15_MINUTES) && !isNaN(Number(MAX_REQUEST_PER_15_MINUTES)) ? parseInt(MAX_REQUEST_PER_15_MINUTES) : 25;
var limiter = (0, import_express_rate_limit.rateLimit)({
  windowMs: 15 * 60 * 1e3,
  // Maximum number of accesses within 15 minutes
  max: maxCount,
  statusCode: 200,
  // 200 means success，but the message is 'Too many requests from this IP in 15 minutes'
  message: async (req, res) => {
    res.send({ status: "Fail", message: "Too many requests from this IP in 15 minutes", data: null });
  }
});


// src/index.ts
var app = (0, import_express.default)();
var router = import_express.default.Router();
app.use(import_express.default.static("public"));
app.use(import_express.default.json());
app.use((0, import_compression.default)());
app.use((0, import_helmet.default)());
app.all("*", (_, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "authorization, Content-Type");
  res.header("Access-Control-Allow-Methods", "*");
  next();
});
router.get("/", async (req, res) => {
  res.type("html");
  res.render("index.html");
});
router.post("/chat-process", [auth, limiter], async (req, res) => {
  res.setHeader("Content-type", "application/octet-stream");
  try {
    const { prompt, options = {} } = req.body;
    let firstChunk = true;
    await chatReplyProcess(prompt, options, (chat) => {
      res.write(firstChunk ? JSON.stringify(chat) : `
${JSON.stringify(chat)}`);
      firstChunk = false;
    });
  } catch (error) {
    res.write(JSON.stringify(error));
  } finally {
    res.end();
  }
});
router.post("/config", auth, async (req, res) => {
  try {
    const response = await chatConfig();
    res.send(response);
  } catch (error) {
    res.send(error);
  }
});
router.post("/session", async (req, res) => {
  try {
    const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY;
    const hasAuth = isNotEmptyString(AUTH_SECRET_KEY);
    res.send({ status: "Success", message: "", data: { auth: hasAuth, model: currentModel() } });
  } catch (error) {
    res.send({ status: "Fail", message: error.message, data: null });
  }
});
router.post("/verify", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token)
      throw new Error("Secret key is empty");
    if (process.env.AUTH_SECRET_KEY !== token)
      throw new Error("\u5BC6\u94A5\u65E0\u6548 | Secret key is invalid");
    res.send({ status: "Success", message: "Verify successfully", data: null });
  } catch (error) {
    res.send({ status: "Fail", message: error.message, data: null });
  }
});
app.use("", router);
app.use("/api", router);
app.listen(6660, () => globalThis.console.log("Server is running on port 6660"));
