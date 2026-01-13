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

  // Calculate dynamic height based on commitment text length
  const baseHeight = 640;
  const commitmentLength = commitment.length;
  // Add extra height for longer commitments (roughly 20px per extra line)
  const extraHeight = commitmentLength > 20 ? Math.ceil((commitmentLength - 20) / 15) * 20 : 0;
  const dynamicHeight = Math.max(baseHeight, baseHeight + extraHeight);

  // Set dimensions (2x for retina)
  const scale = 2;
  const width = 360 * scale;
  const height = dynamicHeight * scale;
  canvas.width = width;
  canvas.height = height;
  ctx.scale(scale, scale);

  // Background gradient - deep space
  const gradient = ctx.createLinearGradient(0, 0, 0, dynamicHeight);
  gradient.addColorStop(0, "#0a0a1a");
  gradient.addColorStop(0.3, "#0d1b2a");
  gradient.addColorStop(0.6, "#1a1a3e");
  gradient.addColorStop(1, "#2d1b4e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 360, dynamicHeight);

  // Nebula glow effects
  // Purple nebula - top right
  const nebula1 = ctx.createRadialGradient(380, -50, 0, 380, -50, 200);
  nebula1.addColorStop(0, "rgba(147, 51, 234, 0.3)");
  nebula1.addColorStop(0.7, "rgba(147, 51, 234, 0.1)");
  nebula1.addColorStop(1, "rgba(147, 51, 234, 0)");
  ctx.fillStyle = nebula1;
  ctx.fillRect(0, 0, 360, 300);

  // Blue nebula - left side
  const nebula2 = ctx.createRadialGradient(-30, 200, 0, -30, 200, 180);
  nebula2.addColorStop(0, "rgba(59, 130, 246, 0.25)");
  nebula2.addColorStop(0.7, "rgba(59, 130, 246, 0.08)");
  nebula2.addColorStop(1, "rgba(59, 130, 246, 0)");
  ctx.fillStyle = nebula2;
  ctx.fillRect(0, 50, 200, 350);

  // Pink nebula - bottom right
  const nebula3 = ctx.createRadialGradient(380, dynamicHeight - 140, 0, 380, dynamicHeight - 140, 150);
  nebula3.addColorStop(0, "rgba(236, 72, 153, 0.2)");
  nebula3.addColorStop(0.7, "rgba(236, 72, 153, 0.05)");
  nebula3.addColorStop(1, "rgba(236, 72, 153, 0)");
  ctx.fillStyle = nebula3;
  ctx.fillRect(150, dynamicHeight - 290, 210, 290);

  // Cyan nebula - bottom left
  const nebula4 = ctx.createRadialGradient(50, dynamicHeight - 190, 0, 50, dynamicHeight - 190, 120);
  nebula4.addColorStop(0, "rgba(34, 211, 238, 0.15)");
  nebula4.addColorStop(0.7, "rgba(34, 211, 238, 0.05)");
  nebula4.addColorStop(1, "rgba(34, 211, 238, 0)");
  ctx.fillStyle = nebula4;
  ctx.fillRect(0, dynamicHeight - 290, 180, 200);

  // Draw stars
  const stars = [
    { x: 20, y: 30, size: 1.5, opacity: 1 },
    { x: 40, y: 70, size: 1, opacity: 0.8 },
    { x: 90, y: 40, size: 1, opacity: 0.6 },
    { x: 130, y: 80, size: 2, opacity: 1 },
    { x: 160, y: 120, size: 1, opacity: 0.7 },
    { x: 200, y: 50, size: 1, opacity: 0.5 },
    { x: 250, y: 150, size: 2, opacity: 1 },
    { x: 280, y: 90, size: 1, opacity: 0.6 },
    { x: 310, y: 200, size: 1, opacity: 0.8 },
    { x: 50, y: 250, size: 1, opacity: 0.5 },
    { x: 100, y: 300, size: 2, opacity: 1 },
    { x: 180, y: 280, size: 1, opacity: 0.7 },
    { x: 300, y: 320, size: 1, opacity: 0.8 },
    { x: 70, y: 400, size: 2, opacity: 1 },
    { x: 150, y: 450, size: 1, opacity: 0.5 },
    { x: 320, y: 480, size: 1, opacity: 0.6 },
    { x: 30, y: 520, size: 2, opacity: 1 },
    { x: 120, y: 580, size: 1, opacity: 0.8 },
    { x: 260, y: 550, size: 1, opacity: 0.5 },
    { x: 340, y: 600, size: 1, opacity: 0.7 },
  ];

  stars.forEach((star) => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
    ctx.fill();
  });

  // Draw title first - above photo
  const titleStartY = 20; // Top padding

  // SK 신입구성원 text
  ctx.fillStyle = "rgba(250, 204, 21, 0.8)";
  ctx.font = "bold 11px Arial";
  ctx.textAlign = "center";
  ctx.fillText("— SK 신입구성원 —", 180, titleStartY);

  // PILOT LICENSE text
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 24px Arial";
  ctx.fillText("PILOT LICENSE", 180, titleStartY + 26);

  // Load and draw photo - rectangular for upper body portrait (1.2x enlarged)
  const photoWidth = 268; // 224 * 1.2 = 268px
  const photoHeight = 346; // 288 * 1.2 = 346px
  const photoX = (360 - photoWidth) / 2; // Center horizontally
  const photoY = titleStartY + 40; // Below title
  const borderRadius = 16; // rounded-2xl

  try {
    const photo = await loadImage(photoUrl);

    // Draw rounded rectangle clip for photo
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, photoX, photoY, photoWidth, photoHeight, borderRadius);
    ctx.clip();

    // Draw image with aspect ratio preserved (cover behavior)
    const imgWidth = photo.naturalWidth || photo.width;
    const imgHeight = photo.naturalHeight || photo.height;

    // Calculate scale to cover the target area while maintaining aspect ratio
    const scale2 = Math.max(photoWidth / imgWidth, photoHeight / imgHeight);
    const scaledWidth = imgWidth * scale2;
    const scaledHeight = imgHeight * scale2;

    // Center horizontally, align to top for upper body photos
    const offsetX = photoX + (photoWidth - scaledWidth) / 2;
    const offsetY = photoY;

    ctx.drawImage(photo, offsetX, offsetY, scaledWidth, scaledHeight);
    ctx.restore();

    // Draw photo border with glow
    ctx.strokeStyle = "rgba(250, 204, 21, 0.7)";
    ctx.lineWidth = 4;
    ctx.shadowColor = "rgba(255, 215, 0, 0.4)";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    roundRect(ctx, photoX - 2, photoY - 2, photoWidth + 4, photoHeight + 4, borderRadius);
    ctx.stroke();
    ctx.shadowBlur = 0;
  } catch (e) {
    console.error("Failed to load photo:", e);
  }

  // Text below photo
  const textStartY = photoY + photoHeight + 16; // 16px below photo

  // Name
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30px Arial";
  ctx.fillText(name, 180, textStartY + 72);

  // Company
  ctx.fillStyle = "#d1d5db";
  ctx.font = "16px Arial";
  ctx.fillText(company, 180, textStartY + 100);

  // Commitment box - dynamic height based on text length
  const commitmentBoxHeight = 50 + extraHeight;
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  roundRect(ctx, 60, textStartY + 115, 240, commitmentBoxHeight, 12);
  ctx.fill();
  ctx.stroke();

  // Commitment text
  ctx.fillStyle = "#e5e7eb";
  ctx.font = "italic 15px Arial";
  const commitmentText = `"${commitment}"`;
  wrapText(ctx, commitmentText, 180, textStartY + 145, 220, 18);

  // Footer position - relative to dynamic height
  const footerY = dynamicHeight - 40;

  // Footer - 2026 SK 신입구성원 과정
  // Draw SK logo with aspect ratio preserved
  try {
    const skLogo = await loadImage("/img/sk.png");
    const logoMaxSize = 28;
    const logoWidth = skLogo.naturalWidth || skLogo.width;
    const logoHeight = skLogo.naturalHeight || skLogo.height;

    // Scale to fit within maxSize while maintaining aspect ratio
    const logoScale = Math.min(logoMaxSize / logoWidth, logoMaxSize / logoHeight);
    const scaledLogoWidth = logoWidth * logoScale;
    const scaledLogoHeight = logoHeight * logoScale;

    // Position relative to footer
    const logoX = 30;
    const logoY = footerY - scaledLogoHeight / 2;

    ctx.drawImage(skLogo, logoX, logoY, scaledLogoWidth, scaledLogoHeight);
  } catch (e) {
    console.error("Failed to load SK logo:", e);
  }

  ctx.fillStyle = "#9ca3af";
  ctx.font = "11px Arial";
  ctx.textAlign = "left";
  ctx.fillText("2026 SK 신입구성원 과정", 62, footerY + 4);

  // Footer - ISSUED date
  ctx.textAlign = "right";
  ctx.fillStyle = "#6b7280";
  ctx.font = "9px Arial";
  ctx.fillText("ISSUED", 330, footerY - 10);

  ctx.fillStyle = "#d1d5db";
  ctx.font = "14px Arial";
  const today = new Date();
  const issueDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}`;
  ctx.fillText(issueDate, 330, footerY + 8);

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
