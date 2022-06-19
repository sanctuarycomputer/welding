const extractTokenIdsFromContentBlocks = (blocks) => {
  const urls =
    blocks.reduce((acc, block) => {
      switch(block.type) {
        case 'linkTool': {
          acc = [new URL(block.data.link), ...acc];
          break;
        }
        case 'paragraph': {
          const doc = document.createElement("html");
          doc.innerHTML = block.data.text;
          const links = Array.from(doc.getElementsByTagName("a"));
          acc = [...links.map(a => {
            return new URL(a.getAttribute("href"));
          }), ...acc];
          break;
        }
      }
      return acc;
    }, []);

  return urls.reduce((acc, url) => {
    if (url.host === process.env.NEXT_PUBLIC_BASE_HOST) {
      const splat = url.pathname.split('/');
      const slug = splat[splat.length - 1];
      if (slug) acc = [slug.split('-')[0], ...acc];
    }
    return acc;
  }, []);
};

export default extractTokenIdsFromContentBlocks;
