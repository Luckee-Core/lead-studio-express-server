/**
 * Start Server
 * Initializes and starts the Express server
 */

import { Express } from 'express';
import { getOpenTrackingBaseUrl } from '../email/open-tracking';

interface ServerConfig {
  port: number;
  environment: string;
}

export const startServer = (app: Express, config: ServerConfig): void => {
  const { port, environment } = config;

  app.listen(port, () => {
    console.log('');
    console.log('='.repeat(50));
    console.log(`🚀 TroutHouseTech Express Server`);
    console.log('='.repeat(50));
    console.log(`Environment: ${environment}`);
    console.log(`Port: ${port}`);
    console.log(`URL: http://localhost:${port}`);
    console.log(`Health Check: http://localhost:${port}/api/health`);
    const openTrackingBase = getOpenTrackingBaseUrl();
    if (openTrackingBase) {
      console.log(`📬 Email open tracking: ON → ${openTrackingBase}/api/email/open`);
    } else {
      console.log('📬 Email open tracking: OFF (set EMAIL_OPEN_TRACKING_BASE_URL)');
    }
    console.log('='.repeat(50));
    console.log('');
  });
};
