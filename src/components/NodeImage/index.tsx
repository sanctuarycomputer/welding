import { FC } from 'react';
import Upload from 'src/components/Icons/Upload';

type Props = {
  readOnly: boolean;
  imagePreview: string;
  imageDidChange: Function;
};

const NodeImage: FC<Props> = ({
  readOnly,
  imagePreview,
  imageDidChange,
  children
}) => {
  return (
    <div
      style={{ backgroundImage: `url(${imagePreview})` }}
      className="aspect-sharecard bg-cover bg-center p-2 relative">

      {children}

      {!readOnly && (
        <label className="cursor-pointer w-full h-full flex items-center justify-center opacity-0 hover:opacity-80 background-color absolute left-0 right-0 top-0 bottom-0">
          <Upload />
          <input
            style={{display: 'none'}}
            type="file"
            onChange={imageDidChange}
            accept="image/*"
          />
        </label>
      )}
    </div>
  );
};

export default NodeImage;
