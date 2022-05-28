import { FC } from 'react';
import Upload from 'src/components/Icons/Upload';
import RemoveImage from 'src/components/Icons/RemoveImage';

type Props = {
  showDefault?: boolean;
  readOnly: boolean;
  imagePreview: string | null;
  imageDidChange: Function;
  clearImage: Function;
};

const NodeImage: FC<Props> = ({
  showDefault,
  readOnly,
  imagePreview,
  imageDidChange,
  clearImage,
  children
}) => {
  const isDefault = (imagePreview || "").endsWith("emoji.jpg") || imagePreview === null;
  if (!showDefault && isDefault) return null;

  return (
    <div
      style={{ backgroundImage: `url(${imagePreview})` }}
      className={`allowed aspect-sharecard bg-cover bg-center background-passive-color p-2 relative ${readOnly ? 'pointer-events-none' : ''}`}>

      {children}

      {!readOnly && (
        <>
          <div className="opacity-0 hover:opacity-95 background-color absolute left-0 right-0 top-0 bottom-0">
            <label className="w-full h-full flex items-center justify-center cursor-pointer">
              <Upload />
              <input
                style={{display: 'none'}}
                type="file"
                onChange={imageDidChange}
                accept="image/*"
              />
            </label>

            <div
              style={{ transform: 'translate(0, -50%)' }}
              onClick={clearImage}
              className="cursor-pointer top-0 right-2 absolute background-color border-2 border-color shadow-lg p-1 rounded-full z-10">
              <RemoveImage />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NodeImage;
