import { FC } from 'react';
import Link from 'next/link';
import styles from './styles.module.css';
import type { BaseNodeFormValues, BaseNode } from 'src/types';
import type { FormikProps } from 'formik';
import Welding from 'src/lib/Welding';

type Props = {
  subgraph: BaseNode;
  currentDocument?: BaseNode;
  newDocument?: FormikProps<BaseNodeFormValues>;
  documents: Array<BaseNode>;
  topics: Array<BaseNode>;
  canEdit: boolean;
  hide: boolean;
  didClickHide: Function;
};

const SubgraphSidebar: FC<Props> = ({
  subgraph,
  currentDocument,
  newDocument,
  documents,
  topics,
  canEdit,
  hide,
  didClickHide
}) => {
  const emoji = subgraph.currentRevision.metadata.properties.emoji.native;
  const name = subgraph.currentRevision.metadata.name;
  return (
    <nav className="fixed left-0 top-0 my-2 ml-2 w-64 p-2 h-screen">
      <div
        onClick={() => didClickHide()}
        className={`${styles.SubgraphHeader} flex cursor-pointer`}
      >
        <p className={`${styles.hide} pb-4 mr-2 hidden py-1`}>
          {hide ? 'Show →' : '← Hide'}
        </p>
        <p className="font-semibold pb-4 pt-1">
          {emoji} {name}
        </p>
      </div>

       <div className={`${hide ? styles.hidden : ''} h-full border border-color rounded p-2 transition-transform ease-in-out duration-500`}>
          <p className="pb-4">
            {subgraph.currentRevision.metadata.description || 'No description'}
          </p>
          <div className="flex justify-between">
            <p className="pb-2">
              <span className="font-semibold">{0}</span> Backlinks
            </p>
            {canEdit && (
              <p className="pb-2">Revise ↗</p>
            )}
          </div>

          <hr className="pb-2" />
          <div className={`${styles.SectionHeader} flex justify-between`}>
            <p className="pb-2 font-semibold tracking-wide text-passive-color uppercase">Documents</p>
            {canEdit && (
              <Link href={`/subgraphs/${Welding.slugifyNode(subgraph)}/mint`}>
                <a className={`${styles.cta} transition-opacity ease-in-out duration-150 opacity-0 pb-2 text-xs`}>+ New</a>
              </Link>
            )}
          </div>

          {documents.map(d => {
            if (d.tokenId === currentDocument?.tokenId) {
              return (
                <p
                  key={d.tokenId}
                  className="text-xs font-semibold"
                >
                  {d.currentRevision.metadata.properties.emoji.native} {d.currentRevision.metadata.name}
                </p>
              );
            }
            return (
              <Link key={d.tokenId} href={`/subgraphs/${Welding.slugifyNode(subgraph)}/${Welding.slugifyNode(d)}`}>
                <a className="block text-xs pb-1">{d.currentRevision.metadata.properties.emoji.native} {d.currentRevision.metadata.name}</a>
              </Link>
            );
          })}

          {newDocument && (
            <p key="_new_" className="text-xs font-semibold">{newDocument.values.emoji.native} {newDocument.values.name}</p>
          )}
       </div>
    </nav>
  );
};

export default SubgraphSidebar;
