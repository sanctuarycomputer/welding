import { useEffect, useState, useContext } from "react";
import { useSigner } from "wagmi";
import { useFormik, FormikProps } from "formik";
import { ExchangeRateContext } from "src/hooks/useExchangeRates";
import { GraphContext } from "src/hooks/useGraphData";
import FeeIcon from "src/components/Icons/Fee";
import Button from "src/components/Button";
import { formatUnits, parseUnits } from "ethers/lib/utils";

import Client from "src/lib/Client";
import Welding from "src/lib/Welding";
import NProgress from "nprogress";
import toast from "react-hot-toast";
import * as Sentry from "@sentry/nextjs";

type FeeFormValues = {
  fee: number;
};

const Fee = ({ node, setLocked }) => {
  const { data: signer } = useSigner();
  const { exchangeRate } = useContext(ExchangeRateContext);
  const { purgeCache, doesOwnNode } = useContext(GraphContext);
  const [USDEstimate, setUSDEstimate] = useState<string | null>(null);

  const formik: FormikProps<FeeFormValues> = useFormik<FeeFormValues>({
    initialValues: {
      fee: parseFloat(formatUnits(node.fee, "ether").toString()),
    },
    onSubmit: async (values) => {
      let toastId;
      const { fee } = values;
      try {
        if (!signer) throw new Error("no_signer_present");
        setLocked(true);

        NProgress.start();
        toastId = toast.loading("Requesting signature...", {
          className: "toast",
        });
        let tx = await Welding.Nodes.connect(signer).setConnectionFee(
          node.tokenId,
          parseUnits(`${fee}`, "ether")
        );

        toast.loading("Setting fee...", {
          id: toastId,
        });
        tx = await tx.wait();

        toast.loading("Confirming transaction...", {
          id: toastId,
        });
        NProgress.done();
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
      }
    },
  });

  useEffect(() => {
    if (formik.values.fee && exchangeRate) {
      setUSDEstimate((formik.values.fee * exchangeRate).toFixed(2));
    } else {
      setUSDEstimate(null);
    }
  }, [formik.values.fee, exchangeRate]);

  return (
    <>
      <table className="table-auto w-full">
        <tbody>
          {formik.values.fee === null ? (
            <tr className="border-b border-color border-dashed">
              <td className="py-4 text-center">
                <p>Loading...</p>
              </td>
            </tr>
          ) : (
            <tr className="border-b border-color border-dashed">
              <td className="py-4 pl-2 text-center">
                <form
                  className="flex flex-row items-center flex-grow"
                  onSubmit={formik.handleSubmit}
                >
                  <input
                    name="fee"
                    value={formik.values.fee}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="text-xs"
                    placeholder="Connection Fee"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    readOnly={!doesOwnNode(node)}
                  />
                </form>
              </td>
              <td className="py-4 px-2 text-right">
                <p>MATIC / {USDEstimate || "?"} USD</p>
              </td>
              {doesOwnNode(node) && (
                <td className="text-right pr-2">
                  <Button
                    label="Update Fee"
                    disabled={
                      !doesOwnNode(node) ||
                      formik.isSubmitting ||
                      !(formik.isValid && formik.dirty)
                    }
                    onClick={formik.handleSubmit}
                  />
                </td>
              )}
            </tr>
          )}
        </tbody>
      </table>

      <div className="py-16 px-4 text-center flex relative flex-grow justify-center items-center flex-col">
        <FeeIcon />
        <p className="pt-2 font-semibold">
          This fee is applied when external users reference this node.
        </p>
      </div>
    </>
  );
};

export default Fee;
