import { Dispatch, FC, SetStateAction } from "react";
import { BaseNode } from "src/types";
import Tile from "src/components/Tile";
import { useSigner } from "wagmi";
import { useFormik, FormikProps } from "formik";
import * as yup from "yup";
import Reflection from "src/components/Icons/Reflection";
import Button from "src/components/Button";
import dynamic from "next/dynamic";

import Client from "src/lib/Client";
import Welding from "src/lib/Welding";
import NProgress from "nprogress";
import toast from "react-hot-toast";
import * as Sentry from "@sentry/nextjs";
import getRelatedNodes from "src/utils/getRelatedNodes";
import { bg } from "src/utils/theme";

const Address = dynamic(() => import("src/components/Address"), {
  ssr: false,
});

enum Roles {
  OWNER = "Owner",
  ADMIN = "Admin",
  EDITOR = "Editor",
}

type Props = {
  node: BaseNode;
  currentAddress: string;
  setLocked: Dispatch<SetStateAction<boolean>>;
  reloadData: () => void;
};

type FormikInviteProps = {
  address: string;
  role: 0 | 1;
};

type FormikDelegateProps = {
  toTokenId: string;
};

const Team: FC<Props> = ({ node, currentAddress, setLocked, reloadData }) => {
  const { data: signer } = useSigner();

  const roles: {
    [address: string]: Roles[];
  } = {};
  roles[node.owner.address] = roles[node.owner.address] || [Roles.OWNER];
  node.admins.forEach((a) => {
    roles[a.address] = roles[a.address] || [];
    roles[a.address].push(Roles.ADMIN);
  });
  node.editors.forEach((a) => {
    roles[a.address] = roles[a.address] || [];
    roles[a.address].push(Roles.EDITOR);
  });
  const isAdmin = roles[currentAddress]?.includes(Roles.ADMIN);

  const permissionDelegates = getRelatedNodes(
    node,
    "outgoing",
    "BaseNode",
    "_DELEGATES_PERMISSIONS_TO"
  );

  const formik: FormikProps<FormikInviteProps> = useFormik<FormikInviteProps>({
    enableReinitialize: true,
    initialValues: {
      address: "",
      role: 1,
    },
    onSubmit: async (values) => {
      if (!signer) return;

      let toastId;
      const { role, address } = values;

      try {
        setLocked(true);
        NProgress.start();
        toastId = toast.loading("Requesting signature...", {
          className: "toast",
        });
        let tx = await Welding.Nodes.connect(signer).grantRole(
          node.tokenId,
          role,
          address
        );

        toast.loading("Granting role...", {
          id: toastId,
        });
        tx = await tx.wait();

        toast.loading("Confirming transaction...", {
          id: toastId,
        });
        await Client.fastForward(tx.blockNumber, window.location.pathname);
        await reloadData();
        toast.success("Success!", {
          id: toastId,
        });
      } catch (e) {
        toast.error("An error occured.", {
          id: toastId,
        });
        console.log(e);
        Sentry.captureException(e);
      } finally {
        setLocked(false);
        NProgress.done();
      }
    },
    validationSchema: yup.object({
      address: yup
        .string()
        .trim()
        .required("A valid address is required")
        .matches(/0x[a-fA-F0-9]{40}/, "Must be a valid address"),
    }),
  });

  const delegateFormik: FormikProps<FormikDelegateProps> =
    useFormik<FormikDelegateProps>({
      enableReinitialize: true,
      initialValues: {
        toTokenId: "",
      },
      onSubmit: async (values) => {
        if (!signer) return;

        let toastId;
        const { toTokenId } = values;

        try {
          setLocked(true);
          NProgress.start();
          toastId = toast.loading("Requesting signature...", {
            className: "toast",
          });
          let tx = await Welding.Nodes.connect(signer).delegatePermissions(
            node.tokenId,
            toTokenId
          );

          toast.loading("Granting delegate permissions...", {
            id: toastId,
          });
          tx = await tx.wait();

          toast.loading("Confirming transaction...", {
            id: toastId,
          });
          await Client.fastForward(tx.blockNumber, window.location.pathname);
          await reloadData();
          toast.success("Success!", {
            id: toastId,
          });
        } catch (e) {
          toast.error("An error occured.", {
            id: toastId,
          });
          console.log(e);
          Sentry.captureException(e);
        } finally {
          setLocked(false);
          NProgress.done();
        }
      },
      validationSchema: yup.object({
        toTokenId: yup
          .number()
          .integer()
          .required("A valid Token ID is required"),
      }),
    });

  const triggerRoleRemoval = async (address, role, method) => {
    if (!signer) return;

    let toastId;
    try {
      if (node.admins.length === 1 && role === "Admin") {
        toast.error("Can't remove last admin", {
          className: "toast",
        });
        return;
      }

      setLocked(true);
      NProgress.start();
      toastId = toast.loading("Requesting signature...", {
        className: "toast",
      });

      let tx;
      if (method === "revoke") {
        tx = await Welding.Nodes.connect(signer).revokeRole(
          node.tokenId,
          role === Roles.ADMIN ? 0 : 1,
          address
        );
      } else {
        tx = await Welding.Nodes.connect(signer).renounceRole(
          node.tokenId,
          role === Roles.ADMIN ? 0 : 1
        );
      }

      toast.loading("Removing role...", {
        id: toastId,
      });
      tx = await tx.wait();

      toast.loading("Confirming transaction...", {
        id: toastId,
      });

      await Client.fastForward(tx.blockNumber, window.location.pathname);
      await reloadData();
      toast.success("Success!", {
        id: toastId,
      });
    } catch (e) {
      NProgress.done();
      toast.error("An error occured.", {
        id: toastId,
      });
      console.log(e);
      Sentry.captureException(e);
    } finally {
      setLocked(false);
    }
  };

  const triggerRenounceDelegate = async (delegate) => {
    if (!signer) return;

    let toastId;
    try {
      setLocked(true);
      NProgress.start();
      toastId = toast.loading("Requesting signature...", {
        className: "toast",
      });

      let tx = await Welding.Nodes.connect(signer).renounceDelegatePermissions(
        node.tokenId,
        delegate.tokenId
      );

      toast.loading("Removing role...", {
        id: toastId,
      });
      tx = await tx.wait();

      toast.loading("Confirming transaction...", {
        id: toastId,
      });

      await Client.fastForward(tx.blockNumber, window.location.pathname);
      await reloadData();
      toast.success("Success!", {
        id: toastId,
      });
    } catch (e) {
      NProgress.done();
      toast.error("An error occured.", {
        id: toastId,
      });
      console.log(e);
      Sentry.captureException(e);
    } finally {
      setLocked(false);
    }
  };

  const onClickHandlerForDelegate = (delegate) => {
    if (isAdmin) return () => triggerRenounceDelegate(delegate);
    return null;
  };

  const onClickHandlerForRole = (address, role) => {
    if (role === Roles.OWNER) return null;
    if (address === currentAddress)
      return () => triggerRoleRemoval(address, role, "renounce");
    if (isAdmin) return () => triggerRoleRemoval(address, role, "revoke");
    return null;
  };

  return (
    <>
      <table className="table-auto w-full">
        <tbody>
          {permissionDelegates.length > 0 && (
            <tr className="border-b border-color border-dashed">
              <td className="px-2 py-3">
                <p className="font-semibold py-1">
                  Inherits permissions from →
                </p>
              </td>
              <td className="pr-2 text-right">
                {permissionDelegates.map((n) => (
                  <Tile
                    key={n.tokenId}
                    label={`${n.currentRevision.metadata.properties.emoji.native} ${n.currentRevision.metadata.name}`}
                    onClick={() => onClickHandlerForDelegate(n)}
                  />
                ))}
              </td>
            </tr>
          )}

          {Object.entries(roles).map(([k, v]) => {
            return (
              <tr key={k} className="border-b border-color border-dashed">
                <td className="px-2 py-3">
                  <Address address={k} />
                </td>
                <td className="pr-2 text-right">
                  {v.map((r) => {
                    const handler = onClickHandlerForRole(k, r);
                    if (!handler) return <Tile key={r} label={r} />;
                    return <Tile key={r} label={r} onClick={() => handler()} />;
                  })}
                </td>
              </tr>
            );
          })}

          {isAdmin && (
            <tr className="border-b border-color border-dashed">
              <td className="px-2 py-2">
                <input
                  name="address"
                  value={formik.values.address}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="text-xs py-2 mr-4"
                  placeholder="Paste an Address"
                />
              </td>
              <td className="text-right pr-2">
                <select
                  name="role"
                  className={`${bg} text-xs mr-2`}
                  value={formik.values.role}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <option value={1}>Editor</option>
                  <option value={0}>Admin</option>
                </select>
                <Button
                  label="+ Add Member"
                  disabled={
                    formik.isSubmitting || !(formik.isValid && formik.dirty)
                  }
                  onClick={formik.handleSubmit}
                />
              </td>
            </tr>
          )}

          {isAdmin && (
            <tr className="border-b border-color border-dashed">
              <td className="px-2 py-2">
                <input
                  name="toTokenId"
                  value={delegateFormik.values.toTokenId}
                  onChange={delegateFormik.handleChange}
                  onBlur={delegateFormik.handleBlur}
                  className="text-xs py-2 mr-4"
                  placeholder="Token ID to inherit permissions from"
                />
              </td>
              <td className="text-right pr-2">
                <Button
                  label="+ Add Delegate"
                  disabled={
                    delegateFormik.isSubmitting ||
                    !(delegateFormik.isValid && !delegateFormik.dirty)
                  }
                  onClick={delegateFormik.handleSubmit}
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="py-16 px-4 text-center flex relative flex-grow justify-center items-center flex-col">
        <Reflection />
        <p className="pt-2 font-semibold">
          Admins can edit and invite others. Editors can not manage roles.
        </p>
      </div>
    </>
  );
};

export default Team;
