import React from 'react';
import { useAtomValue } from 'jotai';
import { ValidatorScrollTile } from '../ValidatorScrollTile';
import { filteredValidatorsAtom, filteredDialogValidatorsAtom } from '@/atoms';
import { CombinedStakingInfo } from '@/types';

interface ValidatorTilesProps {
  isSelectable?: boolean;
  onClick?: (asset: CombinedStakingInfo) => void;
  isDialog?: boolean;
}

// TODO: show some indicator of uptime (such as coloring symphony icon depending) (on all screen)
// TODO: show some indicator of APY (on all screen)
// TODO: check for registry symbol where symbol equals denom
// const denom = validatorReward.rewards[0]?.denom || 'UNKNOWN';
export const ValidatorTiles: React.FC<ValidatorTilesProps> = ({
  isSelectable = false,
  onClick,
  isDialog = false,
}) => {
  const filteredValidators = useAtomValue(
    isDialog ? filteredDialogValidatorsAtom : filteredValidatorsAtom,
  );

  if (filteredValidators.length === 0) {
    return <p className="text-base text-neutral-1">No validators found</p>;
  }

  return (
    <>
      {filteredValidators.map(combinedStakingInfo => (
        <ValidatorScrollTile
          key={`${combinedStakingInfo.validator.operator_address}`}
          combinedStakingInfo={combinedStakingInfo}
          isSelectable={isSelectable}
          onClick={onClick}
        />
      ))}
    </>
  );
};
