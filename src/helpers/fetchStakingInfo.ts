import { queryNode } from './queryNodes'; // Use queryNode helper
import { DelegationResponse, ValidatorInfo } from '@/types';

// Fetch delegations (staked assets) from either the REST or RPC endpoint
export const fetchDelegations = async (
  delegatorAddress: string,
): Promise<{ delegations: DelegationResponse[]; pagination: any }> => {
  try {
    console.log('Fetching delegations for delegator:', delegatorAddress);
    const endpoint = `/cosmos/staking/v1beta1/delegations/${delegatorAddress}`;
    const response = await queryNode(endpoint);

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
export const fetchValidatorInfo = async (validatorAddress: string): Promise<ValidatorInfo> => {
  try {
    console.log('Fetching validator info for validator:', validatorAddress);
    const endpoint = `/cosmos/staking/v1beta1/validators/${validatorAddress}`;
    const response = await queryNode(endpoint);

    console.log('Validator response:', response);

    return response.validator;
  } catch (error) {
    console.error(`Error fetching validator info for ${validatorAddress}:`, error);
    throw error;
  }
};

export const fetchAllValidators = async (): Promise<{
  validators: ValidatorInfo[];
  pagination: any;
}> => {
  try {
    console.log('Fetching all validators');
    const endpoint = `/cosmos/staking/v1beta1/validators`;
    const response = await queryNode(endpoint);

    console.log('All validators response:', response);

    return {
      validators: response.validators.map((validator: any) => {
        console.log('Validator recorded as:', validator);
        return validator;
      }),
      pagination: response.pagination,
    };
  } catch (error) {
    console.error('Error fetching all validators:', error);
    throw error;
  }
};
