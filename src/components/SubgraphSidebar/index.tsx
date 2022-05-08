import { FC, useContext, useState } from 'react';
import { ModalContext, ModalType } from 'src/hooks/useModal';
import Link from 'next/link';
import styles from './styles.module.css';
import type { BaseNodeFormValues, BaseNode } from 'src/types';
import type { FormikProps } from 'formik';
import Button from 'src/components/Button';
import Upload from 'src/components/Icons/Upload';
import Welding from 'src/lib/Welding';

import useEditableImage from 'src/hooks/useEditableImage';
import NodeImage from 'src/components/NodeImage';
import EditNav from 'src/components/EditNav';

type Props = {
  subgraphFormik: FormikProps<BaseNodeFormValues>;
  canEdit: boolean;

  currentDocument?: BaseNode;
  newDocument?: FormikProps<BaseNodeFormValues>;
  documents: Array<BaseNode>;
};

const SubgraphSidebar: FC<Props> = ({
  subgraphFormik,
  canEdit,

  currentDocument,
  newDocument,
  documents,
}) => {
  const { openModal, closeModal } = useContext(ModalContext);

  const unsavedChanges = subgraphFormik?.dirty;
  const emoji = subgraphFormik.values.emoji.native;
  const name = subgraphFormik.values.name;
  const subgraph = subgraphFormik.values.__readOnly__;

  const [imagePreview, imageDidChange] = useEditableImage(subgraphFormik);

  return (
    <nav
      className="fixed top-0 inline-block ml-4 w-64 h-screen border-color border-r border-l"
    >

      <div className="px-2 py-4 text-xs flex">
        <p
          className="cursor-pointer mr-1 py-1"
          onClick={() => canEdit && openModal({
            type: ModalType.EMOJI_PICKER,
            meta: {
              didPickEmoji: (emoji: BaseEmoji) => {
                subgraphFormik.setFieldValue('emoji', emoji);
                closeModal();
              }
            }
          })}
        >{emoji}</p>
        <input
          readOnly={!canEdit}
          type="text"
          name="name"
          className="font-semibold"
          placeholder={`Subgraph name`}
          value={subgraphFormik.values.name}
          onChange={subgraphFormik.handleChange}
          onBlur={subgraphFormik.handleBlur}
        />
      </div>

      <div
        style={{height: 'calc(100vh - 54px)'}}
        className={`background-color flex flex-col`}>
          {unsavedChanges && (
            <div className="flex px-2 py-4 justify-between background-passive-color">
              <div
                className="background-warning-color text-background-color font-medium text-xs px-2 py-1 rounded-full mr-2"
              >
                Unsaved
              </div>
              <Button
                disabled={subgraphFormik.isSubmitting || !(subgraphFormik.isValid && unsavedChanges)}
                onClick={() => subgraphFormik.handleSubmit()}
                label={"+ Mint Revision"}
              />
            </div>
          )}

          <NodeImage
            imagePreview={imagePreview}
            imageDidChange={imageDidChange}
          >
          </NodeImage>

          <div className="border-b border-color">
            <textarea
              readOnly={!canEdit}
              className="pb-4 w-full bg-transparent text-xs px-2 pt-2"
              type="text"
              name="description"
              placeholder="Add a description"
              value={subgraphFormik.values.description}
              onChange={subgraphFormik.handleChange}
              onBlur={subgraphFormik.handleBlur}
            />
          </div>

          <div className="pb-2 px-2 pt-2">
            <div className={`${styles.SectionHeader} flex justify-between`}>
              <p className="pb-2 font-semibold tracking-wide text-passive-color uppercase">Documents</p>
              {canEdit && (
                <Link href={`/${Welding.slugifyNode(subgraph)}/mint`}>
                  <a className={`${styles.cta} transition-opacity ease-in-out duration-150 opacity-0 pb-2 text-xs`}>+ New</a>
                </Link>
              )}
            </div>

            {documents.map(d => {
              if (d.tokenId === currentDocument?.tokenId) {
                return (
                  <p
                    key={d.tokenId}
                    className="text-xs font-semibold pb-1"
                  >
                    {d.currentRevision.metadata.properties.emoji.native} {d.currentRevision.metadata.name}
                  </p>
                );
              }
              return (
                <Link key={d.tokenId} href={`/${Welding.slugifyNode(subgraph)}/${Welding.slugifyNode(d)}`}>
                  <a className="block text-xs pb-1">{d.currentRevision.metadata.properties.emoji.native} {d.currentRevision.metadata.name}</a>
                </Link>
              );
            })}

            {newDocument && (
              <p key="_new_" className="text-xs font-semibold">{newDocument.values.emoji.native} {newDocument.values.name}</p>
            )}

          </div>

          <div className="mt-auto text-center">
            <hr />
            <p
              onClick={() => openModal({ type: ModalType.SUBGRAPH_SWITCHER })}
              className="font-semibold py-4 w-100 cursor-pointer"
            >
              Switch Subgraph ↗
            </p>
          </div>
       </div>
    </nav>
  );
};

export default SubgraphSidebar;
