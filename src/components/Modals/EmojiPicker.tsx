import { FC } from "react";
import Modal from "react-modal";
import ModalHeader from "src/components/Modals/ModalHeader";
import { Picker, BaseEmoji } from "emoji-mart";
import Uwu from "src/components/Icons/Uwu";

export type EmojiPickerMeta = {
  didPickEmoji: (emoji: BaseEmoji) => void;
  back?: () => void | null;
};

type Props = {
  isOpen: boolean;
  onRequestClose: () => void;
  meta: EmojiPickerMeta;
};

const EmojiPicker: FC<Props> = ({ onRequestClose, meta }) => {
  return (
    <Modal isOpen={true} onRequestClose={() => onRequestClose()}>
      <div className="h-screen sm:h-auto flex flex-col">
        <ModalHeader
          onClickBack={() => meta.back && meta.back()}
          title="Choose an Emoji"
          hint="Select an emoji to represent this node"
          onClickClose={onRequestClose}
        />
        <Picker
          onSelect={meta.didPickEmoji}
          showSkinTones={false}
          showPreview={false}
        />
        <div className="py-16 px-4 text-center flex relative flex-grow justify-center items-center flex-col border-t sm:hidden">
          <Uwu />
          <p className="pt-2 font-semibold">
            All nodes in Welding are represented by an emoji.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default EmojiPicker;
