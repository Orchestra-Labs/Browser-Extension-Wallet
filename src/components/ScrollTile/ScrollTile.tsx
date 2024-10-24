import { LogoIcon } from '@/assets/icons';
import { cn, selectTextColorByStatus } from '@/helpers';

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
  const textColor = selectTextColorByStatus(status);
  const borderClass = selected ? 'border-blue bg-blue-hover-secondary' : 'border-neutral-4';
  const activityBorderClass =
    'hover:bg-blue-hover-secondary hover:text-blue-dark hover:border-blue-darker active:bg-blue-pressed-secondary active:text-blue active:border-blue';

  return (
    <div
      className={cn(
        `p-2 min-h-[52px] rounded-md flex items-center cursor-pointer border ${borderClass} ${activityBorderClass}`,
      )}
      onClick={onClick}
    >
      <div className="rounded-full h-9 w-9 bg-neutral-2 p-1 flex items-center justify-center">
        {icon || <LogoIcon />}
      </div>
      <div className="flex flex-col ml-3">
        <h6 className={`text-base ${textColor} text-left`}>{title}</h6>
        <p className="text-xs text-neutral-1 text-left">{subtitle}</p>
      </div>
      <div className="flex-1" />
      <div className="text-white text-h6">{value}</div>
    </div>
  );
};
