// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract Node is ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Burnable {

    /* ERC721 Miscellany & Utils, Helpers etc */

    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    function _ensureStringPresent(string memory str) private {
        require(bytes(str).length > 0, "invalid_string");
    }

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://";
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return string(abi.encodePacked(super.tokenURI(tokenId), "/metadata.json"));
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /* Behavior: GraphLike */

    constructor() ERC721("Node", "NODE") {}

    mapping(uint256 => string) private nodeLabels;
    mapping(string => EnumerableSet.UintSet) private nodesForLabel;
    mapping(uint256 => mapping(string => EnumerableSet.UintSet)) private connections;
    mapping(uint256 => mapping(string => EnumerableSet.UintSet)) private backlinkedConnections;

    function mintNode(
      string memory label,
      string memory hash,
      uint256[] memory fromConnections,
      uint256[] memory toConnections
    ) public {
        _ensureStringPresent(label);
        /* ERC721 standard minting */
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(_msgSender(), tokenId);
        /* Add node to the node LU tables */
        nodesForLabel[label].add(tokenId);
        nodeLabels[tokenId] = label;
        /* Minter automatically gets ADMIN_ROLE */
        _roles[tokenId][ADMIN_ROLE][_msgSender()] = true;
        emit RoleGranted(tokenId, ADMIN_ROLE, _msgSender(), _msgSender());
        /* Record our initial revision */
        makeRevision(tokenId, hash);

        /* Make initial connections */
        for (uint256 i; i < fromConnections.length; i++) {
            connectNodes(fromConnections[i], tokenId);
        }
        for (uint256 i; i < toConnections.length; i++) {
            connectNodes(tokenId, toConnections[i]);
        }
    }

    function labelFor(uint256 tokenId) public view returns (string memory) {
        return nodeLabels[tokenId];
    }

    function getNodeCountForLabel(string memory label) public view returns (uint256) {
        return nodesForLabel[label].length();
    }

    function getNodeForLabelAtIndex(string memory label, uint256 index) public view returns (uint256) {
        return nodesForLabel[label].at(index);
    }

    function connectNodes(uint256 from, uint256 to) public onlyEditors(to) {
        require(_exists(from), "node_nonexistent");
        require(_exists(to), "node_nonexistent");

        string memory fromLabel = labelFor(from);
        string memory toLabel = labelFor(to);

        connections[to][fromLabel].add(from);
        backlinkedConnections[from][toLabel].add(to);
        // TODO Event
    }

    function getConnectedNodeCountForNodeByLabel(uint256 tokenId, string memory label)
      public
      view
      returns (uint256)
    {
        return connections[tokenId][label].length();
    }

    function getConnectedNodeForNodeByLabelAndIndex(uint256 tokenId, string memory label, uint256 index)
      public
      view
      returns (uint256)
    {
        return connections[tokenId][label].at(index);
    }

    function getBacklinkedNodeCountForNodeByLabel(uint256 tokenId, string memory label)
      public
      view
      returns (uint256)
    {
        return backlinkedConnections[tokenId][label].length();
    }

    function getBacklinkedNodeForNodeByLabelAndIndex(uint256 tokenId, string memory label, uint256 index)
      public
      view
      returns (uint256)
    {
        return backlinkedConnections[tokenId][label].at(index);
    }

    // TODO Implement me
    function disconnectNodes(uint256 from, uint256 to) public {
        string memory fromLabel = labelFor(from);
        string memory toLabel = labelFor(to);
    }

    // TODO
    //function burnNode(uint256) {
    //}

    /* Per-token Role Management */

    uint256 public constant ADMIN_ROLE = 0;
    uint256 public constant EDITOR_ROLE = 1;

    event RoleGranted(
      uint256 tokenId,
      uint256 indexed role,
      address indexed account,
      address indexed sender
    );

    event RoleRevoked(
      uint256 tokenId,
      uint256 indexed role,
      address indexed account,
      address indexed sender
    );

    mapping(uint256 => mapping(uint256 => mapping(address => bool))) private _roles;
    mapping(uint256 => mapping(uint256 => EnumerableSet.AddressSet)) private _roleMembers;

    modifier onlyRole(uint256 tokenId, uint256 role) {
        require(hasRole(tokenId, role, _msgSender()), "insufficient_permissions");
        _;
    }

    modifier onlyEditors(uint256 tokenId) {
        require(canEdit(tokenId, _msgSender()), "insufficient_permissions");
        _;
    }

    function hasRole(uint256 tokenId, uint256 role, address account)
      public
      view
      returns (bool)
    {
        return _roles[tokenId][role][account];
    }

    function canEdit(uint256 tokenId, address account)
      public
      view
      returns (bool)
    {
      return hasRole(tokenId, ADMIN_ROLE, account) || hasRole(tokenId, EDITOR_ROLE, account);
    }

    function grantRole(uint256 tokenId, uint256 role, address account)
      public
      onlyRole(tokenId, ADMIN_ROLE)
    {
        if (!hasRole(tokenId, role, account)) {
            _roles[tokenId][role][account] = true;
            emit RoleGranted(tokenId, role, account, _msgSender());
        }
        _roleMembers[tokenId][role].add(account);
    }

    function renounceRole(uint256 tokenId, uint256 role)
      public
    {
        if (hasRole(tokenId, role, _msgSender())) {
            _roles[tokenId][role][_msgSender()] = false;
            emit RoleRevoked(tokenId, role, _msgSender(), _msgSender());
        }
        _roleMembers[tokenId][role].remove(_msgSender());
    }

    function revokeRole(uint256 tokenId, uint256 role, address account)
      public
      onlyRole(tokenId, ADMIN_ROLE)
    {
        if (hasRole(tokenId, role, account)) {
            _roles[tokenId][role][account] = false;
            emit RoleRevoked(tokenId, role, account, _msgSender());
        }
        _roleMembers[tokenId][role].remove(account);
    }

    function getRoleMember(uint256 tokenId, uint256 role, uint256 index)
      public
      view
      returns (address)
    {
        return _roleMembers[tokenId][role].at(index);
    }

    function getRoleMemberCount(uint256 tokenId, uint256 role)
      public
      view
      returns (uint256)
    {
        return _roleMembers[tokenId][role].length();
    }

    /* Per-token Revision Management */

    event RevisionMade(
      uint256 tokenId,
      uint256 indexed timestamp,
      string indexed hash,
      address indexed sender
    );

    struct Revision {
        uint256 timestamp;
        string hash;
        address revisor;
    }

    mapping(uint256 => Revision[]) public revisions;

    function getRevisionCount(uint256 tokenId) public view returns (uint256) {
        return revisions[tokenId].length;
    }

    function getRevision(uint256 tokenId, uint256 index) public view returns (Revision memory) {
        return revisions[tokenId][index];
    }

    function makeRevision(uint256 tokenId, string memory hash)
      public
      onlyEditors(tokenId)
    {
        require(_exists(tokenId), "node_nonexistent");
        _ensureStringPresent(hash);
        revisions[tokenId].push(Revision(block.timestamp, hash, _msgSender()));
        _setTokenURI(tokenId, hash);
        emit RevisionMade(tokenId, block.timestamp, hash, _msgSender());
    }
}
