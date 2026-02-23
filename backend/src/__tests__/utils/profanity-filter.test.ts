import { ProfanityFilter } from '../../utils/profanity-filter';

describe('ProfanityFilter', () => {
  describe('filter', () => {
    it('should filter English profanity', () => {
      const result = ProfanityFilter.filter('This is fucking awesome');
      expect(result).toBe('This is *** awesome');
    });

    it('should filter Thai profanity', () => {
      const result = ProfanityFilter.filter('ไอ้ควายมึง');
      expect(result).toBe('ไอ้***มึง');
    });

    it('should handle mixed language text', () => {
      const result = ProfanityFilter.filter('Hello ควย สัด มึง');
      expect(result).toBe('Hello *** *** ***');
    });

    it('should preserve clean text', () => {
      const result = ProfanityFilter.filter('This is a clean message');
      expect(result).toBe('This is a clean message');
    });

    it('should handle empty string', () => {
      const result = ProfanityFilter.filter('');
      expect(result).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(ProfanityFilter.filter(null as any)).toBe(null);
      expect(ProfanityFilter.filter(undefined as any)).toBe(undefined);
    });

    it('should be case insensitive', () => {
      const result = ProfanityFilter.filter('FUCK you');
      expect(result).toBe('*** you');
    });

    it('should filter variations and misspellings', () => {
      const result = ProfanityFilter.filter('f*ck sh*t');
      expect(result).toBe('*** ***');
    });
  });

  describe('containsProfanity', () => {
    it('should return true for profane text', () => {
      expect(ProfanityFilter.containsProfanity('fuck this')).toBe(true);
      expect(ProfanityFilter.containsProfanity('ไอ้ควย')).toBe(true);
    });

    it('should return false for clean text', () => {
      expect(ProfanityFilter.containsProfanity('hello world')).toBe(false);
      expect(ProfanityFilter.containsProfanity('สวัสดี')).toBe(false);
    });

    it('should return false for empty/null', () => {
      expect(ProfanityFilter.containsProfanity('')).toBe(false);
      expect(ProfanityFilter.containsProfanity(null as any)).toBe(false);
      expect(ProfanityFilter.containsProfanity(undefined as any)).toBe(false);
    });
  });

  describe('getProfaneWords', () => {
    it('should return array of profane words found', () => {
      const result = ProfanityFilter.getProfaneWords('fuck shit damn');
      expect(result).toContain('fuck');
      expect(result).toContain('shit');
      expect(result).toContain('damn');
    });

    it('should return empty array for clean text', () => {
      const result = ProfanityFilter.getProfaneWords('hello world');
      expect(result).toEqual([]);
    });

    it('should remove duplicates', () => {
      const result = ProfanityFilter.getProfaneWords('fuck fuck shit');
      expect(result).toEqual(['fuck', 'shit']);
    });
  });

  describe('filterWithLength', () => {
    it('should preserve word length with asterisks in middle', () => {
      const result = ProfanityFilter.filterWithLength('asshole');
      expect(result).toBe('a****e');
    });

    it('should handle short words', () => {
      const result = ProfanityFilter.filterWithLength('ass');
      expect(result).toBe('**');
    });
  });

  describe('isClean', () => {
    it('should return true for clean text', () => {
      expect(ProfanityFilter.isClean('hello world')).toBe(true);
    });

    it('should return false for profane text', () => {
      expect(ProfanityFilter.isClean('fuck this')).toBe(false);
    });
  });

  describe('countProfanity', () => {
    it('should count profanity occurrences', () => {
      const result = ProfanityFilter.countProfanity('fuck shit fuck');
      expect(result).toBe(2); // fuck counted once due to deduplication
    });
  });

  describe('filterObject', () => {
    it('should filter profanity in object properties', () => {
      const obj = {
        name: 'John Doe',
        message: 'fuck this shit',
        description: 'Hello world',
        nested: {
          text: 'damn it',
          clean: 'nice day'
        },
        array: ['hello', 'fuck', 'world']
      };

      const result = ProfanityFilter.filterObject(obj);

      expect(result.name).toBe('John Doe');
      expect(result.message).toBe('*** this ***');
      expect(result.description).toBe('Hello world');
      expect(result.nested.text).toBe('*** it');
      expect(result.nested.clean).toBe('nice day');
      expect(result.array).toEqual(['hello', '***', 'world']);
    });

    it('should handle arrays', () => {
      const arr = ['hello', 'fuck', 'world', 'shit'];
      const result = ProfanityFilter.filterObject(arr);
      expect(result).toEqual(['hello', '***', 'world', '***']);
    });

    it('should handle non-objects', () => {
      expect(ProfanityFilter.filterObject('hello world')).toBe('hello world');
      expect(ProfanityFilter.filterObject(123)).toBe(123);
      expect(ProfanityFilter.filterObject(null)).toBe(null);
    });
  });

  describe('generateReport', () => {
    it('should generate comprehensive profanity report', () => {
      const result = ProfanityFilter.generateReport('fuck this shit');

      expect(result.originalLength).toBe(14);
      expect(result.filteredLength).toBe(12); // '*** this ***'
      expect(result.profaneWordsFound).toContain('fuck');
      expect(result.profaneWordsFound).toContain('shit');
      expect(result.profanityCount).toBe(2);
      expect(result.isClean).toBe(false);
    });
  });

  describe('addCustomWords', () => {
    it('should add custom profane words', () => {
      ProfanityFilter.addCustomWords(['custombadword', 'anotherbad']);

      expect(ProfanityFilter.containsProfanity('custombadword')).toBe(true);
      expect(ProfanityFilter.containsProfanity('anotherbad')).toBe(true);
    });

    it('should handle invalid input', () => {
      expect(() => {
        ProfanityFilter.addCustomWords(['', null as any, 'validword']);
      }).not.toThrow();

      expect(ProfanityFilter.containsProfanity('validword')).toBe(true);
    });
  });

  describe('removeWords', () => {
    it('should remove words from filter', () => {
      ProfanityFilter.removeWords(['damn']);

      expect(ProfanityFilter.containsProfanity('damn')).toBe(false);
      expect(ProfanityFilter.containsProfanity('fuck')).toBe(true); // Should still work
    });
  });

  describe('getAllWords', () => {
    it('should return all profane words', () => {
      const words = ProfanityFilter.getAllWords();
      expect(Array.isArray(words)).toBe(true);
      expect(words.length).toBeGreaterThan(0);
      expect(words).toContain('fuck');
      expect(words).toContain('ควย');
    });
  });
});
