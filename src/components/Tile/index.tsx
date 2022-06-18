import { FC, useState } from 'react';
import Spinner from 'src/components/Icons/Spinner';
import { bgPassive } from 'src/utils/theme';

type Props = {
  label: string;
  tracked?: boolean;
  onClick?: Function;
};

const Tile: FC<Props> = ({ label, onClick, tracked }) => {
  const [isLoading, setIsLoading] = useState(false);
  const didClickTile = async () => {
    if (!onClick) return;
    setIsLoading(true);
    await onClick();
    setIsLoading(false);
  };

  return (
    <div
      className={`${bgPassive} inline-flex rounded-full p-1 items-center`}>
      <span className={`px-1 text-xs ${tracked ? 'uppercase font-bold' : ''}`}>
        {label}
      </span>

      {onClick && (
        isLoading ? (
          <span className={`loader inline-flex`}>
            <Spinner />
          </span>
        ) : (
          <span className="text-xs pr-1 cursor-pointer" onClick={didClickTile}>
            ✕
          </span>
        )
      )}
    </div>
  );
};

export default Tile;
