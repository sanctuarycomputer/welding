// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./Base.sol";

contract Document is Base {
    constructor() ERC721("Document", "DOC") {}
}
