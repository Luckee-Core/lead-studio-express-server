import { Router, Request, Response } from 'express';
import { getUserCreditsByUser } from './get-user-credits-by-user';
import { createCreditPurchase } from './create-credit-purchase';
import { createCreditDeduction } from './create-credit-deduction';

/**
 * Creates the user-credits router with URL paths and function calls
 * @returns Express router configured with user credits routes
 */
export const createUserCreditsRouter = (): Router => {
  const router = Router();

  /**
   * GET /user-credits?userId={uuid}
   * Get user credits for a specific user
   */
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.query;

      if (!userId || typeof userId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Missing or invalid userId query parameter',
          message: 'Validation failed',
        });
        return;
      }

      const userCredits = await getUserCreditsByUser(req.supabase, userId);

      if (!userCredits) {
        res.status(404).json({
          success: false,
          error: 'User credits not found',
          message: 'No credits record exists for this user',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: userCredits,
        message: 'User credits retrieved successfully',
      });
    } catch (error) {
      console.error('Error fetching user credits:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch user credits',
      });
    }
  });

  /**
   * POST /user-credits/purchases
   * Create a credit purchase and update balance
   */
  router.post('/purchases', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, user_id, amount, transaction_id, product_id, platform, status } = req.body;

      // Validate required fields
      if (!id || !user_id || !amount || !transaction_id || !product_id || !platform) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: id, user_id, amount, transaction_id, product_id, platform',
          message: 'Validation failed',
        });
        return;
      }

      const creditPurchase = await createCreditPurchase(req.supabase, {
        id,
        user_id,
        amount,
        transaction_id,
        product_id,
        platform,
        status,
      });

      res.status(201).json({
        success: true,
        data: creditPurchase,
        message: 'Credit purchase created successfully',
      });
    } catch (error) {
      console.error('Error creating credit purchase:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to create credit purchase',
      });
    }
  });

  /**
   * POST /user-credits/deductions
   * Create a credit deduction and update balance
   */
  router.post('/deductions', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, user_id, amount, reason, session_id, exchange_id } = req.body;

      // Validate required fields
      if (!id || !user_id || !amount || !reason) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: id, user_id, amount, reason',
          message: 'Validation failed',
        });
        return;
      }

      const creditDeduction = await createCreditDeduction(req.supabase, {
        id,
        user_id,
        amount,
        reason,
        session_id,
        exchange_id,
      });

      res.status(201).json({
        success: true,
        data: creditDeduction,
        message: 'Credit deduction created successfully',
      });
    } catch (error) {
      console.error('Error creating credit deduction:', error);
      
      // Handle specific error cases
      if (error instanceof Error && error.message === 'Insufficient credits') {
        res.status(402).json({
          success: false,
          error: 'Insufficient credits',
          message: 'User does not have enough credits for this operation',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to create credit deduction',
      });
    }
  });

  return router;
};
