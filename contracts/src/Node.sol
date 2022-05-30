// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/escrow/Escrow.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Node is ERC721, ERC721Enumerable, ERC721URIStorage, ReentrancyGuard {
    struct Edge {
        uint256 tokenId;
        string name;
    }

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

    function stringsAreEqual(string memory a, string memory b) public pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://";
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

    Escrow private immutable _escrow;

    function withdrawPayments(address payable payee) public nonReentrant {
        _escrow.withdraw(payee);
    }

    function payments(address dest) public view returns (uint256) {
        return _escrow.depositsOf(dest);
    }

    /* Behavior: GraphLike */
    constructor() ERC721("Node", "NODE") {
        _escrow = new Escrow();
    }

    event Mint(
      uint256 indexed tokenId,
      string label,
      string hash,
      Edge[] incomingEdges,
      Edge[] outgoingEdges,
      address sender
    );

    event Revise(
      uint256 indexed tokenId,
      string hash,
      address sender
    );

    event Merge(
      uint256 indexed tokenId,
      string hash,
      Edge[] incomingEdges,
      Edge[] outgoingEdges,
      address sender
    );

    mapping(uint256 => EnumerableSet.UintSet) private _connections;
    mapping(uint256 => Edge[]) private _currentOutgoingEdges;

    function mint(
      string memory label,
      string memory hash,
      Edge[] memory incomingEdges,
      Edge[] memory outgoingEdges
    ) public payable {
        _ensureStringPresent(label);
        _ensureStringPresent(hash);

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        emit Mint(
          tokenId,
          label,
          hash,
          incomingEdges,
          outgoingEdges,
          _msgSender()
        );

        _safeMint(_msgSender(), tokenId);
        _setTokenURI(tokenId, hash);

        /* Default connection fee */
        _connectionFees[tokenId] = 0;

        /* Minter automatically gets ADMIN_ROLE */
        _roles[tokenId][ADMIN_ROLE][_msgSender()] = true;
        emit RoleGranted(tokenId, ADMIN_ROLE, _msgSender(), _msgSender());

        /* Handle edges */
        _handleEdges(tokenId, incomingEdges, outgoingEdges);
    }

    function revise(
      uint256 tokenId,
      string memory hash
    ) public
      existentNode(tokenId)
      onlyEditors(tokenId)
    {
        _ensureStringPresent(hash);
        _setTokenURI(tokenId, hash);
        emit Revise(tokenId, hash, _msgSender());
    }

    function merge(
      uint256 tokenId,
      string memory hash,
      Edge[] memory incomingEdges,
      Edge[] memory outgoingEdges
    ) public payable
      existentNode(tokenId)
      onlyEditors(tokenId)
    {
        _ensureStringPresent(hash);
        _setTokenURI(tokenId, hash);
        _handleEdges(tokenId, incomingEdges, outgoingEdges);

        emit Merge(
          tokenId,
          hash,
          incomingEdges,
          outgoingEdges,
          _msgSender()
        );
    }

    function _handleEdges(
      uint256 tokenId,
      Edge[] memory incomingEdges,
      Edge[] memory outgoingEdges
    ) private {
        // Handle Incoming Edges
        //   Incoming Edges can reference anything in the system
        //   (but must pay a one-time fee if !canEdit). Once user
        //   has paid that one-time fee, they can use that node as many
        //   times as they'd like in as many different edges as they'd
        //   like.
        for (uint256 i; i < incomingEdges.length; i++) {
            Edge memory edge = incomingEdges[i];
            require(_exists(edge.tokenId), ERR_NODE_NONEXISTENT);
            uint256 connectionFee = getConnectionFee(edge.tokenId);
            if (
                !_isApprovedOrOwner(_msgSender(), edge.tokenId) &&
                !canEdit(edge.tokenId, _msgSender()) &&
                connectionFee > 0 &&
                !_connections[tokenId].contains(edge.tokenId)
            ) {
                _escrow.deposit{value: connectionFee}(ownerOf(edge.tokenId));
            }
            _connections[tokenId].add(edge.tokenId);
        }

        // Handle Outgoing Edges
        //   Outgoing Edges must be added or removed by a user
        //   who currently canEdit the subject node. If a node
        //   is currently connected, a user who !canEdit may submit
        //   it in their merge() call, as they're effectively not
        //   changing that edge.
        Edge[] memory currentOutgoingEdges = _currentOutgoingEdges[tokenId];
        delete _currentOutgoingEdges[tokenId];

        for (uint256 i; i < outgoingEdges.length; i++) {
            Edge memory newEdge = outgoingEdges[i];
            require(_exists(newEdge.tokenId), ERR_NODE_NONEXISTENT);

            bool found = false;
            for (uint256 n; n < currentOutgoingEdges.length; n++) {
                Edge memory connectedEdge = currentOutgoingEdges[n];
                if (
                    connectedEdge.tokenId == newEdge.tokenId &&
                    stringsAreEqual(connectedEdge.name, newEdge.name)
                ) {
                    found = true;
                }
            }

            // Not found in the current set, so this was added
            // test to see the sender can actually remove this edge
            if (
                !found &&
                !hasPermissionsBypass(newEdge.tokenId)
            ) {
                require(canEdit(newEdge.tokenId, _msgSender()), ERR_INSUFFICIENT_PERMISSIONS);
            }

            _currentOutgoingEdges[tokenId].push(newEdge);
        }

        // Test for Removed Edges
        for (uint256 i; i < currentOutgoingEdges.length; i++) {
            Edge memory connectedEdge = currentOutgoingEdges[i];

            bool found = false;
            for (uint256 n; n < outgoingEdges.length; n++) {
                Edge memory newEdge = outgoingEdges[n];
                if (
                    connectedEdge.tokenId == newEdge.tokenId &&
                    stringsAreEqual(connectedEdge.name, newEdge.name)
                ) {
                    found = true;
                }
            }

            // Connected edge not found in the new set, so this was removed
            // test to see the sender can actually remove this edge
            if (
                !found &&
                !hasPermissionsBypass(connectedEdge.tokenId)
            ) {
                require(canEdit(connectedEdge.tokenId, _msgSender()), ERR_INSUFFICIENT_PERMISSIONS);
            }
        }
    }

    function burnNode(uint256 tokenId)
      existentNode(tokenId)
      public
    {
        require(_isApprovedOrOwner(_msgSender(), tokenId), ERR_INSUFFICIENT_PERMISSIONS);
        _burn(tokenId);
    }

    /* Connection Fee Management */

    event ConnectionFeeSet(
      uint256 tokenId,
      uint256 connectionFee,
      address sender
    );

    mapping(uint256 => uint256) private _connectionFees;

    function getConnectionFee(uint256 tokenId) public view returns(uint256) {
        return _connectionFees[tokenId];
    }

    function setConnectionFee(uint256 tokenId, uint256 connectionFee)
      public
      onlyRole(tokenId, ADMIN_ROLE)
    {
        _connectionFees[tokenId] = connectionFee;
        emit ConnectionFeeSet(tokenId, connectionFee, _msgSender());
    }

    /* Per-token Role Management */

    uint256 public constant ADMIN_ROLE = 0;
    uint256 public constant EDITOR_ROLE = 1;

    event RoleGranted(
      uint256 tokenId,
      uint256 role,
      address account,
      address sender
    );

    event RoleRevoked(
      uint256 tokenId,
      uint256 role,
      address account,
      address sender
    );

    mapping(uint256 => mapping(uint256 => mapping(address => bool))) private _roles;
    mapping(uint256 => mapping(uint256 => EnumerableSet.AddressSet)) private _roleMembers;

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    modifier existentNode(uint256 tokenId) {
        require(_exists(tokenId), ERR_NODE_NONEXISTENT);
        _;
    }

    modifier onlyRole(uint256 tokenId, uint256 role) {
        if (!hasPermissionsBypass(tokenId)) {
          require(hasRole(tokenId, role, _msgSender()), ERR_INSUFFICIENT_PERMISSIONS);
          _;
        }
    }

    modifier onlyEditors(uint256 tokenId) {
        if (!hasPermissionsBypass(tokenId)) {
          require(canEdit(tokenId, _msgSender()), ERR_INSUFFICIENT_PERMISSIONS);
          _;
        }
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

    /* Delegatable Role Management */
    event PermissionsDelegated(
      uint256 forTokenId,
      uint256 toTokenId,
      address sender
    );

    event DelegatePermissionsRenounced(
      uint256 forTokenId,
      uint256 toTokenId,
      address sender
    );

    mapping(uint256 => EnumerableSet.UintSet) private _delegatesTo;
    mapping(uint256 => EnumerableSet.UintSet) private _delegatesFor;

    function delegatePermissions(uint256 forTokenId, uint256 toTokenId)
      public
      existentNode(forTokenId)
      existentNode(toTokenId)
      onlyRole(forTokenId, ADMIN_ROLE)
    {
        // Can't delegate to self
        require(forTokenId != toTokenId, ERR_RECURSIVE_DELEGATION);
        require(_delegatesTo[toTokenId].length() == 0, ERR_RECURSIVE_DELEGATION);
        require(_delegatesFor[forTokenId].length() == 0, ERR_RECURSIVE_DELEGATION);

        _delegatesTo[forTokenId].add(toTokenId);
        _delegatesFor[toTokenId].add(forTokenId);
        emit PermissionsDelegated(forTokenId, toTokenId, _msgSender());
    }

    function renounceDelegatePermissions(uint256 forTokenId, uint256 toTokenId)
      public
      existentNode(forTokenId)
      existentNode(toTokenId)
      onlyRole(forTokenId, ADMIN_ROLE)
    {
        _delegatesTo[forTokenId].remove(toTokenId);
        _delegatesFor[toTokenId].remove(forTokenId);
        emit DelegatePermissionsRenounced(forTokenId, toTokenId, _msgSender());
    }

    /* Supports Public Nodes */

    event PermissionsBypassSet(
      uint256 tokenId,
      bool bypassed,
      address sender
    );

    mapping(uint256 => bool) private _shouldBypassPermissions;

    function setPermissionsBypass(uint256 tokenId, bool shouldBypassPermissions)
      public
    {
        // The onlyRole modifier bypasses permissions, so we use the underlying method
        require(hasRole(tokenId, ADMIN_ROLE, _msgSender()), ERR_INSUFFICIENT_PERMISSIONS);
        _shouldBypassPermissions[tokenId] = shouldBypassPermissions;
        emit PermissionsBypassSet(tokenId, shouldBypassPermissions, _msgSender());
    }

    function hasPermissionsBypass(uint256 tokenId)
      public
      view
      returns (bool)
    {
        return _shouldBypassPermissions[tokenId];
    }
}
