// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

abstract contract Base is ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Burnable {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Revision {
        uint256 timestamp;
        string hash;
    }

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://";
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
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

    modifier onlyRole(uint256 tokenId, uint256 role) {
        _checkRole(tokenId, role, _msgSender());
        _;
    }

    modifier onlyEditors(uint256 tokenId) {
        _checkEditor(tokenId, _msgSender());
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

    function _checkRole(uint256 tokenId, uint256 role, address account)
      internal
      view
    {
        if (!hasRole(tokenId, role, account)) {
            revert("insufficient_permissions");
        }
    }

    function _checkEditor(uint256 tokenId, address account)
      internal
      view
    {
        if (!canEdit(tokenId, account)) {
            revert("insufficient_permissions");
        }
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
        revisions[tokenId].push(Revision(block.timestamp, hash));
        _setTokenURI(tokenId, hash);
    }

    function mint(string memory hash) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(_msgSender(), tokenId);

        _roles[tokenId][ADMIN_ROLE][_msgSender()] = true;
        emit RoleGranted(tokenId, ADMIN_ROLE, _msgSender(), _msgSender());
        makeRevision(tokenId, hash);
        return tokenId;
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
}
