import { ModelType, OpenAICompatibleSettings } from "@/lib/types";

export type GenerationRequest = {
  model: ModelType;
  prompt: string;
  negativePrompt: string;
};

export type GenerationResponse = {
  mode: "demo" | "api";
  imageUrl?: string;
  error?: string;
  metadata: string;
};

const normalizeEndpoint = (endpoint: string) => endpoint.replace(/\/$/, "");

export const generateImage = async (
  request: GenerationRequest,
  settings: OpenAICompatibleSettings,
): Promise<GenerationResponse> => {
  if (!settings.enabled || !settings.endpoint || !settings.apiKey || !settings.model) {
    return {
      mode: "demo",
      metadata: "Demo Mode — connect an OpenAI-compatible API endpoint to generate real images.",
    };
  }

  try {
    const endpoint = `${normalizeEndpoint(settings.endpoint)}/images/generations`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + settings.apiKey,
      },
      body: JSON.stringify({
        model: settings.model,
        prompt: request.prompt,
        negative_prompt: request.negativePrompt || undefined,
        size: settings.imageSize || "1024x1024",
        n: 1,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Generation failed (${response.status})`);
    }

    const payload = await response.json();
    const first = payload?.data?.[0];
    const url = first?.url
      ? first.url
      : first?.b64_json
        ? `data:image/png;base64,${first.b64_json}`
        : undefined;

    if (!url) {
      throw new Error("No image returned by the provider.");
    }

    return {
      mode: "api",
      imageUrl: url,
      metadata: `${request.model} • ${settings.model} • ${settings.imageSize}`,
    };
  } catch (error) {
    return {
      mode: "api",
      error: error instanceof Error ? error.message : "Unknown generation error",
      metadata: "OpenAI-compatible request failed. Showing no generated output.",
    };
  }
};
