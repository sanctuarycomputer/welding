import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/router";
import Client from "src/lib/Client";
import makeFormikForBaseNode from "src/lib/makeBaseNodeFormik";
import useEditableImage from "src/hooks/useEditableImage";
import { useSigner } from "wagmi";
import { GraphContext } from "src/hooks/useGraphData";
import { ModalContext, ModalType } from "src/hooks/useModal";
import NProgress from "nprogress";

interface WithPublisherProps {}

export default function withPublisher<
  T extends WithPublisherProps = WithPublisherProps
>(label: NodeLabel, WrappedComponent: React.ComponentType<T>) {
  const ComponentWithPublisher = (props: Omit<T, keyof WithPublisherProps>) => {
    const router = useRouter();
    const { data: signer } = useSigner();
    const { accountData, loadAccountData } = useContext(GraphContext);
    const { openModal, closeModal } = useContext(ModalContext);

    const [node, setNode] = useState(props.node);
    const reloadData = async (tx) => {
      loadAccountData(accountData?.address);
      if (node.tokenId.startsWith("-")) {
        const transferEvent = tx?.events.find((e) => e.event === "Transfer");
        if (transferEvent) {
          await router.push(`/${transferEvent.args.tokenId.toString()}`);
        } else {
          await router.reload();
        }
      } else {
        setNode(await Client.fetchBaseNodeByTokenId(node.tokenId));
      }
      NProgress.done();
      formik.setStatus(null);
    };

    const formik = makeFormikForBaseNode(signer, accountData, label, node);

    const [imagePreview, imageDidChange, clearImage] = useEditableImage(formik);

    useEffect(() => {
      if (!formik?.status) {
        closeModal();
        return;
      }
      const { status, tx } = formik.status;
      if (status === "COMPLETE") {
        reloadData(tx);
        return;
      }
      openModal({
        type: ModalType.PUBLISHER,
        meta: { formik },
      });
    }, [formik?.status]);

    return (
      <WrappedComponent
        formik={formik}
        imageDidChange={imageDidChange}
        imagePreview={imagePreview}
        clearImage={clearImage}
        reloadData={reloadData}
        {...(props as T)}
      />
    );
  };

  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || "Component";
  ComponentWithPublisher.displayName = `withPublisher(${displayName})`;
  return ComponentWithPublisher;
}
