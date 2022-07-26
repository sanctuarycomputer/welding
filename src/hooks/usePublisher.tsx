import { useContext, useEffect, ChangeEvent } from "react";
import makeFormikForBaseNode from "src/lib/useBaseNodeFormik";
import useEditableImage from "src/hooks/useEditableImage";
import { useSigner } from "wagmi";
import { GraphContext } from "src/hooks/useGraphData";
import { ModalContext, ModalType } from "src/hooks/useModal";
import { BaseNode, BaseNodeFormValues } from "src/types";
import { FormikProps } from "formik";

export interface PublisherUtils {
  formik: FormikProps<BaseNodeFormValues>;
  imagePreview: string | null;
  imageDidChange: (e: ChangeEvent<HTMLInputElement>) => void;
  clearImage: () => void;
  reloadData: (tx: any) => Promise<void>;
}

export default function usePublisher(node: BaseNode): PublisherUtils {
  const { data: signer } = useSigner();
  const { accountData } = useContext(GraphContext);
  const { openModal, closeModal } = useContext(ModalContext);
  const formik = makeFormikForBaseNode(signer, accountData, node);
  const [imagePreview, imageDidChange, clearImage] = useEditableImage(formik);

  const reloadData = async (tx) => {
    if (node.tokenId.startsWith("-")) {
      const transferEvent = tx?.events.find((e) => e.event === "Transfer");
      if (transferEvent) {
        window.location.href = `/${transferEvent.args.tokenId.toString()}`;
        return;
      }
    }
    window.location.reload();
  };

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

  return {
    formik,
    imagePreview,
    imageDidChange,
    clearImage,
    reloadData,
  };
}
