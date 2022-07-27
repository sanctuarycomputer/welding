import s from "slugify";

const slugify = (str: string) => {
  s.extend({'.': '-'});
  return s(str, {
    replacement: '-',
    lower: true,
    strict: true,
  });
};

export default slugify;
