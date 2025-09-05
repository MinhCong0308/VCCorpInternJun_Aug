const leo = require("leo-profanity");
const fs = require("fs");
const englishWords = require("word-list-json");
const frenchWords = require("an-array-of-french-words"); // array
const config = require('configs');
// const viWords = require('dictionary-vi');

class GlobalFilterManager {
  constructor() {
    this.initialized = false;
    this.customBadWords = [];
    this.defaultBadWordsSet = new Set();
    this.dbBadWordsSet = new Set();
    this.englishListWordsSet = new Set();
    this.frenchListWordsSet = new Set();
    this.viWordSet = new Set();
  }
  async initialize() {
    try {
      console.log("Initializing global bad words filter...");
      // Load the default dictionary
      leo.loadDictionary();
      // Add custom bad words if needed
      this.customBadWords = [
        "spam",
        "scam",
        "fraud",
        "fake",
        "cheat",
        "inappropriate",
        "harassment",
        "abuse",
      ];

      leo.add(this.customBadWords);
      // print the dictionary of leo
      let defaultDictionary = leo.getDictionary();
      // convert to set for better lookup performance
      this.defaultBadWordsSet = new Set(defaultDictionary);
      console.log(
        `Global filter initialized with built-in + ${this.customBadWords.length} custom bad words`
      );
      // Load words from database (if table exists)
      try {
        const db = require("models/index");
        const rows = await db.Dictionary.findAll({
          where: { status: 1 },
          attributes: ["word"],
        });
        const words = rows.map((r) => r.word);
        if (words.length) {
          leo.add(words);
          this.dbBadWordsSet = new Set(words);
          console.log(`Loaded ${words.length} bad words from database`);
        }
      } catch (err) {
        console.warn(
          "Dictionary table not ready or error loading DB words:",
          err.message
        );
      }
      console.log("Load English word list...");
      this.englishListWordsSet = new Set(englishWords.filter(Boolean));
      console.log("en words:", this.englishListWordsSet.size);
      console.log("Loading French word list...");
      this.frenchListWordsSet = new Set(frenchWords.filter(Boolean));
      console.log("fr words:", this.frenchListWordsSet.size);
      console.log("Loading Vietnamese Hunspell dictionary (ESM)...");
      const vi = await import("dictionary-vi"); // ESM
      const lines = vi.default.dic.toString("utf8");
      const arr = lines
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      // console.log("Current lines: ", arr[arr.length - 1]);
      // console.log("Lines: ", arr.length);
      this.viWordSet = new Set(arr);
      console.log("vi words:", this.viWordSet.size);
      this.initialized = true;
    } catch (error) {
      console.error("Error initializing global filter:", error);
      throw new Error("Failed to initialize global bad words filter");
    }
  }

  hasBadWords(text) {
    if (!this.initialized) {
      throw new Error("Global filter not initialized");
    }
    return leo.check(text);
  }

  cleanText(text) {
    if (!this.initialized) {
      throw new Error("Global filter not initialized");
    }
    return leo.clean(text);
  }

  countBadWords(text) {
    if (!this.initialized) {
      throw new Error("Global filter not initialized");
    }
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    let count = 0;
    for (const w of words) {
      if (leo.check(w)) count++;
    }
    return count;
  }

  getBadWordsDetails(text) {
    if (!this.initialized) {
      throw new Error("Global filter not initialized");
    }

    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const badWords = [];
    const badWordPositions = [];

    words.forEach((word, index) => {
      if (leo.check(word)) {
        badWords.push(word);
        badWordPositions.push(index);
      }
    });

    return {
      count: badWords.length,
      words: badWords,
      uniqueWords: [...new Set(badWords)],
      positions: badWordPositions,
    };
  }

  analyzeContent(content) {
    if (!this.initialized) {
      throw new Error("Global filter not initialized");
    }

    const hasProfanity = leo.check(content);
    const cleanedContent = leo.clean(content);
    const badWordCount = this.countBadWords(content);
    const badWordsDetails = this.getBadWordsDetails(content);

    return {
      isClean: !hasProfanity,
      hasBadWords: hasProfanity,
      badWordCount: badWordCount,
      badWordsFound: badWordsDetails.uniqueWords,
      originalContent: content,
      cleanedContent: cleanedContent,
      containsProfanity: hasProfanity,
      details: badWordsDetails,
    };
  }

  addBadWords(newBadWords) {
    leo.add(newBadWords);
    this.customBadWords.push(...newBadWords);
    console.log(`Added ${newBadWords.length} new bad words to global filter`);
  }

  removeWords(wordsToRemove) {
    leo.remove(wordsToRemove);
    console.log(`Removed ${wordsToRemove.length} words from bad words filter`);
  }

  loadDatabaseWords(words) {
    leo.add(words);
    this.dbBadWordsSet = new Set(words);
    console.log(`(Re)loaded ${words.length} DB bad words`);
  }
  checkSuitableLanguage(context, languageid) {
    // const words = context.toLowerCase().match(/\b\w+\b/g) || [];
    let isValidCount = 0;
    let words;
    // console.log(`Current languageid: ${languageid}`);
    console.log(`Language enum: ${config.config.languageEnum.ENGLISH}`);
    switch(languageid) {
      case config.config.languageEnum.ENGLISH: 
        words = context.toLowerCase().match(/\b[a-z]+\b/g) || [];
        console.log(`Word list: ${words}`);
        for (const w of words) {
          if (this.englishListWordsSet.has(w)) isValidCount++;
          else {
            // console.log(`Word ${w} is not found on dictionary`);
          }
        }
        break;
      case config.config.languageEnum.FRENCH:
        words = context.toLowerCase().match(/\b[a-zàâäéèêëïîôöùûüÿç]+\b/g) || [];
        console.log(`Word list: ${words}`);
        for (const w of words) {
          if (this.frenchListWordsSet.has(w)) isValidCount++;
        }
        break;
      case config.config.languageEnum.VIETNAMESE:
        const text = context.normalize('NFC');
        //  const text = context.normalize('NFC');
          // Tách bằng mọi ký tự KHÔNG thuộc Letter/Mark/(_ ’ ' -)
        // words = text
        //     .split(/[^\p{L}\p{M}_’'-]+/u)
        //     .filter(Boolean)
        //     .map(w => w.toLowerCase());
        // Option A (preferred): Unicode property escapes (Node 14+)
        // \p{L} = any letter; allow connectors like _, apostrophes, hyphens inside compounds
        const VI_WORD_RE = /(?<![\p{L}\p{M}])(\p{L}+(?:[_’'-]\p{L}+)*)((?![\p{L}\p{M}]))/gu;


        // Option B (fallback if \p{} unsupported): explicit Latin ranges incl. Đ/đ and À–ỵ
        // Covers Vietnamese precomposed letters; still okay if it captures other Latin letters
        // const VI_WORD_RE = /\b(?:[A-Za-zĐđÀ-Ỵà-ỵ]+(?:[_’'-][A-Za-zĐđÀ-Ỵà-ỵ]+)*)\b/g;

        words = [...text.matchAll(VI_WORD_RE)].map(m => m[0].toLowerCase());
        console.log(`Word list: ${words}`);
        for (const w of words) {
          if (this.viWordSet.has(w)) isValidCount++;
        }
        break;
      default:
        // console.log("It is called here");
        break;
    }
    const ratio = words.length ? isValidCount / words.length : 0;
    return ratio >= 0.7; // at least 70% of words must be valid in the specified language
  }
}

const globalFilter = new GlobalFilterManager();

module.exports = globalFilter;
