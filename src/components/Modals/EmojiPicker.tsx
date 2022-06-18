import { FC } from "react";
import Modal from "react-modal";
import ModalHeader from "src/components/Modals/ModalHeader";
import { Picker, BaseEmoji } from "emoji-mart";

export type EmojiPickerMeta = {
  didPickEmoji: (emoji: BaseEmoji) => void;
  back?: Function | null;
};

type Props = {
  onRequestClose: Function;
  meta: EmojiPickerMeta;
};

const EmojiPicker: FC<Props> = ({ onRequestClose, meta }) => {
  return (
    <Modal isOpen={true} onRequestClose={onRequestClose}>
      <div className="h-screen sm:h-auto flex flex-col">
        <ModalHeader
          onClickBack={meta.back}
          title="Choose an Emoji"
          hint="Mint to own the following topics"
          onClickClose={onRequestClose}
        />
      </div>
      <div>
        <Picker
          onSelect={meta.didPickEmoji}
          showSkinTones={false}
          showPreview={false}
        />
      </div>
    </Modal>
  );
};

export default EmojiPicker;
