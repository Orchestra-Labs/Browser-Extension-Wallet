import { DelegationResponse, ValidatorInfo } from '@/types';
import { queryRestNode } from './queryNodes';
import { CHAIN_ENDPOINTS } from '@/constants';

// Fetch delegations (staked assets) from either the REST or RPC endpoint
export const fetchDelegations = async (
  delegatorAddress: string,
  validatorAddress?: string,
): Promise<{ delegations: DelegationResponse[]; pagination: any }> => {
  try {
    let endpoint = `${CHAIN_ENDPOINTS.getDelegations}${delegatorAddress}`;

    // If a validatorAddress is provided, modify the endpoint to fetch delegation for that specific validator
    if (validatorAddress) {
      endpoint = `${CHAIN_ENDPOINTS.getSpecificDelegations}${delegatorAddress}/delegations/${validatorAddress}`;
    }

    console.log(
      'Fetching delegations for delegator:',
      delegatorAddress,
      'Validator:',
      validatorAddress || 'all',
    );

    const response = await queryRestNode({ endpoint });

    console.log('Delegation response:', response);

    return {
      delegations: response.delegation_responses.map((item: any) => {
        console.log('Delegation recorded as:', item);

        return {
          delegation: item.delegation,
          balance: item.balance,
        };
      }),
      pagination: response.pagination,
    };
  } catch (error) {
    console.error(`Error fetching delegations for ${delegatorAddress}:`, error);
    throw error;
  }
};

// Fetch validator details using either the REST or RPC endpoint
export const fetchValidators = async (
  validatorAddress?: string,
): Promise<{ validators: ValidatorInfo[]; pagination: any }> => {
  try {
    let endpoint = `${CHAIN_ENDPOINTS.getValidators}`;

    // If a specific validatorAddress is provided, modify the endpoint to fetch that validator's info
    if (validatorAddress) {
      endpoint = `${CHAIN_ENDPOINTS.getValidators}/${validatorAddress}`;
    }

    console.log('Fetching validator(s) info for:', validatorAddress || 'all validators');

    const response = await queryRestNode({ endpoint });

    console.log('Validator(s) response:', response);

    // Handle the case when fetching all validators or a single validator
    const validators = validatorAddress
      ? [response.validator] // Return as an array when fetching a single validator
      : response.validators; // Return the validators array when fetching all

    return {
      validators: validators.map((validator: any) => {
        console.log('Validator recorded as:', validator);
        return validator;
      }),
      pagination: response.pagination,
    };
  } catch (error) {
    console.error(
      `Error fetching validator info for ${validatorAddress || 'all validators'}:`,
      error,
    );
    throw error;
  }
};
