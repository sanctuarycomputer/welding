import { useState, useRef, useMemo, useContext, useEffect } from "react";
import { GraphContext } from "src/hooks/useGraphData";
import { diff } from "deep-object-diff";
import debounce from "lodash/debounce";
import baseNodeFormikToDraft from "src/utils/baseNodeFormikToDraft";
import canEditNode from "src/utils/canEditNode";
import Client from "src/lib/Client";
import { Draft } from "src/types";
import * as Sentry from "@sentry/nextjs";

const objectIsEmpty = (obj) =>
  obj &&
  Object.keys(obj).length === 0 &&
  Object.getPrototypeOf(obj) === Object.prototype;

// Next
// - [ ] Switching to a new account on a DummyNode should redirect away
// - [ ] Deploy!

// Eventually
// - [ ] CRDTs for multi-user editing
// - [ ] Discard Current Drafts Button
// - [ ] Restore old Drafts
// - [ ] I should be able to see Drafts that others have made in my Subgraph (ReadOnly)?
// - [ ] I should see all of my drafts in /account
// - [ ] I should be able to share a link to my draft? Or give someone else edit access?

const callDebounced = debounce((f) => f(), 2000);

const useDrafts = (formik) => {
  const skipNextPersist = useRef(true);

  const node = formik.values.__node__;
  const [initializingDrafts, setInitializingDrafts] = useState(true);
  const [initializingDraftsError, setInitializingDraftsError] = useState<
    any | null
  >(null);
  const [lastPersistErrored, setLastPersistErrored] = useState(false);
  const [drafts, setDrafts] = useState<{ submittedAt: string; draft: Draft }[]>(
    []
  );
  const [draftsPersisting, setDraftsPersisting] = useState<Draft[]>([]);

  const { sessionData, sessionDataLoading } = useContext(GraphContext);

  const canEdit = canEditNode(node, sessionData?.address);

  const initDrafts = async () => {
    if (sessionDataLoading) {
      setInitializingDraftsError(null);
      setInitializingDrafts(true);
      unstageDraft();
      setDrafts([]);
      return;
    }

    if (sessionData?.address && canEdit) {
      try {
        setInitializingDraftsError(null);
        setInitializingDrafts(true);
        unstageDraft();
        const drafts = await Client.Drafts.forTokenId(node.tokenId, 1);
        if (drafts.length) {
          const nextValues = { ...formik.values, ...drafts[0].draft };
          if (!objectIsEmpty(diff(formik.values, nextValues))) {
            skipNextPersist.current = true;
            formik.setValues(nextValues, false);
          }
        }
        setDrafts(drafts);
        setInitializingDrafts(false);
      } catch (e) {
        setInitializingDraftsError(e);
        setInitializingDrafts(false);
        Sentry.captureException(e);
      }
    } else {
      setInitializingDraftsError(null);
      setInitializingDrafts(false);
    }
  };

  const persistDraft = async () => {
    if (!sessionData?.address || !canEdit) return;
    const draft = baseNodeFormikToDraft(formik);
    const shouldPersist =
      drafts.length === 0 || !objectIsEmpty(diff(drafts[0].draft, draft));
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

  const unstageDraft = () => {
    if (formik.dirty) formik.resetForm();
  };

  useMemo(() => {
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    persistDraft();
  }, [
    formik.values.name,
    formik.values.description,
    formik.values.emoji,
    formik.values.content,
  ]);

  useEffect(() => {
    initDrafts();
  }, [sessionData, sessionDataLoading, node.tokenId]);

  return {
    initializingDrafts,
    initializingDraftsError,
    lastPersistErrored,
    drafts,
    draftsPersisting,
    persistDraft,
    unstageDraft,
  };
};

export default useDrafts;
