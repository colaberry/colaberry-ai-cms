#!/usr/bin/env node
/**
 * Seed Strapi with LLM Architecture data.
 *
 * Usage:
 *   STRAPI_URL=http://localhost:1338 CMS_API_TOKEN=<token> node scripts/seed-llm-architectures.mjs
 *
 * Skips entries that already exist (matched by slug).
 * Publishes all entries after creation.
 */

const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1338";
const TOKEN = process.env.CMS_API_TOKEN;

if (!TOKEN) {
  console.error("ERROR: CMS_API_TOKEN environment variable is required");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${TOKEN}`,
};

/* ── LLM Architecture Dataset ────────────────────────────────────────── */

const LLM_ARCHITECTURES = [
  {
    slug: "gpt-2-xl",
    name: "GPT-2 XL",
    organization: "OpenAI",
    parameters: "1.5B",
    contextWindow: "1,024",
    releaseDate: "2019-11",
    decoderType: "Dense",
    attention: "MHA",
    keyFeatures: ["Byte-pair encoding", "Layer normalization", "Autoregressive pretraining"],
    configUrl: "https://huggingface.co/openai-community/gpt2-xl/blob/main/config.json",
  },
  {
    slug: "llama-3-8b",
    name: "Llama 3",
    organization: "Meta",
    parameters: "8B",
    contextWindow: "8,192",
    releaseDate: "2024-04",
    decoderType: "Dense",
    attention: "GQA + RoPE",
    keyFeatures: ["Grouped Query Attention", "RoPE embeddings", "SwiGLU activation"],
    configUrl: "https://huggingface.co/meta-llama/Meta-Llama-3-8B/blob/main/config.json",
  },
  {
    slug: "llama-3-2-1b",
    name: "Llama 3.2",
    organization: "Meta",
    parameters: "1B",
    contextWindow: "128K",
    releaseDate: "2024-09",
    decoderType: "Dense",
    attention: "GQA",
    keyFeatures: ["Lightweight dense model", "Long context", "GQA efficiency"],
  },
  {
    slug: "olmo-2-7b",
    name: "OLMo 2",
    organization: "AI2",
    parameters: "7B",
    contextWindow: "4,096",
    releaseDate: "2024-11",
    decoderType: "Dense",
    attention: "MHA + QK-Norm",
    keyFeatures: ["Fully open-source", "QK normalization", "Dolma dataset"],
    configUrl: "https://huggingface.co/allenai/OLMo-2-7B/blob/main/config.json",
  },
  {
    slug: "phi-4-14b",
    name: "Phi-4",
    organization: "Microsoft",
    parameters: "14B",
    contextWindow: "16,384",
    vocabSize: "100K",
    releaseDate: "2024-12",
    decoderType: "Dense",
    attention: "GQA + RoPE",
    keyFeatures: ["Data quality focus", "Synthetic training data", "Strong reasoning"],
    configUrl: "https://huggingface.co/microsoft/phi-4/blob/main/config.json",
  },
  {
    slug: "deepseek-v3",
    name: "DeepSeek V3",
    organization: "DeepSeek",
    parameters: "671B",
    activeParameters: "37B",
    contextWindow: "128K",
    releaseDate: "2024-12",
    decoderType: "MoE",
    attention: "MLA",
    keyFeatures: ["Multi-head Latent Attention", "Expert routing", "FP8 training"],
    paperUrl: "https://arxiv.org/pdf/2412.19437",
  },
  {
    slug: "deepseek-r1",
    name: "DeepSeek R1",
    organization: "DeepSeek",
    parameters: "671B",
    activeParameters: "37B",
    contextWindow: "128K",
    releaseDate: "2025-01",
    decoderType: "MoE",
    attention: "MLA",
    keyFeatures: ["Reasoning-focused", "Chain-of-thought", "MLA efficiency"],
  },
  {
    slug: "gemma-3-27b",
    name: "Gemma 3",
    organization: "Google",
    parameters: "27B",
    contextWindow: "128K",
    vocabSize: "262K",
    releaseDate: "2025-03",
    decoderType: "Dense",
    attention: "GQA + QK-Norm + SWA",
    keyFeatures: ["Sliding Window Attention", "QK normalization", "Large vocabulary"],
    configUrl: "https://huggingface.co/google/gemma-3-27b/blob/main/config.json",
  },
  {
    slug: "mistral-small-3-1",
    name: "Mistral Small 3.1",
    organization: "Mistral",
    parameters: "24B",
    contextWindow: "128K",
    releaseDate: "2025-03",
    decoderType: "Dense",
    attention: "GQA",
    keyFeatures: ["Efficient dense model", "Strong multilingual", "128K context"],
  },
  {
    slug: "xlstm-7b",
    name: "xLSTM",
    organization: "NXAI",
    parameters: "7B",
    contextWindow: "No explicit limit",
    releaseDate: "2025-03",
    decoderType: "Recurrent",
    attention: "mLSTM (recurrent)",
    keyFeatures: ["Extended LSTM architecture", "Linear complexity", "No attention mechanism"],
    paperUrl: "https://arxiv.org/pdf/2405.04517",
  },
  {
    slug: "llama-4-maverick",
    name: "Llama 4 Maverick",
    organization: "Meta",
    parameters: "400B",
    activeParameters: "17B",
    contextWindow: "1M",
    releaseDate: "2025-04",
    decoderType: "MoE",
    attention: "GQA",
    keyFeatures: ["1M context window", "MoE routing", "Efficient inference"],
  },
  {
    slug: "qwen3-235b",
    name: "Qwen3 (235B-A22B)",
    organization: "Alibaba",
    parameters: "235B",
    activeParameters: "22B",
    contextWindow: "128K",
    releaseDate: "2025-04",
    decoderType: "MoE",
    attention: "GQA + QK-Norm",
    keyFeatures: ["Thinking mode toggle", "MoE architecture", "Multilingual"],
    configUrl: "https://huggingface.co/Qwen/Qwen3-235B-A22B/blob/main/config.json",
  },
  {
    slug: "qwen3-32b",
    name: "Qwen3 (32B)",
    organization: "Alibaba",
    parameters: "32B",
    contextWindow: "128K",
    releaseDate: "2025-04",
    decoderType: "Dense",
    attention: "GQA + QK-Norm",
    keyFeatures: ["Dense variant", "QK normalization", "Thinking mode"],
  },
  {
    slug: "qwen3-8b",
    name: "Qwen3 (8B)",
    organization: "Alibaba",
    parameters: "8B",
    contextWindow: "128K",
    releaseDate: "2025-04",
    decoderType: "Dense",
    attention: "GQA + QK-Norm",
    keyFeatures: ["Compact dense model", "128K context", "Thinking mode"],
  },
  {
    slug: "qwen3-4b",
    name: "Qwen3 (4B)",
    organization: "Alibaba",
    parameters: "4B",
    contextWindow: "32,768",
    vocabSize: "151K",
    releaseDate: "2025-04",
    decoderType: "Dense",
    attention: "GQA + QK-Norm",
    keyFeatures: ["Small efficient model", "Thinking mode", "Large vocab"],
  },
  {
    slug: "smollm3-3b",
    name: "SmolLM3",
    organization: "Hugging Face",
    parameters: "3B",
    contextWindow: "131K",
    releaseDate: "2025-06",
    decoderType: "Dense",
    attention: "GQA + NoPE",
    keyFeatures: ["No positional embeddings", "Compact architecture", "Long context"],
  },
  {
    slug: "kimi-k2",
    name: "Kimi K2",
    organization: "Moonshot AI",
    parameters: "1T",
    activeParameters: "32B",
    contextWindow: "128K",
    releaseDate: "2025-07",
    decoderType: "MoE",
    attention: "MLA",
    keyFeatures: ["Trillion-parameter MoE", "MLA attention", "32B active params"],
  },
  {
    slug: "glm-4-5",
    name: "GLM-4.5",
    organization: "Zhipu AI",
    parameters: "355B",
    activeParameters: "32B",
    contextWindow: "128K",
    releaseDate: "2025-07",
    decoderType: "MoE",
    attention: "GQA + QK-Norm",
    keyFeatures: ["Chinese-English bilingual", "MoE routing", "Strong benchmarks"],
  },
  {
    slug: "glm-4-5-air",
    name: "GLM-4.5-Air",
    organization: "Zhipu AI",
    parameters: "106B",
    activeParameters: "12B",
    contextWindow: "128K",
    releaseDate: "2025-07",
    decoderType: "MoE",
    attention: "GQA",
    keyFeatures: ["Lightweight GLM variant", "12B active", "Fast inference"],
  },
  {
    slug: "qwen3-coder-flash",
    name: "Qwen3 Coder Flash",
    organization: "Alibaba",
    parameters: "30B",
    activeParameters: "3.3B",
    contextWindow: "256K",
    releaseDate: "2025-07",
    decoderType: "MoE",
    attention: "GQA",
    keyFeatures: ["Code-specialized", "256K context", "3.3B active params"],
  },
  {
    slug: "gpt-oss-120b",
    name: "GPT-OSS (120B)",
    organization: "OpenAI",
    parameters: "117B",
    activeParameters: "5.1B",
    contextWindow: "128K",
    releaseDate: "2025-08",
    decoderType: "MoE",
    attention: "GQA + SWA",
    keyFeatures: ["Open-source GPT", "Sliding Window Attention", "Sparse routing"],
  },
  {
    slug: "gpt-oss-20b",
    name: "GPT-OSS (20B)",
    organization: "OpenAI",
    parameters: "21B",
    activeParameters: "3.6B",
    contextWindow: "128K",
    releaseDate: "2025-08",
    decoderType: "MoE",
    attention: "GQA + SWA",
    keyFeatures: ["Compact open-source GPT", "SWA", "MoE routing"],
  },
  {
    slug: "gemma-3-270m",
    name: "Gemma 3 (270M)",
    organization: "Google",
    parameters: "270M",
    contextWindow: "128K",
    vocabSize: "262K",
    releaseDate: "2025-08",
    decoderType: "Dense",
    attention: "MQA + QK-Norm + SWA",
    keyFeatures: ["Ultra-small model", "Multi-Query Attention", "On-device capable"],
  },
  {
    slug: "grok-2-5",
    name: "Grok 2.5",
    organization: "xAI",
    parameters: "270B",
    contextWindow: "131K",
    releaseDate: "2025-08",
    decoderType: "MoE",
    attention: "GQA",
    keyFeatures: ["xAI flagship", "MoE architecture", "Real-time data access"],
  },
  {
    slug: "qwen3-next",
    name: "Qwen3 Next",
    organization: "Alibaba",
    parameters: "80B",
    activeParameters: "3B",
    contextWindow: "262K",
    releaseDate: "2025-09",
    decoderType: "Hybrid",
    attention: "Gated DeltaNet + Gated Attention",
    keyFeatures: ["Hybrid linear + transformer", "DeltaNet blocks", "262K context"],
  },
  {
    slug: "minimax-m2",
    name: "MiniMax M2",
    organization: "MiniMax",
    parameters: "230B",
    activeParameters: "10B",
    contextWindow: "196K",
    releaseDate: "2025-10",
    decoderType: "MoE",
    attention: "GQA + QK-Norm",
    keyFeatures: ["10B active MoE", "196K context", "Efficient routing"],
  },
  {
    slug: "kimi-linear",
    name: "Kimi Linear",
    organization: "Moonshot AI",
    parameters: "48B",
    activeParameters: "3B",
    contextWindow: "1M",
    releaseDate: "2025-10",
    decoderType: "Hybrid",
    attention: "MLA + Kimi Delta Attention",
    keyFeatures: ["1M context", "Linear attention hybrid", "Delta attention mechanism"],
  },
  {
    slug: "olmo-3-32b",
    name: "OLMo 3 (32B)",
    organization: "AI2",
    parameters: "32B",
    contextWindow: "65K",
    releaseDate: "2025-11",
    decoderType: "Dense",
    attention: "GQA + QK-Norm + SWA",
    keyFeatures: ["Fully open-source", "SWA + QK-Norm", "Dolma 2 dataset"],
  },
  {
    slug: "olmo-3-7b",
    name: "OLMo 3 (7B)",
    organization: "AI2",
    parameters: "7B",
    contextWindow: "65K",
    releaseDate: "2025-11",
    decoderType: "Dense",
    attention: "MHA + QK-Norm + SWA",
    keyFeatures: ["Open weights + data", "MHA with SWA", "Research-friendly"],
  },
  {
    slug: "intellect-3",
    name: "INTELLECT-3",
    organization: "Prime Intellect",
    parameters: "106B",
    activeParameters: "12B",
    contextWindow: "128K",
    releaseDate: "2025-11",
    decoderType: "MoE",
    attention: "GQA",
    keyFeatures: ["Decentralized training", "Open-source MoE", "12B active"],
  },
  {
    slug: "deepseek-v3-2",
    name: "DeepSeek V3.2",
    organization: "DeepSeek",
    parameters: "671B",
    activeParameters: "37B",
    contextWindow: "128K",
    releaseDate: "2025-12",
    decoderType: "MoE",
    attention: "MLA + Sparse Attention",
    keyFeatures: ["Sparse attention upgrade", "MLA V2", "Improved routing"],
  },
  {
    slug: "mistral-large-3",
    name: "Mistral Large 3",
    organization: "Mistral",
    parameters: "673B",
    activeParameters: "41B",
    contextWindow: "262K",
    releaseDate: "2025-12",
    decoderType: "MoE",
    attention: "MLA",
    keyFeatures: ["MLA adoption", "262K context", "41B active params"],
  },
  {
    slug: "nemotron-3-nano-30b",
    name: "Nemotron 3 Nano",
    organization: "NVIDIA",
    parameters: "30B",
    activeParameters: "3B",
    contextWindow: "1M",
    releaseDate: "2025-12",
    decoderType: "Hybrid",
    attention: "Mostly Mamba-2 + GQA",
    keyFeatures: ["Mamba-2 SSM blocks", "1M context", "Hybrid SSM-transformer"],
  },
  {
    slug: "xiaomi-mimo-v2-flash",
    name: "Xiaomi MiMo-V2-Flash",
    organization: "Xiaomi",
    parameters: "309B",
    activeParameters: "15B",
    contextWindow: "262K",
    releaseDate: "2025-12",
    decoderType: "MoE",
    attention: "SWA",
    keyFeatures: ["SWA-only attention", "15B active", "Fast inference"],
  },
  {
    slug: "glm-4-7",
    name: "GLM-4.7",
    organization: "Zhipu AI",
    parameters: "355B",
    activeParameters: "32B",
    contextWindow: "202K",
    releaseDate: "2025-12",
    decoderType: "MoE",
    attention: "GQA + QK-Norm",
    keyFeatures: ["Extended context", "Improved GLM series", "202K window"],
  },
  {
    slug: "arcee-trinity-large",
    name: "Arcee AI Trinity Large",
    organization: "Arcee AI",
    parameters: "400B",
    activeParameters: "13B",
    contextWindow: "512K",
    releaseDate: "2026-01",
    decoderType: "MoE",
    attention: "GQA + Gated + SWA",
    keyFeatures: ["512K context", "Gated attention", "13B active MoE"],
  },
  {
    slug: "kimi-k2-5",
    name: "Kimi K2.5",
    organization: "Moonshot AI",
    parameters: "1T",
    activeParameters: "32B",
    contextWindow: "256K",
    releaseDate: "2026-01",
    decoderType: "MoE",
    attention: "MLA",
    keyFeatures: ["Trillion-param v2", "256K context", "Improved MLA"],
  },
  {
    slug: "glm-5",
    name: "GLM-5",
    organization: "Zhipu AI",
    parameters: "744B",
    activeParameters: "40B",
    contextWindow: "202K",
    releaseDate: "2026-02",
    decoderType: "MoE",
    attention: "MLA + Sparse Attention",
    keyFeatures: ["MLA adoption", "Sparse attention", "40B active"],
  },
  {
    slug: "step-3-5-flash",
    name: "Step 3.5 Flash",
    organization: "StepFun",
    parameters: "196B",
    activeParameters: "11B",
    contextWindow: "262K",
    releaseDate: "2026-02",
    decoderType: "MoE",
    attention: "GQA + SWA",
    keyFeatures: ["Fast inference MoE", "SWA", "11B active"],
  },
  {
    slug: "nanbeige-4-1",
    name: "Nanbeige 4.1",
    organization: "Nanbeige",
    parameters: "3B",
    contextWindow: "262K",
    releaseDate: "2026-02",
    decoderType: "Dense",
    attention: "GQA",
    keyFeatures: ["Ultra-compact", "262K context", "Chinese-focused"],
  },
  {
    slug: "minimax-m2-5",
    name: "MiniMax-M2.5",
    organization: "MiniMax",
    parameters: "230B",
    activeParameters: "10B",
    contextWindow: "196K",
    releaseDate: "2026-02",
    decoderType: "MoE",
    attention: "GQA + QK-Norm",
    keyFeatures: ["M2 upgrade", "10B active", "Improved routing"],
  },
  {
    slug: "tiny-aya",
    name: "Tiny Aya",
    organization: "Cohere",
    parameters: "3.35B",
    contextWindow: "8,192",
    releaseDate: "2026-02",
    decoderType: "Dense",
    attention: "GQA + SWA + NoPE",
    keyFeatures: ["No positional embeddings", "Massively multilingual", "Compact"],
  },
  {
    slug: "ling-2-5",
    name: "Ling 2.5",
    organization: "Inclusion AI",
    parameters: "1T",
    activeParameters: "63B",
    contextWindow: "256K",
    releaseDate: "2026-02",
    decoderType: "Hybrid",
    attention: "Lightning Attention + MLA",
    keyFeatures: ["Lightning linear attention", "MLA hybrid", "63B active"],
  },
  {
    slug: "qwen3-5",
    name: "Qwen3.5",
    organization: "Alibaba",
    parameters: "397B",
    activeParameters: "17B",
    contextWindow: "262K",
    releaseDate: "2026-02",
    decoderType: "Hybrid",
    attention: "Gated DeltaNet + Gated Attention",
    keyFeatures: ["Hybrid architecture", "DeltaNet + transformer", "17B active"],
  },
  {
    slug: "sarvam-30b",
    name: "Sarvam (30B)",
    organization: "Sarvam AI",
    parameters: "30B",
    activeParameters: "2.4B",
    contextWindow: "131K",
    releaseDate: "2026-03",
    decoderType: "MoE",
    attention: "GQA + QK-Norm",
    keyFeatures: ["India-focused", "2.4B active", "Multilingual Indic"],
  },
  {
    slug: "sarvam-105b",
    name: "Sarvam (105B)",
    organization: "Sarvam AI",
    parameters: "105B",
    activeParameters: "10.3B",
    contextWindow: "131K",
    releaseDate: "2026-03",
    decoderType: "MoE",
    attention: "MLA",
    keyFeatures: ["MLA architecture", "Indic language focus", "10.3B active"],
  },
  {
    slug: "mistral-small-4",
    name: "Mistral Small 4",
    organization: "Mistral",
    parameters: "119B",
    activeParameters: "6.63B",
    contextWindow: "256K",
    releaseDate: "2026-03",
    decoderType: "MoE",
    attention: "MLA",
    keyFeatures: ["MLA adoption", "256K context", "Efficient MoE"],
  },
  {
    slug: "nemotron-3-super",
    name: "Nemotron 3 Super",
    organization: "NVIDIA",
    parameters: "120B",
    activeParameters: "12B",
    contextWindow: "1M",
    releaseDate: "2026-03",
    decoderType: "Hybrid",
    attention: "Mostly Mamba-2 + GQA",
    keyFeatures: ["Mamba-2 SSM", "1M context", "12B active hybrid"],
  },
  {
    slug: "nemotron-3-nano-4b",
    name: "Nemotron 3 Nano (4B)",
    organization: "NVIDIA",
    parameters: "4B",
    contextWindow: "262K",
    releaseDate: "2026-03",
    decoderType: "Hybrid",
    attention: "Mostly Mamba-2 + GQA",
    keyFeatures: ["Ultra-compact hybrid", "Mamba-2 blocks", "262K context"],
  },
  {
    slug: "gemma-4-31b",
    name: "Gemma 4 (31B)",
    organization: "Google",
    parameters: "30.7B",
    contextWindow: "256K",
    vocabSize: "262K",
    releaseDate: "2026-04",
    decoderType: "Dense",
    attention: "GQA + QK-Norm + SWA",
    keyFeatures: ["256K context", "Large vocabulary", "SWA + QK-Norm"],
  },
  {
    slug: "gemma-4-26b-a4b",
    name: "Gemma 4 (26B-A4B)",
    organization: "Google",
    parameters: "25.2B",
    activeParameters: "3.8B",
    contextWindow: "256K",
    vocabSize: "262K",
    releaseDate: "2026-04",
    decoderType: "MoE",
    attention: "GQA + QK-Norm + SWA",
    keyFeatures: ["MoE Gemma variant", "3.8B active", "SWA + QK-Norm"],
  },
  {
    slug: "gemma-4-e2b",
    name: "Gemma 4 (E2B)",
    organization: "Google",
    parameters: "5.1B",
    contextWindow: "128K",
    vocabSize: "262K",
    releaseDate: "2026-04",
    decoderType: "Dense",
    attention: "MQA + QK-Norm + SWA",
    keyFeatures: ["Effective 2.3B parameters", "MQA efficiency", "On-device"],
  },
  {
    slug: "gemma-4-e4b",
    name: "Gemma 4 (E4B)",
    organization: "Google",
    parameters: "8B",
    contextWindow: "128K",
    vocabSize: "262K",
    releaseDate: "2026-04",
    decoderType: "Dense",
    attention: "GQA + QK-Norm + SWA",
    keyFeatures: ["Effective 4.5B parameters", "Distilled", "Efficient"],
  },
  {
    slug: "glm-5-1",
    name: "GLM-5.1",
    organization: "Zhipu AI",
    parameters: "744B",
    activeParameters: "40B",
    contextWindow: "202K",
    releaseDate: "2026-04",
    decoderType: "MoE",
    attention: "MLA + Sparse Attention",
    keyFeatures: ["GLM-5 refresh", "MLA + sparse", "40B active"],
  },
];

/* ── Seed logic ──────────────────────────────────────────────────────── */

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function findExistingSlugs() {
  const slugs = new Set();
  let page = 1;
  while (true) {
    const res = await fetch(
      `${STRAPI_URL}/api/llm-architectures?pagination[page]=${page}&pagination[pageSize]=100&fields[0]=slug`,
      { headers }
    );
    if (!res.ok) break;
    const json = await res.json();
    const items = json.data || [];
    for (const d of items) slugs.add(d.slug);
    if (!json.meta?.pagination || page >= json.meta.pagination.pageCount) break;
    page++;
  }
  return slugs;
}

async function createEntry(arch) {
  const payload = {
    data: {
      name: arch.name,
      slug: arch.slug,
      organization: arch.organization,
      parameters: arch.parameters,
      activeParameters: arch.activeParameters || null,
      contextWindow: arch.contextWindow,
      vocabSize: arch.vocabSize || null,
      releaseDate: arch.releaseDate,
      decoderType: arch.decoderType,
      attention: arch.attention,
      keyFeatures: arch.keyFeatures,
      configUrl: arch.configUrl || null,
      paperUrl: arch.paperUrl || null,
      visibility: "public",
      verified: true,
      description: `${arch.name} is a ${arch.decoderType} decoder LLM by ${arch.organization} with ${arch.parameters} parameters and ${arch.contextWindow} context window. Uses ${arch.attention} attention.`,
    },
  };

  const res = await fetch(`${STRAPI_URL}/api/llm-architectures`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create ${arch.slug}: ${res.status} ${err}`);
  }

  const created = await res.json();

  // Publish the entry
  const docId = created.data?.documentId || created.data?.id;
  if (docId) {
    await fetch(`${STRAPI_URL}/api/llm-architectures/${docId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ data: { publishedAt: new Date().toISOString() } }),
    });
  }

  return created;
}

async function main() {
  console.log(`Seeding LLM Architectures to ${STRAPI_URL}...`);
  console.log(`Total models: ${LLM_ARCHITECTURES.length}\n`);

  const existing = await findExistingSlugs();
  console.log(`Already in CMS: ${existing.size}`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const arch of LLM_ARCHITECTURES) {
    if (existing.has(arch.slug)) {
      console.log(`  SKIP  ${arch.slug} (exists)`);
      skipped++;
      continue;
    }

    try {
      await createEntry(arch);
      console.log(`  OK    ${arch.slug}`);
      created++;
      await delay(300); // Avoid rate limiting
    } catch (e) {
      console.error(`  FAIL  ${arch.slug}: ${e.message}`);
      errors++;
      if (e.message.includes("429")) {
        console.log("  ... waiting 5s for rate limit reset");
        await delay(5000);
      }
    }
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped, ${errors} errors`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
