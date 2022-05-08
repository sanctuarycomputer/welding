import { useState } from 'react';
import Welding from 'src/lib/Welding';

const useEditableImage = (
  formik
) => {
  let imageSrc = null;
  if (formik.values.image) {
    imageSrc =
      `${Welding.ipfsGateways[0]}${formik.values.image.replace('ipfs://', '/ipfs/')}`;
  }
  const [imagePreview, setImagePreview] = useState<string | null>(imageSrc);

  const imageDidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLInputElement;
    const file = target.files[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.addEventListener("load", function(e) {
      setImagePreview(e.target.result);
      formik.setFieldValue('image', e.target.result.split(',')[1]);
    });
    fileReader.readAsDataURL(file);
  };

  return [imagePreview, imageDidChange];
}

export default useEditableImage;
