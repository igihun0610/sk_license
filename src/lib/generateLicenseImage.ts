/**
 * Generate license card image using Canvas API
 * This works reliably on both desktop and mobile
 */

interface LicenseData {
  name: string;
  company: string;
  commitment: string;
  photoUrl: string;
}

export async function generateLicenseImage(data: LicenseData): Promise<string> {
  const { name, company, commitment, photoUrl } = data;

  // Create canvas
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  // Set dimensions (2x for retina)
  const scale = 2;
  const width = 360 * scale;
  const height = 560 * scale;
  canvas.width = width;
  canvas.height = height;
  ctx.scale(scale, scale);

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 560);
  gradient.addColorStop(0, "#0d1b2a");
  gradient.addColorStop(0.5, "#1b1464");
  gradient.addColorStop(1, "#2d1b69");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 360, 560);

  // Draw decorative elements (stars, etc.)
  ctx.font = "24px Arial";
  ctx.fillText("✨", 24, 40);
  ctx.fillText("🌟", 310, 45);
  ctx.font = "16px Arial";
  ctx.fillText("⭐", 90, 70);
  ctx.fillText("🚀", 310, 180);
  ctx.font = "20px Arial";
  ctx.fillText("🪐", 30, 430);
  ctx.fillText("🌙", 310, 460);
  ctx.font = "14px Arial";
  ctx.fillText("★", 20, 300);

  // Load and draw photo
  try {
    const photo = await loadImage(photoUrl);

    // Draw circular photo
    ctx.save();
    ctx.beginPath();
    ctx.arc(180, 130, 75, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Draw image centered in circle
    const size = 150;
    ctx.drawImage(photo, 180 - size/2, 130 - size/2, size, size);
    ctx.restore();

    // Draw photo border
    ctx.strokeStyle = "rgba(250, 204, 21, 0.7)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(180, 130, 77, 0, Math.PI * 2);
    ctx.stroke();

    // Glow effect
    ctx.shadowColor = "rgba(255, 215, 0, 0.4)";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(180, 130, 77, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  } catch (e) {
    console.error("Failed to load photo:", e);
  }

  // SK AEROSPACE text
  ctx.fillStyle = "rgba(250, 204, 21, 0.8)";
  ctx.font = "bold 11px Arial";
  ctx.textAlign = "center";
  ctx.letterSpacing = "3px";
  ctx.fillText("— SK AEROSPACE —", 180, 240);

  // PILOT LICENSE text
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 24px Arial";
  ctx.fillText("PILOT LICENSE", 180, 275);

  // Name
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px Arial";
  ctx.fillText(name, 180, 320);

  // Company
  ctx.fillStyle = "#d1d5db";
  ctx.font = "14px Arial";
  ctx.fillText(company, 180, 350);

  // Class
  ctx.fillStyle = "rgba(250, 204, 21, 0.8)";
  ctx.font = "11px Arial";
  ctx.fillText("CLASS: 신입 우주비행사", 180, 370);

  // Commitment box
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  roundRect(ctx, 60, 395, 240, 60, 12);
  ctx.fill();
  ctx.stroke();

  // Commitment text
  ctx.fillStyle = "#e5e7eb";
  ctx.font = "italic 13px Arial";
  const commitmentText = `"${commitment}"`;
  wrapText(ctx, commitmentText, 180, 430, 220, 18);

  // Footer - SK NEW CREW
  ctx.fillStyle = "rgba(250, 204, 21, 0.2)";
  ctx.beginPath();
  ctx.arc(45, 520, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "12px Arial";
  ctx.fillText("🧑‍🚀", 45, 524);

  ctx.fillStyle = "#9ca3af";
  ctx.font = "11px Arial";
  ctx.textAlign = "left";
  ctx.fillText("SK NEW CREW", 70, 524);

  // Footer - ISSUED date
  ctx.textAlign = "right";
  ctx.fillStyle = "#6b7280";
  ctx.font = "9px Arial";
  ctx.fillText("ISSUED", 330, 510);

  ctx.fillStyle = "#d1d5db";
  ctx.font = "14px Arial";
  const today = new Date();
  const issueDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}`;
  ctx.fillText(issueDate, 330, 528);

  // Return as data URL
  return canvas.toDataURL("image/png", 1.0);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  ctx.textAlign = "center";
  const words = text.split("");
  let line = "";
  let testLine = "";
  let lineCount = 0;

  for (let i = 0; i < words.length; i++) {
    testLine = line + words[i];
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && line !== "") {
      ctx.fillText(line, x, y + lineCount * lineHeight);
      line = words[i];
      lineCount++;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y + lineCount * lineHeight);
}
