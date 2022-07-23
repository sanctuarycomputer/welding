import { useState, useContext, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/router";
import Client from "src/lib/Client";
import makeFormikForBaseNode from "src/lib/useBaseNodeFormik";
import useEditableImage from "src/hooks/useEditableImage";
import { useSigner } from "wagmi";
import { GraphContext } from "src/hooks/useGraphData";
import { ModalContext, ModalType } from "src/hooks/useModal";
import NProgress from "nprogress";
import { BaseNode, BaseNodeFormValues } from "src/types";
import { FormikProps } from "formik";

export interface PublisherUtils {
  formik: FormikProps<BaseNodeFormValues>;
  imagePreview: string | null;
  imageDidChange: (e: ChangeEvent<HTMLInputElement>) => void;
  clearImage: () => void;
  reloadData: (tx: any) => Promise<void>;
}

export default function usePublisher(initialNode: BaseNode): PublisherUtils {
  const router = useRouter();
  const { data: signer } = useSigner();
  const { accountData, loadAccountData } = useContext(GraphContext);
  const { openModal, closeModal } = useContext(ModalContext);
  const [node, setNode] = useState<BaseNode>(initialNode);
  const formik = makeFormikForBaseNode(signer, accountData, node);
  const [imagePreview, imageDidChange, clearImage] = useEditableImage(formik);

  const reloadData = async (tx) => {
    if (accountData?.address) loadAccountData(accountData.address);
    if (node.tokenId.startsWith("-")) {
      const transferEvent = tx?.events.find((e) => e.event === "Transfer");
      if (transferEvent) {
        await router.push(`/${transferEvent.args.tokenId.toString()}`);
      } else {
        router.reload();
      }
    } else {
      const reloadedNode = await Client.fetchBaseNodeByTokenId(node.tokenId);
      if (reloadedNode) setNode(reloadedNode);
    }
    NProgress.done();
    formik.setStatus(null);
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
