import Image from '@/components/ui/image';
import { useIsMounted } from '@/lib/hooks/use-is-mounted';
import { useIsDarkMode } from '@/lib/hooks/use-is-dark-mode';
import whiteLogoIcon from '@/assets/images/logo/white_1.png';
import blackLogoIcon from '@/assets/images/logo/black_1.png';

const Logo: React.FC<React.SVGAttributes<{}>> = (props) => {
  const isMounted = useIsMounted();
  const { isDarkMode } = useIsDarkMode();

  return (
    <div className="flex cursor-pointer outline-none" {...props}>
      <span className="relative flex overflow-hidden">
        {isMounted && isDarkMode && (
          <Image src={whiteLogoIcon} alt="Criptic" priority fill />
        )}
        {isMounted && !isDarkMode && (
          <Image src={blackLogoIcon} alt="Criptic" priority fill />
        )}
      </span>
    </div>
  );
};

export default Logo;
