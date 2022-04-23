import type { NextPage, GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Button from 'src/components/Button';
import Frontmatter from 'src/components/Frontmatter';
import Modal from 'react-modal';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { emojiIndex } from 'emoji-mart';
import SubgraphSidebar from 'src/components/SubgraphSidebar';
import EditNav from 'src/components/EditNav';
import { useSigner, useConnect, useAccount } from 'wagmi';
import TopicManager from 'src/components/TopicManager';
import NProgress from 'nprogress';
import Welding from 'src/lib/Welding';
import slugify from 'slugify';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('src/components/Editor'), {
  ssr: false
});

const GraphsDocumentMint: NextPage = ({
  subgraph,
  subgraphDocuments,
  subgraphTopics,
  document,
  documentTopics
}) => {
  const router = useRouter();

  const [{ loading: connectionLoading}] = useConnect();
  const [{ data: signer, loading }] = useSigner();
  const [{ data: account }] = useAccount();
  const [canEdit, setCanEdit] = useState(null);

  const loadCanEdit = async () => {
    if (signer && account) {
      const canEdit =
        await Welding.Nodes
          .connect(signer)
          .canEdit(subgraph.id, account.address);
      setCanEdit(canEdit);
    } else {
      setCanEdit(false);
    }
  };

  useEffect(() => {
    loadCanEdit();
  }, [account, connectionLoading]);

  const [topics, setTopics] = useState(documentTopics);
  const [mintProgress, setMintProgress] = useState(null);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: document.metadata.name,
      description: document.metadata.description,
      emoji: document.metadata.properties.emoji,
      content: (document.metadata.properties.content || {})
    },
    onSubmit: async (values) => {
      try {
        NProgress.start();
        const hash =
          await Welding.publishMetadataToIPFS(values);
        NProgress.done();

        const tx =
          await Welding.Nodes.connect(signer).makeRevision(
            document.id,
            hash,
          );
        NProgress.start();
        await tx.wait();

        const slug =
          Welding.slugify(`${document.id} ${values.name}`);
        router.replace(`/subgraphs/${subgraph.slug}/${slug}`);
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
        className="py-4 mt-6 ml-64 pl-4"
        style={{height: "3000px"}}
      >
        <SubgraphSidebar
          subgraph={subgraph}
          canEdit={canEdit}
          topics={subgraphTopics}
          documents={subgraphDocuments}
          currentDocument={document}
        />

        {canEdit && (
          <EditNav
            formik={formik}
            buttonLabel={formik.isSubmitting
              ? "Loading..."
              : "+ Mint Revision"}
            onButtonClick={formik.handleSubmit}
          />
        )}

        <div className="content">
          <Frontmatter
            formik={formik}
            readOnly={!canEdit || formik.isSubmitting}
          />
          {canEdit && (
            <TopicManager
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
  gid = gid.split('-')[0];
  did = did.split('-')[0];

  const subgraph =
    await Welding.loadNodeById(gid, null);
  const topics =
    await Welding.loadNodeConnectionsByLabel(subgraph.id, 'topic');
  const documents =
    await Welding.loadNodeConnectionsByLabel(subgraph.id, 'document');
  const document = documents.find(d => d.id === did);

  // If no document, redirect

  const documentTopics =
    await Welding.loadNodeConnectionsByLabel(did, 'topic');

  return {
    props: {
      subgraph,
      subgraphTopics: topics,
      subgraphDocuments: documents,
      document: document,
      documentTopics
    },
  };
}

export default GraphsDocumentMint;
