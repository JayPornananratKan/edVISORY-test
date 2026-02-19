// Internationalization utility for multi-language support

// Define translation key types for type safety
type TranslationKey = 
  | 'auth.login_success' | 'auth.login_failed' | 'auth.logout_success' | 'auth.session_expired'
  | 'auth.invalid_credentials' | 'auth.user_not_found' | 'auth.account_locked' | 'auth.registration_success'
  | 'auth.email_already_exists' | 'auth.username_already_exists' | 'auth.password_updated'
  | 'auth.device_not_found' | 'auth.session_not_found' | 'auth.username_exists' | 'auth.email_exists'
  | 'auth.logout_all_success'
  | 'general.success' | 'general.error' | 'general.not_found' | 'general.unauthorized'
  | 'general.forbidden' | 'general.server_error' | 'general.validation_error' | 'general.created'
  | 'general.updated' | 'general.deleted' | 'general.no_data' | 'general.invalid_request'
  | 'general.required_field' | 'general.conflict' | 'general.foreign_key_violation'
  | 'account.created' | 'account.updated' | 'account.deleted' | 'account.not_found'
  | 'account.insufficient_balance' | 'account.cannot_delete_with_transactions' | 'account.name_required'
  | 'account.type_required'
  | 'category.created' | 'category.updated' | 'category.deleted' | 'category.not_found'
  | 'category.has_transactions' | 'category.name_required' | 'category.parent_not_found'
  | 'category.circular_reference' | 'category.type_mismatch' | 'category.has_children'
  | 'transaction.created' | 'transaction.updated' | 'transaction.deleted' | 'transaction.not_found'
  | 'transaction.account_not_found' | 'transaction.category_not_found' | 'transaction.amount_required'
  | 'transaction.type_required' | 'transaction.date_required' | 'transaction.invalid_amount'
  | 'transaction.invalid_date' | 'transaction.attachment_not_found' | 'transaction.attachment_too_large'
  | 'transaction.invalid_file_type'
  | 'report.no_data' | 'report.invalid_date_range' | 'report.export_success' | 'report.import_success'
  | 'report.import_failed' | 'report.invalid_format'
  | 'budget.created' | 'budget.updated' | 'budget.deleted' | 'budget.not_found'
  | 'budget.category_not_found' | 'budget.amount_required' | 'budget.invalid_period'
  | 'file.upload_success' | 'file.upload_failed' | 'file.not_found' | 'file.too_large'
  | 'file.invalid_type' | 'file.corrupted' | 'file.required'
  | 'pagination.page_info' | 'pagination.showing' | 'pagination.no_results' | 'pagination.previous'
  | 'pagination.next'
  | 'date.today' | 'date.yesterday' | 'date.this_month' | 'date.last_month' | 'date.this_year'
  | 'date.last_year' | 'date.custom_range'
  | 'validation.email_invalid' | 'validation.password_weak' | 'validation.password_mismatch'
  | 'validation.username_invalid' | 'validation.phone_invalid' | 'validation.url_invalid'
  | 'validation.date_invalid' | 'validation.number_invalid' | 'validation.min_length'
  | 'validation.max_length' | 'validation.min_value' | 'validation.max_value'
  | 'error.database_connection' | 'error.external_service' | 'error.rate_limit_exceeded'
  | 'error.maintenance_mode' | 'error.feature_disabled'
  | 'success.settings_updated' | 'success.profile_updated' | 'success.preferences_updated'
  | 'success.data_exported' | 'success.data_imported';

type TranslationObject = Record<TranslationKey, string>;
type Translations = Record<'en' | 'th', TranslationObject>;

export class I18nUtils {
  private static readonly DEFAULT_LANGUAGE = 'en';
  private static readonly SUPPORTED_LANGUAGES = ['en', 'th'];

