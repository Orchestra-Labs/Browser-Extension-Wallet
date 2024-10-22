import { CombinedStakingInfo, DelegationResponse, ValidatorInfo } from '@/types';
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

// Fetch rewards for delegations
export const fetchRewards = async (
  delegatorAddress: string,
  delegations?: { validator_address: string }[],
): Promise<{ validator: string; rewards: any[] }[]> => {
  try {
    let endpoint = `${CHAIN_ENDPOINTS.getRewards}/${delegatorAddress}/rewards`;

    // If specific delegations (validators) are provided, query rewards for each validator separately
    if (delegations && delegations.length > 0) {
      const rewardsPromises = delegations.map(async delegation => {
        const specificEndpoint = `${CHAIN_ENDPOINTS.getRewards}/${delegatorAddress}/rewards/${delegation.validator_address}`;
        const response = await queryRestNode({ endpoint: specificEndpoint });
        return {
          validator: delegation.validator_address,
          rewards: response.rewards || [],
        };
      });

      const rewardsData = await Promise.all(rewardsPromises);
      console.log('Fetched rewards for specific delegations:', rewardsData);
      return rewardsData;
    }

    // Fetch all rewards for the delegator
    const response = await queryRestNode({ endpoint });
    console.log('Fetched all rewards for delegator:', response);

    // Process the response and map rewards for each validator
    return response.rewards.map((reward: any) => ({
      validator: reward.validator_address,
      rewards: reward.reward || [],
    }));
  } catch (error) {
    console.error(`Error fetching rewards for ${delegatorAddress}:`, error);
    throw error;
  }
};

export const fetchStakingData = async (
  delegatorAddress: string,
): Promise<CombinedStakingInfo[]> => {
  try {
    const { delegations } = await fetchDelegations(delegatorAddress);
    const validatorPromises = delegations.map(delegation =>
      fetchValidators(delegation.delegation.validator_address),
    );
    const validatorResults = await Promise.all(validatorPromises);
    const validators = validatorResults.flatMap(result => result.validators);
    const delegationAddresses = delegations.map(delegation => ({
      validator_address: delegation.delegation.validator_address,
    }));
    const rewards = await fetchRewards(delegatorAddress, delegationAddresses);

    // Combine delegations, validators, and rewards into one object per validator
    const combinedData: CombinedStakingInfo[] = delegations.map(delegation => {
      const validatorInfo =
        validators.find(
          validator => validator.operator_address === delegation.delegation.validator_address,
        ) || ({} as ValidatorInfo);
      const rewardInfo = rewards.find(
        reward => reward.validator === delegation.delegation.validator_address,
      );

      return {
        delegation: delegation.delegation,
        balance: delegation.balance,
        validator: validatorInfo,
        rewards: rewardInfo ? rewardInfo.rewards : [],
      };
    });

    return combinedData;
  } catch (error) {
    console.error('Error fetching staking data:', error);
    throw error;
  }
};

export const fetchValidatorData = async (
  delegatorAddress: string,
): Promise<CombinedStakingInfo[]> => {
  try {
    // Fetch all data concurrently, but ensure it's fully resolved before proceeding
    const [validatorResponse, delegationResponse, rewards] = await Promise.all([
      fetchValidators(),
      fetchDelegations(delegatorAddress),
      fetchRewards(delegatorAddress),
    ]);

    const validators = validatorResponse.validators;
    const delegations = delegationResponse.delegations;

    const combinedData: CombinedStakingInfo[] = validators.map(validator => {
      const delegationInfo = delegations.find(
        delegation => delegation.delegation.validator_address === validator.operator_address,
      );
      const rewardInfo = rewards.find(reward => reward.validator === validator.operator_address);

      return {
        validator,
        delegation: delegationInfo?.delegation || {
          delegator_address: '',
          validator_address: '',
          shares: '',
        },
        balance: delegationInfo?.balance || {
          denom: '',
          amount: '0',
        },
        rewards: rewardInfo?.rewards || [],
      };
    });

    return combinedData;
  } catch (error) {
    console.error('Error fetching staking data:', error);
    throw error;
  }
};
