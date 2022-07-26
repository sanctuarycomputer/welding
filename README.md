![Welding Share Card](https://raw.githubusercontent.com/sanctuarycomputer/welding/main/public/share.jpg)

# [welding.app](https://www.welding.app) • knowledge is valuable

<p>
  <a href="https://www.welding.app">
    <img src="https://img.shields.io/website?down_color=lightgrey&down_message=offline&up_color=blue&up_message=online&url=https%3A%2F%2Fwww.welding.app" alt="Website">
  </a>
  <a href="https://twitter.com/welding_app">
    <img src="https://img.shields.io/twitter/follow/welding_app" alt="Twitter">
  </a>
  <a href="/LICENSE">
    <img src="https://img.shields.io/github/license/sanctuarycomputer/welding" alt="License">
  </a>
</p>

## Intro

Welding is a decentralized knowledge graph protocol for building and managing networks of research and documentation. It is inspired by [Notion](https://www.notion.so/), [Are.na](https://www.are.na/) & [Roam](https://roamresearch.com/); but it is built on the Ethereum Virtual Machine (and deployed to [Polygon](https://polygon.technology/)), allowing every `Subgraph`, `Topic` & `Document` to be backed by an NFT, ensuring all content is free and public forever (via [IPFS](https://ipfs.io/)).

Through a novel ERC721 contract design, NFTs can cross-reference each other by merging “edges” into the graph. Researchers and writers can earn royalties as their writing is referenced (and backlinked) by others, allowing all humans to participate and be rewarded for contributing their thought, ideas, and knowledge as they learn together, in the open.

## Documentation

Welding is documented with Welding → [welding.app](https://www.welding.app).

## Development

1. Clone the repo
2. Copy `.env.example` to `.env`
3. Subsitute the `{Add me...` env vars in `.env` with your own
4. `yarn install`
5. `yarn dev`

## Community

Check out the following places for more Welding-related content:

- Join the [discussions on GitHub](https://github.com/sanctuarycomputer/welding/discussions)
- Follow [@welding_app](https://twitter.com/welding_app), [@\_hhff](https://twitter.com/_hhff) and [@sanctucompu](https://twitter.com/sanctucompu) on Twitter to stay up to date

## Authors

- hhff.eth ([@\_hhff](https://twitter.com/_hhff))

## License

[WAGMIT](/LICENSE) License

# Roadmap

Must Have

- [ ] Move everything to ISR (invalidate accounts)
- [ ] Collect effected TokenIds in Sync

---

- [ ] Drafts
- [ ] Manual Reload button
- [ ] Switch to "doesOwnNode"
- [ ] Retryable minting
- [ ] Verify contract ABI?
- [ ] Next.js Image Loader?
- [ ] Bug: I should be able to search Emojis
- [ ] Ability to withdraw Welding Balance
- [ ] Bug: Discarding Topics from the TopicMint screen does not unstage them
- [ ] Reorderable Topics
- [ ] Sitemap.xml
- [ ] Iron Session? (Persisted Drafts, Comments, Favorites?)
- [ ] i18n & translations
- [ ] Editor: Support callouts
- [ ] Editor: Support Text Color
- [ ] Editor: Support Deeplinks into Blocks
- [ ] Editor: Sync'd blocks
- [ ] Support browsing revisions
- [ ] When viewing a revision, I should see a message so that I realize
- [ ] Referenced documents should show backlinks
- [ ] Ability to color your Node's background
- [ ] Custom subdomains & domains
