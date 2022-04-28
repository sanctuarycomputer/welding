import { BaseEmoji } from 'emoji-mart';

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

type Account = {
  address: string;
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
  timestamp: number;
  metadata: Metdata | string | null;
  content: string | null;
  contentType: string | null;
};

type BaseNode = {
  tokenId: string;
  currentRevision: Revision;
  labels: Array<string>;
  revisions?: Revision[];
  connections: BaseNode[];
  backlinks: BaseNode[];
};
