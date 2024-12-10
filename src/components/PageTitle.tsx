import { ArrowLeft, X } from '@/assets/icons';
import { ROUTES } from '@/constants';
import { Separator } from '@/ui-kit';
import { NavLink } from 'react-router-dom';

interface PageTitleProps {
  title: string;
  handleBackClick?: () => void;
  useCloseIcon?: boolean;
}

export const PageTitle: React.FC<PageTitleProps> = ({
  title,
  handleBackClick = () => {},
  useCloseIcon = false,
}) => {
  const icon = useCloseIcon ? (
    <X className="w-full h-full text-white" />
  ) : (
    <ArrowLeft className="w-full h-full text-white" />
  );

  return (
    <>
      <div className="flex justify-between items-center w-full p-5">
        <NavLink
          to={ROUTES.APP.ROOT}
          className="flex items-center justify-center max-w-5 max-h-5 p-0.5"
          onClick={handleBackClick}
        >
          {icon}
        </NavLink>
        <div>
          <h1 className="text-h5 text-white font-bold">{title}</h1>
        </div>
        <div className="max-w-5 w-full max-h-5" />
      </div>

      <Separator />
    </>
  );
};
