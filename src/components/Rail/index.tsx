import { FC } from 'react';
import { BaseNode } from 'src/types';
import Welding from 'src/lib/Welding';

type Props = {
  node: BaseNode
};

const Rail: FC<Props> = ({ node }) => {
  const emoji = node.currentRevision.metadata.properties.emoji.native;
  const name = node.currentRevision.metadata.name;
  const description = node.currentRevision.metadata.description;
  let imageSrc =
    `${Welding.ipfsGateways[0]}${node.currentRevision.metadata.image.replace('ipfs://', '/ipfs/')}`;
  return (
<div className="rounded shadow-lg border border-color mb-4 grid grid-cols-4">
  <div
    style={{ backgroundImage: `url(${imageSrc})` }}
    className="aspect-sharecard bg-cover bg-center col-span-1 mr-2">
  </div>
  <div className="col-span-2">
    <div className="font-bold text-l mb-1">
      {emoji} {name}
    </div>
    <p className="text-xs">
      {description}
    </p>
  </div>
  <div className="col-span-1 text-right">
    <p>hi</p>
  </div>
</div>


  );
};

export default Rail;
