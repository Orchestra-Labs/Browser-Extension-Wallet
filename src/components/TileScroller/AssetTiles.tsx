import React from 'react';
import { AssetScrollTile } from '../AssetScrollTile';
import { useAtomValue } from 'jotai';
import { filteredAssetsAtom } from '@/atoms';
import { Asset } from '@/types';

interface AssetTilesProps {
  isSelectable?: boolean;
  addMargin?: boolean;
  onClick?: (asset: Asset) => void;
}

export const AssetTiles: React.FC<AssetTilesProps> = ({
  isSelectable = false,
  addMargin = true,
  onClick,
}) => {
  const filteredAssets = useAtomValue(filteredAssetsAtom);

  if (!filteredAssets?.length) {
    return <p className="text-base text-neutral-1 px-4">No assets found</p>;
  }

  return (
    <>
      {/* TODO: asset scroll tile using asset registry needs different values to display.  and/or add titles above columns to say what the value is */}
      {filteredAssets.map(asset => (
        <AssetScrollTile
          key={asset.denom}
          asset={asset}
          isSelectable={isSelectable}
          addMargin={addMargin}
          onClick={onClick}
        />
      ))}
    </>
  );
};
