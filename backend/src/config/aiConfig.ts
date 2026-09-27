/**
 * Centralized AI Model & API Key Configuration
 * Defines specific models for each workload to prevent quota exhaustion and separate concerns.
 */

export const AI_CONFIG = {
  // API Key Selection (Order of fallback for keys)
  apiKey: (
    process.env.AI_API_KEY ||
    process.env.OCR_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.NUGEN_API_KEY ||
    ''
  ).trim(),

  // Dedicated Model for Receipt OCR (Cost-efficient multimodal Gemini 3.5 Flash-Lite model)
  receiptModel: process.env.RECEIPT_AI_MODEL || 'gemini-3.5-flash-lite',

  // Configured Fallback Model for Receipt OCR (Used only when primary model hits 429/Quota)
  receiptFallbackModel: process.env.RECEIPT_AI_FALLBACK_MODEL || 'gemini-3.8-flash',

  // Dedicated Model for Nugen AI Assistant Chatbot
  chatModel: process.env.CHAT_AI_MODEL || process.env.NUGEN_MODEL || 'gemini-3.5-flash-lite',

  // Dedicated Model for AI Trip Creation Agent
  tripAgentModel: process.env.TRIP_AGENT_MODEL || 'gemini-3.5-flash-lite',

  // Dedicated Model for Weather Digital Twin Analysis
  weatherModel: process.env.WEATHER_AI_MODEL || 'gemini-3.5-flash-lite'
};
