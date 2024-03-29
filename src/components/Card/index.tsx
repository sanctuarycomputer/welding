import { FC } from "react";
import { BaseNode } from "src/types";
import Welding from "src/lib/Welding";

type Props = {
  node: BaseNode;
};

const Card: FC<Props> = ({ node }) => {
  const emoji = node.currentRevision.nativeEmoji;
  const name = node.currentRevision.name;
  const description = node.currentRevision.description;
  const imageSrc = `${
    Welding.ipfsGateways[0]
  }${node.currentRevision.image.replace("ipfs://", "/ipfs/")}`;

  return (
    <div className="rounded border border-color h-full">
      <div
        style={{ backgroundImage: `url(${imageSrc})` }}
        className="aspect-sharecard bg-cover bg-center text-right p-2"
      ></div>
      <div className="px-4 py-4">
        <div className="font-bold text-l mb-1">
          {emoji} {name}
        </div>
        <p className="text-xs">{description}</p>
      </div>
    </div>
  );
};

export default Card;
