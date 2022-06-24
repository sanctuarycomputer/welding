import { useEffect, useState, useContext } from "react";
import { useProvider, useSigner } from "wagmi";
import { useFormik, FormikProps } from "formik";
import { ExchangeRateContext } from "src/hooks/useExchangeRates";
import { GraphContext } from "src/hooks/useGraphData";
import BurnIcon from "src/components/Icons/Burn";
import Button from "src/components/Button";
import { formatUnits, parseUnits } from "ethers/lib/utils";

import Client from "src/lib/Client";
import Welding from "src/lib/Welding";
import NProgress from "nprogress";
import toast from "react-hot-toast";
import * as Sentry from "@sentry/nextjs";

const Burn = ({ node, setLocked, reloadData }) => {
  const provider = useProvider();
  const { data: signer } = useSigner();
  const { purgeCache, doesOwnNode, loadShallowNodes } =
    useContext(GraphContext);
  const [burning, setBurning] = useState(false);

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
      NProgress.done();
      await Client.fastForward(tx.blockNumber);
      await purgeCache();
      await Promise.all([loadShallowNodes(), reloadData()]);
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
                  <p className="text-red-500">
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
                <p>You don't have permission to burn this node.</p>
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
