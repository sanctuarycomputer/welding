import { useFormik, FormikProps } from 'formik';
import type { Label, BaseNodeFormValues, MintState, BaseNode, Account } from 'src/types';
import * as yup from 'yup';
import NProgress from 'nprogress';
import Welding from 'src/lib/Welding';
import toast from 'react-hot-toast';
import Client from 'src/lib/Client';
import { emojiIndex, BaseEmoji } from 'emoji-mart';
import { Label } from 'src/types';
import { detailedDiff } from 'deep-object-diff';
import { BigNumber } from '@ethersproject/bignumber';

enum PublishStep {
  INIT = "INIT",
  PUBLISH = "PUBLISH",
  REQUEST_SIG = "REQUEST_SIG",
  TRANSACT = "TRANSACT",
  CONFIRM = "CONFIRM",
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
      __node__: node
    },
    onSubmit: async (values) => {
      console.log(feesRequired(formik, accountData).toString());
      let toastId;

      try {
        if (!signer) throw new Error("no_signer_present");

        if (onProgress) onProgress(PublishStep.PUBLISH);
        NProgress.start();
        toastId = toast.loading('Publishing metadata...', {
          position: 'bottom-right',
          className: 'toast'
        });

        // TODO: Deep diff
        const hash =
          await Welding.publishMetadataToIPFS(values);

        NProgress.done();

        if (onProgress) onProgress(PublishStep.REQUEST_SIG);
        toast.loading('Requesting signature...', {
          id: toastId
        });

        if (!signer) throw new Error("no_signer_present");

        let tx;
        if (node.tokenId.startsWith('-')) {
          tx = await Welding.Nodes.connect(signer).mint(
            label,
            hash,
            values.incoming.filter(e => e.active),
            values.outgoing.filter(e => e.active),
            { value: feesRequired(formik, accountData) }
          );
        } else {
          const connectionsDidChange =
            JSON.stringify(values.incoming) !== JSON.stringify(node.incoming) ||
            JSON.stringify(values.outgoing) !== JSON.stringify(node.outgoing);
          const hashDidChange =
            hash !== node.currentRevision.hash;

          if (connectionsDidChange) {
            console.log(values.incoming, values.outgoing);
            tx = await Welding.Nodes.connect(signer).merge(
              node.tokenId,
              hash,
              values.incoming.filter(e => e.active),
              values.outgoing.filter(e => e.active),
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
          formik.resetForm({ values });
          NProgress.done();
          return onComplete(null);
        }

        if (onProgress) onProgress(PublishStep.TRANSACT);
        NProgress.start();
        toast.loading('Processing...', { id: toastId });
        tx = await tx.wait();

        if (onProgress) onProgress(PublishStep.CONFIRM);
        toast.loading('Confirming...', { id: toastId });
        await Client.fastForward(tx.blockNumber);

        toast.success('Success!', {
          id: toastId,
        });
        formik.resetForm({ values });
        NProgress.done();
        return onComplete(tx);
      } catch(e) {
        NProgress.done();
        toast.error('An error occured.', {
          id: toastId,
          position: 'bottom-right',
          className: 'toast',
        });
        console.log(e);
        if (onError) return onError(e);
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
  return formik.values[relation].map((e: Edge) => {
    if (e.active === false) return null;
    if (e.name !== name) return null;
    const n = formik.values.related.find((node: BaseNode) => node.tokenId === e.tokenId);
    if (!n) return null;
    if (!n.labels.includes(label)) return null;
    return n;
  }).filter(r => r !== null);
};

export default makeFormikForBaseNode;
