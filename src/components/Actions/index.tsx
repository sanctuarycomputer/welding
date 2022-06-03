import { FC, useContext } from 'react';
import { ModalContext, ModalType } from 'src/hooks/useModal';
import VerticalDots from 'src/components/Icons/VerticalDots';
import Connect from 'src/components/Icons/Connect';
import Upload from 'src/components/Icons/Upload';

const Actions = ({
  node,
  canEdit,
  imageDidChange,
  allowConnect,
  allowSettings
}) => {
  const {
    openModal,
    closeModal
  } = useContext(ModalContext);

  return (
    <>
      {canEdit && (
        <label className="cursor-pointer opacity-50 hover:opacity-100 scale-75 pr-1">
          <input
            style={{display: 'none'}}
            type="file"
            onChange={imageDidChange}
            accept="image/*"
          />
          <Upload />
        </label>
      )}

      {allowConnect && (
        <div
          className="cursor-pointer opacity-50 hover:opacity-100 scale-75"
          onClick={() => openModal({
            type: ModalType.NODE_SETTINGS,
            meta: { canEdit, node }
          })}
        >
          <Connect />
        </div>
      )}

      {allowSettings && (
        <div
          className="cursor-pointer opacity-50 hover:opacity-100"
          onClick={() => openModal({
            type: ModalType.NODE_SETTINGS,
            meta: { canEdit, node }
          })}
        >
          <VerticalDots />
        </div>
      )}
    </>
  );
};

export default Actions;
