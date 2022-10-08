import { useState, useEffect } from "react";
import Drafts from "src/lib/Drafts";
import { diff } from "deep-object-diff";
import makeHash from "object-hash";
import debounce from "lodash/debounce";
import baseNodeFormikToDraft from "src/utils/baseNodeFormikToDraft";
import Client from "src/lib/Client";

const objectIsEmpty = (obj) =>
  obj &&
  Object.keys(obj).length === 0 &&
  Object.getPrototypeOf(obj) === Object.prototype;

// Next
// - [ ] SubgraphSidebar should update when editing a Draft Title/Emoji?
// - [ ] Types & Sentry & Cleanup
// - [ ] TopicMinter should work too
// - [ ] Ensure Minting works all the way
// - [ ] Switching accounts should reinitialize defats
// - [ ] Staging the first draft should not trigger a persist call

// Eventually
// - [ ] CRDTs for multi-user editing
// - [ ] Discard Current Drafts Button
// - [ ] Restore old Drafts
// - [ ] I should be able to see Drafts that others have made in my Subgraph (ReadOnly)?
// - [ ] I should see all of my drafts in /account
// - [ ] I should be able to share a link to my draft? Or give someone else edit access?

const callDebounced = debounce((f) => f(), 2000);

const useDrafts = (address, canEdit, formik, didPersistDraft) => {
  const node = formik.values.__node__;
  const [initializingDrafts, setInitializingDrafts] = useState(true);
  const [lastPersistErrored, setLastPersistErrored] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [draftsPersisting, setDraftsPersisting] = useState([]);

  const initDrafts = async () => {
    if (address && canEdit) {
      try {
        setInitializingDrafts(true);
        setDrafts(await Client.Drafts.forTokenId(node.tokenId, 1));
      } finally {
        setInitializingDrafts(false);
      }
    } else {
      setInitializingDrafts(false);
    }
  };

  const persistDraft = async () => {
    if (!address || !canEdit) return;
    const draft = baseNodeFormikToDraft(formik);
    const shouldPersist =
      drafts.length === 0 || !objectIsEmpty(diff(drafts[0].values, draft));
    if (!shouldPersist) return null;

    callDebounced(async () => {
      setDraftsPersisting((prevDraftsPersisting) => {
        return [draft, ...prevDraftsPersisting];
      });
      try {
        setLastPersistErrored(!(await Client.Drafts.persist(draft)));
      } catch (e) {
        // TODO: Sentry
        setLastPersistErrored(true);
      } finally {
        setDraftsPersisting((prevDraftsPersisting) => {
          return prevDraftsPersisting.filter((d) => {
            return d !== draft;
          });
        });
      }
    });
  };

  const stageDraft = ({ draft }) => {
    const changes = diff({ name: formik.values.name }, draft);
    Object.keys(changes).forEach((k) => {
      formik.setFieldValue(k, changes[k]);
    });
  };

  const unstageDraft = () => {
    if (formik.dirty) formik.resetForm();
  };

  useEffect(() => {
    initDrafts();
  }, [address, node.tokenId]);

  return {
    initializingDrafts,
    lastPersistErrored,
    drafts,
    draftsPersisting,
    persistDraft,
    stageDraft,
    unstageDraft,
  };
};

export default useDrafts;
