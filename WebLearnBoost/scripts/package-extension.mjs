import { createWriteStream } from "node:fs";
import { mkdir, readFile, readdir, rm, stat } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(rootDir, "dist");
const releaseDir = resolve(rootDir, "release");
const packageJson = JSON.parse(await readFile(resolve(rootDir, "package.json"), "utf8"));
const packageName = `WebLearnBoost-v${packageJson.version}.zip`;
const packagePath = resolve(releaseDir, packageName);
const crcTable = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

await mkdir(releaseDir, { recursive: true });
await rm(packagePath, { force: true });

const files = await collectFiles(distDir);
await createZip(files, packagePath);

console.log(`Packaged ${files.length} files: ${relative(rootDir, packagePath)}`);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(absolutePath));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files.sort((a, b) => relative(distDir, a).localeCompare(relative(distDir, b)));
}

async function createZip(files, outputPath) {
  const output = createWriteStream(outputPath);
  const centralDirectory = [];
  let offset = 0;

  for (const filePath of files) {
    const name = relative(distDir, filePath).split(sep).join("/");
    const fileStat = await stat(filePath);
    const data = await readFile(filePath);
    const compressed = deflateRawSync(data, { level: 9 });
    const crc = crc32(data);
    const dosTime = toDosDateTime(fileStat.mtime);
    const nameBuffer = Buffer.from(name);
    const localHeader = Buffer.alloc(30 + nameBuffer.length);

    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(dosTime.time, 10);
    localHeader.writeUInt16LE(dosTime.date, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    nameBuffer.copy(localHeader, 30);

    output.write(localHeader);
    output.write(compressed);

    centralDirectory.push({ nameBuffer, crc, compressedSize: compressed.length, size: data.length, offset, dosTime });
    offset += localHeader.length + compressed.length;
  }

  const centralStart = offset;

  for (const entry of centralDirectory) {
    const header = Buffer.alloc(46 + entry.nameBuffer.length);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0x0800, 8);
    header.writeUInt16LE(8, 10);
    header.writeUInt16LE(entry.dosTime.time, 12);
    header.writeUInt16LE(entry.dosTime.date, 14);
    header.writeUInt32LE(entry.crc, 16);
    header.writeUInt32LE(entry.compressedSize, 20);
    header.writeUInt32LE(entry.size, 24);
    header.writeUInt16LE(entry.nameBuffer.length, 28);
    header.writeUInt32LE(entry.offset, 42);
    entry.nameBuffer.copy(header, 46);
    output.write(header);
    offset += header.length;
  }

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(centralDirectory.length, 8);
  end.writeUInt16LE(centralDirectory.length, 10);
  end.writeUInt32LE(offset - centralStart, 12);
  end.writeUInt32LE(centralStart, 16);
  output.write(end);

  await new Promise((resolveEnd, rejectEnd) => {
    output.end(resolveEnd);
    output.on("error", rejectEnd);
  });
}

function toDosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  return {
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)
  };
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  }

  return (crc ^ 0xffffffff) >>> 0;
}
