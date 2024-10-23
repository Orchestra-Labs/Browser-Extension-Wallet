import { Dialog, DialogTrigger } from '@radix-ui/react-dialog';
import { LogOut } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { ArrowLeft, Discord, DotsVertical } from '@/assets/icons';
import { Button, DialogContent } from '@/ui-kit';
import { useLogout } from '@/hooks';

const OPTIONS = [
  {
    id: 1,
    name: 'Contact Us',
    icon: <Discord />,
    target: '_blank',
    to: 'https://discord.gg/symphony-1162823265975279636',
  },
];

export const OptionsDialog: React.FC = () => {
  const logout = useLogout();

  const handleLogOut = () => {
    logout();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="p-[7px]" variant="icon" size="rounded-default">
          <DotsVertical width="100%" height="100%" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <h3 className="text-h5 font-bold">Options</h3>
        <div className="grid">
          {OPTIONS.map(option => (
            <Link
              key={option.id}
              to={option.to}
              target={option.target}
              className="flex items-center text-sm text-white font-normal py-3 not-last:border-b not-last:border-neutral-4 hover:text-white"
            >
              <div className="h-8 w-8 bg-blue rounded-full flex items-center justify-center p-1.5 mr-2.5 text-black">
                {option.icon}
              </div>
              {option.name}
              <div className="flex-1" />
              <ArrowLeft className="rotate-180 h-3 w-3" />
            </Link>
          ))}
          <Button
            variant="transparent"
            className="flex items-center text-sm text-white font-normal py-3 px-0 h-auto rounded-none hover:text-white"
            onClick={handleLogOut}
          >
            <div className="h-8 w-8 bg-blue rounded-full flex items-center justify-center p-1.5 mr-2.5 text-black">
              <LogOut width={16} />
            </div>
            Logout
            <div className="flex-1" />
            <ArrowLeft className="rotate-180 h-3 w-3" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
