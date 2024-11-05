import { LogoIcon } from '@/assets/icons';
import { cn, selectTextColorByStatus, truncateString } from '@/helpers';

interface ScrollTileProps {
  title: string;
  subtitle: string;
  value: string;
  icon?: React.ReactNode;
  status?: 'error' | 'warn' | 'good';
  selected?: boolean;
  onClick?: () => void;
}

export const ScrollTile = ({
  title,
  subtitle,
  value,
  icon,
  status = 'good',
  selected = false,
  onClick,
}: ScrollTileProps) => {
  const formattedTitle = truncateString(title, 10);
  const textColor = selectTextColorByStatus(status);

  const baseClasses = 'p-2 min-h-[52px] rounded-md flex items-center cursor-pointer border';
  const selectedClasses = `border-blue bg-blue-hover text-blue-dark
    active:bg-blue-hover-secondary active:text-blue-dark active:border-blue 
    hover:bg-blue-pressed-secondary hover:text-blue hover:border-blue-darker`;
  const unselectedClasses = `border-neutral-4 text-neutral-1
    hover:bg-neutral-4 hover:text-neutral-1 hover:border-grey
    active:bg-neutral-2 active:text-neutral-1 active:border-grey`;

  const tileClasses = cn(baseClasses, selected ? selectedClasses : unselectedClasses);

  return (
    <div className={tileClasses} onClick={onClick}>
      <div className="rounded-full h-9 w-9 bg-neutral-2 p-1 flex items-center justify-center">
        {icon || <LogoIcon />}
      </div>
      <div className="flex flex-col ml-3">
        <h6 className={`text-base ${textColor} text-left line-clamp-1`}>{formattedTitle}</h6>
        <p className="text-xs text-neutral-1 text-left line-clamp-1">{subtitle}</p>
      </div>
      <div className="flex-1" />
      <div className="text-white text-h6 line-clamp-1">{value}</div>
    </div>
  );
};
