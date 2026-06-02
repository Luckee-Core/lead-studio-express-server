export { getAllCampaignEmailVariations } from './get-all';
export { getCampaignEmailVariationById, type CampaignEmailVariation } from './get-by-id';
export {
  createCampaignEmailVariation,
  type CreateCampaignEmailVariationInput,
} from './create';
export {
  updateCampaignEmailVariation,
  type UpdateCampaignEmailVariationInput,
} from './update';
export { deleteCampaignEmailVariation } from './delete';
export { pickRandomCampaignEmailVariation } from './pick-random';
export { createCampaignEmailVariationsRouter } from './router';
