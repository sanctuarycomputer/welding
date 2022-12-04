import type { NextApiRequest, NextApiResponse } from "next";
import Welding from "src/lib/Welding";
import neo4j from "neo4j-driver";
import * as Sentry from "@sentry/nextjs";

const driver = neo4j.driver(
  process.env.NEO4J_URI || "",
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || "",
    process.env.NEO4J_PASSWORD || ""
  )
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string | { error: string }>
) {
  try {
    const { hash } = req.query;
    const session = driver.session();

    const readQ = `MATCH (rev:Revision { hash: $hash })
       WHERE rev.content IS NOT NULL AND rev.contentType IS NOT NULL
       RETURN rev`;
    const readResult = await session.readTransaction((tx) =>
      tx.run(readQ, { hash })
    );

    if (readResult.records.length) {
      const rev = readResult.records[0].get("rev");
      const { content, contentType, name, description, nativeEmoji, image } =
        rev.properties;
      const contentAsJSON = JSON.parse(content);

      if (!name) {
        const writeNameQ = `MERGE (rev:Revision {hash: $hash})
          SET rev.name = $name`;
        await session.writeTransaction((tx) =>
          tx.run(writeNameQ, { hash, name: contentAsJSON.name })
        );
      }

      if (!description) {
        const writeNameQ = `MERGE (rev:Revision {hash: $hash})
          SET rev.description = $description`;
        await session.writeTransaction((tx) =>
          tx.run(writeNameQ, { hash, description: contentAsJSON.description })
        );
      }

      if (!image) {
        const writeNameQ = `MERGE (rev:Revision {hash: $hash})
          SET rev.image = $image`;
        await session.writeTransaction((tx) =>
          tx.run(writeNameQ, { hash, image: contentAsJSON.image })
        );
      }

      if (!nativeEmoji) {
        const writeNameQ = `MERGE (rev:Revision {hash: $hash})
          SET rev.nativeEmoji = $nativeEmoji`;
        await session.writeTransaction((tx) =>
          tx.run(writeNameQ, {
            hash,
            nativeEmoji: contentAsJSON.properties.emoji.native,
          })
        );
      }

      if (content && contentType) {
        return res
          .status(200)
          .setHeader("Content-Type", contentType || "")
          .send(content);
      }
    }

    // If all else fails, fallback to a full
    // load from IPFS. We have no other choice.
    const response = await Promise.race(Welding.ipfsGateways.map(gateway =>
      fetch(`${gateway}/ipfs/${hash}/metadata.json`)
    ));
    if (!response.ok) throw new Error("failed_to_fetch");
    const contentType = response.headers.get("content-type");
    const content = await response.json();
    const writeQ = `MERGE (rev:Revision {hash: $hash})
      ON CREATE
        SET rev.block = 0
      SET rev.name = $name
      SET rev.description = $description
      SET rev.image = $image
      SET rev.nativeEmoji = $nativeEmoji
      SET rev.content = $content
      SET rev.contentType = $contentType`;
    await session.writeTransaction((tx) =>
      tx.run(writeQ, {
        hash,
        content: JSON.stringify(content),
        contentType,
        name: content.name,
        description: content.description,
        image: content.image,
        nativeEmoji: content.properties.emoji.native,
      })
    );

    res
      .status(200)
      .setHeader("Content-Type", contentType || "")
      .send(content || "");
  } catch (e) {
    console.log(e);
    Sentry.captureException(e);
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message || "unexpected" });
    }
    res.status(500).json({ error: "unexpected" });
  }
}
