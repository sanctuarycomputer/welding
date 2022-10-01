import { useState, useEffect } from "react";
import Drafts from "src/lib/Drafts";
import { diff } from "deep-object-diff";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const objectIsEmpty = (obj) =>
  obj &&
  Object.keys(obj).length === 0 &&
  Object.getPrototypeOf(obj) === Object.prototype;

const makePrefix = (address, tokenId) => {
  return `-welding::drafts::${tokenId}::${address}`;
};

// TODO Pass in Formik?
// - [x] When I log in the Draft should be restored
// - [x] When I load the page, the Draft should be restored
// - [x] When I log out, the draft should be unstaged
// - [x] When a draft is successfully submitted to the server, wipe it locally?
// - [x] I should see a "(Spinner) Saving Draft", "Draft" Tile
// - [x] I should be able to discard a draft (reset)
// - [x] When I save, the drafts should be flushed
// - [ ] When I logout local drafts should be destroyed (Unsaved changes modal if any persisting?)
// - [ ] When I pass a -1 tokenId, it should be assigned a temporary id
// - [ ] I should see my drafts in the sidebar
// - [ ] Debounce persist
// - [ ] Save drafts remotely
const useDrafts = (address, canEdit, formik) => {
  const node = formik.values.__node__;
  const [initializingDrafts, setInitializingDrafts] = useState(true);
  const [drafts, setDrafts] = useState({});

  const draftsAsArray = Object.keys(drafts)
    .sort(function (a, b) {
      const aSplat = a.split("::");
      const bSplat = b.split("::");
      return (
        new Date(bSplat[bSplat.length - 1]) -
        new Date(aSplat[aSplat.length - 1])
      );
    })
    .map((k) => {
      return { ...drafts[k], key: k };
    });

  const fetchDrafts = async () => {
    try {
      setInitializingDrafts(true);
      await sleep(1200);
      const prefix = makePrefix(address, node.tokenId);
      const drafts = Object.keys(localStorage).reduce(function (acc, k) {
        if (k.startsWith(prefix))
          acc[k] = {
            key: k,
            values: JSON.parse(window.localStorage.getItem(k)),
            isPersisting: false,
            persistError: null,
          };
        return acc;
      }, {});
      setDrafts(drafts);
    } finally {
      setInitializingDrafts(false);
    }
  };

  const persistDraft = async () => {
    if (!address || !canEdit) return;

    const values = { name: formik.values.name };
    const shouldPersist =
      draftsAsArray.length === 0 ||
      !objectIsEmpty(diff(draftsAsArray[0].values, values));
    if (!shouldPersist) return null;

    const key = `${makePrefix(
      address,
      node.tokenId
    )}::${new Date().toISOString()}`;
    setDrafts((prevDrafts) => {
      const newDrafts = { ...prevDrafts };
      newDrafts[key] = {
        key,
        values,
        isPersisting: true,
        persistError: null,
      };
      return newDrafts;
    });

    try {
      await sleep(450);
      window.localStorage.setItem(key, JSON.stringify(values));
      console.log("Drafts.persist: Did Persist Draft", key, values);

      setDrafts((prevDrafts) => {
        const newDrafts = { ...prevDrafts };
        newDrafts[key] = {
          key,
          values,
          isPersisting: false,
          persistError: null,
        };
        return newDrafts;
      });
    } catch (e) {
      setDrafts((prevDrafts) => {
        const newDrafts = { ...prevDrafts };
        newDrafts[key] = {
          key,
          values,
          isPersisting: false,
          persistError: e,
        };
        return newDrafts;
      });
    }
  };

  const stageDraft = (draft) => {
    const changes = diff({ name: formik.values.name }, draft.values);
    Object.keys(changes).forEach((k) => {
      formik.setFieldValue(k, changes[k]);
    });
  };

  const unstageDraft = () => {
    if (formik.dirty) formik.resetForm();
  };

  useEffect(() => {
    fetchDrafts();
  }, [address, node.tokenId]);

  return {
    initializingDrafts,
    drafts,
    draftsAsArray,
    draftsPersisting: draftsAsArray.some((d) => d.isPersisting),
    persistDraft,
    stageDraft,
    unstageDraft,
  };
};

export default useDrafts;
