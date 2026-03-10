import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { saveFile, readFile } from "@/lib/storage";
import {
  normalizeImage,
  cropImage,
  imageToBase64,
} from "@/lib/imageProcessing";
import { compareMaterials } from "@/lib/claude";
import { getClaudeApiKey, getPassThreshold, getClaudeModel } from "@/lib/config";
import { generateFilename } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const referenceId = formData.get("referenceId") as string;
    const visitorNote = formData.get("visitorNote") as string | null;

    if (!file || !referenceId) {
      return NextResponse.json(
        { error: "Missing required fields: image, referenceId" },
        { status: 400 }
      );
    }

    // Validate reference exists
    const reference = await prisma.referenceImage.findUnique({
      where: { id: referenceId, isActive: true },
    });
    if (!reference) {
      return NextResponse.json(
        { error: "Reference image not found" },
        { status: 404 }
      );
    }

    // Check API key is configured
    const apiKey = await getClaudeApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI analysis is not configured. Please contact the administrator." },
        { status: 503 }
      );
    }

    // Normalize uploaded image
    const buffer = Buffer.from(await file.arrayBuffer());
    const { data: normalizedData, info } = await normalizeImage(buffer);

    const uploadFilename = generateFilename(file.name, "upload");
    await saveFile(uploadFilename, normalizedData);

    // Create audit record
    const audit = await prisma.audit.create({
      data: {
        referenceImageId: referenceId,
        uploadFilename,
        uploadMimetype: info.mimetype,
        uploadWidth: info.width,
        uploadHeight: info.height,
        visitorNote: visitorNote || null,
        status: "PROCESSING",
      },
    });

    // Process synchronously to avoid fire-and-forget being killed by runtime
    const finalStatus = await processAudit(audit.id, apiKey);

    return NextResponse.json({ id: audit.id, status: finalStatus }, { status: 201 });
  } catch (error) {
    console.error("Failed to create audit:", error);
    return NextResponse.json(
      { error: "Failed to create audit" },
      { status: 500 }
    );
  }
}

async function processAudit(auditId: string, apiKey: string): Promise<string> {
  try {
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: { referenceImage: true },
    });
    if (!audit) return "FAILED";

    const [passThreshold, model] = await Promise.all([
      getPassThreshold(),
      getClaudeModel(),
    ]);

    // Read both images
    const [refBuffer, uploadBuffer] = await Promise.all([
      readFile(audit.referenceImage.filename),
      readFile(audit.uploadFilename),
    ]);

    const refBase64 = await imageToBase64(refBuffer);
    const uploadBase64 = await imageToBase64(uploadBuffer);

    // Call Claude for comparison
    const { result, rawResponse } = await compareMaterials(
      apiKey,
      model,
      refBase64,
      audit.referenceImage.mimetype,
      uploadBase64,
      audit.uploadMimetype,
      audit.referenceImage.name,
      passThreshold
    );

    // Crop images based on Claude's detected regions
    let croppedUploadFilename: string | null = null;
    let croppedRefFilename: string | null = null;

    if (result.cropRegion) {
      try {
        const croppedUpload = await cropImage(uploadBuffer, result.cropRegion);
        croppedUploadFilename = generateFilename("cropped.jpg", "crop_upload");
        await saveFile(croppedUploadFilename, croppedUpload);

        // Also create a standardized crop of the reference for overlay
        const croppedRef = await cropImage(refBuffer, {
          top_percent: 0,
          left_percent: 0,
          width_percent: 100,
          height_percent: 100,
        });
        croppedRefFilename = generateFilename("cropped.jpg", "crop_ref");
        await saveFile(croppedRefFilename, croppedRef);
      } catch (cropError) {
        console.error("Cropping failed, continuing without crops:", cropError);
      }
    }

    const overallPass =
      result.finish.pass && result.color.pass && result.material.pass;

    await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: "COMPLETED",
        finishScore: result.finish.score,
        colorScore: result.color.score,
        materialScore: result.material.score,
        overallPass,
        finishFeedback: result.finish.feedback,
        colorFeedback: result.color.feedback,
        materialFeedback: result.material.feedback,
        claudeRawResponse: rawResponse as object,
        croppedUploadFilename,
        croppedRefFilename,
      },
    });
    return "COMPLETED";
  } catch (error) {
    console.error(`Audit ${auditId} processing error:`, error);
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: "FAILED",
        errorMessage:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
    });
    return "FAILED";
  }
}
