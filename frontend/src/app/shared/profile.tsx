'use client';

import React from 'react';
import AnchorLink from '@/components/ui/links/anchor-link';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import routes from '@/config/routes';
import { useIsMounted } from '@/lib/hooks/use-is-mounted';
import { useIsDarkMode } from '@/lib/hooks/use-is-dark-mode';
import ErrorLightImage from '@/assets/images/404-light.svg';
import ErrorDarkImage from '@/assets/images/404-dark.svg';
import { LAYOUT_OPTIONS } from '@/lib/constants';
import { useLayout } from '@/lib/hooks/use-layout';
import Image from '@/components/ui/image';
import Avatar from '@/components/ui/avatar';
import Profile from '@/components/profile/profile';
import Button from '@/components/ui/button';
import { useAccount } from 'wagmi';
import cn from '@/utils/cn';
// static data
import { authorData } from '@/data/static/author';

const AuthorProfilePage = (
  {
    btnClassName,
  }: {
    btnClassName?: string;
    anchorClassName?: string;
  }
) => {

  const { address } = useAccount();
  const { open } = useWeb3Modal();
  const { layout } = useLayout();
  const isMounted = useIsMounted();
  const { isDarkMode } = useIsDarkMode();
  return (
    <>
    { address ? (
      <>
      <div className="relative h-36 w-full overflow-hidden rounded-lg sm:h-44 md:h-64 xl:h-80 2xl:h-96 3xl:h-[448px]">
        <Image
          src={authorData?.cover_image?.thumbnail}
          placeholder="blur"
          quality={100}
          className="!h-full w-full !object-cover"
          alt="Cover Image"
        />
      </div>
      <div className="mx-auto flex w-full shrink-0 flex-col md:px-4 xl:px-6 3xl:max-w-[1700px] 3xl:px-12">
        <Avatar
          size="xl"
          image={authorData?.avatar?.thumbnail}
          alt="Author"
          className="z-10 mx-auto -mt-12 dark:border-gray-500 sm:-mt-14 md:mx-0 md:-mt-16 xl:mx-0 3xl:-mt-20"
        />
        <Profile />
      </div>
      </>
      ) : (
        <div className="flex max-w-full flex-col items-center justify-center text-center">
        <div className="relative aspect-[257/173] w-52 max-w-full sm:w-[400px] xl:w-[450px] 3xl:w-[500px]">
          {isMounted && !isDarkMode && (
            <Image src={ErrorLightImage} alt="Wallet Not Connected" priority />
          )}
          {isMounted && isDarkMode && (
            <Image src={ErrorDarkImage} alt="Wallet Not Connected" priority />
          )}
        </div>

        <h2 className="mb-2 mt-5 text-base font-medium uppercase tracking-wide text-gray-900 dark:text-white sm:mb-4 sm:mt-10 sm:text-xl 3xl:mt-12 3xl:text-2xl">
          Wallet Not Connected
        </h2>
        <p className="mb-4 max-w-full text-xs leading-loose tracking-tight text-gray-600 dark:text-gray-400 sm:mb-6 sm:w-[430px] sm:text-sm sm:leading-loose">
          Sorry, you need to connect your wallet to access this page.
        </p>
        {isMounted && (
            <Button
              onClick={() => open()}
              className={cn('shadow-main hover:shadow-large', btnClassName)}
            >
              CONNECT
            </Button>
        )}
      </div>
      )}
    </>
  );
};

export default AuthorProfilePage;
