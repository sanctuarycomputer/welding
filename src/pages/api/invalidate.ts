import type { NextApiRequest, NextApiResponse } from "next";
import * as Sentry from "@sentry/nextjs";
import neo4j from "neo4j-driver";
import { fetchEnsName } from "@wagmi/core";
import Client from "src/lib/Client";
import getRelatedNodes from "src/utils/getRelatedNodes";
import slugifyNode from "src/utils/slugifyNode";

const driver = neo4j.driver(
  process.env.NEO4J_URI || "",
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || "",
    process.env.NEO4J_PASSWORD || ""
  )
);

const resolveENSNameForPath = async (path) => {
  const splat = path.split("/")
  const address = splat[splat.length - 1].split("-")[0];
  if (!address.match(/0x[a-fA-F0-9]{40}/)) return path;
  const ensName = await fetchEnsName({ address, chainId: 1 });
  if (!ensName) return path;
  return [path, `/accounts/${ensName}`];
};

const accountPathsForNode = (n) => {
  const addresses = new Set<string>();
  addresses.add(`/accounts/${n.owner.address}`);
  n.admins.forEach(a => addresses.add(`/accounts/${a.address}`));
  n.editors.forEach(a => addresses.add(`/accounts/${a.address}`));
  return [...addresses.values()];
};

const invalidationPathsForNode = (node) => {
  if (!node) return [];
  const label = node.labels.filter((l) => l !== "BaseNode")[0];
  const accountPaths = accountPathsForNode(node);

  switch (label) {
    case "Subgraph":
      const subgraphDocuments = getRelatedNodes(
        node,
        "incoming",
        "Document",
        "BELONGS_TO"
      );
      return [
        `/${slugifyNode(node)}`,
        ...subgraphDocuments.map(
          (sd) => `/${slugifyNode(node)}/${slugifyNode(sd)}`
        ),
        ...accountPaths
      ];
    case "Document":
      const documentSubgraphs = getRelatedNodes(
        node,
        "outgoing",
        "Subgraph",
        "BELONGS_TO"
      );
      if (documentSubgraphs.length) {
        return [
          `/${slugifyNode(node)}`,
          `/${slugifyNode(documentSubgraphs[0])}/${slugifyNode(node)}`,
          ...accountPaths
        ];
      } else {
        return [`/${slugifyNode(node)}`, ...accountPaths];
      }
    default:
      return [`/${slugifyNode(node)}`, ...accountPaths];
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = driver.session();
    let { path } = req.query;
    path = (Array.isArray(path) ? path[0] : path) || undefined;

    let tokenIds: Array<string> = [];
    if (path) {
      const splat = path.split("/");
      const nid = splat[splat.length - 1].split("-")[0];
      if (!nid) return res.status(200).json({ paths: [] });
      tokenIds = [nid];
    } else {
      const readQ = `MATCH (n:BaseNode { needsInvalidation: true }) RETURN n.tokenId`;
      const readResult = await session.readTransaction((tx) => tx.run(readQ));
      tokenIds = readResult.records.map(r => r.get("n.tokenId"))
    }

    const nodes =
      await Client.fetchSimpleBaseNodesByTokenIds(tokenIds);
    if (!nodes) return res.status(200).json({ paths: [] });

    const paths = new Set<string>();
    for (const node of nodes) {
      invalidationPathsForNode(node).forEach(p => paths.add(p));
      for (const relatedNode of node.related) {
        invalidationPathsForNode(relatedNode).forEach((p) => paths.add(p));
      }
    }

    const pathsWithENSNames =
      (await Promise.all([...paths.values()].map(resolveENSNameForPath))).flat();
    await Promise.all(pathsWithENSNames.map(p => res.revalidate(p)));
    const writeQ = `MATCH (n:BaseNode { needsInvalidation: true }) SET n.needsInvalidation = false`;
    await session.writeTransaction(tx => tx.run(writeQ));
    return res.status(200).json({ paths: pathsWithENSNames });
  } catch (e) {
    console.log(e);
    Sentry.captureException(e);
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message || "unexpected" });
    }
    res.status(500).json({ error: "unexpected" });
  }
}
