import { InferenceClient } from '@huggingface/inference';
import config from '../config/index.js';
import logger from '../utils/logger.js';

// ─── Provider Implementations ────────────────────────────────

/**
 * Hugging Face Inference API provider
 */
class HuggingFaceProvider {
  constructor() {
    this.client = new InferenceClient(config.ai.huggingface.token);
    this.summaryModel = 'facebook/bart-large-cnn';
    this.textGenModel = 'mistralai/Mistral-7B-Instruct-v0.3';
  }

  async summarize(text) {
    const result = await this.client.summarization({
      model: this.summaryModel,
      inputs: text,
      parameters: { max_length: 150, min_length: 30 },
    });
    return result.summary_text;
  }

  async generateText(prompt) {
    const result = await this.client.textGeneration({
      model: this.textGenModel,
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        return_full_text: false,
      },
    });
    return result.generated_text.trim();
  }
}

/**
 * Ollama (local LLM) provider
 */
class OllamaProvider {
  constructor() {
    this.baseUrl = config.ai.ollama.baseUrl;
    this.model = config.ai.ollama.model;
  }

  async _generate(prompt, timeout = 60000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: { temperature: 0.7, num_predict: 500 },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response.trim();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async summarize(text) {
    const prompt = `Summarize the following text concisely in 2-3 sentences:\n\n"${text}"\n\nSummary:`;
    return this._generate(prompt);
  }

  async generateText(prompt) {
    return this._generate(prompt);
  }
}

// ─── AI Service Abstraction ──────────────────────────────────

class AIService {
  constructor() {
    this.provider = null;
    this._init();
  }

  _init() {
    const providerName = config.ai.provider;

    switch (providerName) {
      case 'huggingface':
        this.provider = new HuggingFaceProvider();
        logger.info('AI Service initialized with HuggingFace provider');
        break;
      case 'ollama':
        this.provider = new OllamaProvider();
        logger.info('AI Service initialized with Ollama provider');
        break;
      default:
        logger.warn(`Unknown AI provider "${providerName}", falling back to HuggingFace`);
        this.provider = new HuggingFaceProvider();
    }
  }

  /**
   * Process a highlight through the full AI pipeline
   * Returns: { summary, explanation, example, tags, difficulty }
   */
  async processHighlight(text) {
    const results = {
      summary: null,
      explanation: null,
      example: null,
      tags: [],
      difficulty: null,
    };

    // 1. Summarize
    try {
      results.summary = await this._retry(() => this.provider.summarize(text));
    } catch (error) {
      logger.error('Summarization failed:', error.message);
      results.summary = text.length > 200 ? text.slice(0, 200) + '...' : text;
    }

    // 2. Explain
    try {
      const explainPrompt = `Explain the following concept in simple terms for a student.\n\nConcept: "${text}"\n\nExplanation:`;
      results.explanation = await this._retry(() => this.provider.generateText(explainPrompt));
    } catch (error) {
      logger.error('Explanation generation failed:', error.message);
    }

    // 3. Example
    try {
      const examplePrompt = `Give a real-world example that illustrates this concept.\n\nConcept: "${text}"\n\nExample:`;
      results.example = await this._retry(() => this.provider.generateText(examplePrompt));
    } catch (error) {
      logger.error('Example generation failed:', error.message);
    }

    // 4. Tags & Difficulty
    try {
      const tagPrompt = `Analyze the following text and return ONLY a JSON object (no other text) with these fields:
- "tags": array of 1-5 relevant topic tags (lowercase, single words or short phrases)
- "difficulty": one of "beginner", "intermediate", or "advanced"

Text: "${text}"

JSON:`;
      const tagOutput = await this._retry(() => this.provider.generateText(tagPrompt));

      // Parse JSON from the output
      const jsonMatch = tagOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        results.tags = Array.isArray(parsed.tags) ? parsed.tags.map((t) => String(t).toLowerCase().trim()).slice(0, 5) : [];
        results.difficulty = ['beginner', 'intermediate', 'advanced'].includes(parsed.difficulty) ? parsed.difficulty : null;
      }
    } catch (error) {
      logger.error('Tag extraction failed:', error.message);
      results.tags = [];
    }

    return results;
  }

  /**
   * Retry wrapper — tries up to 3 times with exponential backoff
   */
  async _retry(fn, maxRetries = 3) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        logger.warn(`AI call failed (attempt ${attempt}/${maxRetries}):`, error.message);
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
        }
      }
    }
    throw lastError;
  }
}

// Singleton
const aiService = new AIService();

/**
 * Generate a weekly digest from an array of highlight data
 */
export async function generateDigest(highlights) {
  const highlightSummaries = highlights
    .map((h, i) => `${i + 1}. ${h.summary || h.text} [Tags: ${(h.tags || []).join(', ') || 'none'}]`)
    .join('\n');

  const prompt = `You are a study assistant. Given the following list of knowledge highlights a user saved this week, create a concise weekly revision digest. Group related topics, provide key takeaways, and suggest areas for deeper study.

Highlights:
${highlightSummaries}

Weekly Revision Digest:`;

  try {
    return await aiService.provider.generateText(prompt);
  } catch (error) {
    logger.error('Digest generation failed:', error.message);
    return null;
  }
}

export default aiService;
