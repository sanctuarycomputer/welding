import type { NextPage, GetServerSideProps } from 'next';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Button from 'src/components/Button';
import Frontmatter from 'src/components/Frontmatter';
import Modal from 'react-modal';
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

  const [confirmModalIsOpen, setConfirmModalIsOpen] = useState(false);
  const openConfirmModal = () => setConfirmModalIsOpen(true);
  const closeConfirmModal = () => setConfirmModalIsOpen(false);

  return (
    <>
      <Modal
        isOpen={confirmModalIsOpen}
        onRequestClose={closeConfirmModal}
        contentLabel="Confirm Modal"
      >
        <div className="flex p-4 border-b border-color">
          <div>
            <h2>Confirm Connections</h2>
            <p>
              You’re connecting to some external Nodes.
              <br />
              Please confirm the following fees.
            </p>
          </div>
          <span onClick={closeConfirmModal} className="cursor-pointer flex items-center pl-8">✕</span>
        </div>

        <div className="border-b border-color">
          <div className="flex p-4 justify-between items-center flex-row">
            <div className="flex flex-row py-1">
              <p className="pr-2">Topic</p>
              <p>Tag</p>
            </div>
            <p className="font-semibold">0.0003 MATIC</p>
          </div>
        </div>

        <div>
          <div className="flex p-4 justify-end flex-row items-center">
            <Button
              label="Confirm"
              onClick={closeConfirmModal}
            />
            <p className="pl-2 font-semibold">0.0003 MATIC</p>
          </div>
        </div>
      </Modal>

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
