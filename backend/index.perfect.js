import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  analyzeAppearance,
  buildColorRecommendations,
  clothesTryOn,
  generateDesign,
  getPerfectStatus,
  removeBackground,
} from "./services/perfectCorp.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5000;
const publicDir = path.join(__dirname, "..", "public");

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
    "https://crishirts.vercel.app",
    "https://crishirt.vercel.app",
    /\.vercel\.app$/,
    /crishirt.*\.vercel\.app$/,
  ],
  credentials: true,
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const designsDir = path.join(__dirname, "designs");
if (!fs.existsSync(designsDir)) {
  fs.mkdirSync(designsDir, { recursive: true });
}
app.use("/designs", express.static(designsDir));

const sendError = (res, error, fallbackMessage = "Perfect Corp request failed") => {
  const message = error instanceof Error ? error.message : fallbackMessage;
  res.status(500).json({
    success: false,
    error: { message },
  });
};

console.log("WearCraft Perfect Corp backend starting...");
const perfectStatus = getPerfectStatus();
console.log("Perfect Corp v2 key:", perfectStatus.v2Ready ? "configured" : "missing");
console.log("Perfect Corp v1 image credentials:", perfectStatus.v1Ready ? "configured or API-key fallback available" : "missing");
console.log("Demo fallback mode:", perfectStatus.demoMode ? "enabled" : "disabled");

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "WearCraft Perfect Corp Backend",
    status: "healthy",
    perfect: getPerfectStatus(),
    endpoints: {
      generate: "/api/generate",
      refine: "/api/refine",
      processUpload: "/api/process-upload",
      clothesTryOn: "/api/perfect/clothes-tryon",
      analyzeAppearance: "/api/perfect/analyze-appearance",
    },
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/generate", async (req, res) => {
  try {
    const { prompt, apparelType, apparelName, garmentColor, material, printArea } = req.body;
    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({ success: false, error: { message: "Prompt is required" } });
    }
    const result = await generateDesign({
      prompt: String(prompt).trim(),
      apparelType,
      apparelName,
      garmentColor,
      material,
      printArea,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    sendError(res, error, "Failed to generate design with Perfect Corp");
  }
});

app.post("/api/perfect/text-to-image", async (req, res) => {
  try {
    if (!req.body?.prompt || !String(req.body.prompt).trim()) {
      return res.status(400).json({ success: false, error: { message: "prompt is required" } });
    }
    const result = await generateDesign(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    sendError(res, error, "Failed to generate design with Perfect Corp");
  }
});

app.post("/api/generate-vector", async (req, res) => {
  try {
    if (!req.body?.prompt || !String(req.body.prompt).trim()) {
      return res.status(400).json({ success: false, error: { message: "prompt is required" } });
    }
    const result = await generateDesign({
      ...req.body,
      prompt: `${req.body.prompt || ""}. Clean vector-style logo, thick shapes, screenprint friendly.`,
    });
    res.json({ success: true, ...result, vectorLike: true });
  } catch (error) {
    sendError(res, error, "Failed to generate vector-style design");
  }
});

app.post("/api/generate-from-sketch", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({ success: false, error: { message: "prompt is required" } });
    }
    const result = await generateDesign({
      prompt: `Turn this sketch idea into a polished print-ready apparel graphic: ${prompt || ""}`,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    sendError(res, error, "Failed to generate design from sketch");
  }
});

app.post("/api/refine", async (req, res) => {
  try {
    const { instruction, imageUrl } = req.body;
    if (!instruction || !imageUrl) {
      return res.status(400).json({ success: false, error: { message: "instruction and imageUrl are required" } });
    }
    const result = await generateDesign({
      prompt: `Print-ready apparel graphic update: ${instruction}`,
      apparelType: req.body.apparelType,
      apparelName: req.body.apparelName,
      garmentColor: req.body.garmentColor,
      material: req.body.material,
      printArea: req.body.printArea,
    });
    res.json({
      success: true,
      ...result,
      refinedImageUrl: result.imageUrl,
      refinementNote: "Perfect Corp text-to-image is used as a safe design-regeneration refinement path. True image-to-image refinement depends on API Console access.",
    });
  } catch (error) {
    sendError(res, error, "Failed to refine design with Perfect Corp");
  }
});

