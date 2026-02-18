// Profanity filter utility for cleaning user input
export class ProfanityFilter {
  private static readonly PROFANE_WORDS = new Set([
    // English profanity
    'fuck', 'shit', 'ass', 'bitch', 'damn', 'hell', 'crap', 'dick', 'piss', 'bastard',
    'cunt', 'whore', 'slut', 'cock', 'pussy', 'tits', 'asshole', 'motherfucker',
    'son of a bitch', 'bullshit', 'goddamn', 'jackass', 'dumbass', 'douchebag',
    
    // Thai profanity (common words that should be filtered)
    'กู', 'มึง', 'ไอ้', 'อี', 'ควย', 'หี', 'แม่ง', 'สัด', 'เหี้ย', 'เฮี้ย',
    'ชาติหมา', 'หมา', 'สันดาน', 'เย็ด', 'จู๋', 'กะหรี่', 'กระหรี่',
    'ตอด', 'รู', 'ตูด', 'ปาก', 'ปากหมา', 'แม่ง', 'สาด', 'ฟัก',
    
    // Variations and common misspellings
    'f*ck', 'sh*t', 'a$$', 'b*tch', 'd*mn', 'h*ll', 'cr*p', 'd*ck',
    'f.u.c.k', 's.h.i.t', 'a.s.s', 'b.i.t.c.h',
    
    // Leet speak variations
    'fck', 'sht', 'assh0le', 'b1tch', 'd4mn', 'h3ll', 'c0ck',
    'fu ck', 'shi t', 'as s', 'bit ch',
    
    // Common Thai variations
    'มึงอี', 'อีมึง', 'ไอ้มึง', 'อีหมา', 'ไอ้หมา', 'ควยมึง',
    'หีมึง', 'แม่งมึง', 'เหี้ยมึง', 'สัดมึง'
  ]);

  private static readonly REPLACEMENT = '***';

  /**
   * Filter profanity from text by replacing with asterisks
   */
  static filter(text: string): string {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let filteredText = text;
    
    // Process each profane word
    this.PROFANE_WORDS.forEach(word => {
      // Create regex with word boundaries and case insensitivity
      const regex = new RegExp(this.escapeRegex(word), 'gi');
      filteredText = filteredText.replace(regex, this.REPLACEMENT);
    });

    return filteredText;
  }

  /**
   * Check if text contains profanity
   */
  static containsProfanity(text: string): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }

    const lowerText = text.toLowerCase();
    
    // Check each profane word
    for (const word of this.PROFANE_WORDS) {
      if (lowerText.includes(word.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get list of profane words found in text
   */
  static getProfaneWords(text: string): string[] {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const foundWords: string[] = [];
    const lowerText = text.toLowerCase();
    
    for (const word of this.PROFANE_WORDS) {
      if (lowerText.includes(word.toLowerCase())) {
        foundWords.push(word);
      }
    }

    return [...new Set(foundWords)]; // Remove duplicates
  }

  /**
   * Advanced filter with context awareness
   * Preserves some words in certain contexts (e.g., "ass" in "assistant")
   */
  static advancedFilter(text: string): string {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let filteredText = text;
    
    // Split into words for context-aware filtering
    const words = text.split(/\s+/);
    const filteredWords = words.map(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      
      // Context-aware checks
      if (this.isAllowedInContext(cleanWord, word)) {
        return word;
      }
      
      return this.filter(word);
    });

    return filteredWords.join(' ');
  }

  /**
   * Check if a potentially profane word is allowed in current context
   */
  private static isAllowedInContext(cleanWord: string, originalWord: string): boolean {
    const lowerOriginal = originalWord.toLowerCase();
    
    // Allow "ass" in certain contexts
    if (cleanWord === 'ass' && (
      lowerOriginal.includes('assistant') ||
      lowerOriginal.includes('class') ||
      lowerOriginal.includes('pass') ||
      lowerOriginal.includes('grass') ||
      lowerOriginal.includes('brass')
    )) {
      return true;
    }

    // Allow "hell" in certain contexts
    if (cleanWord === 'hell' && (
      lowerOriginal.includes('hello') ||
      lowerOriginal.includes('shell') ||
      lowerOriginal.includes('tell')
    )) {
      return true;
    }

    // Allow "cock" in certain contexts
    if (cleanWord === 'cock' && (
      lowerOriginal.includes('peacock') ||
      lowerOriginal.includes('cocktail') ||
      lowerOriginal.includes('rooster')
    )) {
      return true;
    }

    return false;
  }

  /**
   * Escape special regex characters
   */
  private static escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Filter profanity but preserve word length
   * Replaces only the middle characters with asterisks
   */
  static filterWithLength(text: string): string {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let filteredText = text;
    
    this.PROFANE_WORDS.forEach(word => {
      const regex = new RegExp(`\\b(${this.escapeRegex(word)})\\b`, 'gi');
      filteredText = filteredText.replace(regex, (match) => {
        if (match.length <= 2) {
          return '**';
        }
        const first = match[0];
        const last = match[match.length - 1];
        const middle = '*'.repeat(match.length - 2);
        return first + middle + last;
      });
    });

    return filteredText;
  }

  /**
   * Add custom profane words to the filter
   */
  static addCustomWords(words: string[]): void {
    words.forEach(word => {
      if (word && typeof word === 'string') {
        this.PROFANE_WORDS.add(word.toLowerCase().trim());
      }
    });
  }

  /**
   * Remove words from the profanity filter
   */
  static removeWords(words: string[]): void {
    words.forEach(word => {
      if (word && typeof word === 'string') {
        this.PROFANE_WORDS.delete(word.toLowerCase().trim());
      }
    });
  }

  /**
   * Get all profane words in the filter
   */
  static getAllWords(): string[] {
    return Array.from(this.PROFANE_WORDS);
  }

  /**
   * Count profanity occurrences in text
   */
  static countProfanity(text: string): number {
    return this.getProfaneWords(text).length;
  }

  /**
   * Check if text is clean (no profanity)
   */
  static isClean(text: string): boolean {
    return !this.containsProfanity(text);
  }

  /**
   * Filter profanity from object properties recursively
   */
  static filterObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.filterObject(item));
    }

    const filtered: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        filtered[key] = this.filter(value);
      } else if (typeof value === 'object' && value !== null) {
        filtered[key] = this.filterObject(value);
      } else {
        filtered[key] = value;
      }
    }

    return filtered;
  }

  /**
   * Generate profanity report for analytics
   */
  static generateReport(text: string): {
    originalLength: number;
    filteredLength: number;
    profaneWordsFound: string[];
    profanityCount: number;
    isClean: boolean;
  } {
    const profaneWords = this.getProfaneWords(text);
    const filtered = this.filter(text);
    
    return {
      originalLength: text.length,
      filteredLength: filtered.length,
      profaneWordsFound: profaneWords,
      profanityCount: profaneWords.length,
      isClean: profaneWords.length === 0
    };
  }
}
