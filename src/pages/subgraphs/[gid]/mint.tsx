import { FC } from 'react';
import type { GetServerSideProps } from 'next';
import type { BaseNodeFormValues, MintState, BaseNode } from 'src/types';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSigner, useConnect, useAccount } from 'wagmi';
import { useFormik, FormikProps } from 'formik';
import * as yup from 'yup';

import Frontmatter from 'src/components/Frontmatter';
import SubgraphSidebar from 'src/components/SubgraphSidebar';
import EditNav from 'src/components/EditNav';
import TopicManager from 'src/components/TopicManager';

import NProgress from 'nprogress';
import Client from 'src/lib/Client';
import Welding from 'src/lib/Welding';
import { emojiIndex, BaseEmoji } from 'emoji-mart';
import dynamic from 'next/dynamic';

const DEFAULT_EMOJI: BaseEmoji =
  (Object.values(emojiIndex.emojis)[0] as BaseEmoji);

const Editor = dynamic(() => import('src/components/Editor'), {
  ssr: false
});

type Props = {
  subgraph: BaseNode,
};

const GraphsDocumentMint: FC<Props> = ({
  subgraph,
}) => {
  const router = useRouter();
  const [sidebarHidden, setSidebarHidden] = useState(false);

  const { isConnecting } = useConnect();
  const { data: signer } = useSigner();
  const { data: account } = useAccount();
  const [canEdit, setCanEdit] = useState<boolean | null>(null);

  const loadCanEdit = async () => {
    if ((!isConnecting && !account) || !account?.address) {
      return router.push(`/subgraphs/${Welding.slugifyNode(subgraph)}`);
    }
    if (signer) {
      const canEdit =
        await Welding.Nodes
          .connect(signer)
          .canEdit(subgraph.tokenId, account.address);
      if (!canEdit) {
        return router.push(`/subgraphs/${Welding.slugifyNode(subgraph)}`);
      }
      setCanEdit(true);
    }
  };

  useEffect(() => { loadCanEdit() }, []);
  useEffect(() => {
    loadCanEdit();
  }, [account, isConnecting]);

  const subgraphDocuments = subgraph.backlinks.filter(n =>
    n.labels.includes('Document')
  );
  const subgraphTopics = subgraph.backlinks.filter(n =>
    n.labels.includes('Topic')
  );

  const [topics, setTopics] = useState<BaseNode[]>([]);
  const [mintState, setMintState] =
    useState<{ [tokenId: string]: MintState }>({});

  const formik: FormikProps<BaseNodeFormValues> = useFormik<BaseNodeFormValues>({
    initialValues: {
      name: '',
      description: '',
      emoji: DEFAULT_EMOJI,
      content: null
    },
    onSubmit: async (values) => {
      try {
        NProgress.start();
        const hash =
          await Welding.publishMetadataToIPFS(values);
        NProgress.done();

        if (!signer) return;
        let tx = await Welding.Nodes.connect(signer).mintNode(
          Welding.LABELS.document,
          hash,
          topics.map(t => t.tokenId),
          [subgraph.tokenId]
        );
        NProgress.start();
        tx = await tx.wait();

        const transferEvent =
          tx.events.find(e => e.event === "Transfer");
        const documentId = transferEvent.args.tokenId;
        const slug =
          Welding.slugify(`${documentId} ${values.name}`);
        router.push(
          `/subgraphs/${Welding.slugifyNode(subgraph)}/${slug}`
        );
      } catch(e) {
        NProgress.done();
        console.log(e);
      }
    },
    validationSchema: yup.object({
      name:
        yup.string().trim().required('Document name is required'),
    }),
  });

  return (
    <>
      <div
        className={`py-4 mt-6 ${sidebarHidden ? '' : 'ml-64'}`}
      >
        <SubgraphSidebar
          subgraph={subgraph}
          canEdit={!!canEdit}
          topics={subgraphTopics}
          documents={subgraphDocuments}
          newDocument={formik}
          hide={sidebarHidden}
          didClickHide={() => setSidebarHidden(!sidebarHidden)}
        />

        {canEdit && (
          <>
            <EditNav
              formik={formik}
              buttonLabel={formik.isSubmitting
                ? "Loading..."
                : "+ Mint Document"}
            />

            <div
              className={`content ${sidebarHidden ? 'mx-auto' : 'pl-4'}`}
            >
              <Frontmatter
                readOnly={false}
                formik={formik}
                label={Welding.LABELS.document}
              />
              <TopicManager
                readOnly={false}
                setMintState={setMintState}
                mintState={mintState}
                setTopics={setTopics}
                topics={topics}
              />
              <Editor
                readOnly={formik.isSubmitting}
                content={formik.values.content}
                contentDidChange={
                  content => formik.setFieldValue('content', content)
                }
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  let { gid } = context.query;
  gid = ((Array.isArray(gid) ? gid[0] : gid) || '').split('-')[0];
  const subgraph =
    await Client.fetchBaseNodeByTokenId(gid);
  if (!subgraph || !subgraph.labels.includes('Subgraph')) return {
    redirect: { permanent: false, destination: `/` },
    props: {},
  };

  return {
    props: { subgraph }
  };
}

export default GraphsDocumentMint;
