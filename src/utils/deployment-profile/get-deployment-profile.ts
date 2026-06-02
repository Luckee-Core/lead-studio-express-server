/**
 * Per-deploy product shape (same codebase, different Railway env + Supabase schema).
 * Set DEPLOYMENT_PROFILE=luckee-core for minimal Luckee tenants (see luckee-central SQL bundle).
 */

export type DeploymentProfile = 'mentorai-full' | 'luckee-core';

/**
 * @returns mentorai-full when unset — all data routes and AI domains mounted.
 */
export const getDeploymentProfile = (): DeploymentProfile => {
  const raw = process.env.DEPLOYMENT_PROFILE?.trim().toLowerCase();
  if (raw === 'luckee-core' || raw === 'luckee_core') {
    return 'luckee-core';
  }
  return 'mentorai-full';
};
