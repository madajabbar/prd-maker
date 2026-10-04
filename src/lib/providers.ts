import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

export type ProviderId = "openrouter" | "openai" | "anthropic" | "google" | "groq";

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  keyUrl: string;
  models: string[];
  defaultModel: string;
}

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    keyUrl: "https://openrouter.ai/keys",
    models: [
      "deepseek/deepseek-chat-v3.1:free",
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemini-2.0-flash-exp:free",
      "anthropic/claude-sonnet-4.5",
      "openai/gpt-4.1-mini",
      "openai/gpt-4.1",
    ],
    defaultModel: "deepseek/deepseek-chat-v3.1:free",
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    keyUrl: "https://platform.openai.com/api-keys",
    models: ["gpt-4.1-mini", "gpt-4.1", "gpt-4o", "o4-mini"],
    defaultModel: "gpt-4.1-mini",
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic",
    keyUrl: "https://console.anthropic.com/settings/keys",
    models: ["claude-sonnet-4-5", "claude-haiku-4-5", "claude-opus-4-1"],
    defaultModel: "claude-sonnet-4-5",
  },
  google: {
    id: "google",
    label: "Google AI",
    keyUrl: "https://aistudio.google.com/app/apikey",
    models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"],
    defaultModel: "gemini-2.5-flash",
  },
  groq: {
    id: "groq",
    label: "Groq",
    keyUrl: "https://console.groq.com/keys",
    models: [
      "llama-3.3-70b-versatile",
      "meta-llama/llama-4-scout-17b-16e-instruct",
      "llama-3.1-8b-instant",
    ],
    defaultModel: "llama-3.3-70b-versatile",
  },
};

export const DEFAULT_PROVIDER: ProviderId = "openrouter";

export function isProviderId(value: unknown): value is ProviderId {
  return typeof value === "string" && value in PROVIDERS;
}

export function getModel(
  provider: ProviderId,
  apiKey: string,
  modelId: string,
): LanguageModel {
  switch (provider) {
    case "openrouter":
      return createOpenAICompatible({
        name: "openrouter",
        baseURL: "https://openrouter.ai/api/v1",
        apiKey,
      })(modelId);
    case "openai":
      return createOpenAI({ apiKey })(modelId);
    case "anthropic":
      return createAnthropic({ apiKey })(modelId);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(modelId);
    case "groq":
      return createGroq({ apiKey })(modelId);
  }
}
