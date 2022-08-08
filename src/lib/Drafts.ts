import type { Draft } from "src/types";
import { diff, detailedDiff } from "deep-object-diff";

// - [ ] Only persist a draft when it is actually different from the
// most recent draft
// - [ ] When I log out, the draft should be flushed
// - [ ] When I log in the Draft should be restored
// - [ ] When I load the page, the Draft should be restored
// - [ ] I should be able to discard a draft
// - [ ] When I save, the drafts should be flushed
// - [ ] It should not store more than ~10 drafts per tokenId
// - [ ] When I pass a -1 tokenId, it should be assigned a temporary id
// - [ ] I should see my drafts in the sidebar

const applyDraftIfDifferent = (draft, formik) => {};

const Drafts = {
  persist: async function (address, formik): Promise<void> {
    if (typeof window === "undefined") return;
    const drafts = await Drafts.forBaseNode(address, formik);

    console.log("Drafts: will Persist", formik.values.__draft__);
    if (formik.values.__draft__) {
      console.log("will draft is applied");
      // draft is applied
      // test if current values are different to draft
      // if yes, persist, and update draft reference
    } else {
      // draft is not applied, user likely logged in or navigated here
      const draft = drafts[0];
      if (draft) {
        const changed = diff(draft.values, {
          name: formik.values.name,
          description: formik.values.description,
          content: formik.values.content,
        });
        if (Object.keys(changed).length > 0) {
          console.log("will apply draft");
        } else {
          formik.setFieldValue("__draft__", draft);
        }
      } else {
        console.log("will make initial draft");
        const node = formik.values.__node__;
        const type = node.labels.filter((l) => l !== "BaseNode")[0];
        const key = `-welding::drafts::${type}::${
          node.tokenId
        }::${address}::${new Date().toISOString()}`;
        const values = JSON.stringify({
          name: formik.values.name,
          description: formik.values.description,
          content: formik.values.content,
        });
        window.localStorage.setItem(key, values);
        formik.values.__draft__ = { key, values };
      }
    }
  },

  stage: async function (address, formik): Promise<boolean> {
    console.log("Drafts: will Stage");
    const drafts = await Drafts.forBaseNode(address, formik);
    if (!drafts[0]) return false;
    console.log("Will stage");
    formik.setValues({
      ...formik.values,
      name: drafts[0].values.name,
      description: drafts[0].values.name,
      content: drafts[0].values.name,
      __draft__: drafts[0],
    });
    return true;
  },

  unstage: async function (formik): Promise<void> {
    console.log("Drafts: will Unstage");
    if (formik.values.__draft__ === null) return;
    // Only unstage if the current revision on this formik
    // is identical to the latest persisted draft?
  },

  forBaseNode: async function (address, formik): Promise<Array<Draft>> {
    if (typeof window === "undefined") return [];

    const node = formik.values.__node__;
    const type = node.labels.filter((l) => l !== "BaseNode")[0];
    const prefix = `-welding::drafts::${type}::${node.tokenId}::${address}`;

    return Object.keys(localStorage)
      .reduce(function (acc, k) {
        if (k.startsWith(prefix))
          acc = [
            ...acc,
            {
              key: k,
              values: JSON.parse(window.localStorage.getItem(k)),
            },
          ];
        return acc;
      }, [])
      .sort(function (a, b) {
        const aSplat = a.key.split("::");
        const bSplat = b.key.split("::");
        return (
          new Date(bSplat[bSplat.length - 1]) -
          new Date(aSplat[aSplat.length - 1])
        );
      });
  },
};

export default Drafts;
