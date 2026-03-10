import sharp from "sharp";

const MAX_DIMENSION = 4000;
const CROP_OUTPUT_SIZE = 800;

export interface ImageInfo {
  width: number;
  height: number;
  mimetype: string;
}

export interface CropRegion {
  top_percent: number;
  left_percent: number;
  width_percent: number;
  height_percent: number;
}

export async function normalizeImage(
  buffer: Buffer
): Promise<{ data: Buffer; info: ImageInfo }> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  let pipeline = image;

  // Resize if too large
  const w = metadata.width || 0;
  const h = metadata.height || 0;
  if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
    pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  // Convert to JPEG for consistency
  const output = await pipeline.jpeg({ quality: 90 }).toBuffer({ resolveWithObject: true });

  return {
    data: output.data,
    info: {
      width: output.info.width,
      height: output.info.height,
      mimetype: "image/jpeg",
    },
  };
}

export async function cropImage(
  buffer: Buffer,
  region: CropRegion
): Promise<Buffer> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  const imgWidth = metadata.width || 0;
  const imgHeight = metadata.height || 0;

  const left = Math.round((region.left_percent / 100) * imgWidth);
  const top = Math.round((region.top_percent / 100) * imgHeight);
  const width = Math.round((region.width_percent / 100) * imgWidth);
  const height = Math.round((region.height_percent / 100) * imgHeight);

  // Clamp values to image bounds
  const clampedLeft = Math.max(0, Math.min(left, imgWidth - 1));
  const clampedTop = Math.max(0, Math.min(top, imgHeight - 1));
  const clampedWidth = Math.min(width, imgWidth - clampedLeft);
  const clampedHeight = Math.min(height, imgHeight - clampedTop);

  if (clampedWidth < 10 || clampedHeight < 10) {
    // Crop region too small, return original resized
    return sharp(buffer)
      .resize(CROP_OUTPUT_SIZE, CROP_OUTPUT_SIZE, { fit: "inside" })
      .jpeg({ quality: 90 })
      .toBuffer();
  }

  return sharp(buffer)
    .extract({
      left: clampedLeft,
      top: clampedTop,
      width: clampedWidth,
      height: clampedHeight,
    })
    .resize(CROP_OUTPUT_SIZE, CROP_OUTPUT_SIZE, {
      fit: "inside",
      withoutEnlargement: false,
    })
    .jpeg({ quality: 90 })
    .toBuffer();
}

export async function imageToBase64(buffer: Buffer): Promise<string> {
  return buffer.toString("base64");
}
