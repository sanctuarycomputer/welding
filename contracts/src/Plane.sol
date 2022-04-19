// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./Graph.sol";
import "./Document.sol";
import "./Topic.sol";

contract Plane is Context {
  using EnumerableSet for EnumerableSet.UintSet;

  Graph public GraphModel;
  Topic public TopicModel;
  Document public DocumentModel;

  mapping(uint256 => EnumerableSet.UintSet) private graphTopics;
  mapping(uint256 => EnumerableSet.UintSet) private topicGraphs;

  mapping(uint256 => EnumerableSet.UintSet) private documentTopics;
  mapping(uint256 => EnumerableSet.UintSet) private topicDocuments;

  constructor(
    address _graphsAddress,
    address _topicsAddress,
    address _documentsAddress
  ) {
    GraphModel = Graph(_graphsAddress);
    TopicModel = Topic(_topicsAddress);
    DocumentModel = Document(_documentsAddress);
  }

  // Documents <> Topics
  function addDocumentTopic(uint256 documentId, uint256 topicId)
    public
  {
    require(DocumentModel.exists(documentId), "document_nonexistent");
    require(TopicModel.exists(topicId), "topic_nonexistent");
    require(DocumentModel.canEdit(documentId, _msgSender()), "insufficient_permissions");
    documentTopics[documentId].add(topicId);
    topicDocuments[topicId].add(documentId);
  }

  function removeDocumentTopic(uint256 documentId, uint256 topicId)
    public
  {
    require(DocumentModel.canEdit(documentId, _msgSender()), "insufficient_permissions");
    documentTopics[documentId].remove(topicId);
    topicDocuments[topicId].remove(documentId);
  }

  function getTopicForDocument(uint256 documentId, uint256 topicIndex)
    public
    view
    returns (uint256)
  {
    return documentTopics[documentId].at(topicIndex);
  }

  function getTopicCountForDocument(uint256 documentId)
    public
    view
    returns (uint256)
  {
    return documentTopics[documentId].length();
  }

  function getDocumentForTopic(uint256 topicId, uint256 documentIndex)
    public
    view
    returns (uint256)
  {
    return topicDocuments[topicId].at(documentIndex);
  }

  function getDocumentCountForTopic(uint256 topicId)
    public
    view
    returns (uint256)
  {
    return topicDocuments[topicId].length();
  }

  // Graphs <> Topics
  function addGraphTopic(uint256 graphId, uint256 topicId)
    public
  {
    require(GraphModel.exists(graphId), "graph_nonexistent");
    require(TopicModel.exists(topicId), "topic_nonexistent");
    require(GraphModel.canEdit(graphId, _msgSender()), "insufficient_permissions");
    graphTopics[graphId].add(topicId);
    topicGraphs[topicId].add(graphId);
  }

  function removeGraphTopic(uint256 graphId, uint256 topicId)
    public
  {
    require(GraphModel.canEdit(graphId, _msgSender()), "insufficient_permissions");
    graphTopics[graphId].remove(topicId);
    topicGraphs[topicId].remove(graphId);
  }

  function getTopicForGraph(uint256 graphId, uint256 topicIndex)
    public
    view
    returns (uint256)
  {
    return graphTopics[graphId].at(topicIndex);
  }

  function getTopicCountForGraph(uint256 graphId)
    public
    view
    returns (uint256)
  {
    return graphTopics[graphId].length();
  }

  function getGraphForTopic(uint256 topicId, uint256 graphIndex)
    public
    view
    returns (uint256)
  {
    return topicGraphs[topicId].at(graphIndex);
  }

  function getGraphCountForTopic(uint256 topicId)
    public
    view
    returns (uint256)
  {
    return topicGraphs[topicId].length();
  }
}
