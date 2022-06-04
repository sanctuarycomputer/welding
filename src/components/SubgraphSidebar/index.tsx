import { FC, useContext, useState } from 'react';
import { ModalContext, ModalType } from 'src/hooks/useModal';
import Link from 'next/link';
import type { BaseNodeFormValues, BaseNode } from 'src/types';
import type { FormikProps } from 'formik';
import Button from 'src/components/Button';
import Upload from 'src/components/Icons/Upload';
import Welding from 'src/lib/Welding';

import Document from 'src/components/Icons/Document';
import Actions from 'src/components/Actions';
import useEditableImage from 'src/hooks/useEditableImage';
import NodeImage from 'src/components/NodeImage';
import TopicManager from 'src/components/TopicManager';
import VerticalDots from 'src/components/Icons/VerticalDots';
import Connect from 'src/components/Icons/Connect';
import getRelatedNodes from 'src/utils/getRelatedNodes';

type Props = {
  subgraphFormik: FormikProps<BaseNodeFormValues>;
  canEdit: boolean;
  triggerPublish: Function;
  currentDocument?: BaseNode;
  newDocument?: FormikProps<BaseNodeFormValues>;
};

const SubgraphSidebar: FC<Props> = ({
  subgraphFormik,
  canEdit,
  triggerPublish,

  currentDocument,
  newDocument,
}) => {
  const { openModal, closeModal } = useContext(ModalContext);

  const emoji = subgraphFormik.values.emoji.native;
  const name = subgraphFormik.values.name;
  const subgraph = subgraphFormik.values.__node__;

  const documents =
    getRelatedNodes(subgraph, 'incoming', 'Document', 'BELONGS_TO');

  const stashedDocuments =
    getRelatedNodes(subgraph, 'incoming', 'Document', 'STASHED_BY');

  const stashedSubgraphs =
    getRelatedNodes(subgraph, 'incoming', 'Subgraph', 'STASHED_BY');

  const [imagePreview, imageDidChange, clearImage] =
    useEditableImage(subgraphFormik);

  const imageIsDefault =
    (imagePreview || "").endsWith("emoji.jpg") ||
    imagePreview === null;

  return (
    <nav
      className="fixed top-0 inline-block ml-4 w-64 h-screen border-color border-r border-l background-color"
    >
      <div className="fixed left-0 h-screen items-center flex cursor-pointer opacity-0 hover:opacity-100" style={{paddingLeft: '0.5px'}}>
        <VerticalDots />
      </div>

      <div className="pl-2 pr-1 py-4 text-xs flex items-center">
        <p
          className={`${canEdit ? 'cursor-pointer' : 'pointer-events-none'} mr-1 py-1`}
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
          className={`${canEdit ? 'cursor-pointer' : 'pointer-events-none'} font-semibold`}
          placeholder={`Subgraph name`}
          value={subgraphFormik.values.name}
          onChange={subgraphFormik.handleChange}
          onBlur={subgraphFormik.handleBlur}
        />

        <Actions
          node={subgraph}
          canEdit={canEdit}
          imageDidChange={imageDidChange}
          allowConnect={!subgraph.tokenId.startsWith('-')}
          allowSettings={!subgraph.tokenId.startsWith('-')}
        />
      </div>

      <div className="background-color flex flex-col">
          <NodeImage
            showDefault={false}
            readOnly={!canEdit}
            imagePreview={imagePreview}
            imageDidChange={imageDidChange}
            clearImage={clearImage}
          />

          <div className="border-b border-color">
            <textarea
              readOnly={!canEdit}
              className={`${canEdit ? 'cursor-pointer' : 'pointer-events-none'} block pb-4 w-full bg-transparent text-xs px-2`}
              type="text"
              name="description"
              placeholder="Add a description"
              value={subgraphFormik.values.description}
              onChange={subgraphFormik.handleChange}
              onBlur={subgraphFormik.handleBlur}
            />
          </div>

          <div className="px-2 pt-2">
            <TopicManager
              readOnly={!canEdit}
              formik={subgraphFormik}
            />
          </div>

          <div className="pb-2 px-2 pt-2">
            <div className="flex justify-between">
              <p className="pb-2 font-semibold tracking-wide text-passive-color uppercase">Documents</p>

              {canEdit && !subgraph.tokenId.startsWith('-') && (
                <Link
                  href={`/${Welding.slugifyNode(subgraph)}/mint`}
                >
                  <a className="pb-2 text-xs opacity-50 hover:opacity-100">+ New</a>
                </Link>
              )}
            </div>

            {[...documents, ...stashedDocuments].length === 0 && (
              <div className="flex flex-col items-center py-8 opacity-50">
                <Document />
                <p className="pt-1 whitespace-nowrap">
                  No documents (yet).
                </p>
              </div>
            )}

            {documents.map(d => {
              if (
                d.tokenId === currentDocument?.tokenId
              ) {
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

            {stashedDocuments.map(d => {
              if (
                d.tokenId === currentDocument?.tokenId
              ) {
                return (
                  <p
                    key={d.tokenId}
                    className="text-xs font-semibold pb-1"
                  >
                    ↗ {d.currentRevision.metadata.properties.emoji.native} {d.currentRevision.metadata.name}
                  </p>
                );
              }
              return (
                <Link key={d.tokenId} href={`/${Welding.slugifyNode(subgraph)}/${Welding.slugifyNode(d)}`}>
                  <a className="block text-xs pb-1">↗ {d.currentRevision.metadata.properties.emoji.native} {d.currentRevision.metadata.name}</a>
                </Link>
              );
            })}

            {newDocument && (
              <p
                key="_new_"
                className="text-xs font-semibold">{newDocument.values.emoji.native} {newDocument.values.name}
              </p>
            )}

            {stashedSubgraphs.length > 0 && (
              <div className="flex justify-between">
                <p className="py-2 font-semibold tracking-wide text-passive-color uppercase">Subgraphs</p>
              </div>
            )}

            {stashedSubgraphs.map(s => {
              return (
                <Link key={s.tokenId} href={`/${Welding.slugifyNode(s)}`}>
                  <a className="block text-xs pb-1">↗ {s.currentRevision.metadata.properties.emoji.native} {s.currentRevision.metadata.name}</a>
                </Link>
              );
            })}

          </div>

          <div className="absolute w-full bottom-0 text-center border-t border-color">
            {subgraphFormik?.dirty ? (
              <div className="flex px-2 py-4 justify-between">
                <div
                  className="basis-0 flex-grow background-warning-color text-background-color font-medium text-xs px-2 py-1 rounded-full mr-2 text-center"
                >
                  Unsaved
                </div>
                <Button
                  className="basis-0 flex-grow"
                  disabled={
                    subgraphFormik.isSubmitting ||
                    !(subgraphFormik.isValid &&
                    subgraphFormik?.dirty)
                  }
                  onClick={triggerPublish}
                  label={"Publish"}
                />
              </div>
            ) : (
              <p
                onClick={() => openModal({ type: ModalType.SUBGRAPH_SWITCHER })}
                className="font-semibold py-5 w-100 cursor-pointer"
              >
                Switch Subgraph ↗
              </p>
            )}

          </div>
       </div>
    </nav>
  );
};

export default SubgraphSidebar;
