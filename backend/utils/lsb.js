import sharp from "sharp";
import crypto from "crypto";

const genPositions = (seed, total, redundancy) => {
  const rng = crypto.createHash("sha256").update(seed).digest();
  const positions = [];
  let i = 0;
  while (positions.length < redundancy) {
    const index = rng[i % rng.length] % total;
    if (!positions.includes(index)) positions.push(index);
    i++;
  }
  return positions;
};

export async function embedMessage(
  inputPath,
  outputPath,
  message,
  secret,
  redundancy = 5
) {
  const buffer = await sharp(inputPath)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = buffer;
  const totalPixels = info.width * info.height * 4; // RGBA channels

  const binaryMsg = [...message]
    .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"))
    .join("");

  const positions = genPositions(
    secret,
    totalPixels,
    binaryMsg.length * redundancy
  );

  const dataCopy = Buffer.from(data);
  for (let i = 0; i < binaryMsg.length; i++) {
    for (let r = 0; r < redundancy; r++) {
      const idx = positions[i * redundancy + r];
      dataCopy[idx] = (dataCopy[idx] & 0xfe) | Number(binaryMsg[i]);
    }
  }

  await sharp(dataCopy, { raw: info }).toFile(outputPath);
}

export async function extractMessage(
  inputPath,
  msgLength,
  secret,
  redundancy = 5
) {
  const buffer = await sharp(inputPath)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = buffer;
  const totalPixels = info.width * info.height * 4;

  const positions = genPositions(secret, totalPixels, msgLength * redundancy);
  const bits = [];

  for (let i = 0; i < msgLength; i++) {
    let ones = 0;
    for (let r = 0; r < redundancy; r++) {
      const idx = positions[i * redundancy + r];
      ones += data[idx] & 1;
    }
    bits.push(ones > redundancy / 2 ? 1 : 0);
  }

  const bytes = bits.join("").match(/.{8}/g) || [];
  return String.fromCharCode(...bytes.map((b) => parseInt(b, 2)));
}
