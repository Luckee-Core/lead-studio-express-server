import { Router, Request, Response } from 'express';
import { routeParam } from '../../utils/express/route-param';
import { getUserById } from './get-user-by-id';
import { getAllUsers } from './get-all-users';
import { createUser } from './create-user';
import { updateUser } from './update-user';

/**
 * Creates the users router with URL paths and function calls
 * @returns Express router configured with user routes
 */
export const createUsersRouter = (): Router => {
  const router = Router();

  /**
   * GET /users
   * Get all users (list)
   */
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await getAllUsers(req.supabase);

      res.status(200).json({
        success: true,
        data: users,
        count: users.length,
        message: 'Users retrieved successfully',
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch users',
      });
    }
  });

  /**
   * GET /users/:userId
   * Get user by ID
   */
  router.get('/:userId', async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = routeParam(req.params.userId);
      const user = await getUserById(req.supabase, userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          message: `User with ID ${userId} does not exist`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
        message: 'User retrieved successfully',
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch user',
      });
    }
  });

  /**
   * POST /users
   * Create new user
   */
  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, email, name, provider, image } = req.body;

      // Validate required fields
      if (!id || !email || !name || !provider) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: id, email, name, provider',
          message: 'Validation failed',
        });
        return;
      }

      const allowedProviders = new Set(['google', 'apple', 'email']);
      if (!allowedProviders.has(provider)) {
        res.status(400).json({
          success: false,
          error: 'provider must be google, apple, or email',
          message: 'Validation failed',
        });
        return;
      }

      const user = await createUser(req.supabase, {
        id,
        email,
        name,
        provider,
        image,
      });

      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully',
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to create user',
      });
    }
  });

  /**
   * PATCH /users/:userId
   * Update user fields
   */
  router.patch('/:userId', async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = routeParam(req.params.userId);
      const { email, name, image } = req.body;

      // Validate that at least one field is provided
      if (email === undefined && name === undefined && image === undefined) {
        res.status(400).json({
          success: false,
          error: 'At least one field (email, name, or image) must be provided',
          message: 'Validation failed',
        });
        return;
      }

      const user = await updateUser(req.supabase, {
        user_id: userId,
        email,
        name,
        image,
      });

      res.status(200).json({
        success: true,
        data: user,
        message: 'User updated successfully',
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to update user',
      });
    }
  });

  return router;
};
