import React from 'react';
import { useAtomValue } from 'jotai';
import { ValidatorScrollTile } from '../ValidatorScrollTile';
import { filteredValidatorsAtom } from '@/atoms';
import { CombinedStakingInfo } from '@/types';

interface ValidatorTilesProps {
  isSelectable?: boolean;
  addMargin?: boolean;
  onClick?: (asset: CombinedStakingInfo) => void;
}

// TODO: show some indicator of uptime (such as coloring symphony icon depending) (on all screen)
// TODO: show some indicator of APY (on all screen)
// TODO: check for registry symbol where symbol equals denom
// const denom = validatorReward.rewards[0]?.denom || 'UNKNOWN';
export const ValidatorTiles: React.FC<ValidatorTilesProps> = ({
  isSelectable = false,
  addMargin = true,
  onClick,
}) => {
  const filteredValidators = useAtomValue(filteredValidatorsAtom);

  if (filteredValidators.length === 0) {
    return <p className="text-base text-neutral-1 px-4">No validators found</p>;
  }

  console.log('filtered validators:', filteredValidators);

  return (
    <>
      {filteredValidators.map(combinedStakingInfo => (
        <>
          {console.log('making tile for validator', combinedStakingInfo.validator.operator_address)}
          <ValidatorScrollTile
            key={`${combinedStakingInfo.validator.operator_address}`}
            combinedStakingInfo={combinedStakingInfo}
            isSelectable={isSelectable}
            addMargin={addMargin}
            onClick={onClick}
          />
        </>
      ))}
    </>
  );
};
