import { useFormik, FormikProps } from 'formik';
import type { Label, BaseNodeFormValues, MintState, BaseNode, Account } from 'src/types';
import * as yup from 'yup';
import NProgress from 'nprogress';
import Welding from 'src/lib/Welding';
import toast from 'react-hot-toast';
import Client from 'src/lib/Client';
import { emojiIndex, BaseEmoji } from 'emoji-mart';
import { detailedDiff } from 'deep-object-diff';
import { BigNumber } from '@ethersproject/bignumber';

enum PublishStep {
  FEES = "FEES",
  PUBLISH = "PUBLISH",
  REQUEST_SIG = "REQUEST_SIG",
  TRANSACT = "TRANSACT",
  CONFIRM = "CONFIRM",
  COMPLETE = "COMPLETE",
  ERROR = "ERROR",
};

const feesRequired = (
  formik,
  accountData
) => {
  const node = formik.values.__node__;
  const incomingDiff =
    detailedDiff(node.incoming, formik.values.incoming);

  return Object.keys(incomingDiff.added).reduce((acc, key) => {
    if (!incomingDiff.added[key].active) return acc;
    const edge = formik.values.incoming[key];
    if (!edge || !edge.active) return acc;
    const n = formik.values.related.find((n: BaseNode) =>
      edge.tokenId === n.tokenId
    );
    if (!n) return acc;
    if (n.fee === "0") return acc;
    const owned = accountData && !!accountData.related.find(r => {
      return r.tokenId === n.tokenId;
    });
    if (owned) return acc;
    return acc.add(BigNumber.from(n.fee));
  }, BigNumber.from(0));
};

const makeFormikForBaseNode: FormikProps<BaseNodeFormValues> = (
  signer,
  accountData,
  label: Label,
  node: BaseNode,
  onComplete: Function,
  onError?: Function,
  onProgress?: Function,
) => {
  const formik = useFormik<BaseNodeFormValues>({
    enableReinitialize: true,
    initialValues: {
      name: node.currentRevision.metadata.name,
      description: node.currentRevision.metadata.description,
      emoji: node.currentRevision.metadata.properties.emoji,
      content: node.currentRevision.metadata.properties.content,
      image: node.currentRevision.metadata.image,
      related: node.related,
      outgoing: node.outgoing,
      incoming: node.incoming,
      __node__: node,
    },
    onSubmit: async (values) => {
      let status;
      let id = toast.loading('Publishing metadata...', {
        className: 'toast'
      });

      try {
        if (!signer) throw new Error("no_signer_present");

        /* Publish */
        status = PublishStep.PUBLISH;
        formik.setStatus({ status });
        NProgress.start();

        // TODO: Deep diff
        const hash =
          await Welding.publishMetadataToIPFS(values);
        NProgress.done();

        /* Request Signature */
        status = PublishStep.REQUEST_SIG;
        formik.setStatus({ status });
        toast.loading('Requesting signature...', { id });
        if (!signer) throw new Error("no_signer_present");

        let tx;
        if (node.tokenId.startsWith('-')) {
          // TODO: If it's a Document, add the Subgraph Delegate Permission ID
          tx = await Welding.Nodes.connect(signer).mint(
            label,
            hash,
            values.incoming.filter(e => e.active),
            values.outgoing.filter(e => e.active),
            [],
            { value: feesRequired(formik, accountData) }
          );
        } else {
          const connectionsDidChange =
            JSON.stringify(values.incoming) !== JSON.stringify(node.incoming) ||
            JSON.stringify(values.outgoing) !== JSON.stringify(node.outgoing);
          const hashDidChange =
            hash !== node.currentRevision.hash;

          if (connectionsDidChange) {
            tx = await Welding.Nodes.connect(signer).merge(
              node.tokenId,
              hash,
              values.incoming
                .filter(e => !e.name.startsWith('_'))
                .filter(e => e.pivotTokenId === node.tokenId)
                .filter(e => e.active),
              values.outgoing
                .filter(e => !e.name.startsWith('_'))
                .filter(e => e.pivotTokenId === node.tokenId)
                .filter(e => e.active),
              { value: feesRequired(formik, accountData) }
            );
          } else if (hashDidChange) {
            tx = await Welding.Nodes.connect(signer).revise(
              node.tokenId,
              hash,
            );
          }
        }

        if (!tx) {
          status = PublishStep.COMPLETE;
          formik.setStatus({ status });
        }

        /* Transact */
        status = PublishStep.TRANSACT;
        formik.setStatus({ status });
        NProgress.start();
        toast.loading('Processing...', { id });
        tx = await tx.wait();

        /* Confirm */
        status = PublishStep.CONFIRM;
        formik.setStatus({ status });
        toast.loading('Confirming...', { id });
        await Client.fastForward(tx.blockNumber);

        /* Success */
        status = PublishStep.COMPLETE;
        formik.setStatus({ status, tx });
        toast.success('Success!', { id });
        return;
      } catch(e) {
        console.log(e);
        NProgress.done();
        toast.error('An error occured.', {
          id,
          className: 'toast',
        });
        formik.setStatus({ status, error: e });
        throw e;
      }
    },
    validationSchema: yup.object({
      name:
        yup.string().trim().required('Name is required'),
    }),
  });

  return formik;
};

