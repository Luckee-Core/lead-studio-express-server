import express from 'express';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = Number(process.env.PORT) || 3032;

import { setupEarlyMiddleware } from './src/services/middleware';
setupEarlyMiddleware(app);

import { attachSupabaseClient } from './src/services/supabase/create-supabase-client';
app.use(attachSupabaseClient);

if (process.env.NODE_ENV !== 'production') {
  const { devAuthBypass } = require('./src/services/auth');
  app.use(devAuthBypass);
}

import { createHealthRouter } from './src/services/health';
app.use('/', createHealthRouter());
app.use('/api/health', createHealthRouter());

import { createDataService } from './src/data';
app.use('/api/data', createDataService());

import { createServicesHttpRouter } from './src/services/services-http';
app.use('/api/services', createServicesHttpRouter());

import { createFacebookPageDetailsScraperRouter } from './src/domains/facebook-page-details';
import { createFacebookPostsScraperRouter } from './src/domains/facebook-posts';
app.use('/api/scrapers/facebook-page-details', createFacebookPageDetailsScraperRouter());
app.use('/api/scrapers/facebook-posts', createFacebookPostsScraperRouter());

import { createEmailRouter } from './src/services/email';
app.use('/api/email', createEmailRouter());

import { createGmailPushRouter } from './src/services/email/webhook';
app.use('/api/webhooks', createGmailPushRouter());

import { createCronRouter } from './src/services/cron';
app.use('/api/cron', createCronRouter());

import { createLeadContactChatRouter } from './src/domains/lead-contact-chat/router';
app.use('/api/lead-contact-chat', createLeadContactChatRouter());

import { setupErrorHandling } from './src/services/middleware';
setupErrorHandling(app);

const initializeApp = async () => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const { setupDevUser } = await import('./src/services/dev-user');
      await setupDevUser();
    }

    const { startServer } = await import('./src/services/server');
    startServer(app, {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

initializeApp();

export default app;
