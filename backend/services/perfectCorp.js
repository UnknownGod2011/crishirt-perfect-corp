import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";
import sharp from "sharp";

const DEFAULT_V1_BASE_URL = "https://yce-api-01.makeupar.com";
const DEFAULT_V2_BASE_URL = "https://yce-api-01.makeupar.com";

let cachedV1Token = null;
let v1RequestCounter = 0;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const stripTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");
const isPlaceholder = (value) => !value || /^PASTE_|^your_|^YOUR_/i.test(String(value).trim());

const getConfig = () => ({
  apiKey: isPlaceholder(process.env.PERFECT_API_KEY) ? "" : process.env.PERFECT_API_KEY,
  v1AccessToken: isPlaceholder(process.env.PERFECT_V1_ACCESS_TOKEN) ? "" : process.env.PERFECT_V1_ACCESS_TOKEN,
  v1ClientId: isPlaceholder(process.env.PERFECT_V1_CLIENT_ID) ? "" : process.env.PERFECT_V1_CLIENT_ID,
  v1ClientSecret: isPlaceholder(process.env.PERFECT_V1_CLIENT_SECRET) ? "" : process.env.PERFECT_V1_CLIENT_SECRET,
  textStyleGroupId: isPlaceholder(process.env.PERFECT_TEXT_STYLE_GROUP_ID) ? "" : process.env.PERFECT_TEXT_STYLE_GROUP_ID,
  textStyleId: isPlaceholder(process.env.PERFECT_TEXT_STYLE_ID) ? "" : process.env.PERFECT_TEXT_STYLE_ID,
  v1BaseUrl: stripTrailingSlash(process.env.PERFECT_V1_API_BASE_URL || DEFAULT_V1_BASE_URL),
  v2BaseUrl: stripTrailingSlash(process.env.PERFECT_API_BASE_URL || DEFAULT_V2_BASE_URL),
  demoMode: process.env.PERFECT_DEMO_MODE === "true",
  pollIntervalMs: Number(process.env.PERFECT_API_POLL_INTERVAL_MS || 2000),
  maxAttempts: Number(process.env.PERFECT_API_MAX_ATTEMPTS || 45),
  geminiApiKey: isPlaceholder(process.env.GEMINI_API_KEY) ? "" : process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
});

export const getPerfectStatus = () => {
  const config = getConfig();
  return {
    v2Ready: Boolean(config.apiKey),
    v1Ready: Boolean(config.v1AccessToken || (config.v1ClientId && config.v1ClientSecret) || config.apiKey),
    demoMode: config.demoMode,
    baseUrls: {
      v1: config.v1BaseUrl,
      v2: config.v2BaseUrl,
    },
    geminiReady: Boolean(config.geminiApiKey),
  };
};

const requireV2ApiKey = () => {
  const config = getConfig();
  if (!config.apiKey) {
    throw new Error("PERFECT_API_KEY is missing. Paste it into backend/.env or set PERFECT_DEMO_MODE=true for demo fallback.");
  }
  return config.apiKey;
};

const toPemPublicKey = (secret) => {
  if (!secret) return null;
  if (secret.includes("BEGIN PUBLIC KEY")) return secret;
  const normalized = secret.replace(/\s+/g, "");
  const wrapped = normalized.match(/.{1,64}/g)?.join("\n") || normalized;
  return `-----BEGIN PUBLIC KEY-----\n${wrapped}\n-----END PUBLIC KEY-----`;
};

