import { FC, useContext, useState } from 'react';
import { GraphContext } from 'src/hooks/useGraphData';
import { useRouter } from 'next/router';
import { ModalContext, ModalType } from 'src/hooks/useModal';
import makeFormikForBaseNode from 'src/lib/makeBaseNodeFormik';
import type { GetServerSideProps } from 'next';
import Client from 'src/lib/Client';
import { BaseNode } from 'src/types';
import { useSigner, useConnect, useAccount } from 'wagmi';
import SubgraphSidebar from 'src/components/SubgraphSidebar';
import EditNav from 'src/components/EditNav';
import { useFormik, FormikProps } from 'formik';
import * as yup from 'yup';
import Frontmatter from 'src/components/Frontmatter';
import dynamic from 'next/dynamic';
import Welding from 'src/lib/Welding';

const Team = dynamic(() => import('src/components/Team'), {
  ssr: false
});

type Props = {
  subgraph: BaseNode
};

const Settings: FC<Props> = ({
  subgraph
}) => {
  const router = useRouter();
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const { openModal, closeModal } = useContext(ModalContext);

  const { isConnecting } = useConnect();
  const { data: signer } = useSigner();
  const { data: account } = useAccount();
  const { accountData } = useContext(GraphContext);

  let canEditSubgraph = false;
  if (accountData && (
    accountData.adminOf.find(n => n.tokenId === subgraph.tokenId) ||
    accountData.editorOf.find(n => n.tokenId === subgraph.tokenId)
  )) canEditSubgraph = true;

  let canAdministerSubgraph = false;
  if (accountData && (
    accountData.adminOf.find(n => n.tokenId === subgraph.tokenId)
  )) canAdministerSubgraph = true;

  const subgraphDocuments = subgraph.backlinks.filter(n =>
    n.labels.includes('Document')
  );
  const subgraphTopics = subgraph.backlinks.filter(n =>
    n.labels.includes('Topic')
  );

  const didAddMember = (address: string, role: number) => {
    closeModal();
    return router.reload();
  };

  const subgraphFormik = makeFormikForBaseNode(subgraph, (tx) => {
    return router.reload();
  });
  const unsavedChanges = subgraphFormik.dirty;

  const persistedCoverImageSrc =
    `${Welding.ipfsGateways[0]}${subgraph.currentRevision.metadata.image.replace('ipfs://', '/ipfs/')}`;
  const [coverImagePreview, setCoverImagePreview] =
    useState<string | null>(persistedCoverImageSrc);
  const coverImageFileDidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLInputElement;
    const file = target.files[0];

    const fileReader = new FileReader();
    fileReader.addEventListener("load", function(e) {
      setCoverImagePreview(e.target.result);
      formik.setFieldValue('image', e.target.result.split(',')[1]);
    });
    fileReader.readAsDataURL(file);
  };

  return (
    <>
      <div
        className={`py-4 pt-0 mt-12 ${sidebarHidden ? '' : 'ml-64'}`}
      >
        <SubgraphSidebar
          //subgraph={subgraph}
          subgraphFormik={subgraphFormik}
          coverImagePreview={coverImagePreview}
          coverImageFileDidChange={coverImageFileDidChange}
          canEdit={canEditSubgraph}
          topics={subgraphTopics}
          documents={subgraphDocuments}
          currentDocument={null}
          hide={sidebarHidden}
          didClickHide={() => setSidebarHidden(!sidebarHidden)}
          didClickSubgraphSwitcher={() => setSubgraphSwitcherOpen(true)}
        />

        <EditNav
          unsavedChanges={unsavedChanges}
          coverImageFileDidChange={coverImageFileDidChange}
          formik={subgraphFormik}
          buttonLabel={subgraphFormik.isSubmitting
            ? "Loading..."
            : "+ Mint Revision"}
        />

        <div className={`content ${sidebarHidden ? 'mx-auto' : 'px-4'}`}>

          <Frontmatter
            formik={subgraphFormik}
            readOnly={subgraphFormik.isSubmitting}
            label="document"
          />

          <div className="flex flex-grow justify-between items-center pb-2">
            <h2 className="font-semibold">Team</h2>
            {canAdministerSubgraph && (
              <p className="cursor-pointer" onClick={() => openModal({
                type: ModalType.ADD_MEMBER,
                meta: {
                  node: subgraph,
                  onComplete: didAddMember
                }
              })}>+ Add Member</p>
            )}
          </div>

          <Team node={subgraph} currentAddress={account?.address} />
        </div>
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
    props: { subgraph },
  };
}

export default Settings;
