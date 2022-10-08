import { useState, useContext } from "react";
import { useSigner } from "wagmi";
import { GraphContext } from "src/hooks/useGraphData";
import BurnIcon from "src/components/Icons/Burn";
import Button from "src/components/Button";
import Client from "src/lib/Client";
import Welding from "src/lib/Welding";
import NProgress from "nprogress";
import toast from "react-hot-toast";
import * as Sentry from "@sentry/nextjs";

const Burn = ({ node, setLocked }) => {
  const { data: signer } = useSigner();
  const { loadDummyNodes, purgeCache, doesOwnNode } = useContext(GraphContext);
  const [burning, setBurning] = useState(false);

  const triggerDraftBurn = async () => {
    if (!node.labels.includes("DummyNode")) return;
    const didConfirm = confirm(
      "Are you sure you want to permantly delete this Draft Node, and all of it's data?"
    );
    if (!didConfirm) return;

    let toastId;
    try {
      setLocked(true);
      setBurning(true);
      NProgress.start();

      toastId = toast.loading("Burning Draft Node", {
        className: "toast",
      });

      await Client.Drafts.destroyDummyNode(node.tokenId);
      await loadDummyNodes();
      toast.success("Draft Node burnt successfully.", {
        id: toastId,
      });

      const subgraphSlug = window.location.pathname.split("/")[1];
      window.location.replace(`${window.location.origin}/${subgraphSlug}`);
    } catch (e) {
      NProgress.done();
      toast.error("An error occured.", {
        id: toastId,
      });
      console.log(e);
      Sentry.captureException(e);
    } finally {
      setLocked(false);
      setBurning(false);
    }
  };

  if (node.labels.includes("DummyNode")) {
    return (
      <>
        <table className="table-auto w-full">
          <tbody>
            <tr className="border-b border-color border-dashed">
              <>
                <td className="py-4 px-2">
                  <p className="text-red-500 truncate">
                    <span className="font-semibold">⚠️ Danger!</span> Burning a
                    Draft Node is irreversible.
                  </p>
                </td>
                <td className="text-right pr-2">
                  <Button
                    label="Burn Draft Node"
                    disabled={burning}
                    onClick={() => triggerDraftBurn()}
                  />
                </td>
              </>
            </tr>
          </tbody>
        </table>

        <div className="py-16 px-4 text-center flex relative flex-grow justify-center items-center flex-col">
          <BurnIcon />
          <p className="pt-2 font-semibold">
            Burning a Draft Node will disconnect it from all other nodes, and
            delete all drafts permanently.
          </p>
        </div>
      </>
    );
  }

  const triggerBurn = async () => {
    let toastId;
    try {
      if (!signer) throw new Error("no_signer_present");
      setLocked(true);
      setBurning(true);
      NProgress.start();

      toastId = toast.loading("Requesting signature...", {
        className: "toast",
      });
      let tx = await Welding.Nodes.connect(signer).burnNode(node.tokenId);

      toast.loading("Burning node...", {
        id: toastId,
      });
      tx = await tx.wait();
      toast.loading("Confirming transaction...", {
        id: toastId,
      });
      await Client.fastForward(tx.blockNumber, window.location.pathname);
      await purgeCache();
      toast.success("Success!", {
        id: toastId,
      });
      window.location.reload();
    } catch (e) {
      NProgress.done();
      toast.error("An error occured.", {
        id: toastId,
      });
      console.log(e);
      Sentry.captureException(e);
    } finally {
      setLocked(false);
      setBurning(false);
    }
  };

  return (
    <>
      <table className="table-auto w-full">
        <tbody>
          <tr className="border-b border-color border-dashed">
            {doesOwnNode(node) ? (
              <>
                <td className="py-4 px-2">
                  <p className="text-red-500 truncate">
                    <span className="font-semibold">⚠️ Danger!</span> Burning a
                    node is irreversible.
                  </p>
                </td>
                <td className="text-right pr-2">
                  <Button
                    label="Burn Node"
                    disabled={burning}
                    onClick={() => triggerBurn()}
                  />
                </td>
              </>
            ) : (
              <td className="py-4 text-center">
                <p>You don&apos;t have permission to burn this node.</p>
              </td>
            )}
          </tr>
        </tbody>
      </table>

      <div className="py-16 px-4 text-center flex relative flex-grow justify-center items-center flex-col">
        <BurnIcon />
        <p className="pt-2 font-semibold">
          Burning a node will disconnect it from all other nodes, and make it
          permanently uneditable.
        </p>
      </div>
    </>
  );
};

export default Burn;
