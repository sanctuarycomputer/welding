import { FC } from 'react';
import { useRouter } from 'next/router';
import { Account } from 'src/types';
import Tile from 'src/components/Tile';
import HorizontalDots from 'src/components/Icons/HorizontalDots';
import { useSigner, useConnect, useAccount } from 'wagmi';
import dynamic from 'next/dynamic';

import Client from 'src/lib/Client';
import Welding from 'src/lib/Welding';
import NProgress from 'nprogress';
import toast from 'react-hot-toast';

const Address = dynamic(() => import('src/components/Address'), {
  ssr: false
});

enum Roles {
  OWNER = "Owner",
  ADMIN = "Admin",
  EDITOR = "Editor"
};

type Props = {
  node: BaseNode;
  currentAddress: string;
};

const Team: FC<Props> = ({ node, currentAddress }) => {
  const router = useRouter();
  const { data: account } = useAccount();
  const { data: signer } = useSigner();

  const roles = {};
  roles[node.owner.address] =
    roles[node.owner.address] || { account: node.owner, roles: [Roles.OWNER] };
  node.admins.forEach((a: Account) => {
    roles[a.address] =
      roles[a.address] || { account: a, roles: [] };
    roles[a.address].roles.push(Roles.ADMIN);
  });
  node.editors.forEach((a: Account) => {
    roles[a.address] =
      roles[a.address] || { account: a, roles: [] };
    roles[a.address].roles.push(Roles.EDITOR);
  });

  const isAdmin =
    roles[currentAddress]?.roles.includes(Roles.ADMIN);

  const trigger = async (address, role, method = 'revoke' | 'renounce') => {
    if (!signer) return;

    let toastId;
    try {
      NProgress.start();
      toastId = toast.loading('Requesting signature...', {
        position: 'bottom-right',
        className: 'toast'
      });

      let tx;
      if (method === 'revoke') {
        tx = await Welding.Nodes.connect(signer).revokeRole(
          node.tokenId,
          (role === Roles.ADMIN ? 0 : 1),
          address
        );
      } else {
        tx = await Welding.Nodes.connect(signer).renounceRole(
          node.tokenId,
          (role === Roles.ADMIN ? 0 : 1)
        );
      }

      toast.loading('Removing role...', {
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
      return router.reload();
    } catch(e) {
      NProgress.done();
      toast.error('An error occured.', {
        id: toastId
      });
      console.log(e);
    }
  };

  const onClickHandlerForRole = (address, role) => {
    if (role === Roles.OWNER) return null;
    if (address === currentAddress)
      return () => trigger(address, role, 'renounce');
    if (isAdmin)
      return () => trigger(address, role, 'revoke');
    return null;
  };

  return (
    <table className="table-auto w-full">
      <tbody>
        {Object.values(roles).map(v => {
          return (
            <tr key={v.account.address} className="border-t border-b border-color">
              <td className="p-4">
                <Address address={v.account.address} />
              </td>
              <td className="p-4 text-right">
                {v.roles.map(r =>
                  <Tile
                    key={r}
                    label={r}
                    onClick={onClickHandlerForRole(v.account.address, r)}
                  />
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default Team;