  // Translation strings
  private static readonly translations: Translations = {
    en: {
      // Authentication
      'auth.login_success': 'Login successful',
      'auth.login_failed': 'Login failed',
      'auth.logout_success': 'Logout successful',
      'auth.session_expired': 'Session expired',
      'auth.invalid_credentials': 'Invalid credentials',
      'auth.user_not_found': 'User not found',
      'auth.account_locked': 'Account locked due to too many failed attempts',
      'auth.registration_success': 'Registration successful',
      'auth.email_already_exists': 'Email already exists',
      'auth.username_already_exists': 'Username already exists',
      'auth.username_exists': 'Username already exists',
      'auth.email_exists': 'Email already exists',
      'auth.logout_all_success': 'Logged out from all devices successfully',
      'auth.password_updated': 'Password updated successfully',
      'auth.device_not_found': 'Device not found',
      'auth.session_not_found': 'Session not found',
      
      // General
      'general.success': 'Success',
      'general.error': 'Error',
      'general.not_found': 'Not found',
      'general.unauthorized': 'Unauthorized',
      'general.forbidden': 'Forbidden',
      'general.server_error': 'Internal server error',
      'general.validation_error': 'Validation error',
      'general.created': 'Created successfully',
      'general.updated': 'Updated successfully',
      'general.deleted': 'Deleted successfully',
      'general.no_data': 'No data found',
      'general.invalid_request': 'Invalid request',
      'general.required_field': 'This field is required',
      'general.conflict': 'Conflict with existing data',
      'general.foreign_key_violation': 'Referenced data does not exist',
      
      // Accounts
      'account.created': 'Account created successfully',
      'account.updated': 'Account updated successfully',
      'account.deleted': 'Account deleted successfully',
      'account.not_found': 'Account not found',
      'account.insufficient_balance': 'Insufficient balance',
      'account.cannot_delete_with_transactions': 'Cannot delete account with existing transactions',
      'account.name_required': 'Account name is required',
      'account.type_required': 'Account type is required',
      
      // Categories
      'category.created': 'Category created successfully',
      'category.updated': 'Category updated successfully',
      'category.deleted': 'Category deleted successfully',
      'category.not_found': 'Category not found',
      'category.has_transactions': 'Cannot delete category with existing transactions',
      'category.name_required': 'Category name is required',
      'category.parent_not_found': 'Parent category not found',
      'category.circular_reference': 'Circular reference detected',
      'category.type_mismatch': 'Category type mismatch with parent category',
      'category.has_children': 'Cannot delete category with subcategories',
      
      // Transactions
      'transaction.created': 'Transaction created successfully',
      'transaction.updated': 'Transaction updated successfully',
      'transaction.deleted': 'Transaction deleted successfully',
      'transaction.not_found': 'Transaction not found',
      'transaction.account_not_found': 'Account not found',
      'transaction.category_not_found': 'Category not found',
      'transaction.amount_required': 'Amount is required',
      'transaction.type_required': 'Transaction type is required',
      'transaction.date_required': 'Transaction date is required',
      'transaction.invalid_amount': 'Amount must be greater than 0',
      'transaction.invalid_date': 'Invalid date format',
      'transaction.attachment_not_found': 'Attachment not found',
      'transaction.attachment_too_large': 'File size too large',
      'transaction.invalid_file_type': 'Invalid file type',
      
      // Reports
      'report.no_data': 'No data available for the selected period',
      'report.invalid_date_range': 'Invalid date range',
      'report.export_success': 'Export completed successfully',
      'report.import_success': 'Import completed successfully',
      'report.import_failed': 'Import failed',
      'report.invalid_format': 'Invalid file format',
      
      // Budgets
      'budget.created': 'Budget created successfully',
      'budget.updated': 'Budget updated successfully',
      'budget.deleted': 'Budget deleted successfully',
      'budget.not_found': 'Budget not found',
      'budget.category_not_found': 'Category not found',
      'budget.amount_required': 'Budget amount is required',
      'budget.invalid_period': 'Invalid budget period',
      
      // File Upload
      'file.upload_success': 'File uploaded successfully',
      'file.upload_failed': 'File upload failed',
      'file.not_found': 'File not found',
      'file.too_large': 'File size exceeds maximum limit',
      'file.invalid_type': 'Invalid file type',
      'file.corrupted': 'File appears to be corrupted',
      'file.required': 'File is required',
      
      // Pagination
      'pagination.page_info': 'Page {{page}} of {{totalPages}}',
      'pagination.showing': 'Showing {{start}} to {{end}} of {{total}} items',
      'pagination.no_results': 'No results found',
      'pagination.previous': 'Previous',
      'pagination.next': 'Next',
      
      // Date & Time
      'date.today': 'Today',
      'date.yesterday': 'Yesterday',
      'date.this_month': 'This Month',
      'date.last_month': 'Last Month',
      'date.this_year': 'This Year',
      'date.last_year': 'Last Year',
      'date.custom_range': 'Custom Range',
      
      // Validation Messages
      'validation.email_invalid': 'Please enter a valid email address',
      'validation.password_weak': 'Password is too weak',
      'validation.password_mismatch': 'Passwords do not match',
      'validation.username_invalid': 'Username contains invalid characters',
      'validation.phone_invalid': 'Please enter a valid phone number',
      'validation.url_invalid': 'Please enter a valid URL',
      'validation.date_invalid': 'Please enter a valid date',
      'validation.number_invalid': 'Please enter a valid number',
      'validation.min_length': 'Must be at least {{min}} characters',
      'validation.max_length': 'Must not exceed {{max}} characters',
      'validation.min_value': 'Must be at least {{min}}',
      'validation.max_value': 'Must not exceed {{max}}',
      
      // Error Messages
      'error.database_connection': 'Database connection failed',
      'error.external_service': 'External service unavailable',
      'error.rate_limit_exceeded': 'Rate limit exceeded. Please try again later',
      'error.maintenance_mode': 'System is under maintenance',
      'error.feature_disabled': 'This feature is currently disabled',
      
      // Success Messages
      'success.settings_updated': 'Settings updated successfully',
      'success.profile_updated': 'Profile updated successfully',
      'success.preferences_updated': 'Preferences updated successfully',
      'success.data_exported': 'Data exported successfully',
      'success.data_imported': 'Data imported successfully',
    },
    
    th: {
      // Authentication
      'auth.login_success': 'เข้าสู่ระบบสำเร็จ',
      'auth.login_failed': 'เข้าสู่ระบบล้มเหลว',
      'auth.logout_success': 'ออกจากระบบสำเร็จ',
      'auth.session_expired': 'หมดเวลาใช้งาน',
      'auth.invalid_credentials': 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง',
      'auth.user_not_found': 'ไม่พบผู้ใช้',
      'auth.account_locked': 'บัญชีถูกล็อกเนื่องจากพยายามเข้าสู่ระบบหลายครั้งเกินไป',
      'auth.registration_success': 'สมัครสมาชิกสำเร็จ',
      'auth.email_already_exists': 'อีเมลนี้มีผู้ใช้แล้ว',
      'auth.username_already_exists': 'ชื่อผู้ใช้นี้มีผู้ใช้แล้ว',
      'auth.username_exists': 'ชื่อผู้ใช้นี้มีผู้ใช้แล้ว',
      'auth.email_exists': 'อีเมลนี้มีผู้ใช้แล้ว',
      'auth.logout_all_success': 'ออกจากระบบจากทุกอุปกรณ์สำเร็จ',
      'auth.password_updated': 'อัปเดตรหัสผ่านสำเร็จ',
      'auth.device_not_found': 'ไม่พบอุปกรณ์',
      'auth.session_not_found': 'ไม่พบเซสชัน',
      
      // General
      'general.success': 'สำเร็จ',
      'general.error': 'ข้อผิดพลาด',
      'general.not_found': 'ไม่พบข้อมูล',
      'general.unauthorized': 'ไม่มีสิทธิ์เข้าถึง',
      'general.forbidden': 'ถูกปฏิเสธ',
      'general.server_error': 'ข้อผิดพลาดภายในเซิร์ฟเวอร์',
      'general.validation_error': 'ข้อผิดพลาดในการตรวจสอบ',
      'general.created': 'สร้างสำเร็จ',
      'general.updated': 'อัปเดตสำเร็จ',
      'general.deleted': 'ลบสำเร็จ',
      'general.no_data': 'ไม่พบข้อมูล',
      'general.invalid_request': 'คำขอไม่ถูกต้อง',
      'general.required_field': 'จำเป็นต้องกรอกข้อมูลในช่องนี้',
      'general.conflict': 'ข้อมูลซ้ำกับที่มีอยู่',
      'general.foreign_key_violation': 'ข้อมูลอ้างอิงไม่พบ',
      
      // Accounts
      'account.created': 'สร้างบัญชีสำเร็จ',
      'account.updated': 'อัปเดตบัญชีสำเร็จ',
      'account.deleted': 'ลบบัญชีสำเร็จ',
      'account.not_found': 'ไม่พบบัญชี',
      'account.insufficient_balance': 'ยอดเงินไม่เพียงพอ',
      'account.cannot_delete_with_transactions': 'ไม่สามารถลบบัญชีที่มีรายการเงินอยู่ได้',
      'account.name_required': 'จำเป็นต้องระบุชื่อบัญชี',
      'account.type_required': 'จำเป็นต้องระบุประเภทบัญชี',
      
      // Categories
      'category.created': 'สร้างหมวดหมู่สำเร็จ',
      'category.updated': 'อัปเดตหมวดหมู่สำเร็จ',
      'category.deleted': 'ลบหมวดหมู่สำเร็จ',
      'category.not_found': 'ไม่พบหมวดหมู่',
      'category.has_transactions': 'ไม่สามารถลบหมวดหมู่ที่มีรายการเงินอยู่ได้',
      'category.name_required': 'จำเป็นต้องระบุชื่อหมวดหมู่',
      'category.parent_not_found': 'ไม่พบหมวดหมู่หลัก',
      'category.circular_reference': 'พบการอ้างอิงแบบวงกลม',
      'category.type_mismatch': 'ประเภทหมวดหมู่ไม่ตรงกับหมวดหมู่หลัก',
      'category.has_children': 'ไม่สามารถลบหมวดหมู่ที่มีหมวดหมู่ย่อยอยู่ได้',
      
      // Transactions
      'transaction.created': 'สร้างรายการเงินสำเร็จ',
      'transaction.updated': 'อัปเดตรายการเงินสำเร็จ',
      'transaction.deleted': 'ลบรายการเงินสำเร็จ',
      'transaction.not_found': 'ไม่พบรายการเงิน',
      'transaction.account_not_found': 'ไม่พบบัญชี',
      'transaction.category_not_found': 'ไม่พบหมวดหมู่',
      'transaction.amount_required': 'จำเป็นต้องระบุจำนวนเงิน',
      'transaction.type_required': 'จำเป็นต้องระบุประเภทรายการ',
      'transaction.date_required': 'จำเป็นต้องระบุวันที่',
      'transaction.invalid_amount': 'จำนวนเงินต้องมากกว่า 0',
      'transaction.invalid_date': 'รูปแบบวันที่ไม่ถูกต้อง',
      'transaction.attachment_not_found': 'ไม่พบไฟล์แนบ',
      'transaction.attachment_too_large': 'ขนาดไฟล์ใหญ่เกินไป',
      'transaction.invalid_file_type': 'ประเภทไฟล์ไม่ถูกต้อง',
      
      // Reports
      'report.no_data': 'ไม่มีข้อมูลในช่วงเวลาที่เลือก',
      'report.invalid_date_range': 'ช่วงวันที่ไม่ถูกต้อง',
      'report.export_success': 'ส่งออกข้อมูลสำเร็จ',
      'report.import_success': 'นำเข้าข้อมูลสำเร็จ',
      'report.import_failed': 'นำเข้าข้อมูลล้มเหลว',
      'report.invalid_format': 'รูปแบบไฟล์ไม่ถูกต้อง',
      
      // Budgets
      'budget.created': 'สร้างงบประมาณสำเร็จ',
      'budget.updated': 'อัปเดตงบประมาณสำเร็จ',
      'budget.deleted': 'ลบงบประมาณสำเร็จ',
      'budget.not_found': 'ไม่พบงบประมาณ',
      'budget.category_not_found': 'ไม่พบหมวดหมู่',
      'budget.amount_required': 'จำเป็นต้องระบุจำนวนงบประมาณ',
      'budget.invalid_period': 'ช่วงเวลางบประมาณไม่ถูกต้อง',
      
      // File Upload
      'file.upload_success': 'อัปโหลดไฟล์สำเร็จ',
      'file.upload_failed': 'อัปโหลดไฟล์ล้มเหลว',
      'file.not_found': 'ไม่พบไฟล์',
      'file.too_large': 'ขนาดไฟล์เกินขีดจำกัด',
      'file.invalid_type': 'ประเภทไฟล์ไม่ถูกต้อง',
      'file.corrupted': 'ไฟล์อาจเสียหาย',
      'file.required': 'จำเป็นต้องมีไฟล์',
      
      // Pagination
      'pagination.page_info': 'หน้า {{page}} จาก {{totalPages}}',
      'pagination.showing': 'แสดง {{start}} ถึง {{end}} จาก {{total}} รายการ',
      'pagination.no_results': 'ไม่พบข้อมูล',
      'pagination.previous': 'ก่อนหน้า',
      'pagination.next': 'ถัดไป',
      
      // Date & Time
      'date.today': 'วันนี้',
      'date.yesterday': 'เมื่อวาน',
      'date.this_month': 'เดือนนี้',
      'date.last_month': 'เดือนที่แล้ว',
      'date.this_year': 'ปีนี้',
      'date.last_year': 'ปีที่แล้ว',
      'date.custom_range': 'กำหนดช่วงเวลา',
      
      // Validation Messages
      'validation.email_invalid': 'กรุณากรอกอีเมลให้ถูกต้อง',
      'validation.password_weak': 'รหัสผ่านไม่ปลอดภัยเพียงพอ',
      'validation.password_mismatch': 'รหัสผ่านไม่ตรงกัน',
      'validation.username_invalid': 'ชื่อผู้ใช้มีอักขระที่ไม่อนุญาต',
      'validation.phone_invalid': 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง',
      'validation.url_invalid': 'กรุณากรอก URL ให้ถูกต้อง',
      'validation.date_invalid': 'กรุณากรอกวันที่ให้ถูกต้อง',
      'validation.number_invalid': 'กรุณากรอกตัวเลขให้ถูกต้อง',
      'validation.min_length': 'ต้องมีความยาวอย่างน้อย {{min}} ตัวอักษร',
      'validation.max_length': 'ต้องไม่เกิน {{max}} ตัวอักษร',
      'validation.min_value': 'ต้องมีค่าอย่างน้อย {{min}}',
      'validation.max_value': 'ต้องไม่เกิน {{max}}',
      
      // Error Messages
      'error.database_connection': 'เชื่อมต่อฐานข้อมูลล้มเหลว',
      'error.external_service': 'บริการภายนอกไม่พร้อมใช้งาน',
      'error.rate_limit_exceeded': 'เกินขีดจำกัดการใช้งาน กรุณาลองใหม่ภายหลัง',
      'error.maintenance_mode': 'ระบบอยู่ระหว่างการปรับปรุง',
      'error.feature_disabled': 'ฟีเจอร์นี้ปิดใช้งานชั่วคราว',
      
      // Success Messages
      'success.settings_updated': 'อัปเดตการตั้งค่าสำเร็จ',
      'success.profile_updated': 'อัปเดตโปรไฟล์สำเร็จ',
      'success.preferences_updated': 'อัปเดตการตั้งค่าส่วนตัวสำเร็จ',
      'success.data_exported': 'ส่งออกข้อมูลสำเร็จ',
      'success.data_imported': 'นำเข้าข้อมูลสำเร็จ',
    }
  };

