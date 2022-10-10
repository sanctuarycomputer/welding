import { BaseEmoji } from "emoji-mart";

export type Session = {
  address: string;
};

export type PersistedDraft = {
  name: string;
  description: string;
  emoji: BaseEmoji;
  ui: any;
  content?: any;
  image: any;
  outgoing: Edge[];
  incoming: Edge[];
};

export type Draft = PersistedDraft & {
  related: BaseNode[];
  __node__: BaseNode;
};

export type BaseNodeFormValues = Draft;

export type Role = {
  role: null | "0" | "1";
  tokenId: string;
};

export type Account = {
  address: string;
  roles: Role[];
  related: BaseNode[];
  ensName?: string | null;
};

export type MetadataProperties = {
  emoji: BaseEmoji;
  content?: any;
  ui?: {
    subgraphSidebarDocumentSortOrder?: string[];
  };
};

export type Metadata = {
  name: string;
  description: string;
  image: string;
  properties: MetadataProperties;
};

export type Revision = {
  name: string;
  nativeEmoji: string;
  description: string;
  image: string;
  hash?: string;
  block?: number;
  metadata: Metadata;
};

export type Edge = {
  name: string;
  tokenId: string;
  pivotTokenId: string;
  active: boolean;
};

export type BaseNode = {
  tokenId: string;
  fee: string;
  currentRevision: Revision;
  labels: string[];
  burnt: boolean;
  revisions?: Revision[];
  related: BaseNode[];
  incoming: Edge[];
  outgoing: Edge[];
  owner: { address: string };
  admins: { address: string }[];
  editors: { address: string }[];
};
