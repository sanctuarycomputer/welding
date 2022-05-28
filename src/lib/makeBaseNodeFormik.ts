import { useFormik, FormikProps } from 'formik';
import type { Label, BaseNodeFormValues, MintState, BaseNode, Account } from 'src/types';
import * as yup from 'yup';
import NProgress from 'nprogress';
import Welding from 'src/lib/Welding';
import toast from 'react-hot-toast';
import Client from 'src/lib/Client';
import { emojiIndex, BaseEmoji } from 'emoji-mart';
import { useSigner } from 'wagmi';
import { Label } from 'src/types';

enum PublishStep {
  INIT = "INIT",
  PUBLISH = "PUBLISH",
  REQUEST_SIG = "REQUEST_SIG",
  TRANSACT = "TRANSACT",
  CONFIRM = "CONFIRM",
};

const makeFormikForBaseNode: FormikProps<BaseNodeFormValues> = (
  label: Label,
  node: BaseNode,
  onComplete: Function,
  onError?: Function,
  onProgress?: Function,
) => {
  const { data: signer } = useSigner();

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
      let toastId;

      try {
        if (!signer) throw new Error("no_signer_present");

        if (onProgress) onProgress(PublishStep.PUBLISH);
        NProgress.start();
        toastId = toast.loading('Publishing metadata...', {
          position: 'bottom-right',
          className: 'toast'
        });

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
            values.incoming,
            values.outgoing
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
              values.incoming,
              values.outgoing
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

export default makeFormikForBaseNode;