  /**
   * Get translation for a key in specified language
   */
  static translate(key: TranslationKey, language: string = this.DEFAULT_LANGUAGE, params?: Record<string, any>): string {
    const lang = this.SUPPORTED_LANGUAGES.includes(language) ? language : this.DEFAULT_LANGUAGE;
    const translation = this.translations[lang as keyof Translations]?.[key] || this.translations[this.DEFAULT_LANGUAGE]?.[key] || key;
    
    // Replace parameters in translation
    if (params) {
      return this.interpolate(translation, params);
    }
    
    return translation;
  }

  /**
   * Interpolate parameters into translation string
   */
  private static interpolate(text: string, params: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match;
    });
  }

  /**
   * Get supported languages
   */
  static getSupportedLanguages(): string[] {
    return [...this.SUPPORTED_LANGUAGES];
  }

  /**
   * Check if language is supported
   */
  static isLanguageSupported(language: string): boolean {
    return this.SUPPORTED_LANGUAGES.includes(language);
  }

  /**
   * Get default language
   */
  static getDefaultLanguage(): string {
    return this.DEFAULT_LANGUAGE;
  }

  /**
   * Get language from request headers
   */
  static getLanguageFromHeaders(acceptLanguage?: string): string {
    if (!acceptLanguage) return this.DEFAULT_LANGUAGE;
    
    // Parse Accept-Language header
    const languages = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().toLowerCase())
      .filter(lang => this.SUPPORTED_LANGUAGES.includes(lang));
    
    return languages[0] || this.DEFAULT_LANGUAGE;
  }

  /**
   * Format date according to language
   */
  static formatDate(date: Date, language: string = this.DEFAULT_LANGUAGE): string {
    const lang = this.SUPPORTED_LANGUAGES.includes(language) ? language : this.DEFAULT_LANGUAGE;
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    if (lang === 'th') {
      return date.toLocaleDateString('th-TH', options);
    } else {
      return date.toLocaleDateString('en-US', options);
    }
  }

  /**
   * Format number according to language
   */
  static formatNumber(number: number, language: string = this.DEFAULT_LANGUAGE, decimals: number = 2): string {
    const lang = this.SUPPORTED_LANGUAGES.includes(language) ? language : this.DEFAULT_LANGUAGE;
    
    return number.toLocaleString(lang === 'th' ? 'th-TH' : 'en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  /**
   * Format currency according to language
   */
  static formatCurrency(amount: number, currency: string = 'THB', language: string = this.DEFAULT_LANGUAGE): string {
    const lang = this.SUPPORTED_LANGUAGES.includes(language) ? language : this.DEFAULT_LANGUAGE;
    
    return amount.toLocaleString(lang === 'th' ? 'th-TH' : 'en-US', {
      style: 'currency',
      currency: currency
    });
  }

  /**
   * Get localized error message
   */
  static getErrorMessage(errorKey: string, language: string = this.DEFAULT_LANGUAGE): string {
    return this.translate(`error.${errorKey}` as TranslationKey, language);
  }

  /**
   * Get localized success message
   */
  static getSuccessMessage(successKey: string, language: string = this.DEFAULT_LANGUAGE): string {
    return this.translate(`success.${successKey}` as TranslationKey, language);
  }

  /**
   * Get localized validation message
   */
  static getValidationMessage(validationKey: string, language: string = this.DEFAULT_LANGUAGE, params?: Record<string, any>): string {
    return this.translate(`validation.${validationKey}` as TranslationKey, language, params);
  }

  /**
   * Add custom translations
   */
  static addTranslations(language: string, translations: Record<string, string>): void {
    const langKey = language as keyof Translations;
    if (!this.translations[langKey]) {
      (this.translations as any)[langKey] = {};
    }
    
    Object.assign(this.translations[langKey], translations);
  }

  /**
   * Get all translations for a language
   */
  static getAllTranslations(language: string): Record<string, string> {
    const langKey = language as keyof Translations;
    return this.translations[langKey] || {};
  }
}
