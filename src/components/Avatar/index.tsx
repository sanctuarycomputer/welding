import { useEnsAvatar } from 'wagmi';
import UnknownUser from 'src/components/Icons/UnknownUser';

type Props = {
  address: string;
  width?: number;
};

const Avatar: FC<Props> = ({
  address,
  width,
}) => {
  const { data: ensAvatar } = useEnsAvatar({ addressOrName: address });
  return (ensAvatar
    ? <img className={`aspect-square w-${width || 4} background-passive-color rounded-full inline-block`} src={ensAvatar} alt="ENS Avatar" />
    : (width > 4 ? <div className={`aspect-square w-${width || 4} background-passive-color rounded-full inline-block flex items-center justify-center`}><UnknownUser /></div> : null)
  );
};

export default Avatar;
