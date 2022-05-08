import { FC, useEffect, useContext } from 'react';
import { ModalContext } from 'src/hooks/useModal';
import Modal from 'react-modal';
import ModalHeader from 'src/components/Modals/ModalHeader';
import Reflection from 'src/components/Icons/Reflection';
import Button from 'src/components/Button';
import { useFormik, FormikProps } from 'formik';
import * as yup from 'yup';
import { useSigner } from 'wagmi';

import Client from 'src/lib/Client';
import Welding from 'src/lib/Welding';
import NProgress from 'nprogress';
import toast from 'react-hot-toast';

type Props = {
  isOpen: boolean;
  onRequestClose: Function
};

export type AddMemberMeta = {
  node: BaseNode;
  onComplete: (address: string, role: number) => void;
  back?: Function;
};

const AddMember: FC<Props> = ({
  isOpen,
  onRequestClose,
  meta
}) => {
  const { data: signer } = useSigner();

  const formik: FormikProps<BaseNodeFormValues> = useFormik<BaseNodeFormValues>({
    enableReinitialize: true,
    initialValues: {
      address: '',
      role: 1,
    },
    onSubmit: async (values) => {
      if (!signer) return;

      let toastId;
      const { role, address } = values;

      try {
        NProgress.start();
        toastId = toast.loading('Requesting signature...', {
          position: 'bottom-right',
          className: 'toast'
        });
        let tx = await Welding.Nodes.connect(signer).grantRole(
          meta.node.tokenId,
          role,
          address
        );

        toast.loading('Granting role...', {
          id: toastId
        });
        tx = await tx.wait();

        toast.loading('Confirming transaction...', {
          id: toastId
        });
        await Client.fastForward(tx.blockNumber);
        toast.success('Success!', {
          id: toastId
        });

        meta.onComplete(address, role);
      } catch(e) {
        NProgress.done();
        toast.error('An error occured.', {
          id: toastId
        });
        console.log(e);
      }
    },
    validationSchema: yup.object({
      address: yup
        .string()
        .trim()
        .required('A valid address is required')
        .matches(
          /0x[a-fA-F0-9]{40}/,
          "Must be a valid address"
        ),
    }),
  });

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={() => onRequestClose()}
    >
      <div className="h-screen sm:h-auto flex flex-col">
        <ModalHeader
          onClickBack={meta.back}
          title="Add Member"
          hint="Give others permission to edit this node"
          onClickClose={() => onRequestClose()}
        />

        <div
          className="relative p-4 border-b border-color"
        >
            <form className="flex flex-row items-center py-1 flex-grow" onSubmit={formik.handleSubmit}>
              <input
                name="address"
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="text-xs py-2 mr-4"
                placeholder="Paste an Address"
              />
              <select
                name="role"
                className="background-color text-xs font-semibold"
                value={formik.values.role}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                <option value={1}>Editor</option>
                <option value={0}>Admin</option>
              </select>
            </form>

            {(typeof formik.errors.address === "string") && (
              <div className="mb-4 mt-1">
                <div className="pill inline">{formik.errors.address}</div>
              </div>
            )}
        </div>

        <div
          className="py-16 flex relative flex-grow justify-center items-center flex-col border-b border-color">
          <Reflection />
          <p className="pt-2 font-semibold">
            Admins can edit and invite others. Editors can only edit.
          </p>
        </div>

        <div className="p-4 flex flex-row-reverse">
          <Button
            label="+ Add Member"
            disabled={formik.isSubmitting || !(formik.isValid && !formik.isDirty)}
            onClick={formik.handleSubmit}
          />
        </div>
      </div>
    </Modal>
  );
};

export default AddMember;
