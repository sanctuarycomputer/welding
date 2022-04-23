// TODO Topics
import Link from 'next/link';
import styles from './styles.module.css';

const SubgraphSidebar = ({
  subgraph,
  currentDocument,
  newDocument,
  documents,
  topics,
  canEdit
}) => {
  return (
    <nav className="fixed left-0 top-0 my-2 ml-2 w-64 p-2 h-screen">
      <p className="font-semibold pb-4">
        {subgraph.metadata.properties.emoji.native} {subgraph.metadata.name}</p>
       <div className="h-full border border-color rounded p-2">
          <p className="pb-4">
            {subgraph.metadata.description || 'No description'}
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
              <Link href={`/subgraphs/${subgraph.slug}/mint`}>
                <a className={`${styles.cta} transition-opacity ease-in-out duration-150 opacity-0 pb-2 text-xs`}>+ New</a>
              </Link>
            )}
          </div>

          {documents.map(d => {
            if (d.id === currentDocument?.id) {
              return <p key={d.id} className="text-xs font-semibold">{d.metadata.properties.emoji.native} {d.metadata.name}</p>
            }
            return (
              <Link key={d.id} href={`/subgraphs/${subgraph.slug}/${d.slug}`}>
                <a className="block text-xs pb-1">{d.metadata.properties.emoji.native} {d.metadata.name}</a>
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