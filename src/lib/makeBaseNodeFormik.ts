import { useFormik, FormikProps } from "formik";
import type { BaseNodeFormValues, BaseNode, Edge } from "src/types";
import * as yup from "yup";
import NProgress from "nprogress";
import Welding from "src/lib/Welding";
import toast from "react-hot-toast";
import Client from "src/lib/Client";
import { diff, detailedDiff } from "deep-object-diff";
import { BigNumber } from "@ethersproject/bignumber";
import onlyUnique from "src/utils/onlyUnique";
import * as Sentry from "@sentry/nextjs";
import { notEmpty } from "src/utils/predicates";

enum PublishStep {
  RESOLVE = "RESOLVE",
  FEES = "FEES",
  PUBLISH = "PUBLISH",
  REQUEST_SIG = "REQUEST_SIG",
  TRANSACT = "TRANSACT",
  CONFIRM = "CONFIRM",
  COMPLETE = "COMPLETE",
  ERROR = "ERROR",
}

const feesRequired = (formik, accountData) => {
  const node = formik.values.__node__;
  const incomingDiff: any = detailedDiff(node.incoming, formik.values.incoming);

  return Object.keys(incomingDiff.added).reduce((acc, key) => {
    if (!incomingDiff.added[key].active) return acc;
    const edge = formik.values.incoming[key];
    if (!edge || !edge.active) return acc;
    const n = formik.values.related.find(
      (n: BaseNode) => edge.tokenId === n.tokenId
    );
    if (!n) return acc;
    if (n.fee === "0") return acc;
    const owned =
      accountData &&
      !!accountData.related.find((r) => {
        return r.tokenId === n.tokenId;
      });
    if (owned) return acc;
    return acc.add(BigNumber.from(n.fee));
  }, BigNumber.from(0));
};

const makeFormikForBaseNode = (
  signer,
  accountData,
  node: BaseNode
): FormikProps<BaseNodeFormValues> => {
  const label = node.labels.filter((l) => l !== "BaseNode")[0] || "Document";
 
  const formik = useFormik<BaseNodeFormValues>({
    enableReinitialize: true,
    initialValues: {
      name: node.currentRevision.metadata.name,
      description: node.currentRevision.metadata.description,
      emoji: node.currentRevision.metadata.properties.emoji,
      ui: node.currentRevision.metadata.properties.ui || {},
      content: node.currentRevision.metadata.properties.content,
      image: node.currentRevision.metadata.image,
      related: node.related,
      outgoing: node.outgoing,
      incoming: node.incoming,
      __node__: node,
    },
    onSubmit: async (values) => {
      let status;
      let id;

      try {
        if (!signer) throw new Error("no_signer_present");

        const incomingDiff: any = detailedDiff(node.incoming, values.incoming);
        const hasConnectionChanges =
          Object.values(incomingDiff.added).length > 0 ||
          Object.values(incomingDiff.updated).length > 0 ||
          Object.values(incomingDiff.deleted).length > 0;

        if (hasConnectionChanges) {
          status = PublishStep.FEES;
          await new Promise((resolve, reject) => {
            formik.setStatus({
              status,
              resolve,
              reject,
            });
          });
        }

        id = toast.loading("Publishing...", {
          className: "toast",
        });

        /* Publish */
        status = PublishStep.PUBLISH;
        formik.setStatus({ status });
        NProgress.start();

        const hash = await Welding.publishMetadataToIPFS(values);
        NProgress.done();

        /* Request Signature */
        status = PublishStep.REQUEST_SIG;
        formik.setStatus({ status });
        toast.loading("Requesting signature...", { id });
        if (!signer) throw new Error("no_signer_present");

        let tx;
        if (node.tokenId.startsWith("-")) {
          const belongsTo = values.outgoing.find(
            (e) => e.name === "BELONGS_TO"
          );
          tx = await Welding.Nodes.connect(signer).mint(
            label,
            hash,
            values.incoming.filter((e) => e.active),
            values.outgoing.filter((e) => e.active),
            belongsTo ? [belongsTo.tokenId] : [],
            { value: feesRequired(formik, accountData) }
          );
        } else {
          const connectionsDidChange =
            JSON.stringify(values.incoming) !== JSON.stringify(node.incoming) ||
            JSON.stringify(values.outgoing) !== JSON.stringify(node.outgoing);
          const hashDidChange = hash !== node.currentRevision.hash;

          if (connectionsDidChange) {
            tx = await Welding.Nodes.connect(signer).merge(
              node.tokenId,
              hash,
              values.incoming
                .filter((e) => !e.name.startsWith("_"))
                .filter((e) => e.pivotTokenId === node.tokenId)
                .filter((e) => e.active),
              values.outgoing
                .filter((e) => !e.name.startsWith("_"))
                .filter((e) => e.pivotTokenId === node.tokenId)
                .filter((e) => e.active),
              { value: feesRequired(formik, accountData) }
            );
          } else if (hashDidChange) {
            tx = await Welding.Nodes.connect(signer).revise(node.tokenId, hash);
          }
        }

        if (!tx) {
          status = PublishStep.COMPLETE;
          formik.setStatus({ status, tx: null });
          toast.success("Success!", { id });
          return;
        }

        /* Transact */
        status = PublishStep.TRANSACT;
        formik.setStatus({ status });
        NProgress.start();
        toast.loading("Processing...", { id });
        tx = await tx.wait();

        /* Confirm */
        status = PublishStep.CONFIRM;
        formik.setStatus({ status });
        toast.loading("Confirming...", { id });
        await Client.fastForward(tx.blockNumber);

        /* Success */
        status = PublishStep.COMPLETE;
        formik.setStatus({ status, tx });
        toast.success("Success!", { id });
        return;
      } catch (e: any) {
        if (e && e?.message === "user_rejected") {
          toast.dismiss();
        } else {
          console.log(e);
          Sentry.captureException(e);
          NProgress.done();
          toast.error("An error occured.", {
            id,
            className: "toast",
          });
          formik.setStatus({ status, error: e });
          throw e;
        }
      }
    },
    validationSchema: yup.object({
      name: yup.string().trim().required("Name is required"),
    }),
  });

  return formik;
};
export default makeFormikForBaseNode;

