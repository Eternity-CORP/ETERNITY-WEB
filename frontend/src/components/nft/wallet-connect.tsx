'use client';

import { useState } from 'react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import cn from '@/utils/cn';
import Button from '@/components/ui/button';
import { Menu } from '@/components/ui/menu';
import { Transition } from '@/components/ui/transition';
import ActiveLink from '@/components/ui/links/active-link';
import { ChevronForward } from '@/components/icons/chevron-forward';
import { PowerIcon } from '@/components/icons/power';
import { EditFilled } from '@ant-design/icons';

export default function WalletConnect({
  btnClassName,
  anchorClassName,
}: {
  btnClassName?: string;
  anchorClassName?: string;
}) {
  const { address } = useAccount();
  const { open } = useWeb3Modal();
  const { data } = useBalance({
    address,
  });
  const { disconnect } = useDisconnect();
  const balance = data?.formatted;

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('eternaki');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleEditClick = (e:any) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleInputChange = (e:any) => {
    setUsername(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    // Add save logic here if needed
  };

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <>
      {address ? (
        <div className="flex items-center gap-3 sm:gap-6 lg:gap-8">
          <div className="relative flex-shrink-0">
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button
                  className="block h-10 w-10 overflow-hidden rounded-full border-3 border-solid border-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-main transition-all hover:-translate-y-0.5 hover:shadow-large dark:border-gray-700 sm:h-12 sm:w-12"
                  onClick={handleMenuToggle}
                ></Menu.Button>
              </div>
              <Transition
                show={menuOpen}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-300"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-4"
              >
                <Menu.Items
                  static
                  className="absolute -right-20 mt-3 w-80 origin-top-right rounded-lg bg-white shadow-large dark:bg-gray-900 sm:-right-14"
                >
                  <Menu.Item>
                    <div className="border-b border-dashed border-gray-200 p-3 dark:border-gray-700">
                      <ActiveLink
                        href="/profile"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800"
                      >
                        <span className="h-8 w-8 rounded-full border-2 border-solid border-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:border-gray-700"></span>
                        <span className="grow uppercase">
                          View Your Profile
                        </span>
                        <ChevronForward />
                      </ActiveLink>
                    </div>
                  </Menu.Item>
                  <Menu.Item>
                    <div className="border-b border-dashed border-gray-200 px-6 py-5 dark:border-gray-700">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium -tracking-tighter text-gray-600 dark:text-gray-400">
                          Username
                        </span>
                        <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm tracking-tighter dark:bg-gray-800 w-8/12">
                          {isEditing ? (
                            <input
                              type="text"
                              value={username}
                              onChange={handleInputChange}
                              onBlur={handleInputBlur}
                              className="bg-transparent border-none focus:outline-none w-9/12 h-5"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span>{username}</span>
                          )}
                          <EditFilled
                            onClick={handleEditClick}
                            className="cursor-pointer"
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-sm font-medium -tracking-tighter text-gray-600 dark:text-gray-400">
                          Wallet
                        </span>
                        <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm tracking-tighter dark:bg-gray-800 w-8/12">
                          {address.slice(0, 8)}
                          {'...'}
                          {address.slice(address.length - 8)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-sm font-medium -tracking-tighter text-gray-600 dark:text-gray-400">
                          Balance
                        </span>
                        <span className="rounded-lg bg-gray-100 px-5 py-2 text-sm tracking-tighter dark:bg-gray-800 w-8/12">
                          {balance} ETH
                        </span>
                      </div>
                    </div>
                  </Menu.Item>
                  <Menu.Item>
                    <div className="p-3">
                      <div
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800"
                        onClick={() => disconnect()}
                      >
                        <PowerIcon />
                        <span className="grow uppercase">Disconnect</span>
                      </div>
                    </div>
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>

          <ActiveLink href="/create-nft" className={cn(anchorClassName)}>
            <Button
              className={cn('shadow-main hover:shadow-large', btnClassName)}
            >
              CREATE
            </Button>
          </ActiveLink>
        </div>
      ) : (
        <Button
          onClick={() => open()}
          className={cn('shadow-main hover:shadow-large', btnClassName)}
        >
          CONNECT
        </Button>
      )}
    </>
  );
}
