import s from "slugify";

const slugify = (str: string) => {
  return s(str, { lower: true });
};

export default slugify;
