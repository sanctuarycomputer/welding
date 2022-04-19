import type { NextPage, GetServerSideProps } from 'next';
import Link from 'next/link';
import Frontmatter from 'src/components/Frontmatter';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { emojiIndex } from 'emoji-mart';
import EditNav from 'src/components/EditNav';
import TopicManager from 'src/components/TopicManager';

import { ethers } from 'ethers';
import Welding from 'src/lib/Welding';

const GraphsMint: NextPage = ({ }) => {
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

      await Welding.init();
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      try {
        const tx = await (await Welding.Graphs.connect(signer).mint(hash)).wait();
        const transferEvent = tx.events.find(e => e.event === "Transfer");
        const graphId = transferEvent.args.tokenId;
        console.log(graphId);
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
        backLinkHref="/graphs"
        backLinkLabel="← Graphs"
        buttonDisabled={!(formik.isValid && formik.dirty)}
        buttonLabel={formik.isSubmitting ? "Loading..." : "+ Mint Graph"}
        onButtonClick={formik.handleSubmit}
      />
      <div className="content py-4 mt-24 mx-auto">
        <Frontmatter formik={formik} />
        <TopicManager />
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
