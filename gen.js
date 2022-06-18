const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");

const makeImageFileForEmoji = async () => {
  const apple64 = `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@14.0.0/img/apple/64/1f469-200d-1f3ed.png`;

  const img = await loadImage(apple64);
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const xOffset = -30;
  const yOffset = -70;
  Array.from({ length: 12 }, (x, xi) => {
    Array.from({ length: 12 }, (x, yi) => {
      ctx.drawImage(img, xi * 120 + xOffset, yi * 120 + (yOffset * xi) / 2);
    });
  });

  return canvas.toBuffer("image/jpeg", { quality: 1 });
};

const gen = async () => {
  const buffer = await makeImageFileForEmoji();
  fs.writeFileSync("share.jpg", buffer);
};

gen()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
