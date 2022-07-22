const URL_REGEX =
  /(?:ht|f)tps?:\/\/[-a-zA-Z0-9:.]+(\.[a-zA-Z]{2,3})?(\/[^"<]*)?/g;

const extractTokenIdsFromContentBlocks = (blocks) => {
  const urls = blocks.reduce((acc, block) => {
    switch (block.type) {
      case "linkTool": {
        acc = [new URL(block.data.link), ...acc];
        break;
      }
      case "paragraph": {
        const matches = block.data.text.match(URL_REGEX);
        if (matches) acc = [...matches.map((m) => new URL(m)), ...acc];
        break;
      }
    }
    return acc;
  }, []);

  return urls.reduce((acc, url) => {
    if (url.host === "www.welding.app") {
      const splat = url.pathname.split("/");
      const slug = splat[splat.length - 1];
      if (slug) acc = [slug.split("-")[0], ...acc];
    }
    return acc;
  }, []);
};

export default extractTokenIdsFromContentBlocks;
