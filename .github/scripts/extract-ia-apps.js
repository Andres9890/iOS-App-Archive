const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const IA_ACCOUNT = process.env.IA_ACCOUNT;

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

async function main() {
  const items = await getAllItems(IA_ACCOUNT);
  const apps = [];
  for (const id of items) {
    const meta = await getItemMetadata(id);
    if (!meta || !meta.metadata) continue;

    const description = meta.metadata.description || "";
    const creator = meta.metadata.creator || "Unknown";
    const downloadUrl = `https://archive.org/download/${id}/`;

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
      title: meta.metadata.title || id,
      developer: creator,
      description: description,
      versions: { archived: [], unarchived: [] },
      compatibility: meta.metadata.os || "Unknown",
      icon: iconPath,
      screenshot: screenshotPath,
      downloadUrl
    });
  }

  // Write or update script.js
  const scriptPath = 'iOS-App-Archive/script.js';
  let scriptContent;
  if (fs.existsSync(scriptPath)) {
    scriptContent = fs.readFileSync(scriptPath, 'utf8');
    scriptContent = scriptContent.replace(
      /const apps = \[[\s\S]*?\];/,
      `const apps = ${JSON.stringify(apps, null, 4)};`
    );
  } else {
    scriptContent = `// All your apps with complete information
const apps = ${JSON.stringify(apps, null, 4)};
`;
  }
  fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
  fs.writeFileSync(scriptPath, scriptContent);
  console.log('Updated script.js with new app metadata.');
}

main();
