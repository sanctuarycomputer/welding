import { ChangeEvent, useState } from "react";
import Welding from "src/lib/Welding";

const useEditableImage = (formik): [
  string | null,
  (e: ChangeEvent<HTMLInputElement>) => void,
  Function
] => {
  let imageSrc = ``;
  if (formik.values.image) {
    imageSrc = `${Welding.ipfsGateways[0]}${formik.values.image.replace(
      "ipfs://",
      "/ipfs/"
    )}`;
  }
  const [imagePreview, setImagePreview] = useState<string | null>(imageSrc);

  const clearImage = () => {
    setImagePreview(null);
    formik.setFieldValue("image", "");
  };

  const imageDidChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLInputElement;
    const file = target.files && target.files[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.addEventListener("load", function (e) {
      if (typeof e.target?.result === "string") {
        setImagePreview(e.target.result);
        formik.setFieldValue("image", e.target.result.split(",")[1]);
      }
    });
    fileReader.readAsDataURL(file);
  };

  return [imagePreview, imageDidChange, clearImage];
};

export default useEditableImage;
