import type { NextPage, GetServerSideProps } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Button from 'src/components/Button';
import Frontmatter from 'src/components/Frontmatter';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { emojiIndex } from 'emoji-mart';
import EditNav from 'src/components/EditNav';
import TopicManager from 'src/components/TopicManager';

import { ethers } from 'ethers';
import Welding from 'src/lib/Welding';

const GraphsMint: NextPage = ({ }) => {
  const router = useRouter();
  const [topics, setTopics] = useState([]);

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      emoji: Object.values(emojiIndex.emojis)[0]
    },
    onSubmit: async (values) => {
      const { name, description, emoji } = values;
      const response = await fetch('/api/publish-graph-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          emoji,
        })
      });
      const { hash } = await response.json();

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      try {
        const tx = await (
          await Welding.Nodes.connect(signer).mintNode(
            Welding.LABELS.subgraph,
            hash,
            topics.map(t => t.id),
            []
          )
        ).wait();
        const transferEvent = tx.events.find(e => e.event === "Transfer");
        const subgraphId = transferEvent.args.tokenId;
        router.push(`/subgraphs/${subgraphId.toString()}/mint`);
      } catch(e) {
        console.log(e);
      }
    },
    validationSchema: yup.object({
      name:
        yup.string().trim().required('Graph name is required'),
    }),
  });

  return (
    <>
      <EditNav
        formik={formik}
        buttonLabel={formik.isSubmitting ? "Loading..." : "+ Mint Graph"}
      />

      <div className="content py-4 mt-24 mx-auto">
        <Frontmatter
          formik={formik}
          label={Welding.LABELS.subgraph}
        />
        <TopicManager
          setTopics={setTopics}
          topics={topics}
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
