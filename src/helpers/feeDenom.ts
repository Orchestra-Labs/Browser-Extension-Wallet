import { LOCAL_ASSET_REGISTRY } from '@/constants';

export const getValidFeeDenom = (sendDenom?: string): string => {
  // Check if sendDenom exists in registry and is a fee token
  if (sendDenom && LOCAL_ASSET_REGISTRY[sendDenom]?.isFeeToken) {
    return sendDenom;
  }
  
  // Default to note if sendDenom isn't valid fee token
  return LOCAL_ASSET_REGISTRY.note.denom;
};