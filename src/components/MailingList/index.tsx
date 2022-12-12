import { Dispatch, FC, SetStateAction, useState } from "react";
import { BaseNode } from "src/types";
import Reflection from "src/components/Icons/Reflection";
import Button from "src/components/Button";

import NProgress from "nprogress";
import toast from "react-hot-toast";
import * as Sentry from "@sentry/nextjs";

enum Roles {
  OWNER = "Owner",
  ADMIN = "Admin",
  EDITOR = "Editor",
}

type Props = {
  node: BaseNode;
  currentAddress: string;
  setLocked: Dispatch<SetStateAction<boolean>>;
  locked: boolean;
};

const MailingList: FC<Props> = ({ node, currentAddress, setLocked, locked }) => {
  const [urls, setUrls] = useState<string[]>([]);

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

  const triggerExport = async () => {
    let toastId;
    try {
      setUrls([]);
      setLocked(true);
      NProgress.start();
      toastId = toast.loading("Triggering export...", {
        className: "toast",
      });
      const response = await fetch(`/api/lists/${node.tokenId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok || response.status !== 200)
        throw new Error("export_failed");
      const { urls } = await response.json();
      if (Array.isArray(urls)) setUrls(urls);
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
  };

  return (
    <>
      <table className="table-auto w-full">
        <tbody>
          {isAdmin && (
            <tr className="border-b border-color border-dashed">
              <td className="py-4 px-2">
                  <p className="truncate">
                    Export your mailing list as a CSV →
                  </p>
                </td>
              <td className="text-right pr-2 whitespace-nowrap">
                <Button
                  label="Export Mailing List"
                  disabled={locked}
                  onClick={triggerExport}
                />
              </td>
            </tr>
          )}

          {isAdmin && urls.map(url => {
            return (
              <tr key={urls.indexOf(url)} className="border-b border-color border-dashed">
                <td className="pl-2 py-4 whitespace-nowrap truncate">
                  <p className="font-semibold">CSV Export #{urls.indexOf(url) + 1}</p>
                </td>
                <td className="px-2 py-4 text-right whitespace-nowrap truncate">
                  <a href={url} target="_blank" rel="noreferrer" download>
                    <p className="underline">Download ↗</p>
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="py-16 px-4 text-center flex relative flex-grow justify-center items-center flex-col">
        <Reflection />
        <p className="pt-2 font-semibold">
          Only admins can export Subgraph mailing lists.
        </p>
      </div>
    </>
  );
};

export default MailingList;