const requestV1AccessToken = async (config) => {
  if (cachedV1Token && cachedV1Token.expiresAt > Date.now() + 60_000) {
    return cachedV1Token.accessToken;
  }

  if (!config.v1ClientId || !config.v1ClientSecret) {
    return null;
  }

  const payload = `client_id=${config.v1ClientId}&timestamp=${Date.now()}`;
  const encrypted = crypto.publicEncrypt(
    {
      key: toPemPublicKey(config.v1ClientSecret),
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(payload),
  );

  const response = await fetch(`${config.v1BaseUrl}/s2s/v1.0/client/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.v1ClientId,
      id_token: encrypted.toString("base64"),
    }),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok || Number(json.status || response.status) >= 400) {
    throw new Error(json?.result?.error || json?.error_message || "Perfect Corp v1 authentication failed");
  }

  const accessToken = json?.result?.access_token || json?.data?.access_token;
  if (!accessToken) {
    throw new Error("Perfect Corp v1 authentication did not return an access token");
  }

  cachedV1Token = {
    accessToken,
    expiresAt: Date.now() + 115 * 60 * 1000,
  };

  return accessToken;
};

const getBearerToken = async (version) => {
  const config = getConfig();

  if (version === "v1") {
    if (config.v1AccessToken) return config.v1AccessToken;
    const accessToken = await requestV1AccessToken(config);
    if (accessToken) return accessToken;
    if (config.apiKey) return config.apiKey;
    throw new Error("Perfect Corp v1 credentials are missing. Fill PERFECT_V1_ACCESS_TOKEN or client credentials if text-to-image/background-removal requires them.");
  }

  return requireV2ApiKey();
};

const authHeaders = async (version) => ({
  Authorization: `Bearer ${await getBearerToken(version)}`,
  "Content-Type": "application/json",
});

const parseJson = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
};

const isTransientNetworkError = (error) =>
  /ECONNRESET|ETIMEDOUT|ECONNREFUSED|ENOTFOUND|network|aborted|socket/i.test(error?.message || "");

const perfectFetch = async (url, options = {}, attempt = 0) => {
  let response;
  const method = String(options.method || "GET").toUpperCase();
  try {
    response = await fetch(url, options);
  } catch (error) {
    if (method === "GET" && attempt < 3 && isTransientNetworkError(error)) {
      await wait(1000 * (attempt + 1));
      return perfectFetch(url, options, attempt + 1);
    }
    throw error;
  }
  const json = await parseJson(response);
  const apiStatus = Number(json.status || response.status);

  if (!response.ok || apiStatus >= 400) {
    const message =
      json?.data?.error ||
      json?.data?.error_message ||
      json?.result?.error ||
      json?.result?.error_message ||
      json?.error ||
      json?.error_message ||
      json?.message ||
      `Perfect Corp request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = json;
    throw error;
  }

  return json;
};

const sanitizeContentType = (contentType = "image/jpeg") => {
  if (contentType.includes("png")) return "image/png";
  if (contentType.includes("webp")) return "image/webp";
  if (contentType.includes("jpg") || contentType.includes("jpeg")) return "image/jpeg";
  return "image/jpeg";
};

const extensionForType = (contentType) => {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
};

const toSafeNumericId = (id) => {
  const numeric = Number(id);
  return Number.isSafeInteger(numeric) ? numeric : null;
};

const normalizeImageInput = async (input, { fallbackType = "image/jpeg", publicDir, maxSizeKb = 1500 } = {}) => {
  if (!input || typeof input !== "string") {
    throw new Error("Image input is required");
  }

  let contentType;
  let buffer;

  if (input.startsWith("data:")) {
    const match = input.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("Invalid data URL image");
    contentType = sanitizeContentType(match[1]);
    buffer = Buffer.from(match[2], "base64");
  } else if (input.startsWith("http://") || input.startsWith("https://")) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    let response;
    try {
      response = await fetch(input, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) throw new Error(`Could not fetch image for upload (${response.status})`);
    const arrayBuffer = await response.arrayBuffer();
    contentType = sanitizeContentType(response.headers.get("content-type") || fallbackType);
    buffer = Buffer.from(arrayBuffer);
  } else if (input.startsWith("/") && publicDir) {
    const filePath = path.join(publicDir, input.replace(/^\/+/, ""));
    buffer = await fs.readFile(filePath);
    contentType = sanitizeContentType(path.extname(filePath).toLowerCase() === ".png" ? "image/png" : fallbackType);
  } else {
    contentType = sanitizeContentType(fallbackType);
    buffer = Buffer.from(input, "base64");
  }

  // Always convert PNG to JPEG for uploads (PNG is uncompressed, much larger)
  // Resize if still over the size limit after conversion
  const sizeKb = buffer.length / 1024;
  const isPng = contentType === "image/png";
  
  if (isPng || sizeKb > maxSizeKb) {
    try {
      const targetWidth = maxSizeKb >= 3000 ? 2048 : 1024;
      const quality = maxSizeKb >= 3000 ? 92 : 85;
      let pipeline = sharp(buffer);
      
      // Only resize if over the limit
      if (sizeKb > maxSizeKb) {
        pipeline = pipeline.resize({ width: targetWidth, height: targetWidth, fit: "inside", withoutEnlargement: true });
      }
      
      const resized = await pipeline.jpeg({ quality }).toBuffer();
      console.log(`[uploadFile] Converted${sizeKb > maxSizeKb ? '+resized' : ''} image: ${Math.round(sizeKb)}KB → ${Math.round(resized.length/1024)}KB`);
      return { contentType: "image/jpeg", buffer: resized };
    } catch (err) {
      console.warn("[uploadFile] Sharp conversion failed, using original:", err?.message);
    }
  }

  return { contentType, buffer };
};

const extractFileInfo = (uploadInit) => {
  return uploadInit?.data?.files?.[0] || uploadInit?.result?.files?.[0] || uploadInit?.files?.[0];
};

const uploadFile = async ({ aiTask, image, fileNamePrefix, version = "v2", publicDir, maxSizeKb = 1500 }) => {
  const config = getConfig();
  const baseUrl = version === "v1" ? config.v1BaseUrl : config.v2BaseUrl;
  const normalized = await normalizeImageInput(image, { publicDir, maxSizeKb });
  const contentType = normalized.contentType;
  const fileName = `${fileNamePrefix}-${Date.now()}.${extensionForType(contentType)}`;

  const filePayload = {
    content_type: contentType,
    file_name: fileName,
    ...(version === "v2" ? { file_size: normalized.buffer.length } : {}),
  };

  const uploadInit = await perfectFetch(`${baseUrl}/s2s/${version === "v1" ? "v1.0" : "v2.0"}/file/${aiTask}`, {
    method: "POST",
    headers: await authHeaders(version),
    body: JSON.stringify({ files: [filePayload] }),
  });

  const fileInfo = extractFileInfo(uploadInit);
  const uploadRequest = fileInfo?.requests?.[0];
  const fileId = fileInfo?.file_id || fileInfo?.id;

  if (!fileId || !uploadRequest?.url) {
    throw new Error("Perfect Corp did not return upload information");
  }

  const uploadHeaders = {
    ...(uploadRequest.headers || {}),
    "Content-Type": uploadRequest.headers?.["Content-Type"] || contentType,
    "Content-Length": String(normalized.buffer.length),
  };

  // Use AbortController for upload timeout (large files can hang on S3)
  const uploadController = new AbortController();
  const uploadTimeout = setTimeout(() => uploadController.abort(), 45000);
  let uploadResponse;
  try {
    uploadResponse = await fetch(uploadRequest.url, {
      method: uploadRequest.method || "PUT",
      headers: uploadHeaders,
      body: normalized.buffer,
      signal: uploadController.signal,
    });
  } finally {
    clearTimeout(uploadTimeout);
  }

  if (!uploadResponse.ok) {
    const errText = await uploadResponse.text().catch(() => "");
    throw new Error(`Perfect Corp file upload failed (${uploadResponse.status})${errText ? `: ${errText.substring(0, 100)}` : ""}`);
  }

  return { fileId };
};

const extractTaskId = (taskResponse) => taskResponse?.data?.task_id || taskResponse?.result?.task_id || taskResponse?.task_id;
const getTaskData = (statusResponse) => statusResponse?.data || statusResponse?.result || statusResponse || {};

const createV2Task = async ({ aiTask, payload }) => {
  const config = getConfig();
  const taskResponse = await perfectFetch(`${config.v2BaseUrl}/s2s/v2.0/task/${aiTask}`, {
    method: "POST",
    headers: await authHeaders("v2"),
    body: JSON.stringify(payload),
  });
  const taskId = extractTaskId(taskResponse);
  if (!taskId) throw new Error("Perfect Corp did not return a task id");
  return taskId;
};

const createV1Task = async ({ aiTask, payload }) => {
  const config = getConfig();
  v1RequestCounter = (v1RequestCounter + 1) % 100000;
  const requestBody = Object.prototype.hasOwnProperty.call(payload || {}, "request_id")
    ? payload
    : {
        request_id: (Date.now() % 1000000000) + v1RequestCounter,
        payload,
      };
  const taskResponse = await perfectFetch(`${config.v1BaseUrl}/s2s/v1.0/task/${aiTask}`, {
    method: "POST",
    headers: await authHeaders("v1"),
    body: JSON.stringify(requestBody),
  });
  const taskId = extractTaskId(taskResponse);
  if (!taskId) throw new Error("Perfect Corp did not return a task id");
  return taskId;
};

const pollV2Task = async ({ aiTask, taskId, version = "v2.0" }) => {
  const config = getConfig();
  for (let attempt = 0; attempt < config.maxAttempts; attempt += 1) {
    let statusResponse;
    try {
      statusResponse = await perfectFetch(`${config.v2BaseUrl}/s2s/${version}/task/${aiTask}/${taskId}`, {
        method: "GET",
        headers: await authHeaders("v2"),
      });
    } catch (error) {
      if (/invalid task id/i.test(error?.message || "") && attempt < 5) {
        await wait(config.pollIntervalMs);
        continue;
      }
      throw error;
    }
    const data = getTaskData(statusResponse);
    const taskStatus = String(data.task_status || data.status || "").toLowerCase();
    if (["success", "completed", "complete", "done"].includes(taskStatus)) return data;
    if (["error", "failed", "failure"].includes(taskStatus)) {
      throw new Error(data.error_message || data.error || "Perfect Corp task failed");
    }
    await wait(Number(data.polling_interval || config.pollIntervalMs));
  }
  throw new Error("Perfect Corp task timed out");
};

const pollV1Task = async ({ aiTask, taskId }) => {
  const config = getConfig();
  for (let attempt = 0; attempt < config.maxAttempts; attempt += 1) {
    const statusResponse = await perfectFetch(`${config.v1BaseUrl}/s2s/v1.0/task/${aiTask}?task_id=${encodeURIComponent(taskId)}`, {
      method: "GET",
      headers: await authHeaders("v1"),
    });
    // v1 API returns: { status: 200, result: { status: "success"|"processing", results: [...], ... } }
    // We need to check result.status, not result.task_status
    const result = statusResponse?.result || statusResponse?.data || statusResponse || {};
    const taskStatus = String(
      result.task_status || result.status || result.task_state || ""
    ).toLowerCase();
    if (["success", "completed", "complete", "done"].includes(taskStatus)) return result;
    if (["error", "failed", "failure"].includes(taskStatus)) {
      throw new Error(result.error_message || result.error || "Perfect Corp task failed");
    }
    await wait(Number(result.polling_interval || config.pollIntervalMs));
  }
  throw new Error("Perfect Corp task timed out");
};

const findResultUrl = (value) => {
  if (!value || typeof value !== "object") return null;

  // v2 cloth task structure: { results: { url: "..." } }
  if (value.results && typeof value.results === "object" && !Array.isArray(value.results)) {
    if (typeof value.results.url === "string" && value.results.url.startsWith("http")) {
      return value.results.url;
    }
  }

  // v1 text-to-image / sod structure: { results: [{ data: [{ url: "..." }] }] }
  if (Array.isArray(value.results)) {
    for (const resultItem of value.results) {
      if (Array.isArray(resultItem?.data)) {
        for (const dataItem of resultItem.data) {
          if (typeof dataItem?.url === "string" && dataItem.url.startsWith("http")) {
            return dataItem.url;
          }
        }
      }
      // Also handle results[0].url directly
      if (typeof resultItem?.url === "string" && resultItem.url.startsWith("http")) {
        return resultItem.url;
      }
    }
  }

  // Generic deep search for any http URL value
  const direct = value.url || value.result_url || value.processed_url || value.file_url || value.image_url;
  if (typeof direct === "string" && direct.startsWith("http")) return direct;
  for (const nested of Object.values(value)) {
    if (Array.isArray(nested)) {
      for (const item of nested) {
        const found = findResultUrl(item);
        if (found) return found;
      }
    } else if (nested && typeof nested === "object") {
      const found = findResultUrl(nested);
      if (found) return found;
    }
  }
  return null;
};

const fetchResultAsDataUrl = async (url, retries = 3) => {
  if (!url) return null;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) return null;
      const contentType = response.headers.get("content-type") || "image/jpeg";
      const arrayBuffer = await response.arrayBuffer();
      return `data:${contentType};base64,${Buffer.from(arrayBuffer).toString("base64")}`;
    } catch (err) {
      if (attempt < retries - 1) {
        await wait(1500 * (attempt + 1)); // backoff: 1.5s, 3s
        continue;
      }
      console.error(`fetchResultAsDataUrl failed after ${retries} attempts:`, err?.message);
      return null;
    }
  }
  return null;
};

