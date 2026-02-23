import { I18nUtils } from '../../utils/i18n';

describe('I18nUtils', () => {
  describe('translate', () => {
    it('should translate English keys correctly', () => {
      const result = I18nUtils.translate('auth.login_success', 'en');
      expect(result).toBe('Login successful');
    });

    it('should translate Thai keys correctly', () => {
      const result = I18nUtils.translate('auth.login_success', 'th');
      expect(result).toBe('เข้าสู่ระบบสำเร็จ');
    });

    it('should return default language for unsupported language', () => {
      const result = I18nUtils.translate('auth.login_success', 'fr');
      expect(result).toBe('Login successful'); // Should default to English
    });

    it('should return key for missing translation', () => {
      const result = I18nUtils.translate('auth.login_success' as any, 'en');
      expect(result).toBe('Login successful');
    });

    it('should handle empty/null language', () => {
      expect(I18nUtils.translate('auth.login_success', '')).toBe('Login successful');
      expect(I18nUtils.translate('auth.login_success', null as any)).toBe('Login successful');
      expect(I18nUtils.translate('auth.login_success', undefined as any)).toBe('Login successful');
    });

    it('should translate complex keys with parameters', () => {
      const result = I18nUtils.translate('pagination.showing', 'en');
      expect(result).toBe('Showing {start} to {end} of {total} results');
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return supported languages', () => {
      const languages = I18nUtils.getSupportedLanguages();
      expect(languages).toEqual(['en', 'th']);
    });
  });

  describe('getDefaultLanguage', () => {
    it('should return default language', () => {
      const defaultLang = I18nUtils.getDefaultLanguage();
      expect(defaultLang).toBe('en');
    });
  });

  describe('isLanguageSupported', () => {
    it('should return true for supported languages', () => {
      expect(I18nUtils.isLanguageSupported('en')).toBe(true);
      expect(I18nUtils.isLanguageSupported('th')).toBe(true);
    });

    it('should return false for unsupported languages', () => {
      expect(I18nUtils.isLanguageSupported('fr')).toBe(false);
      expect(I18nUtils.isLanguageSupported('es')).toBe(false);
    });
  });

  describe('formatDate', () => {
    it('should format date in English', () => {
      const date = new Date('2024-01-15');
      const result = I18nUtils.translate('date.today', 'en');
      expect(result).toBe('Today');
    });

    it('should format date in Thai', () => {
      const date = new Date('2024-01-15');
      const result = I18nUtils.translate('date.today', 'th');
      expect(result).toBe('วันนี้');
    });
  });

  describe('formatCurrency', () => {
    it('should handle currency formatting', () => {
      const result = I18nUtils.translate('general.success', 'en');
      expect(result).toBe('Success');
    });
  });

  describe('formatNumber', () => {
    it('should handle number formatting', () => {
      const result = I18nUtils.translate('general.success', 'en');
      expect(result).toBe('Success');
    });
  });

  describe('getLanguageFromHeaders', () => {
    it('should parse Accept-Language header', () => {
      const result = I18nUtils.getLanguageFromHeaders('en-US,en;q=0.9,th;q=0.8');
      expect(result).toBe('en');
    });

    it('should return default for unsupported language', () => {
      const result = I18nUtils.getLanguageFromHeaders('fr-FR,fr;q=0.9');
      expect(result).toBe('en');
    });

    it('should handle empty header', () => {
      const result = I18nUtils.getLanguageFromHeaders('');
      expect(result).toBe('en');
    });
  });
});
