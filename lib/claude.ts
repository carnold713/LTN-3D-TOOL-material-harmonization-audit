import Anthropic from "@anthropic-ai/sdk";

export interface CropRegionResult {
  description: string;
  top_percent: number;
  left_percent: number;
  width_percent: number;
  height_percent: number;
}

export interface MaterialAuditResult {
  cropRegion: CropRegionResult;
  referenceCropRegion: CropRegionResult;
  finish: {
    score: number;
    pass: boolean;
    feedback: string;
  };
  color: {
    score: number;
    pass: boolean;
    feedback: string;
  };
  material: {
    score: number;
    pass: boolean;
    feedback: string;
  };
}

function buildComparisonPrompt(
  referenceName: string,
  threshold: number
): string {
  return `You are a material finishing expert performing a harmonization audit for architectural hardware. You are blunt, precise, and do not sugarcoat your assessments.

IMAGE 1 (first image): The REFERENCE material — "${referenceName}". This is the single source of truth for how this material should look.
IMAGE 2 (second image): The SUBMITTED sample to evaluate against the reference.

## Your Task

Compare the submitted sample against the reference material across three categories. Focus ONLY on the material/hardware surface itself — ignore backgrounds, walls, lighting conditions, environmental context, and any surrounding elements. If the submitted image is an environmental/lifestyle photo showing the material installed in a setting, mentally isolate just the material component.

### Crop Region Detection
For BOTH images, identify the region that contains ONLY the material surface texture — excluding any hardware fixtures (knobs, handles, switches), mounting plates, edges, borders, backgrounds, text overlays, and surrounding context. The goal is to isolate a representative patch of the raw material finish for comparison.

- **referenceCropRegion**: The material-only region in the REFERENCE image (IMAGE 1).
- **cropRegion**: The material-only region in the SUBMITTED image (IMAGE 2).

Return bounding boxes as percentages of each image's dimensions. Crop TIGHTLY into the material — the result should show nothing but the surface texture/finish, similar to a macro shot of the material.

### Scoring Categories

Score each category from 0.00 to 10.00 (use up to hundredths precision):

1. **FINISH** — Surface texture and sheen comparison.
   - Evaluate: matte vs. glossy, brushed vs. polished, textured vs. smooth, satin quality, reflectivity level, brush pattern (lines per inch, direction, depth), surface grain consistency.
   - A perfect 10.00 means the finish is indistinguishable from the reference.

2. **COLOR** — Color match accuracy.
   - Evaluate: hue accuracy, saturation match, brightness/value match, undertone alignment (warm vs. cool), color consistency across the surface, any discoloration or uneven tones.
   - A perfect 10.00 means the color is an exact match to the reference.

3. **MATERIAL** — Material type and quality match.
   - Evaluate: apparent material composition (bronze, brass, nickel, stainless steel, plastic, etc.), grain/crystalline pattern, surface uniformity, edge quality, manufacturing consistency, material authenticity.
   - A perfect 10.00 means the material is identical to the reference.

### Pass/Fail Criteria
A score below ${threshold} indicates a FAIL for that category.

### Feedback Requirements
- For FAILING categories (score < ${threshold}): Provide specific, actionable feedback. Be blunt. State exactly what is wrong and precisely what adjustments need to be made to achieve a 10. For example:
  - Color: "The sample runs approximately 15% too warm. The undertone needs to shift from yellow-gold toward a cooler silver-gold. Reduce warm pigmentation."
  - Finish: "Brush lines are approximately 40% too coarse. Lines per inch need to increase from roughly 80 to 120. Brush depth should be reduced by about 30%."
  - Material: "Surface grain pattern suggests zinc alloy rather than the specified solid brass. Grain structure is too uniform and lacks the natural variation of brass."
- For PASSING categories: Briefly confirm what matches well. Keep it to 1-2 sentences.

## Response Format

Respond with ONLY valid JSON — no markdown code fences, no additional text:
{
  "referenceCropRegion": {
    "description": "Brief description of the material-only region in the reference image",
    "top_percent": <0-100>,
    "left_percent": <0-100>,
    "width_percent": <0-100>,
    "height_percent": <0-100>
  },
  "cropRegion": {
    "description": "Brief description of the material-only region in the submitted image",
    "top_percent": <0-100>,
    "left_percent": <0-100>,
    "width_percent": <0-100>,
    "height_percent": <0-100>
  },
  "finish": {
    "score": <0.00-10.00>,
    "pass": <true|false>,
    "feedback": "<specific feedback>"
  },
  "color": {
    "score": <0.00-10.00>,
    "pass": <true|false>,
    "feedback": "<specific feedback>"
  },
  "material": {
    "score": <0.00-10.00>,
    "pass": <true|false>,
    "feedback": "<specific feedback>"
  }
}`;
}

export async function compareMaterials(
  apiKey: string,
  model: string,
  referenceBase64: string,
  referenceMime: string,
  uploadBase64: string,
  uploadMime: string,
  referenceName: string,
  passThreshold: number
): Promise<{ result: MaterialAuditResult; rawResponse: unknown }> {
  const client = new Anthropic({ apiKey });

  const validMediaTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ] as const;
  type MediaType = (typeof validMediaTypes)[number];

  const refMediaType = (
    validMediaTypes.includes(referenceMime as MediaType)
      ? referenceMime
      : "image/jpeg"
  ) as MediaType;

  const uploadMediaType = (
    validMediaTypes.includes(uploadMime as MediaType)
      ? uploadMime
      : "image/jpeg"
  ) as MediaType;

  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: refMediaType,
              data: referenceBase64,
            },
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: uploadMediaType,
              data: uploadBase64,
            },
          },
          {
            type: "text",
            text: buildComparisonPrompt(referenceName, passThreshold),
          },
        ],
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Parse JSON, handling potential markdown code fences
  let jsonStr = textContent.text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const result: MaterialAuditResult = JSON.parse(jsonStr);

  // Round scores to hundredths
  result.finish.score = Math.round(result.finish.score * 100) / 100;
  result.color.score = Math.round(result.color.score * 100) / 100;
  result.material.score = Math.round(result.material.score * 100) / 100;

  return { result, rawResponse: response };
}
