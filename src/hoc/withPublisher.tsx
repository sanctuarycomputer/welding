import { useState, useContext, useEffect } from 'react';
import Client from 'src/lib/Client';
import makeFormikForBaseNode from 'src/lib/makeBaseNodeFormik';
import useEditableImage from 'src/hooks/useEditableImage';
import { useSigner } from 'wagmi';
import { GraphContext } from 'src/hooks/useGraphData';
import { ModalContext, ModalType } from 'src/hooks/useModal';
import NProgress from 'nprogress';

interface WithPublisherProps {
}

export default function withPublisher<T extends WithPublisherProps = WithPublisherProps>(
  label: NodeLabel,
  WrappedComponent: React.ComponentType<T>
) {
  const ComponentWithPublisher = (props: Omit<T, keyof WithPublisherProps>) => {
    const { data: signer } = useSigner();
    const { accountData } = useContext(GraphContext);
    const { openModal, closeModal } = useContext(ModalContext);

    const [node, setNode] = useState(props.node);
    const reloadNode = async () => {
      const reloadedNode =
        await Client.fetchBaseNodeByTokenId(node.tokenId);
      setNode(reloadedNode);
      formik.setStatus(null);
      NProgress.done();
    };

    const formik =
      makeFormikForBaseNode(signer, accountData, label, node);

    const [
      imagePreview,
      imageDidChange,
      clearImage
    ] = useEditableImage(formik);

    useEffect(() => {
      if (!formik?.status) {
        closeModal();
        return;
      }
      const { status } = formik.status;
      if (status === 'COMPLETE') {
        reloadNode();
        return;
      }
      openModal({
        type: ModalType.PUBLISHER,
        meta: { formik }
      });
    }, [formik?.status])

    return (
      <WrappedComponent
        formik={formik}
        imageDidChange={imageDidChange}
        imagePreview={imagePreview}
        clearImage={clearImage}
      {...(props as T)} />
    );
  };

  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || "Component";
  ComponentWithPublisher.displayName = `withPublisher(${displayName})`;
  return ComponentWithPublisher;
}