const findFirstHex = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value.match(/#[0-9a-fA-F]{6}/)?.[0] || null;
  if (Array.isArray(value)) {
    if (value.length >= 3 && value.slice(0, 3).every((item) => Number.isFinite(Number(item)))) {
      return `#${value
        .slice(0, 3)
        .map((item) => Math.max(0, Math.min(255, Math.round(Number(item)))).toString(16).padStart(2, "0"))
        .join("")}`;
    }
    for (const item of value) {
      const found = findFirstHex(item);
      if (found) return found;
    }
  }
  if (typeof value === "object") {
    if (["r", "g", "b"].every((key) => Number.isFinite(Number(value[key])))) {
      return `#${["r", "g", "b"].map((key) => Math.round(Number(value[key])).toString(16).padStart(2, "0")).join("")}`;
    }
    for (const item of Object.values(value)) {
      const found = findFirstHex(item);
      if (found) return found;
    }
  }
  return null;
};

const findValueByKey = (value, pattern) => {
  if (!value || typeof value !== "object") return null;
  for (const [key, nested] of Object.entries(value)) {
    if (pattern.test(key)) return nested;
    if (nested && typeof nested === "object") {
      const found = findValueByKey(nested, pattern);
      if (found !== null && found !== undefined) return found;
    }
  }
  return null;
};

