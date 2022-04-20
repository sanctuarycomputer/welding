// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract Node is ERC721, ERC721Enumerable, ERC721URIStorage {

    string public constant ERR_RECURSIVE_DELEGATION = 'recursive_delegation';
    string public constant ERR_NODE_NONEXISTENT = 'node_nonexistent';
    string public constant ERR_INSUFFICIENT_PERMISSIONS = 'insufficient_permissions';

    /* ERC721 Miscellany & Utils, Helpers etc */

    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    function _ensureStringPresent(string memory str) private pure {
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
        /* Ya just GOTTA have a label */
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

        /* Record our initial revision (ensures hash is a valid string too) */
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

    function connectNodes(uint256 from, uint256 to)
      public
      existentNode(from)
      existentNode(to)
      onlyEditors(to)
    {
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

    function disconnectNodes(uint256 from, uint256 to)
      public
      existentNode(from)
      existentNode(to)
      onlyEditors(to)
    {
        string memory fromLabel = labelFor(from);
        string memory toLabel = labelFor(to);
        connections[to][fromLabel].remove(from);
        backlinkedConnections[from][toLabel].remove(to);

        // TODO Event
    }

    function burnNode(uint256 tokenId)
      existentNode(tokenId)
      public
    {
        require(_isApprovedOrOwner(_msgSender(), tokenId), ERR_INSUFFICIENT_PERMISSIONS);
        _burn(tokenId);
    }

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

    modifier existentNode(uint256 tokenId) {
        require(_exists(tokenId), ERR_NODE_NONEXISTENT);
        _;
    }

    modifier onlyRole(uint256 tokenId, uint256 role) {
        require(hasRole(tokenId, role, _msgSender()), ERR_INSUFFICIENT_PERMISSIONS);
        _;
    }

    modifier onlyEditors(uint256 tokenId) {
        require(canEdit(tokenId, _msgSender()), ERR_INSUFFICIENT_PERMISSIONS);
        _;
    }

    function hasRole(uint256 tokenId, uint256 role, address account)
      public
      view
      returns (bool)
    {
        if (_roles[tokenId][role][account]) return true;
        for (uint256 i = 0; i < _delegatesTo[tokenId].length(); i++) {
            if (hasRole(_delegatesTo[tokenId].at(i), role, account)) return true;
        }
        return false;
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
      existentNode(tokenId)
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
      existentNode(tokenId)
    {
        if (hasRole(tokenId, role, _msgSender())) {
            _roles[tokenId][role][_msgSender()] = false;
            emit RoleRevoked(tokenId, role, _msgSender(), _msgSender());
        }
        _roleMembers[tokenId][role].remove(_msgSender());
    }

    function revokeRole(uint256 tokenId, uint256 role, address account)
      public
      existentNode(tokenId)
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

    /* Delegatable Role Management */

    mapping(uint256 => EnumerableSet.UintSet) private _delegatesTo;
    mapping(uint256 => EnumerableSet.UintSet) private _delegatesFor;

    function delegatePermissions(uint256 forTokenId, uint256 toTokenId)
      public
      existentNode(forTokenId)
      existentNode(toTokenId)
      onlyRole(forTokenId, ADMIN_ROLE)
      onlyRole(toTokenId, ADMIN_ROLE)
    {
        // Can't delegate to self
        require(forTokenId != toTokenId, ERR_RECURSIVE_DELEGATION);
        require(getDelegatesToCount(toTokenId) == 0, ERR_RECURSIVE_DELEGATION);
        require(getDelegatesForCount(forTokenId) == 0, ERR_RECURSIVE_DELEGATION);

        _delegatesTo[forTokenId].add(toTokenId);
        _delegatesFor[toTokenId].add(forTokenId);
    }

    function renounceDelegatePermissions(uint256 forTokenId, uint256 toTokenId)
      public
      existentNode(forTokenId)
      existentNode(toTokenId)
      onlyRole(forTokenId, ADMIN_ROLE)
      onlyRole(toTokenId, ADMIN_ROLE)
    {
        _delegatesTo[forTokenId].remove(toTokenId);
        _delegatesFor[toTokenId].remove(forTokenId);
    }

    function getDelegatesToAtIndex(uint256 tokenId, uint256 index)
      public
      view
      returns (uint256)
    {
        return _delegatesTo[tokenId].at(index);
    }

    function getDelegatesToCount(uint256 tokenId)
      public
      view
      returns (uint256)
    {
        return _delegatesTo[tokenId].length();
    }

    function getDelegatesForAtIndex(uint256 tokenId, uint256 index)
      public
      view
      returns (uint256)
    {
        return _delegatesFor[tokenId].at(index);
    }

    function getDelegatesForCount(uint256 tokenId)
      public
      view
      returns (uint256)
    {
        return _delegatesFor[tokenId].length();
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
      existentNode(tokenId)
      onlyEditors(tokenId)
    {
        _ensureStringPresent(hash);
        revisions[tokenId].push(Revision(block.timestamp, hash, _msgSender()));
        _setTokenURI(tokenId, hash);
        emit RevisionMade(tokenId, block.timestamp, hash, _msgSender());
    }
}
