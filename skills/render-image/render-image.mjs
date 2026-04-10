import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "node:process";

// Load .env manually (no dotenv dependency)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const envPath = path.join(root, ".env");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] = val;
  }
}

const VALID_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"];
const VALID_SIZES = ["1K", "2K"];

function parseArgs(args) {
  const result = { prompt: "", ratio: null, size: null };
  const parts = [];
  let i = 0;

  while (i < args.length) {
    if (args[i] === "--ratio" && i + 1 < args.length) {
      result.ratio = args[i + 1];
      i += 2;
    } else if (args[i] === "--size" && i + 1 < args.length) {
      result.size = args[i + 1];
      i += 2;
    } else {
      parts.push(args[i]);
      i++;
    }
  }

  result.prompt = parts.join(" ");
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const { prompt, ratio, size } = parseArgs(args);

  if (!prompt) {
    console.error("Error: prompt is required");
    console.error('Usage: node render-image.mjs "<prompt>" --ratio 1:1 --size 1K');
    process.exit(1);
  }

  if (!ratio) {
    console.error("Error: --ratio is required (1:1, 3:4, 4:3, 9:16, 16:9)");
    process.exit(1);
  }

  if (!VALID_RATIOS.includes(ratio)) {
    console.error(`Error: invalid ratio "${ratio}". Must be one of: ${VALID_RATIOS.join(", ")}`);
    process.exit(1);
  }

  if (!size) {
    console.error("Error: --size is required (1K, 2K)");
    process.exit(1);
  }

  if (!VALID_SIZES.includes(size)) {
    console.error(`Error: invalid size "${size}". Must be one of: ${VALID_SIZES.join(", ")}`);
    process.exit(1);
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error("Error: GOOGLE_AI_API_KEY not found in .env");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  console.log(`Generating image: "${prompt}" (${ratio}, ${size})...`);

  const response = await ai.models.generateImages({
    model: "imagen-4.0-generate-001",
    prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: ratio,
      imageSize: size,
    },
  });

  if (!response.generatedImages || response.generatedImages.length === 0) {
    console.error("Error: no image was generated. The prompt may have been blocked by safety filters.");
    process.exit(1);
  }

  const imgBytes = response.generatedImages[0].image.imageBytes;
  const buffer = Buffer.from(imgBytes, "base64");

  const outputDir = path.join(root, "output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = Date.now();
  const filename = `image-${timestamp}.png`;
  const outputPath = path.join(outputDir, filename);

  fs.writeFileSync(outputPath, buffer);
  console.log(outputPath);
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
