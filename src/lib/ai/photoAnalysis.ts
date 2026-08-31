import * as fs from "fs/promises";
import * as path from "path";
import { z } from "zod";
import { anthropic, AI_MODEL } from "@/lib/anthropic";

// looksFake is occasionally omitted by the model even when tool_choice
// forces a call and fakeReasons is populated (observed directly in
// testing) — falling back to "fakeReasons non-empty" rather than trusting
// the field's absence, same "don't fully trust raw AI output" posture as
// the rest of this app's AI-decision code.
const RawPhotoAnalysisSchema = z.object({
  looksFake: z.boolean().optional(),
  fakeReasons: z.array(z.string()).default([]),
  supportsRefund: z.boolean(),
  refundReasoning: z.string(),
  confidence: z.number().min(0).max(1),
});

export const PhotoAnalysisSchema = RawPhotoAnalysisSchema.transform((raw) => ({
  ...raw,
  looksFake: raw.looksFake ?? raw.fakeReasons.length > 0,
}));
export type PhotoAnalysis = z.infer<typeof PhotoAnalysisSchema>;

const PHOTO_ANALYSIS_TOOL_NAME = "submit_photo_analysis";

const PHOTO_ANALYSIS_TOOL = {
  name: PHOTO_ANALYSIS_TOOL_NAME,
  description:
    "Submit your authenticity and relevance assessment of a customer-submitted refund evidence photo.",
  input_schema: {
    type: "object" as const,
    properties: {
      looksFake: {
        type: "boolean",
        description:
          "True ONLY if the image shows specific, concrete signs of fraud: a visible stock-photo/marketing watermark or caption (e.g. 'sample', 'preview', a stock-site name), obvious studio/product-catalog staging (perfectly centered on a seamless studio background, professional product lighting), or AI-generation artifacts (warped/impossible geometry, duplicated or ghosted elements, shadows inconsistent with the light source). Do NOT flag an image as fake just because it is simple, low-detail, low-resolution, dimly lit, oddly composed, or otherwise looks like an amateur phone photo — that is exactly what a genuine customer snapshot looks like. When in doubt and no specific fraud signal is present, set this to false.",
      },
      fakeReasons: {
        type: "array",
        items: { type: "string" },
        description:
          "Specific, concrete reasons the image looks fake (e.g. 'diagonal stock-photo watermark text visible', 'duplicated ghost outline consistent with AI generation', 'shadow direction is inconsistent with the light source'). Empty array if looksFake is false.",
      },
      supportsRefund: {
        type: "boolean",
        description:
          "True if the image, taken at face value, plausibly supports the customer's stated refund claim (e.g. actually shows visible damage matching what they described).",
      },
      refundReasoning: {
        type: "string",
        description: "Brief explanation of the supportsRefund call.",
      },
      confidence: {
        type: "number",
        description: "Your confidence in this overall assessment, from 0 to 1.",
      },
    },
    required: [
      "looksFake",
      "fakeReasons",
      "supportsRefund",
      "refundReasoning",
      "confidence",
    ],
  },
};

function mediaTypeForExtension(filePath: string): "image/png" | "image/jpeg" {
  return path.extname(filePath).toLowerCase() === ".jpg" ||
    path.extname(filePath).toLowerCase() === ".jpeg"
    ? "image/jpeg"
    : "image/png";
}

/**
 * imageUrl is a local public/ path like "/demo-photos/legit-damage-1.png".
 * Claude's servers can't reach localhost, so the file is read from disk and
 * sent as base64 rather than as a URL source — works identically in dev and
 * production since it never depends on the app being publicly reachable.
 */
export async function analyzePhoto(
  imageUrl: string,
  caption: string,
  context: { customerClaim: string }
): Promise<PhotoAnalysis> {
  const filePath = path.join(process.cwd(), "public", imageUrl);
  const bytes = await fs.readFile(filePath);
  const mediaType = mediaTypeForExtension(filePath);

  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: bytes.toString("base64"),
            },
          },
          {
            type: "text",
            text: `A customer submitted this photo as evidence for a refund request. Their caption: "${caption}". Context on their claim so far: ${context.customerClaim}\n\nYou are checking specifically for fraud: does this image show concrete signs of being a stock/marketing photo (a visible watermark or caption, professional studio staging) or an AI-generated image (warped geometry, duplicated/ghosted elements, inconsistent shadows)? A genuine customer photo is often low-quality, oddly framed, or dimly lit — that alone is NOT a fraud signal, so don't flag it for that. Only flag looksFake when you can point to a specific, concrete reason. Separately, assess whether the image plausibly supports their refund claim.`,
          },
        ],
      },
    ],
    tools: [PHOTO_ANALYSIS_TOOL],
    tool_choice: { type: "tool", name: PHOTO_ANALYSIS_TOOL_NAME },
  });

  const block = response.content.find(
    (b) => b.type === "tool_use" && b.name === PHOTO_ANALYSIS_TOOL_NAME
  );
  if (!block || block.type !== "tool_use") {
    throw new Error(`AI did not call the expected tool: ${PHOTO_ANALYSIS_TOOL_NAME}`);
  }

  return PhotoAnalysisSchema.parse(block.input);
}
