import { FastifyInstance, FastifyReply } from 'fastify';
import { ExportImportService, ExportOptions } from '../services/ExportImportService';
import { ApiResponse, AuthenticatedRequest } from '../types';
import { I18nUtils } from '../utils/i18n';

export class ExportImportController {
  private exportImportService = new ExportImportService();

  /**
   * Export transactions
   */
  async exportTransactions(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const query = authedRequest.query as any;
      const options: ExportOptions = {
        format: query.format || 'csv',
        start_date: query.start_date,
        end_date: query.end_date,
        account_ids: query.account_ids ? query.account_ids.split(',').map(Number) : undefined,
        category_ids: query.category_ids ? query.category_ids.split(',').map(Number) : undefined,
        transaction_type: query.transaction_type || 'all',
        include_attachments: query.include_attachments === 'true'
      };

      const result = await this.exportImportService.exportTransactions(authedRequest.user.id, options);

      // Set appropriate headers for file download
      reply.header('Content-Disposition', `attachment; filename="${result.filename}"`);
      reply.header('Content-Type', result.mimeType);

      return reply.send(result.data);

    } catch (error) {
      authedRequest.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', authedRequest.user.language),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }

  /**
   * Import transactions
   */
  async importTransactions(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const query = authedRequest.query as any;
      const format = query.format || 'csv';

      // Get uploaded file
      const file = await authedRequest.file();
      
      if (!file) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('file.required', authedRequest.user.language),
          error: 'No file uploaded'
        };
        return reply.code(400).send(response);
      }

      // Validate file format
      const supportedFormats = ['excel', 'csv', 'json'];
      if (!supportedFormats.includes(format)) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('file.invalid_type', authedRequest.user.language),
          error: `Unsupported format: ${format}`
        };
        return reply.code(400).send(response);
      }

      // Read file buffer
      const buffer = await file.toBuffer();
      
      // Import transactions
      const result = await this.exportImportService.importTransactions(
        authedRequest.user.id, 
        buffer, 
        format as 'excel' | 'csv' | 'json'
      );

      const response: ApiResponse = {
        success: result.success,
        message: result.message,
        data: {
          imported_count: result.imported_count,
          failed_count: result.failed_count,
          errors: result.errors,
          imported_transactions: result.imported_transactions
        }
      };

      return reply.send(response);

    } catch (error) {
      authedRequest.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', authedRequest.user.language),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }

  /**
   * Get import template
   */
  async getImportTemplate(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const query = authedRequest.query as any;
      const format = query.format || 'csv';

      const result = await this.exportImportService.getImportTemplate(format as 'excel' | 'csv' | 'json');

      // Set appropriate headers for file download
      reply.header('Content-Disposition', `attachment; filename="${result.filename}"`);
      reply.header('Content-Type', result.mimeType);

      return reply.send(result.data);

    } catch (error) {
      authedRequest.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', authedRequest.user.language),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }

  /**
   * Get supported export/import formats
   */
  async getSupportedFormats(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const response: ApiResponse = {
        success: true,
        data: {
          export_formats: [
            {
              format: 'excel',
              extension: '.xlsx',
              mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              description: 'Microsoft Excel format'
            },
            {
              format: 'csv',
              extension: '.csv',
              mime_type: 'text/csv',
              description: 'Comma-separated values'
            },
            {
              format: 'json',
              extension: '.json',
              mime_type: 'application/json',
              description: 'JSON format'
            },
            {
              format: 'googlesheet',
              extension: '.json',
              mime_type: 'application/json',
              description: 'Google Sheets format'
            }
          ],
          import_formats: [
            {
              format: 'excel',
              extension: '.xlsx',
              mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              description: 'Microsoft Excel format'
            },
            {
              format: 'csv',
              extension: '.csv',
              mime_type: 'text/csv',
              description: 'Comma-separated values'
            },
            {
              format: 'json',
              extension: '.json',
              mime_type: 'application/json',
              description: 'JSON format'
            }
          ],
          max_file_size: '10MB',
          supported_columns: [
            'date', 'time', 'description', 'notes', 'amount', 'type',
            'account_name', 'category_name', 'location', 'tags',
            'is_recurring', 'recurring_pattern', 'reference_number'
          ]
        }
      };

      return reply.send(response);

    } catch (error) {
      authedRequest.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', authedRequest.user.language),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }
}
