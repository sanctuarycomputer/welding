import { FC } from "react";
import { useEnsAvatar } from "wagmi";
import UnknownUser from "src/components/Icons/UnknownUser";
import { bgPassive } from "src/utils/theme";

type Props = {
  address: string;
  width?: number;
};

const Avatar: FC<Props> = ({ address, width }) => {
  const { data: ensAvatar } = useEnsAvatar({
    addressOrName: address,
    chainId: 1,
  });
  if (!width) width = 4;
  return ensAvatar ? (
    <img
      className={`${bgPassive} aspect-square w-${width} rounded-full inline-block`}
      src={ensAvatar}
      alt="ENS Avatar"
    />
  ) : width > 4 ? (
    <div
      className={`${bgPassive} aspect-square w-${width} rounded-full inline-block flex items-center justify-center`}
    >
      <UnknownUser />
    </div>
  ) : null;
};

export default Avatar;
