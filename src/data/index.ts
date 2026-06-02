import { Router } from 'express';
import { createLeadStudioDataService } from './lead-studio-data-service';

/**
 * Creates the data service router for Lead Studio OSS.
 */
export const createDataService = (): Router => createLeadStudioDataService();
