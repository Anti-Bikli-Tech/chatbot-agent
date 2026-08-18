require("dotenv").config();

const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const prisma = require("../config/prisma");
const { chunkText } = require("../services/chunking.service");
const { embedText } = require("../services/gemini.service");
const { saveChunk } = require("../services/vectorStore.service");

const KB_DIR = path.join(__dirname, "../../data/knowledge-base");

async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".txt" || ext === ".md") {
    return fs.readFileSync(filePath, "utf-8");
  }

  if (ext === ".pdf") {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === ".docx") {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  console.warn(`Skipping unsupported file type: ${filePath}`);
  return null;
}

async function ingestFile(filePath) {
  const filename = path.basename(filePath);
  console.log(`\nProcessing: ${filename}`);

  const text = await extractText(filePath);
  if (!text) return;

  const document = await prisma.document.create({
    data: { filename, source: filePath },
  });

  const chunks = chunkText(text);
  console.log(`  Split into ${chunks.length} chunks`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await embedText(chunk);

    await saveChunk({
      documentId: document.id,
      content: chunk,
      embedding,
    });

    process.stdout.write(`  Embedded chunk ${i + 1}/${chunks.length}\r`);
  }

  console.log(`\n  Done: ${filename}`);
}

async function run() {
  if (!fs.existsSync(KB_DIR)) {
    console.error(`Knowledge base folder not found: ${KB_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(KB_DIR).filter((f) => !f.startsWith("."));

  if (files.length === 0) {
    console.log("No files found in knowledge-base folder. Add some docs first.");
    process.exit(0);
  }

  console.log(`Found ${files.length} file(s) to ingest`);

  for (const file of files) {
    const filePath = path.join(KB_DIR, file);
    try {
      await ingestFile(filePath);
    } catch (err) {
      console.error(`Failed to ingest ${file}:`, err.message);
    }
  }

  console.log("\nIngestion complete.");
  await prisma.$disconnect();
  process.exit(0);
}

run();