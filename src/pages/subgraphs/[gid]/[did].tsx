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
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('src/components/Editor'), {
  ssr: false
});

type Props = {
  subgraph: BaseNode,
  document: BaseNode,
};

const GraphsDocumentMint: FC<Props> = ({
  subgraph,
  document,
}) => {
  const router = useRouter();
  const [sidebarHidden, setSidebarHidden] = useState(false);

  const { isConnecting } = useConnect();
  const { data: signer } = useSigner();
  const { data: account } = useAccount();
  const [canEdit, setCanEdit] = useState<boolean | null>(null);

  const loadCanEdit = async () => {
    if (!signer || !account?.address) return setCanEdit(false);
    const canEdit =
      await Welding.Nodes
        .connect(signer)
        .canEdit(subgraph.tokenId, account.address);
    setCanEdit(canEdit);
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
  const documentTopics = document.backlinks.filter(n =>
    n.labels.includes('Topic')
  );

  const [topics, setTopics] = useState<BaseNode[]>(documentTopics);
  const [mintState, setMintState] =
    useState<{ [tokenId: string]: MintState }>({});

  const formik: FormikProps<BaseNodeFormValues> = useFormik<BaseNodeFormValues>({
    enableReinitialize: true,
    initialValues: {
      name: document.currentRevision.metadata.name,
      description: document.currentRevision.metadata.description,
      emoji: document.currentRevision.metadata.properties.emoji,
      content: document.currentRevision.metadata.properties.content
    },
    onSubmit: async (values) => {
      try {
        NProgress.start();
        const hash =
          await Welding.publishMetadataToIPFS(values);
        NProgress.done();

        if (!signer) return;
        const tx =
          await Welding.Nodes.connect(signer).makeRevision(
            document.tokenId,
            hash,
          );
        NProgress.start();
        await tx.wait();

        // TODO: prewarm things?
        router.replace(`/subgraphs/${Welding.slugifyNode(subgraph)}/${Welding.slugifyNode(document)}`);
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
          currentDocument={document}
          hide={sidebarHidden}
          didClickHide={() => setSidebarHidden(!sidebarHidden)}
        />

        {canEdit && (
          <EditNav
            formik={formik}
            buttonLabel={formik.isSubmitting
              ? "Loading..."
              : "+ Mint Revision"}
          />
        )}

        <div
          className={`content ${sidebarHidden ? 'mx-auto' : 'pl-4'}`}
        >
          <Frontmatter
            formik={formik}
            readOnly={!canEdit || formik.isSubmitting}
            label="document"
          />

          {canEdit && (
            <TopicManager
              mintState={mintState}
              setMintState={setMintState}
              setTopics={setTopics}
              topics={topics}
              readOnly={!canEdit || formik.isSubmitting}
            />
          )}

          <Editor
            readOnly={!canEdit || formik.isSubmitting}
            content={formik.values.content}
            contentDidChange={
              content => formik.setFieldValue('content', content)
            }
          />
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  let { gid, did } = context.query;
  gid = ((Array.isArray(gid) ? gid[0] : gid) || '').split('-')[0];
  const subgraph =
    await Client.fetchBaseNodeByTokenId(gid);
  if (!subgraph || !subgraph.labels.includes('Subgraph')) return {
    redirect: { permanent: false, destination: `/` },
    props: {},
  };

  did = ((Array.isArray(did) ? did[0] : did) || '').split('-')[0];
  const document =
    await Client.fetchBaseNodeByTokenId(did);
  if (!document || !document.labels.includes('Document')) return {
    redirect: { permanent: false, destination: `/subgraphs/${subgraph.tokenId}`},
    props:{},
  };

  return {
    props: { subgraph, document }
  };
}

export default GraphsDocumentMint;
