import { Draft } from "src/types";

const baseNodeFormikToDraft = (
  baseNodeFormik: FormikProps<BaseNodeFormValues>
): Draft => {
  return baseNodeFormik.values;
};

export default baseNodeFormikToDraft;
