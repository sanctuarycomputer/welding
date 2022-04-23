import type { NextPage, GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Button from 'src/components/Button';
import Frontmatter from 'src/components/Frontmatter';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { emojiIndex } from 'emoji-mart';
import SubgraphSidebar from 'src/components/SubgraphSidebar';
import EditNav from 'src/components/EditNav';
import { useSigner, useConnect, useAccount } from 'wagmi';
import NProgress from 'nprogress';
import TopicManager from 'src/components/TopicManager';
import Welding from 'src/lib/Welding';

const GraphsDocumentMint: NextPage = ({
  subgraph,
  subgraphDocuments,
  subgraphTopics
}) => {
  const router = useRouter();

  const [{ loading: connectionLoading}] = useConnect();
  const [{ data: signer, loading }] = useSigner();
  const [{ data: account }] = useAccount();
  const [canEdit, setCanEdit] = useState(null);

  const loadCanEdit = async () => {
    if (!connectionLoading && !account) {
      return router.push(`/subgraphs/${subgraph.slug}`);
    }
    if (signer) {
      const canEdit =
        await Welding.Nodes
          .connect(signer)
          .canEdit(subgraph.id, account.address);
      if (!canEdit) {
        return router.push(`/subgraphs/${subgraph.slug}`);
      }
      setCanEdit(true);
    }
  };

  useEffect(() => { loadCanEdit() }, []);
  useEffect(() => {
    loadCanEdit();
  }, [account, connectionLoading]);

  const [topics, setTopics] = useState([]);
  const [mintProgress, setMintProgress] = useState(null);

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      emoji: Object.values(emojiIndex.emojis)[0]
    },
    onSubmit: async (values) => {
      try {
        NProgress.start();
        const hash =
          await Welding.publishMetadataToIPFS(values);
        NProgress.done();

        let tx = await Welding.Nodes.connect(signer).mintNode(
          Welding.LABELS.document,
          hash,
          topics.map(t => t.id),
          [subgraph.id]
        );
        NProgress.start();
        tx = await tx.wait();

        const transferEvent =
          tx.events.find(e => e.event === "Transfer");
        const documentId = transferEvent.args.tokenId;
        const slug =
          Welding.slugify(`${documentId} ${values.name}`);
        router.push(
          `/subgraphs/${subgraph.slug}/${slug}`
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
      <div className="py-4 mt-6 ml-64 pl-4" style={{height: "3000px"}}>
        <SubgraphSidebar
          subgraph={subgraph}
          canEdit={canEdit}
          topics={subgraphTopics}
          documents={subgraphDocuments}
          newDocument={formik}
        />

        {canEdit === true && (
          <>
            <EditNav
              formik={formik}
              buttonLabel={formik.isSubmitting
                ? "Loading..."
                : "+ Mint Document"}
            />

            <div className="content">
              <Frontmatter
                formik={formik}
                label={Welding.LABELS.document}
              />
              <TopicManager
                setTopics={setTopics}
                topics={topics}
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
  gid = gid.split('-')[0];

  const subgraph =
    await Welding.loadNodeById(gid, null);

  // TODO: redirect if not found

  const topics =
    await Welding.loadNodeConnectionsByLabel(subgraph.id, 'topic');
  const documents =
    await Welding.loadNodeConnectionsByLabel(subgraph.id, 'document');
  return {
    props: {
      subgraph,
      subgraphTopics: topics,
      subgraphDocuments: documents
    },
  };
}

export default GraphsDocumentMint;