const safeSvgText = (value) =>
  String(value || "")
    .replace(/[<>&"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const hashString = (value) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const createDemoDesignImage = ({ prompt, apparelName = "apparel" }) => {
  const text = safeSvgText(prompt || "Custom Apparel");
  const words = text.split(" ").filter(Boolean);
  const hash = hashString(text);
  const accent = ["#2563eb", "#f97316", "#16a34a", "#9333ea", "#dc2626"][hash % 5];
  const second = ["#0f172a", "#111827", "#312e81", "#064e3b", "#581c87"][hash % 5];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <circle cx="512" cy="512" r="318" fill="${second}"/>
      <circle cx="512" cy="512" r="276" fill="none" stroke="${accent}" stroke-width="34"/>
      <path d="M278 555 C365 405 462 668 555 500 C629 367 699 437 760 568" fill="none" stroke="#ffffff" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M320 665 H704" stroke="${accent}" stroke-width="36" stroke-linecap="round"/>
      <circle cx="694" cy="352" r="44" fill="${accent}"/>
      <text x="512" y="500" text-anchor="middle" font-family="Arial, sans-serif" font-size="74" font-weight="900" fill="#ffffff">${safeSvgText(words.slice(0, 3).join(" ") || "WearCraft").toUpperCase()}</text>
      <text x="512" y="590" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#ffffff">${safeSvgText(words.slice(3, 7).join(" ") || apparelName).toUpperCase()}</text>
    </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};

const createDemoTryOnImage = ({ personImage, garmentImage, apparelName = "Custom apparel" }) => {
  const safePerson = String(personImage || "").replace(/"/g, "&quot;");
  const safeGarment = String(garmentImage || "").replace(/"/g, "&quot;");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <rect width="1200" height="900" fill="#0f172a"/>
      <text x="70" y="86" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="#ffffff">Perfect Corp Try-On Demo</text>
      <text x="70" y="132" font-family="Arial, sans-serif" font-size="22" fill="#bfdbfe">Demo fallback is enabled. Live mode will call Perfect Corp.</text>
      <rect x="70" y="180" width="500" height="620" rx="28" fill="#111827" stroke="#60a5fa" stroke-width="3"/>
      <rect x="630" y="180" width="500" height="620" rx="28" fill="#111827" stroke="#f97316" stroke-width="3"/>
      <image href="${safePerson}" x="95" y="215" width="450" height="520" preserveAspectRatio="xMidYMid slice"/>
      <image href="${safeGarment}" x="680" y="250" width="400" height="410" preserveAspectRatio="xMidYMid meet"/>
      <text x="880" y="700" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#fed7aa">${safeSvgText(apparelName)}</text>
    </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};

export const buildColorRecommendations = (skinToneHex) => {
  const normalized = skinToneHex?.replace("#", "");
  const rgb = normalized?.length === 6
    ? {
        r: parseInt(normalized.slice(0, 2), 16),
        g: parseInt(normalized.slice(2, 4), 16),
        b: parseInt(normalized.slice(4, 6), 16),
      }
    : null;
  const brightness = rgb ? (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 : 150;
  const warmth = rgb ? rgb.r - rgb.b : 0;
  const undertone = warmth > 18 ? "warm" : warmth < -12 ? "cool" : "neutral";
  const depth = brightness > 185 ? "light" : brightness < 105 ? "deep" : "medium";
  const palettes = {
    warm: [
      { hex: "#111827", name: "black" },
      { hex: "#14532D", name: "forest green" },
      { hex: "#7C2D12", name: "rust" },
      { hex: "#F8FAFC", name: "soft white" },
      { hex: "#1E3A8A", name: "deep navy" },
    ],
    cool: [
      { hex: "#0F172A", name: "charcoal" },
      { hex: "#1D4ED8", name: "royal blue" },
      { hex: "#581C87", name: "plum" },
      { hex: "#E5E7EB", name: "cool grey" },
      { hex: "#064E3B", name: "teal" },
    ],
    neutral: [
      { hex: "#111827", name: "black" },
      { hex: "#374151", name: "graphite" },
      { hex: "#1F2937", name: "slate" },
      { hex: "#F9FAFB", name: "white" },
      { hex: "#0F766E", name: "sea green" },
    ],
  };
  return {
    skinToneHex: skinToneHex || null,
    undertone,
    depth,
    recommendedColors: palettes[undertone],
    designTips: [
      depth === "deep"
        ? "Bright or light ink accents will keep the print readable."
        : "Saturated dark ink or bold outlines will keep the print legible.",
      undertone === "warm"
        ? "Earthy greens, navy, rust, and cream are a strong premium direction."
        : undertone === "cool"
          ? "Blue, charcoal, plum, teal, and clean grey palettes should feel cohesive."
          : "Balanced neutrals with one saturated accent are the safest premium direction.",
      "Avoid matching the print color too closely to the garment color.",
    ],
  };
};

const buildApparelPrompt = ({ prompt, apparelName, garmentColor, material, printArea }) => {
  const sanitizedConcept = String(prompt || "")
    .replace(/\b(t-?shirt|tee|hoodie|sweatshirt|crop top|long sleeve|polo|tank top)\s+design\b/gi, "print graphic")
    .replace(/\bdesign\s+(for|on)\s+(a\s+)?(t-?shirt|tee|hoodie|sweatshirt|crop top|long sleeve|polo|tank top)\b/gi, "print graphic")
    .replace(/\b(on|wearing|worn by|modeled by)\s+(a\s+)?(person|model|man|woman|body|torso)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return [
    "Generate standalone print artwork only for screen printing",
    `Design concept: ${sanitizedConcept || prompt}`,
    "The final image should be a centered logo, mascot, emblem, or illustration",
    "Use bold clean edges, high contrast, and print-friendly shapes",
    "Keep the artwork isolated with a simple transparent-friendly background",
    `It will later be placed on a ${garmentColor || "colored"} ${material || "fabric"} ${printArea || "front"} print area`,
    `Product reference only: ${apparelName || "upper-wear"}`,
    "Do not include the apparel item, a product mockup, a person, a hanger, or a scene",
    "Think of the result as a sticker or iron-on transfer graphic",
  ].join(". ");
};

const buildSaferDesignPrompt = (prompt) =>
  String(prompt || "")
    .replace(/\bstreetwear\b/gi, "bold graphic")
    .replace(/\baggressive\b/gi, "dynamic")
    .replace(/\bscary\b/gi, "dramatic")
    .replace(/\btiger\b/gi, "friendly geometric tiger mascot")
    .replace(/\b(claw|fang|blood|violent|weapon)\w*\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

const getTextToImageStyle = async () => {
  const config = getConfig();
  if (config.textStyleGroupId && config.textStyleId) {
    return {
      styleGroupId: Number(config.textStyleGroupId),
      styleId: Number(config.textStyleId),
    };
  }

  const groupsResponse = await perfectFetch(`${config.v1BaseUrl}/s2s/v1.0/task/style-group/text-to-image`, {
    method: "GET",
    headers: await authHeaders("v1"),
  });
  const groups = groupsResponse?.result?.style_groups || groupsResponse?.result?.groups || groupsResponse?.data?.style_groups || groupsResponse?.data?.groups || [];
  const group = groups.find((item) => /graphic|logo|cartoon|illustration/i.test(item?.name || item?.title || item?.info?.title || "")) || groups[0];
  if (!group?.id) throw new Error("Perfect Corp text-to-image style group is unavailable. Fill PERFECT_TEXT_STYLE_GROUP_ID and PERFECT_TEXT_STYLE_ID if the API Console requires explicit values.");

  const stylesResponse = await perfectFetch(`${config.v1BaseUrl}/s2s/v1.0/task/style/text-to-image?style_group_id=${encodeURIComponent(group.id)}`, {
    method: "GET",
    headers: await authHeaders("v1"),
  });
  const styles = stylesResponse?.result?.styles || stylesResponse?.data?.styles || [];
  const style =
    styles.find((item) => toSafeNumericId(item?.id) !== null && /comic|anime|cartoon|vector|sticker|logo|graphic/i.test(item?.name || item?.title || item?.info?.title || "")) ||
    styles.find((item) => toSafeNumericId(item?.id) !== null) ||
    styles[0];
  const styleGroupId = toSafeNumericId(group.id);
  const styleId = toSafeNumericId(style?.id);
  if (styleGroupId === null || styleId === null) {
    throw new Error("Perfect Corp returned style IDs outside JavaScript's safe integer range. Set PERFECT_TEXT_STYLE_GROUP_ID and PERFECT_TEXT_STYLE_ID to safe numeric IDs from the API Console.");
  }
  return { styleGroupId, styleId };
};

export const generateDesign = async ({ prompt, apparelType, apparelName, garmentColor, material, printArea }) => {
  const config = getConfig();
  if (config.demoMode) {
    const imageUrl = createDemoDesignImage({ prompt, apparelName });
    return { provider: "perfect-corp-demo", imageUrl, resultImage: imageUrl, usedDemoFallback: true };
  }

  const style = await getTextToImageStyle();
  const runTextToImage = async (promptVariant) => {
    const taskId = await createV1Task({
      aiTask: "text-to-image",
      payload: {
        actions: [
          {
            id: 0,
            params: {
              prompt: buildApparelPrompt({ prompt: promptVariant, apparelName, garmentColor, material, printArea }),
              style_group_id: style.styleGroupId,
              style_ids: [style.styleId],
            },
          },
        ],
        output_ext: "jpg",
      },
    });
    const result = await pollV1Task({ aiTask: "text-to-image", taskId });
    return { taskId, result, promptVariant };
  };

  let generation;
  try {
    generation = await runTextToImage(prompt);
  } catch (error) {
    if (!/nsfw|safety|policy/i.test(error?.message || "")) throw error;
    const safePrompt = buildSaferDesignPrompt(prompt);
    if (!safePrompt || safePrompt === prompt) throw error;
    generation = await runTextToImage(safePrompt);
    generation.safetyRetry = true;
    generation.originalPromptRejected = true;
  }

  const { taskId, result } = generation;
  const resultUrl = findResultUrl(result);
  const originalImage = (await fetchResultAsDataUrl(resultUrl)) || resultUrl;
  const backgroundRemoved = await removeBackground({ image: resultUrl || originalImage }).catch((error) => ({ error: error.message }));
  const imageUrl = backgroundRemoved.resultImage || originalImage;
  return {
    provider: "perfect-corp",
    taskId,
    imageUrl,
    resultImage: imageUrl,
    originalImage,
    backgroundRemoval: backgroundRemoved,
    designSpec: {
      apparelType,
      apparelName,
      garmentColor,
      material,
      printArea,
      safetyRetry: Boolean(generation.safetyRetry),
      promptVariant: generation.promptVariant,
    },
    raw: result,
  };
};

export const removeBackground = async ({ image, publicDir }) => {
  const config = getConfig();
  if (config.demoMode) {
    return { provider: "perfect-corp-demo", resultImage: image, imageUrl: image, usedDemoFallback: true };
  }

  const source = await uploadFile({ aiTask: "sod", image, fileNamePrefix: "wearcraft-sod", version: "v1", publicDir });
  const taskId = await createV1Task({
    aiTask: "sod",
    payload: {
      file_sets: {
        src_ids: [source.fileId],
      },
      actions: [{ id: 0 }],
      output_ext: "png",
    },
  });
  const result = await pollV1Task({ aiTask: "sod", taskId });
  const resultUrl = findResultUrl(result);
  const resultImage = (await fetchResultAsDataUrl(resultUrl)) || resultUrl;
  return { provider: "perfect-corp", taskId, resultUrl, resultImage, imageUrl: resultImage, raw: result };
};

export const clothesTryOn = async ({ personImage, garmentImage, apparelName, garmentCategory = "upper_body", publicDir }) => {
  const config = getConfig();
  if (config.demoMode) {
    const imageUrl = createDemoTryOnImage({ personImage, garmentImage, apparelName });
    return { provider: "perfect-corp-demo", imageUrl, resultImage: imageUrl, usedDemoFallback: true };
  }

  const sourcePayload = /^https?:\/\//i.test(String(personImage || ""))
    ? { src_file_url: personImage }
    : { src_file_id: (await uploadFile({ aiTask: "cloth", image: personImage, fileNamePrefix: "wearcraft-person", publicDir })).fileId };
  const referencePayload = /^https?:\/\//i.test(String(garmentImage || ""))
    ? { ref_file_url: garmentImage }
    : { ref_file_id: (await uploadFile({ aiTask: "cloth", image: garmentImage, fileNamePrefix: "wearcraft-garment", publicDir })).fileId };
  const taskId = await createV2Task({
    aiTask: "cloth",
    payload: {
      ...sourcePayload,
      ...referencePayload,
      garment_category: garmentCategory,
      change_shoes: false,
    },
  });
  const result = await pollV2Task({ aiTask: "cloth", taskId });
  const resultUrl = findResultUrl(result);
  const resultImage = (await fetchResultAsDataUrl(resultUrl)) || resultUrl;
  return { provider: "perfect-corp", taskId, resultUrl, resultImage, imageUrl: resultImage, raw: result };
};

const concernLabels = {
  acne: "acne / blemishes",
  pimples: "acne / blemishes",
  moisture: "moisture",
  redness: "redness",
  oiliness: "oiliness",
  pores: "pores",
  dark_circle: "dark circles",
  wrinkles: "wrinkles",
  texture: "texture",
  spots: "spots",
};

const extractConcerns = (value) => {
  const concerns = [];
  const seen = new Set();
  const add = (name, score) => {
    const key = String(name || "").toLowerCase().replace(/\s+/g, "_");
    const label = concernLabels[key] || concernLabels[key.replace(/-/g, "_")];
    if (!label || seen.has(label)) return;
    seen.add(label);
    concerns.push({ key, label, score: Number.isFinite(Number(score)) ? Number(score) : null });
  };
  const scan = (node, inheritedKey = null) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach((item) => scan(item, inheritedKey));
      return;
    }
    const name = node.name || node.type || node.concern || node.concern_type || inheritedKey;
    const score = node.score ?? node.value ?? node.percent ?? node.confidence ?? null;
    if (name) add(name, score);
    Object.entries(node).forEach(([key, nested]) => scan(nested, key));
  };
  scan(value);
  return concerns.slice(0, 6);
};

const buildProductSuggestions = (concerns) => {
  const keys = new Set(concerns.map((item) => item.key));
  const suggestions = [];
  if (keys.has("acne") || keys.has("pimples")) {
    suggestions.push({
      title: "Gentle non-comedogenic skincare",
      reason: "Possible blemish-prone areas were surfaced by the beauty analysis, so a gentle routine is a natural retail suggestion.",
    });
  }
  if (keys.has("oiliness")) {
    suggestions.push({
      title: "Oil-control cleanser or moisturizer",
      reason: "Oil-control prep can reduce shine before try-on selfies.",
    });
  }
  if (keys.has("redness")) {
    suggestions.push({
      title: "Redness-balancing cosmetic primer",
      reason: "A calming cosmetic product can pair with the personalized shopping journey.",
    });
  }
  if (!suggestions.length) {
    suggestions.push({
      title: "Photo-ready skin prep",
      reason: "Use gentle skincare and SPF before capturing try-on photos.",
    });
  }
  return suggestions.slice(0, 3);
};

const buildRuleBasedConsumerInsights = (analysis) => {
  const concerns = analysis?.skinInsights?.concerns || [];
  const firstConcern = concerns[0];
  const colorNames = (analysis?.recommendedColors || [])
    .slice(0, 4)
    .map((item) => item.name)
    .join(", ");

  const skinComment = firstConcern
    ? `We noticed possible ${firstConcern.label}. Consider gentle cosmetic prep before taking product photos.`
    : analysis?.skinInsights?.analysisAvailable
      ? "Your skin looks clear in this photo. Keep it photo-ready with gentle cleanser and SPF."
      : "Skin-specific analysis needs a clearer close-up photo, but color recommendations are still available.";

  return {
    headline: `${analysis?.depth || "medium"} ${analysis?.undertone || "neutral"} style profile`,
    skinComment,
    colorReason: colorNames
      ? `${colorNames} should complement this appearance profile while keeping prints readable.`
      : "High-contrast upperwear colors should keep the design readable.",
    skincareSuggestion: firstConcern
      ? "Try gentle non-comedogenic skincare or a lightweight photo-prep moisturizer."
      : "Try daily SPF and a gentle moisturizer for photo-ready skin.",
    demoSummary: "Use these colors for garment selection, then keep the print high-contrast against the chosen garment.",
  };
};

const parseGeminiJson = (text) => {
  if (!text) return null;
  const cleaned = String(text)
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const enrichConsumerInsights = async ({ analysis, rawErrors = {} }) => {
  const fallback = buildRuleBasedConsumerInsights(analysis);
  const config = getConfig();
  if (!config.geminiApiKey) return fallback;

  try {
    const model = config.geminiModel.replace(/^models\//, "");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": config.geminiApiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: [
                  "Convert this Perfect Corp appearance/skin analysis into concise consumer-facing shopping insights.",
                  "Return only JSON with keys: headline, skinComment, colorReason, skincareSuggestion, demoSummary.",
                  "Do not diagnose medical conditions. Use phrases like possible, visible, may benefit, cosmetic suggestion.",
                  "Keep it short and useful for an apparel and beauty-commerce demo.",
                  JSON.stringify({
                    undertone: analysis?.undertone,
                    depth: analysis?.depth,
                    recommendedColors: analysis?.recommendedColors,
                    designTips: analysis?.designTips,
                    skinInsights: analysis?.skinInsights,
                    rawErrors,
                  }),
                ].join("\n"),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          response_mime_type: "application/json",
        },
      }),
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.warn("Gemini insight enrichment failed:", json?.error?.message || response.status);
      return fallback;
    }

    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = parseGeminiJson(text);
    return {
      ...fallback,
      ...(parsed && typeof parsed === "object" ? parsed : {}),
    };
  } catch (error) {
    console.warn("Gemini insight enrichment unavailable:", error?.message);
    return fallback;
  }
};

const runV2AnalysisTask = async ({ aiTask, personImage, fileNamePrefix, payload = {}, publicDir, pollVersion = "v2.0" }) => {
  // Skin analysis needs full resolution — only compress if truly huge (>4MB)
  // Face analysis works fine with moderate compression
  const maxSizeKb = aiTask === "skin-analysis" ? 4000 : 800;
  const sourcePayload = /^https?:\/\//i.test(String(personImage || ""))
    ? { src_file_url: personImage }
    : { src_file_id: (await uploadFile({ aiTask, image: personImage, fileNamePrefix, publicDir, maxSizeKb })).fileId };
  const taskId = await createV2Task({
    aiTask,
    payload: {
      ...sourcePayload,
      ...payload,
    },
  });
  const result = await pollV2Task({ aiTask, taskId, version: pollVersion });
  return { taskId, result };
};

export const analyzeAppearance = async ({ personImage, publicDir }) => {
  const config = getConfig();
  if (config.demoMode) {
    const demoAnalysis = {
      ...buildColorRecommendations(null),
      skinInsights: {
        concerns: [],
        analysisAvailable: false,
        productRecommendations: buildProductSuggestions([]),
        note: "Demo mode is enabled. Live Skin Analysis runs when PERFECT_DEMO_MODE=false and credentials are valid.",
      },
    };
    return {
      provider: "perfect-corp-demo",
      usedDemoFallback: true,
      analysis: {
        ...demoAnalysis,
        consumerInsights: buildRuleBasedConsumerInsights(demoAnalysis),
      },
    };
  }

  let faceValue = null;
  let skinValue = null;
  let faceError = null;
  let skinError = null;

  // Run face analysis and skin analysis in parallel with individual timeouts
  const withTimeout = (promise, ms, label) =>
    Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)),
    ]);

  const [faceResult, skinResult] = await Promise.allSettled([
    withTimeout(
      runV2AnalysisTask({
        aiTask: "face-attr-analysis",
        personImage,
        fileNamePrefix: "wearcraft-face",
        payload: {
          face_angle_strictness_level: "low",
          features: ["faceShape", "age", "gender", "eyeColor", "hairColor", "lipColor"],
        },
        publicDir,
      }),
      60000,
      "face-attr-analysis"
    ),
    withTimeout(
      runV2AnalysisTask({
        aiTask: "skin-analysis",
        personImage,
        fileNamePrefix: "wearcraft-skin",
        payload: {
          // Use SD actions (min 480px short side) instead of HD (min 1080px short side)
          // HD requires 1080px minimum on short side which many user photos won't meet
          dst_actions: ["wrinkle", "pore", "texture", "acne"],
          miniserver_args: { enable_mask_overlay: false },
        },
        pollVersion: "v2.0",
        publicDir,
      }),
      90000,
      "skin-analysis"
    ),
  ]);

  if (faceResult.status === "fulfilled") {
    faceValue = faceResult.value;
  } else {
    faceError = faceResult.reason;
    console.warn("face-attr-analysis failed:", faceResult.reason?.message);
  }

  if (skinResult.status === "fulfilled") {
    skinValue = skinResult.value;
  } else {
    skinError = skinResult.reason;
    console.warn("skin-analysis failed:", skinResult.reason?.message);
  }

  const faceData = faceValue?.result || null;
  const skinData = skinValue?.result || null;
  
  // If both failed, return graceful color recommendations instead of throwing
  // This handles cases like poor image quality, face angle, or face too small
  if (!faceData && !skinData) {
    const faceMsg = faceError?.message || "";
    const skinMsg = skinError?.message || "";
    const isImageQualityIssue = /face_angle|face_too_small|no_face|below_min|resolution|quality/i.test(faceMsg + skinMsg);
    
    console.warn("analyzeAppearance: both analyses failed —", faceMsg, "|", skinMsg);
    
    const fallbackAnalysis = {
      ...buildColorRecommendations(null),
      faceAttributes: { hairColorHex: null, eyeColorHex: null },
      skinInsights: {
        concerns: [],
        analysisAvailable: false,
        productRecommendations: buildProductSuggestions([]),
        note: isImageQualityIssue
          ? "For best results, use a clear front-facing photo with good lighting. Color recommendations shown are general suggestions."
          : `Analysis unavailable: ${faceMsg || skinMsg}. Color recommendations shown are general suggestions.`,
      },
    };

    return {
      provider: "perfect-corp",
      usedFallback: true,
      analysis: {
        ...fallbackAnalysis,
        consumerInsights: await enrichConsumerInsights({
          analysis: fallbackAnalysis,
          rawErrors: { faceAttr: faceMsg || null, skinAnalysis: skinMsg || null },
        }),
      },
      raw: {
        faceAttr: null,
        skinAnalysis: null,
        errors: { faceAttr: faceMsg || null, skinAnalysis: skinMsg || null },
      },
    };
  }

  // v2 face-attr-analysis returns: result.results.color.{ eye_color, hair_color, lip_color }
  // Use findValueByKey for robustness across response structure variations
  const colorData = faceData?.results?.color || {};
  const hairColorHex = colorData.hair_color || findFirstHex(findValueByKey(faceData, /^hair_color$/i));
  const eyeColorHex = colorData.eye_color || findFirstHex(findValueByKey(faceData, /^eye_color$/i));
  const lipColorHex = colorData.lip_color || findFirstHex(findValueByKey(faceData, /^lip_color$/i));

  // Use lip color as skin tone proxy (closest to actual skin), fallback to generic search
  // Avoid using eye_color as skin tone (too dark, misleading)
  const skinToneHex = lipColorHex || findFirstHex(findValueByKey(faceData, /skin_?color/i)) || null;
  const concerns = extractConcerns(skinData);

  const analysis = {
    ...buildColorRecommendations(skinToneHex),
    faceAttributes: {
      hairColorHex: hairColorHex || null,
      eyeColorHex: eyeColorHex || null,
    },
    skinInsights: {
      concerns,
      analysisAvailable: Boolean(skinData),
      productRecommendations: buildProductSuggestions(concerns),
      note: skinData
        ? "Beauty-commerce suggestions only; not medical advice."
        : `Skin-specific analysis was unavailable${skinError?.message ? `: ${skinError.message}` : ""}. Color recommendations are based on available face/appearance signals.`,
    },
  };

  analysis.consumerInsights = await enrichConsumerInsights({
    analysis,
    rawErrors: {
      faceAttr: faceError?.message || null,
      skinAnalysis: skinError?.message || null,
    },
  });

  return {
    provider: "perfect-corp",
    taskIds: {
      faceAttr: faceValue?.taskId || null,
      skinAnalysis: skinValue?.taskId || null,
    },
    analysis,
    raw: {
      faceAttr: faceData,
      skinAnalysis: skinData,
      errors: {
        faceAttr: faceError?.message || null,
        skinAnalysis: skinError?.message || null,
      },
    },
  };
};
