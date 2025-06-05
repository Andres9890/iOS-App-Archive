const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const IA_ACCOUNT = process.env.IA_ACCOUNT;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function getAllItems(account) {
  const url = `https://archive.org/advancedsearch.php?q=collection%3A${account}&fl[]=identifier&rows=1000&output=json`;
  const res = await fetch(url);
  const data = await res.json();
  return data.response.docs.map(doc => doc.identifier);
}

async function getItemMetadata(identifier) {
  const url = `https://archive.org/metadata/${identifier}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.json();
}

async function downloadImage(url, dest) {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const buffer = await res.buffer();
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buffer);
    return true;
  } catch {
    return false;
  }
}

async function geminiExtractMetadata({ description, creator, downloadUrl }) {
  const prompt = `
Given the following app information, extract and return a JSON object with the following fields:
- title: (string)
- developer: (string)
- description: (string, cleaned up)
- compatibility: (string, e.g. "iOS 6.0 and Later" or similar, if available)
- versions: { archived: [string], unarchived: [string] }
If any field is missing, do your best to infer or leave as an empty string/array.

App Description: """${description}"""
Creator: """${creator}"""
Download URL: """${downloadUrl}"""
`;

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const result = await model.generateContent(prompt);
  const text = result.response.candidates[0].content.parts[0].text;
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return null;
  }
}

async function main() {
  const items = await getAllItems(IA_ACCOUNT);
  const apps = [];
  for (const id of items) {
    const meta = await getItemMetadata(id);
    if (!meta || !meta.metadata) continue;

    const description = meta.metadata.description || "";
    const creator = meta.metadata.creator || "";
    const downloadUrl = `https://archive.org/download/${id}/`;

    // Use Gemini to extract/clean metadata
    const aiMeta = await geminiExtractMetadata({ description, creator, downloadUrl });
    if (!aiMeta) continue;

    // Download icon and screenshot if available
    let iconPath = `app-icon/${id}/icon.png`;
    let screenshotPath = `app-icon/${id}/screenshot.png`;
    let iconDownloaded = false, screenshotDownloaded = false;

    // Try to find image files in the IA item files list
    if (meta.files) {
      const iconFile = meta.files.find(f => f.name.match(/\.(png|jpg|jpeg)$/i) && f.name.toLowerCase().includes('icon'));
      const screenshotFile = meta.files.find(f => f.name.match(/\.(png|jpg|jpeg)$/i) && f.name.toLowerCase().includes('screen'));
      if (iconFile) {
        iconDownloaded = await downloadImage(`https://archive.org/download/${id}/${iconFile.name}`, `iOS-App-Archive/${iconPath}`);
      }
      if (screenshotFile) {
        screenshotDownloaded = await downloadImage(`https://archive.org/download/${id}/${screenshotFile.name}`, `iOS-App-Archive/${screenshotPath}`);
      }
    }

    if (!iconDownloaded) iconPath = "https://via.placeholder.com/100/007aff/ffffff?text=App";
    if (!screenshotDownloaded) screenshotPath = "UNDERCONSTRUCTION.jpg";

    // Compose app object
    apps.push({
      id,
      title: aiMeta.title || id,
      developer: aiMeta.developer || creator || "Unknown",
      description: aiMeta.description || description,
      versions: aiMeta.versions || { archived: [], unarchived: [] },
      compatibility: aiMeta.compatibility || "Unknown",
      icon: iconPath,
      screenshot: screenshotPath,
      downloadUrl
    });
  }

  // Read the old script.js, replace the apps array
  const scriptPath = '../script.js';
  let scriptContent = fs.readFileSync(scriptPath, 'utf8');
  scriptContent = scriptContent.replace(
    /const apps = \[[\s\S]*?\];/,
    `const apps = ${JSON.stringify(apps, null, 4)};`
  );
  fs.writeFileSync(scriptPath, scriptContent);
  console.log('Updated script.js with new app metadata.');
}

main();