export const getRelatedNodes = (
  formik: BaseNode,
  relation: 'incoming' | 'outgoing',
  label: string,
  name: string
) => {
  const uniqueTokenIds = new Set();
  return formik.values[relation].map((e: Edge) => {
    if (e.active === false) return null;
    if (e.name !== name) return null;
    const n =
      formik.values.related.find((node: BaseNode) =>
        node.tokenId === e.tokenId);
    if (!n) return null;
    if (!n.labels.includes(label)) return null;
    return n;
  }).filter(n => {
    if (n === null) return false;
    const dupe = uniqueTokenIds.has(n.tokenId);
    uniqueTokenIds.add(n.tokenId);
    if (!dupe) return true;
    return false;
  });
};

export const hasStagedRelations = (
  formik,
  relation: 'incoming' | 'outgoing',
  nodes: BaseNode[],
  name: string
) => {
  return nodes.every(n => {
    return !!formik.values[relation].find(e => {
      return (
        e.name === name &&
        e.tokenId === n.tokenId &&
        e.active
      );
    });
  });
};

export const stageNodeRelations = (
  formik,
  relation: 'incoming' | 'outgoing',
  nodes: BaseNode[],
  name: string,
  disableOthers: boolean
) => {
  const pivotTokenId = formik.values.__node__.tokenId;
  const nodeIds = nodes.map(n => n.tokenId);

  // Activate possible existing edges for this relation
  const activatedExistingEdges =
    formik.values[relation].reduce((acc, e) => {
      const n = formik.values.related.find((r: BaseNode) =>
        r.tokenId === e.tokenId);
      if (!n) return acc;
      if (
        e.pivotTokenId === pivotTokenId,
        e.name === name
      ) {
        if (disableOthers) {
          if (nodeIds.includes(n.tokenId)) {
            return [...acc, { ...e, active: true }];
          } else {
            return [...acc, { ...e, active: false}];
          }
        } else {
          return [...acc, { ...e, active: true }];
        }
      }

      return [...acc, e];
    }, []);

  // After activation,
  const missingEdges = nodes.map(n => {
    const existingEdge = activatedExistingEdges.find(e => {
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
      active: true
    };
  }).filter(e => e !== null);

  formik.setFieldValue(relation, [
    ...activatedExistingEdges,
    ...missingEdges
  ]);

  const otherRelatedNodes =
    formik.values.related.filter((n: BaseNode) => {
      return !nodeIds.includes(n.tokenId);
    });
  formik.setFieldValue('related', [
    ...otherRelatedNodes,
    ...nodes
  ]);
}

export const unstageNodeRelations = (
  formik,
  relation: 'incoming' | 'outgoing',
  nodes: BaseNode[],
  name: string
) => {
  const nodeIds = nodes.map(n => n.tokenId);

  const deactivatedExistingEdges =
    formik.values[relation].reduce((acc, e) => {
      const n = formik.values.related.find((r: BaseNode) =>
        r.tokenId === e.tokenId);
      if (!n) return acc;
      if (
        e.name === name &&
        nodeIds.includes(n.tokenId)
      ) {
        return [...acc, { ...e, active: false }];
      }
      return [...acc, e];
    }, []);

  formik.setFieldValue(relation, [
    ...deactivatedExistingEdges
  ]);
}

export default makeFormikForBaseNode;
