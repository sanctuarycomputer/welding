import { useFormik, FormikProps } from 'formik';
import type { BaseNodeFormValues, MintState, BaseNode, Account } from 'src/types';
import * as yup from 'yup';
import NProgress from 'nprogress';
import Welding from 'src/lib/Welding';
import toast from 'react-hot-toast';
import Client from 'src/lib/Client';
import { emojiIndex, BaseEmoji } from 'emoji-mart';
import { useSigner } from 'wagmi';

const DEFAULT_EMOJI: BaseEmoji =
  (Object.values(emojiIndex.emojis)[0] as BaseEmoji);

const makeFormikForBaseNode: FormikProps<BaseNodeFormValues> = (
  node: BaseNode | undefined,
  onComplete: Function,
  onError?: Function | undefined
) => {
  const { data: signer } = useSigner();

  return useFormik<BaseNodeFormValues>({
    enableReinitialize: true,
    initialValues: (node ? {
      name: node.currentRevision.metadata.name,
      description: node.currentRevision.metadata.description,
      emoji: node.currentRevision.metadata.properties.emoji,
      content: node.currentRevision.metadata.properties.content,
      image: node.currentRevision.metadata.image,
      __readOnly__: node
    } : {
      name: '',
      description: '',
      emoji: DEFAULT_EMOJI,
      content: null,
      image: null,
      __readOnly__: null,
    }),
    onSubmit: async (values) => {
      let toastId;
      try {
        if (!signer) return;

        NProgress.start();
        toastId = toast.loading('Publishing metadata...', {
          position: 'bottom-right',
          className: 'toast'
        });

        const hash =
          await Welding.publishMetadataToIPFS(values);

        NProgress.done();
        toast.loading('Requesting signature...', {
          id: toastId
        });

        if (!signer) return;
        let tx;

        if (node) {
          // TODO: Update Topics?
          tx = await Welding.Nodes.connect(signer).makeRevision(
            node.tokenId,
            hash,
          );
          NProgress.start();
          toast.loading('Minting...', {
            id: toastId
          });
          tx = await tx.wait();

          // Ensure we've processed this block before continuing
          toast.loading('Confirming...', {
            id: toastId
          });
          await Client.fastForward(tx.blockNumber);

          toast.success('Success!', {
            id: toastId
          });

          return onComplete(tx);
        }

        tx = await Welding.Nodes.connect(signer).mintNode(
          //Welding.LABELS.document,
          hash,
          topics.map(t => t.tokenId),
          [subgraph.tokenId]
        );
        NProgress.start();
        toast.loading('Minting...', {
          id: toastId
        });
        tx = await tx.wait();

        // Ensure we've processed this block before continuing
        toast.loading('Confirming transaction...', {
          id: toastId
        });
        await Client.fastForward(tx.blockNumber);

        toast.success('Success!', {
          id: toastId
        });

        return onComplete(tx);

        //const transferEvent =
        //  tx.events.find(e => e.event === "Transfer");
        //const slug =
        //  Welding.slugify(`${transferEvent.args.tokenId} ${values.name}`);
        //router.push(
        //  `/subgraphs/${Welding.slugifyNode(subgraph)}/${slug}`
        //);
      } catch(e) {
        NProgress.done();
        toast.error('An error occured.', {
          id: toastId
        });
        console.log(e);
        if (onError) return onError(e);
      }
    },
    validationSchema: yup.object({
      name:
        yup.string().trim().required('Node name is required'),
    }),
  });
};

export default makeFormikForBaseNode;
