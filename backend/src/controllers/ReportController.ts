import { FastifyInstance, FastifyReply } from 'fastify';
import { ApiResponse, AuthenticatedRequest } from '../types';
import { ReportService } from '../services/ReportService';

export class ReportController {
  private reportService = new ReportService();

  async getTransactionSummary(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { start_date, end_date, group_by, account_id, category_id, transaction_type } = authedRequest.query as any;

      const result = await this.reportService.getTransactionSummary(authedRequest.user.id, {
        start_date,
        end_date,
        group_by,
        account_id,
        category_id,
        transaction_type
      });

      const response: ApiResponse = {
        success: true,
        data: result
      };

      return reply.send(response);

    } catch (error) {
      authedRequest.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: 'Server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }

  async getDailySpending(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { month, year, target_monthly_spending } = authedRequest.query as any;

      const result = await this.reportService.getDailySpendingAnalysis(authedRequest.user.id, {
        month: parseInt(month) || new Date().getMonth() + 1,
        year: parseInt(year) || new Date().getFullYear(),
        target_monthly_spending: target_monthly_spending ? parseFloat(target_monthly_spending) : undefined
      });

      const response: ApiResponse = {
        success: true,
        data: result
      };

      return reply.send(response);

    } catch (error) {
      authedRequest.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: 'Server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }

  async getAccountSummary(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.reportService.getAccountSummary(authedRequest.user.id);

      const response: ApiResponse = {
        success: true,
        data: result
      };

      return reply.send(response);

    } catch (error) {
      authedRequest.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: 'Server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }

  async getCategorySpending(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { start_date, end_date, transaction_type } = authedRequest.query as any;

      const result = await this.reportService.getCategorySpending(authedRequest.user.id, {
        start_date,
        end_date,
        transaction_type
      });

      const response: ApiResponse = {
        success: true,
        data: result
      };

      return reply.send(response);

    } catch (error) {
      authedRequest.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: 'Server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }
}
