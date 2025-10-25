/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getAgentPreset = /* GraphQL */ `query GetAgentPreset($id: ID!) {
  getAgentPreset(id: $id) {
    configs
    createdAt
    createdBy
    description
    id
    isDefault
    isPublic
    name
    owner
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetAgentPresetQueryVariables,
  APITypes.GetAgentPresetQuery
>;
export const getConversation = /* GraphQL */ `query GetConversation($id: ID!) {
  getConversation(id: $id) {
    agentPresetId
    createdAt
    id
    messages {
      nextToken
      __typename
    }
    owner
    title
    updatedAt
    user {
      createdAt
      email
      id
      name
      owner
      preferences
      updatedAt
      __typename
    }
    userId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetConversationQueryVariables,
  APITypes.GetConversationQuery
>;
export const getMessage = /* GraphQL */ `query GetMessage($id: ID!) {
  getMessage(id: $id) {
    agentResponses
    content
    conversation {
      agentPresetId
      createdAt
      id
      owner
      title
      updatedAt
      userId
      __typename
    }
    conversationId
    createdAt
    id
    judgeResponse
    owner
    role
    traceId
    traceSteps {
      nextToken
      __typename
    }
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetMessageQueryVariables,
  APITypes.GetMessageQuery
>;
export const getTraceStep = /* GraphQL */ `query GetTraceStep($id: ID!) {
  getTraceStep(id: $id) {
    action
    agentId
    citations
    createdAt
    duration
    errorCount
    id
    message {
      agentResponses
      content
      conversationId
      createdAt
      id
      judgeResponse
      owner
      role
      traceId
      updatedAt
      __typename
    }
    messageId
    owner
    stepNumber
    timestamp
    toolsUsed
    traceId
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetTraceStepQueryVariables,
  APITypes.GetTraceStepQuery
>;
export const getUser = /* GraphQL */ `query GetUser($id: ID!) {
  getUser(id: $id) {
    conversations {
      nextToken
      __typename
    }
    createdAt
    email
    id
    name
    owner
    preferences
    updatedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.GetUserQueryVariables, APITypes.GetUserQuery>;
export const listAgentPresets = /* GraphQL */ `query ListAgentPresets(
  $filter: ModelAgentPresetFilterInput
  $id: ID
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listAgentPresets(
    filter: $filter
    id: $id
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
      configs
      createdAt
      createdBy
      description
      id
      isDefault
      isPublic
      name
      owner
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListAgentPresetsQueryVariables,
  APITypes.ListAgentPresetsQuery
>;
export const listConversations = /* GraphQL */ `query ListConversations(
  $filter: ModelConversationFilterInput
  $id: ID
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listConversations(
    filter: $filter
    id: $id
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
      agentPresetId
      createdAt
      id
      owner
      title
      updatedAt
      userId
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListConversationsQueryVariables,
  APITypes.ListConversationsQuery
>;
export const listMessages = /* GraphQL */ `query ListMessages(
  $filter: ModelMessageFilterInput
  $id: ID
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listMessages(
    filter: $filter
    id: $id
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
      agentResponses
      content
      conversationId
      createdAt
      id
      judgeResponse
      owner
      role
      traceId
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListMessagesQueryVariables,
  APITypes.ListMessagesQuery
>;
export const listTraceSteps = /* GraphQL */ `query ListTraceSteps(
  $filter: ModelTraceStepFilterInput
  $id: ID
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listTraceSteps(
    filter: $filter
    id: $id
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
      action
      agentId
      citations
      createdAt
      duration
      errorCount
      id
      messageId
      owner
      stepNumber
      timestamp
      toolsUsed
      traceId
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListTraceStepsQueryVariables,
  APITypes.ListTraceStepsQuery
>;
export const listUsers = /* GraphQL */ `query ListUsers(
  $filter: ModelUserFilterInput
  $id: ID
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listUsers(
    filter: $filter
    id: $id
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
      createdAt
      email
      id
      name
      owner
      preferences
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListUsersQueryVariables, APITypes.ListUsersQuery>;
