import { FC } from 'react';
import type { GetServerSideProps } from 'next';
import type { BaseNodeFormValues, MintState, BaseNode } from 'src/types';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSigner, useConnect, useAccount } from 'wagmi';
import { useFormik, FormikProps } from 'formik';
import * as yup from 'yup';

import Molecule from 'src/components/Icons/Molecule';
import EditNav from 'src/components/EditNav';
import Frontmatter from 'src/components/Frontmatter';
import TopicManager from 'src/components/TopicManager';

import NProgress from 'nprogress';
import Welding from 'src/lib/Welding';
import { emojiIndex, BaseEmoji } from 'emoji-mart';

const DEFAULT_EMOJI: BaseEmoji =
  (Object.values(emojiIndex.emojis)[0] as BaseEmoji);

const GraphsMint: FC<{}> = () => {
  const router = useRouter();

  const { isConnecting } = useConnect();
  const { data: signer } = useSigner();
  const { data: account } = useAccount();
  const [canEdit, setCanEdit] = useState<boolean | null>(null);

  const loadCanEdit = async () => {
    if ((!isConnecting && !account) || !account?.address) {
      return router.push(`/`);
    }
    setCanEdit(true);
  };

  useEffect(() => { loadCanEdit() }, []);
  useEffect(() => {
    loadCanEdit();
  }, [account, isConnecting]);

  const [topics, setTopics] = useState<BaseNode[]>([]);
  const [mintState, setMintState] =
    useState<{ [tokenId: string]: MintState }>({});

  const formik: FormikProps<BaseNodeFormValues> = useFormik<BaseNodeFormValues>({
    initialValues: {
      name: '',
      description: '',
      emoji: DEFAULT_EMOJI
    },
    onSubmit: async (values) => {
      try {
        NProgress.start();
        const hash =
          await Welding.publishMetadataToIPFS(values);
        NProgress.done();

        if (!signer) return;
        let tx =
          await Welding.Nodes.connect(signer).mintNode(
            Welding.LABELS.subgraph,
            hash,
            topics.map(t => t.tokenId),
            []
          );
        NProgress.start();
        tx = await tx.wait();
        const transferEvent =
          tx.events.find(e => e.event === "Transfer");
        const subgraphId = transferEvent.args.tokenId;
        const slug =
          Welding.slugify(`${subgraphId} ${values.name}`);
        router.push(
          `/subgraphs/${slug}/${slug}`
        );
      } catch(e) {
        NProgress.done();
        console.log(e);
      }
    },
    validationSchema: yup.object({
      name:
        yup.string().trim().required('Subgraph name is required'),
    }),
  });

  return (
    <>
      <EditNav
        formik={formik}
        buttonLabel={formik.isSubmitting ? "Loading..." : "+ Mint Graph"}
      />

      <div className="content py-4 mt-24 mx-auto">
        <div className="background-passive-color rounded p-4 flex flex-row">
          <div className="pr-2">
            <Molecule />
          </div>
          <div>
            <p className="text-sm">You're minting a subgraph.</p>
          </div>
        </div>
        <Frontmatter
          readOnly={!canEdit}
          formik={formik}
          label={Welding.LABELS.subgraph}
        />
        <TopicManager
          readOnly={!canEdit}
          setTopics={setTopics}
          topics={topics}
          mintState={mintState}
          setMintState={setMintState}
        />
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: { },
  };
}

export default GraphsMint;