app.post("/api/process-upload", async (req, res) => {
  try {
    const { imageData } = req.body;
    if (!imageData) {
      return res.status(400).json({ success: false, error: { message: "imageData is required" } });
    }
    const result = await removeBackground({ image: imageData, publicDir });
    res.json({
      success: true,
      imageUrl: result.resultImage || result.imageUrl,
      processingSteps: ["Perfect Corp background removal"],
      transparentBackground: true,
      ...result,
    });
  } catch (error) {
    sendError(res, error, "Failed to process uploaded design with Perfect Corp");
  }
});

app.post("/api/perfect/remove-background", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: { message: "image is required" } });
    }
    const result = await removeBackground({ image, publicDir });
    res.json({ success: true, ...result });
  } catch (error) {
    sendError(res, error, "Failed to remove background");
  }
});

app.post("/api/perfect/clothes-tryon", async (req, res) => {
  try {
    const {
      personImage,
      userPhoto,
      garmentImage,
      designUrl,
      apparelName = "Custom apparel",
      garmentCategory = "upper_body",
    } = req.body;
    if (!(personImage || userPhoto)) {
      return res.status(400).json({ success: false, error: { message: "personImage is required" } });
    }
    if (!(garmentImage || designUrl)) {
      return res.status(400).json({ success: false, error: { message: "garmentImage is required" } });
    }
    const result = await clothesTryOn({
      personImage: personImage || userPhoto,
      garmentImage: garmentImage || designUrl,
      apparelName,
      garmentCategory,
      publicDir,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    sendError(res, error, "Failed to run Perfect Corp clothes try-on");
  }
});

app.post("/api/virtual-tryon", async (req, res) => {
  try {
    const { userPhoto, designUrl, designPrompt } = req.body;
    if (!userPhoto) {
      return res.status(400).json({ success: false, error: { message: "userPhoto is required" } });
    }
    if (!designUrl) {
      return res.status(400).json({ success: false, error: { message: "designUrl is required" } });
    }
    const result = await clothesTryOn({
      personImage: userPhoto,
      garmentImage: designUrl,
      apparelName: designPrompt || "Custom apparel",
      garmentCategory: "upper_body",
      publicDir,
    });
    res.json({ success: true, imageUrl: result.resultImage || result.imageUrl, ...result });
  } catch (error) {
    sendError(res, error, "Failed to run Perfect Corp virtual try-on");
  }
});

app.post("/api/perfect/analyze-appearance", async (req, res) => {
  try {
    const { personImage, userPhoto } = req.body;
    if (!(personImage || userPhoto)) {
      return res.status(400).json({ success: false, error: { message: "personImage is required" } });
    }
    const result = await analyzeAppearance({ personImage: personImage || userPhoto, publicDir });
    res.json({ success: true, ...result });
  } catch (error) {
    sendError(res, error, "Failed to analyze appearance with Perfect Corp");
  }
});

app.post("/api/perfect/color-recommendations", (req, res) => {
  const { skinToneHex } = req.body;
  res.json({
    success: true,
    analysis: buildColorRecommendations(skinToneHex),
  });
});

app.post("/api/cart/add", async (req, res) => {
  res.json({
    success: true,
    message: "Cart item accepted locally",
    cartItem: req.body,
  });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err?.message || err);
  if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ success: false, error: { message: "Invalid JSON request body" } });
  }
  res.status(500).json({ success: false, error: { message: "Internal server error" } });
});

app.listen(PORT, () => {
  console.log(`WearCraft Perfect Corp backend running on port ${PORT}`);
  console.log("Ready: generation, upload processing, clothes try-on, appearance analysis, and recommendations.");
});