export const getRelatedNodes = (
  formik: FormikProps<BaseNodeFormValues>,
  relation: "incoming" | "outgoing",
  label: string,
  name: string
) => {
  const uniqueTokenIds = new Set();
  return formik.values[relation]
    .map((e: Edge) => {
      if (e.active === false) return null;
      if (e.name !== name) return null;
      const n = formik.values.related.find(
        (node: BaseNode) => node.tokenId === e.tokenId
      );
      if (!n) return null;
      if (!n.labels.includes(label)) return null;
      return n;
    })
    .filter((n) => {
      if (n === null) return false;
      const dupe = uniqueTokenIds.has(n.tokenId);
      uniqueTokenIds.add(n.tokenId);
      if (!dupe) return true;
      return false;
    }).filter(notEmpty);
};

//export const hasStagedRelations = (
//  formik,
//  relation: "incoming" | "outgoing",
//  nodes: BaseNode[],
//  name: string,
//  exclusive: boolean
//) => {
//  if (!exclusive) {
//    return nodes.every((n) => {
//      return !!formik.values[relation].find((e) => {
//        return e.name === name && e.tokenId === n.tokenId && e.active;
//      });
//    });
//  }
//};

export const stageNodeRelations = (
  formik,
  relation: "incoming" | "outgoing",
  nodes: BaseNode[],
  name: string,
  disableOthers: boolean
) => {
  const pivotTokenId = formik.values.__node__.tokenId;
  const nodeIds = nodes.map((n) => n.tokenId);

  // Activate possible existing edges for this relation
  const activatedExistingEdges = formik.values[relation].reduce((acc, e) => {
    const n = formik.values.related.find(
      (r: BaseNode) => r.tokenId === e.tokenId
    );
    if (!n) return acc;
    if ((e.pivotTokenId === pivotTokenId, e.name === name)) {
      if (disableOthers) {
        if (nodeIds.includes(n.tokenId)) {
          return [...acc, { ...e, active: true }];
        } else {
          return [...acc, { ...e, active: false }];
        }
      } else {
        if (nodeIds.includes(n.tokenId)) {
          return [...acc, { ...e, active: true }];
        }
      }
    }

    return [...acc, e];
  }, []);

  // After activation,
  const missingEdges = nodes
    .map((n) => {
      const existingEdge = activatedExistingEdges.find((e) => {
        return (
          e.name === name &&
          e.tokenId === n.tokenId &&
          e.pivotTokenId === pivotTokenId &&
          e.active
        );
      });
      if (!!existingEdge) return null;
      return {
        __typename: "Edge",
        name: name,
        tokenId: n.tokenId,
        pivotTokenId: pivotTokenId,
        active: true,
      };
    })
    .filter((e) => e !== null);

  const newEdges = [...activatedExistingEdges, ...missingEdges];
  if (Object.values(diff(formik.values[relation], newEdges)).length) {
    formik.setFieldValue(relation, newEdges);
  }

  // Check to see if we actually need to update
  // the related hash, as this will cause rerenders
  const existingIds = formik.values.related
    .map((n) => n.tokenId)
    .filter(onlyUnique);

  const otherRelatedNodes = formik.values.related.filter((n: BaseNode) => {
    return !nodeIds.includes(n.tokenId);
  });
  const newRelated = [...otherRelatedNodes, ...nodes];
  const newIds = newRelated
    .map((n) => n.tokenId)
    .filter(onlyUnique)
    .sort(function (a, b) {
      return existingIds.indexOf(a) - existingIds.indexOf(b);
    });
  if (Object.values(diff(existingIds, newIds)).length) {
    formik.setFieldValue("related", newRelated);
  }
};

export const unstageNodeRelations = (
  formik,
  relation: "incoming" | "outgoing",
  nodes: BaseNode[],
  name: string
) => {
  const nodeIds = nodes.map((n) => n.tokenId);

  const deactivatedExistingEdges = formik.values[relation].reduce((acc, e) => {
    const n = formik.values.related.find(
      (r: BaseNode) => r.tokenId === e.tokenId
    );
    if (!n) return acc;
    if (e.name === name && nodeIds.includes(n.tokenId)) {
      return [...acc, { ...e, active: false }];
    }
    return [...acc, e];
  }, []);

  formik.setFieldValue(relation, [...deactivatedExistingEdges]);
};