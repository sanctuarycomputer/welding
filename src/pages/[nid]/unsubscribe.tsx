import slugifyNode from "src/utils/slugifyNode";
import Client from "src/lib/Client";
import { FC } from "react";
import { GetStaticProps } from "next";
import { BaseNode } from "src/types";
import Head from "src/components/Head";
import Link from "next/link"
import { useFormik, FormikProps } from "formik";
import NProgress from "nprogress";
import toast from "react-hot-toast";
import * as Sentry from "@sentry/nextjs";
import * as yup from "yup";
import Button from "src/components/Button";

type Props = {
  node: BaseNode;
};

type FormikUnsubscribeProps = {
  email: string;
};

const NodeUnsubscribe: FC<Props> = ({ node }) => {
  const formik: FormikProps<FormikUnsubscribeProps> =
    useFormik<FormikUnsubscribeProps>({
      enableReinitialize: true,
      initialValues: {
        email: "",
      },
      onSubmit: async (values) => {
        let toastId;
        try {
          NProgress.start();
          toastId = toast.loading("Unsubscribing...", {
            className: "toast",
          });

          await fetch(`/api/lists/${node.tokenId}/unsubscribe`, {
            method: "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: values.email })
          });

          toast.success("Unsubscribed!", {
            id: toastId,
          });
          window.location.href = `/${slugifyNode(node)}`;
        } catch (e) {
          toast.error("An error occured.", {
            id: toastId,
          });
          console.log(e);
          Sentry.captureException(e);
        } finally {
          NProgress.done();
        }
      },
      validationSchema: yup.object({
        email: yup.string().email()
      }),
    });

  return (
    <>
      <Head node={node} />
      <div className="h-screen w-screen flex justify-center items-center">
        <div className="flex items-center flex-col">
          <p className="py-2 font-semibold">
            Unsubscribe from <Link href={`/${slugifyNode(node)}`}>{`${node.currentRevision.nativeEmoji} ${node.currentRevision.name}`}</Link>?
          </p>

          <table className="table-auto w-full">
            <tbody>
              <tr>
                <td>
                  <input
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="text-xs py-2 mr-4"
                    placeholder="Email Address"
                  />
                </td>
                <td className="text-right">
                  <Button
                    label="Unsubscribe"
                    disabled={
                      formik.isSubmitting ||
                      !(formik.isValid && formik.dirty)
                    }
                    onClick={formik.handleSubmit}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  let nid = context.params?.nid;
  nid = ((Array.isArray(nid) ? nid[0] : nid) || "").split("-")[0];

  const node = await Client.fetchBaseNodeByTokenId(nid);
  if (!node) return { notFound: true };

  const nodeType = node.labels.filter((l) => l !== "BaseNode")[0];
  if (nodeType !== "Subgraph") {
    return {
      redirect: {
        permanent: false,
        destination: `/${slugifyNode(node)}`,
      },
    };
  }

  let givenNidSlug = context.params?.nid;
  givenNidSlug =
    (Array.isArray(givenNidSlug) ? givenNidSlug[0] : givenNidSlug) || "";
  if (
    givenNidSlug !== slugifyNode(node)
  ) {
    return {
      redirect: {
        permanent: false,
        destination: `/${slugifyNode(node)}/unsubscribe`,
      },
    };
  }

  return {
    props: { node },
  };
};

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
};

export default NodeUnsubscribe;
