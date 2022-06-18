import { FC, useContext, useState } from 'react';
import { ModalContext, ModalType } from 'src/hooks/useModal';
import Link from 'next/link';
import type { BaseNodeFormValues, BaseNode } from 'src/types';
import type { FormikProps } from 'formik';
import Button from 'src/components/Button';
import slugifyNode from 'src/utils/slugifyNode';

import Document from 'src/components/Icons/Document';
import Actions from 'src/components/Actions';
import useEditableImage from 'src/hooks/useEditableImage';
import NodeImage from 'src/components/NodeImage';
import TopicManager from 'src/components/TopicManager';
import VerticalDots from 'src/components/Icons/VerticalDots';
import getRelatedNodes from 'src/utils/getRelatedNodes';
import { bg, border, textPassive } from 'src/utils/theme';

type Props = {
  formik: FormikProps<BaseNodeFormValues>;
  canEdit: boolean;
  currentDocument?: BaseNode;
  reloadData: Function;
};

const SubgraphSidebar: FC<Props> = ({
  formik,
  canEdit,
  currentDocument,
  reloadData
}) => {
  const { openModal, closeModal } = useContext(ModalContext);
  const [mobileOpen, setMobileOpen] = useState(false);

  const emoji = formik.values.emoji.native;
  const name = formik.values.name;
  const subgraph = formik.values.__node__;

  const topics =
    getRelatedNodes(subgraph, 'incoming', 'Topic', 'DESCRIBES');
  const documents =
    getRelatedNodes(subgraph, 'incoming', 'Document', 'BELONGS_TO');
  const stashedDocuments =
    getRelatedNodes(subgraph, 'incoming', 'Document', 'STASHED_BY');
  const stashedSubgraphs =
    getRelatedNodes(subgraph, 'incoming', 'Subgraph', 'STASHED_BY');

  const [imagePreview, imageDidChange, clearImage] =
    useEditableImage(formik);

  const descriptionPresent = (
    !!formik.values.description &&
    formik.values.description.length > 0
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="absolute p-2">
        <p className="py-3 font-semibold">{emoji} {formik.values.name}</p>
      </button>

      <div
        onClick={() => setMobileOpen(!mobileOpen)}
        className={`${bg} w-full h-screen fixed z-10 curtain ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:-translate-x-full`}>
      </div>

      <nav
        className={`${bg} ${border} ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed top-0 inline-block w-64 h-screen border-r z-20 `}>

        <div className="pl-2 pr-1 py-4 text-xs flex items-center">
          <p
            className={`${canEdit ? 'cursor-pointer' : 'pointer-events-none'} mr-1 py-1`}
            onClick={() => canEdit && openModal({
              type: ModalType.EMOJI_PICKER,
              meta: {
                didPickEmoji: (emoji: BaseEmoji) => {
                  formik.setFieldValue('emoji', emoji);
                  closeModal();
                }
              }
            })}
          >{emoji}</p>
          <input
            readOnly={!canEdit}
            type="text"
            name="name"
            className={`${canEdit ? 'cursor-edit' : 'pointer-events-none'} font-semibold`}
            placeholder={`Subgraph name`}
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />

          <Actions
            node={subgraph}
            canEdit={canEdit}
            imageDidChange={imageDidChange}
            allowConnect={!subgraph.tokenId.startsWith('-')}
            allowSettings={!subgraph.tokenId.startsWith('-')}
            reloadData={reloadData}
          />
        </div>

        <div className={`${bg} flex flex-col`}>
          <NodeImage
            showDefault={false}
            readOnly={!canEdit}
            imagePreview={imagePreview}
            imageDidChange={imageDidChange}
            clearImage={clearImage}
          />

          {(descriptionPresent || canEdit) && (
            <div className={`border-b ${border}`}>
              <textarea
                style={{resize: 'none'}}
                readOnly={!canEdit}
                className={`${canEdit ? 'cursor-edit' : 'pointer-events-none'} block pb-4 w-full bg-transparent text-xs px-2`}
                type="text"
                name="description"
                placeholder="Add a description"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>
          )}

          {(topics.length || canEdit) && (
            <div className="px-2 pt-2">
              <TopicManager
                readOnly={!canEdit}
                formik={formik}
              />
            </div>
          )}

          <div className="pb-2 px-2 pt-2">
            <div className="flex justify-between">
              <p className={`${textPassive} pb-2 font-semibold tracking-wide uppercase`}>Documents</p>
              {canEdit && !subgraph.tokenId.startsWith('-') && (
                <Link
                  href={`/${slugifyNode(subgraph)}/mint`}
                >
                  <a className="pb-2 text-xs opacity-60 hover:opacity-100">+ New</a>
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
                <Link key={d.tokenId} href={`/${slugifyNode(subgraph)}/${slugifyNode(d)}`}>
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
                <Link key={d.tokenId} href={`/${slugifyNode(subgraph)}/${slugifyNode(d)}`}>
                  <a className="block text-xs pb-1">↗ {d.currentRevision.metadata.properties.emoji.native} {d.currentRevision.metadata.name}</a>
                </Link>
              );
            })}

            {stashedSubgraphs.length > 0 && (
              <div className="flex justify-between">
                <p className={`${textPassive} py-2 font-semibold tracking-wide uppercase`}>
                  Subgraphs
                </p>
              </div>
            )}

            {stashedSubgraphs.map(s => {
              return (
                <Link key={s.tokenId} href={`/${slugifyNode(s)}`}>
                  <a className="block text-xs pb-1">↗ {s.currentRevision.metadata.properties.emoji.native} {s.currentRevision.metadata.name}</a>
                </Link>
              );
            })}
          </div>

          {formik.dirty && (
            <div className={`absolute w-full bottom-0 text-center border-t ${border}`}>
              <div className="flex px-2 py-4 justify-between">
                <div
                  className="basis-0 flex-grow bg-yellow-400 text-stone-800 font-medium text-xs px-2 py-1 rounded-full mr-2 text-center"
                >
                  Unsaved
                </div>
                <Button
                  className="basis-0 flex-grow"
                  disabled={
                    formik.isSubmitting ||
                    !(formik.isValid && formik.dirty)
                  }
                  onClick={formik.handleSubmit}
                  label={"Publish"}
                />
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default SubgraphSidebar;
