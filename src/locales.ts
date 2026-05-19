
export const translations = {
  en: {
    name: "VeoMotion AI",
    tagline: "Next Gen Motion",
    description: "Transform static imagery into high-fidelity cinematic experiences. Powered by Veo 3 technology.",
    tabs: {
      prompt: "Prompt",
      images: "Images",
      settings: "Settings"
    },
    labels: {
      cinematicPrompt: "Cinematic Prompt",
      promptPlaceholder: "Describe the motion, lighting, and camera movement...",
      startFrame: "Start Frame",
      endFrame: "End Frame (Optional)",
      referenceAssets: "Reference Assets (Max 3)",
      aestheticStyle: "Aesthetic style",
      motionIntensity: "Motion Intensity",
      aspectRatio: "Aspect Ratio",
      generationSpeed: "Generation Speed",
      upload: "Upload",
      add: "Add",
      fast: "Fast",
      highQuality: "High Quality"
    },
    styles: {
      cinematic: "Cinematic",
      realistic: "Realistic",
      art: "Art"
    },
    actions: {
      generate: "Generate Motion",
      processing: "Processing Cinema...",
      download: "Download MP4"
    },
    status: {
      masterPreview: "Master Preview",
      directing: "Directing Content...",
      directingDesc: "Generating cinematic motion frames and synchronizing audio. This may take up to 2-3 minutes for the highest quality.",
      awaiting: "Awaiting your creative vision",
      awaitingDesc: "Configure settings & press generate to start",
      online: "Engine Online"
    },
    footer: {
      documentation: "Documentation",
      apiStatus: "API Status",
      terms: "Terms of Vision"
    }
  },
  ua: {
    name: "VeoMotion AI",
    tagline: "Рух Наступного Покоління",
    description: "Перетворюйте статичні зображення на високоякісні кінематографічні відео. На базі технології Veo 3.",
    tabs: {
      prompt: "Опис",
      images: "Зображення",
      settings: "Налаштування"
    },
    labels: {
      cinematicPrompt: "Кінематографічний опис",
      promptPlaceholder: "Опишіть рух, освітлення та переходи камери...",
      startFrame: "Початковий кадр",
      endFrame: "Кінцевий кадр (опційно)",
      referenceAssets: "Референси (макс. 3)",
      aestheticStyle: "Естетичний стиль",
      motionIntensity: "Інтенсивність руху",
      aspectRatio: "Співвідношення сторін",
      generationSpeed: "Швидкість генерації",
      upload: "Завантажити",
      add: "Додати",
      fast: "Швидко",
      highQuality: "Висока якість"
    },
    styles: {
      cinematic: "Кіно",
      realistic: "Реалізм",
      art: "Арт"
    },
    actions: {
      generate: "Створити рух",
      processing: "Створення кіно...",
      download: "Завантажити MP4"
    },
    status: {
      masterPreview: "Попередній перегляд",
      directing: "Режисура контенту...",
      directingDesc: "Генерація кінематографічних кадрів та синхронізація звуку. Це може зайняти 2-3 хвилини для найкращої якості.",
      awaiting: "Очікування вашого бачення",
      awaitingDesc: "Налаштуйте параметри та натисніть 'Створити', щоб почати",
      online: "Двигун онлайн"
    },
    footer: {
      documentation: "Документація",
      apiStatus: "Статус API",
      terms: "Умови використання"
    }
  }
};

export type Language = 'en' | 'ua';
export type TranslationDict = typeof translations.en;
