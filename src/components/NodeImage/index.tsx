import { FC } from "react";
import Upload from "src/components/Icons/Upload";
import RemoveImage from "src/components/Icons/RemoveImage";
import { bg, bgPassive } from "src/utils/theme";

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
  children,
}) => {
  const isDefault =
    (imagePreview || "").endsWith("emoji.jpg") || imagePreview === null;
  if (!showDefault && isDefault) return null;

  return (
    <div
      style={{ backgroundImage: `url(${imagePreview})` }}
      className={`${bgPassive} allowed aspect-sharecard bg-cover bg-center p-2 relative ${
        readOnly ? "pointer-events-none" : ""
      }`}
    >
      {children}

      {!readOnly && (
        <>
          <div
            className={`${bg} opacity-0 hover:opacity-70 absolute left-0 right-0 top-0 bottom-0`}
          >
            <label className="w-full h-full flex items-center justify-center cursor-pointer">
              <Upload />
              <input
                style={{ display: "none" }}
                type="file"
                onChange={imageDidChange}
                accept="image/*"
              />
            </label>

            {!isDefault && (
              <div
                onClick={clearImage}
                className="cursor-pointer top-2 right-2 absolute p-1 rounded-full z-10"
              >
                <RemoveImage />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NodeImage;
