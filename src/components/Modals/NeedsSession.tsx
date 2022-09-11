import { FC, useContext, useEffect, useState } from "react";
import { SiweMessage } from "siwe";
import { useAccount, useNetwork, useSignMessage } from "wagmi";
import Modal from "react-modal";
import NProgress from "nprogress";
import * as Sentry from "@sentry/nextjs";
import toast from "react-hot-toast";

import { GraphContext } from "src/hooks/useGraphData";
import Button from "src/components/Button";
import ModalHeader from "src/components/Modals/ModalHeader";
import Network from "src/components/Icons/Network";

type Props = {
  isOpen: boolean;
  onRequestClose: () => void;
};

// [ ] Combine Session & Account?
// [ ] SSR?

const NeedsSession: FC<Props> = ({ isOpen, onRequestClose }) => {
  const { address } = useAccount();
  const { chain: activeChain } = useNetwork();
  const { signMessageAsync } = useSignMessage();
  const { sessionDataLoading, loadCurrentSession, flushSessionAndDisconnect } =
    useContext(GraphContext);

  const [nonceState, setNonceState] = useState<{
    loading: boolean;
    nonce: string | null;
    error: Error | null;
  }>({
    loading: true,
    nonce: null,
    error: null,
  });

  const [signingState, setSigningState] = useState<{
    loading: boolean;
    error: Error | null;
  }>({
    loading: false,
    error: null,
  });

  const fetchNonce = async () => {
    try {
      NProgress.start();
      setNonceState({ nonce: null, loading: true, error: null });
      const nonceRes = await fetch("/api/nonce");
      const nonce = await nonceRes.text();
      setNonceState({ nonce, loading: false, error: null });
    } catch (e) {
      Sentry.captureException(e);
      setNonceState({ nonce: null, loading: false, error: e as Error });
    } finally {
      NProgress.done();
    }
  };

  const close = () => {
    flushSessionAndDisconnect();
    onRequestClose();
  };

  const sign = async () => {
    try {
      NProgress.start();
      const chainId = activeChain?.id;
      if (!address || !chainId || !nonceState.nonce) return;

      setSigningState({ loading: true, error: null });
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce: nonceState.nonce,
      });
      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });

      const verifyRes = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, signature }),
      });
      if (!verifyRes.ok) throw new Error("Error verifying message");

      setSigningState({ loading: false, error: null });
      // TODO test a session was success
      const session = await loadCurrentSession();
      if (session) {
        toast.success("Success!", {
          className: "toast",
        });
        onRequestClose();
      } else {
        throw new Error("failed_to_fetch_session_after_signing");
      }
    } catch (e) {
      Sentry.captureException(e);
      toast.error("An error occured.", {
        className: "toast",
      });
      setSigningState({ loading: false, error: e as Error });
      fetchNonce();
    } finally {
      NProgress.done();
    }
  };

  useEffect(() => {
    fetchNonce();
  }, []);

  return (
    <Modal isOpen={isOpen} onRequestClose={close}>
      <div className="h-screen sm:h-auto flex flex-col">
        <ModalHeader
          title="Sign-in"
          hint={"Sign-in with Ethereum to continue."}
          onClickClose={close}
        />

        <div className="py-16 px-4 text-center flex relative flex-grow justify-center items-center flex-col border-b border-color">
          <Network />
          {nonceState.loading && (
            <p className="pt-2 font-semibold">Loading nonce...</p>
          )}

          {nonceState.error && (
            <p className="pt-2 font-semibold">
              Failed to fetch nonce. A refresh might help.
            </p>
          )}

          {signingState.loading && (
            <p className="pt-2 font-semibold">Awaiting signature...</p>
          )}

          {sessionDataLoading && (
            <p className="pt-2 font-semibold">Finalizing session</p>
          )}

          {nonceState.nonce && !signingState.loading && !sessionDataLoading && (
            <p className="pt-2 font-semibold">
              Welding requires that you{" "}
              <a
                className="underline"
                href="https://login.xyz/"
                target="_blank"
                rel="noreferrer"
              >
                Sign-in with Ethereum
              </a>{" "}
              to enable secure communication between our frontend and API. Learn
              more{" "}
              <a
                href="https://docs.login.xyz/general-information/siwe-overview/eip-4361"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                here
              </a>
              .
            </p>
          )}
        </div>

        <div className="p-4 flex flex-row-reverse justify-between">
          <Button
            label="Sign-in with Ethereum"
            onClick={sign}
            disabled={
              nonceState.loading ||
              !!nonceState.error ||
              signingState.loading ||
              !nonceState.nonce
            }
          />
        </div>
      </div>
    </Modal>
  );
};

export default NeedsSession;
