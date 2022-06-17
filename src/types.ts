import { BaseEmoji } from 'emoji-mart';

enum Roles {
  OWNER = "Owner",
  ADMIN = "Admin",
  EDITOR = "Editor"
};

type BaseNodeFormValues = {
  name: string,
  description: string,
  emoji: BaseEmoji,
  content?: any
};

type MintState = {
  tokenId: string,
  label: string,
  progress: number,
  disabled: boolean
};

type Role = {
  role: string | null;
  tokenId: string;
};

type Account = {
  address: string;
  roles: Role[],
  related: BaseNode[],
};

type MetadataProperties = {
  emoji: BaseEmoji,
  content?: any
};

type Metadata = {
  name: string;
  description: string;
  image: string;
  properties: MetadataProperties;
};

type Revision = {
  hash: string;
  block: number;
  metadata: Metadata | string | null;
  content: string | null;
  contentType: string | null;
};

type BaseNodeLabel = "BaseNode";
type SubgraphLabel = "Subgraph";
type DocumentLabel = "Document";
type TopicLabel = "Topic";
type NodeLabel = SubgraphLabel | DocumentLabel | TopicLabel;

type Edge = {
  name: string;
  tokenId: string;
  pivotTokenId: string;
  active: boolean;
};

type BaseNode = {
  tokenId: string;
  fee: string;
  currentRevision: Revision;
  labels: Array<BaseNodeLabel | NodeLabel>;
  revisions?: Revision[];
  related: BaseNode[];
  incoming: Edge[];
  outgoing: Edge[];
};
