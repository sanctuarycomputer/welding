// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./Base.sol";

contract Node is Base {
    using EnumerableSet for EnumerableSet.UintSet;

    constructor() ERC721("Node", "NODE") {}

    mapping(uint256 => string) private nodeLabels;
    mapping(string => EnumerableSet.UintSet) private nodesForLabel;
    mapping(uint256 => mapping(string => EnumerableSet.UintSet)) private connections;
    mapping(uint256 => mapping(string => EnumerableSet.UintSet)) private backlinkedConnections;

    // Todo: Establish connections
    function mintNode(
      string memory label,
      string memory hash,
      uint256[] memory fromConnections,
      uint256[] memory toConnections
    ) public {
        uint256 tokenId = mint(hash);
        nodesForLabel[label].add(tokenId);
        nodeLabels[tokenId] = label;
    }

    function labelFor(uint256 tokenId) public view returns (string memory) {
        require(exists(tokenId), "node_nonexistent");
        return nodeLabels[tokenId];
    }

    function getNodeCountForLabel(string memory label) public view returns (uint256) {
        return nodesForLabel[label].length();
    }

    function getNodeForLabelAtIndex(string memory label, uint256 index) public view returns (uint256) {
        return nodesForLabel[label].at(index);
    }

    function connectNodes(uint256 from, uint256 to) public onlyEditors(to) {
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

    function disconnectNodes(uint256 from, uint256 to) public {
        string memory fromLabel = labelFor(from);
        string memory toLabel = labelFor(to);
        connections[from][toLabel].remove(to);
        backlinkedConnections[to][fromLabel].remove(from);
    }

    // TODO
    //function burnNode(uint256) {
    //}
}
