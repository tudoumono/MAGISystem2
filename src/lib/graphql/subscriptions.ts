/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateAgentPreset = /* GraphQL */ `subscription OnCreateAgentPreset(
  $filter: ModelSubscriptionAgentPresetFilterInput
  $owner: String
) {
  onCreateAgentPreset(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateAgentPresetSubscriptionVariables,
  APITypes.OnCreateAgentPresetSubscription
>;
export const onCreateConversation = /* GraphQL */ `subscription OnCreateConversation(
  $filter: ModelSubscriptionConversationFilterInput
  $owner: String
) {
  onCreateConversation(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateConversationSubscriptionVariables,
  APITypes.OnCreateConversationSubscription
>;
export const onCreateMessage = /* GraphQL */ `subscription OnCreateMessage(
  $filter: ModelSubscriptionMessageFilterInput
  $owner: String
) {
  onCreateMessage(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateMessageSubscriptionVariables,
  APITypes.OnCreateMessageSubscription
>;
export const onCreateTraceStep = /* GraphQL */ `subscription OnCreateTraceStep(
  $filter: ModelSubscriptionTraceStepFilterInput
  $owner: String
) {
  onCreateTraceStep(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateTraceStepSubscriptionVariables,
  APITypes.OnCreateTraceStepSubscription
>;
export const onCreateUser = /* GraphQL */ `subscription OnCreateUser(
  $filter: ModelSubscriptionUserFilterInput
  $owner: String
) {
  onCreateUser(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateUserSubscriptionVariables,
  APITypes.OnCreateUserSubscription
>;
export const onDeleteAgentPreset = /* GraphQL */ `subscription OnDeleteAgentPreset(
  $filter: ModelSubscriptionAgentPresetFilterInput
  $owner: String
) {
  onDeleteAgentPreset(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteAgentPresetSubscriptionVariables,
  APITypes.OnDeleteAgentPresetSubscription
>;
export const onDeleteConversation = /* GraphQL */ `subscription OnDeleteConversation(
  $filter: ModelSubscriptionConversationFilterInput
  $owner: String
) {
  onDeleteConversation(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteConversationSubscriptionVariables,
  APITypes.OnDeleteConversationSubscription
>;
export const onDeleteMessage = /* GraphQL */ `subscription OnDeleteMessage(
  $filter: ModelSubscriptionMessageFilterInput
  $owner: String
) {
  onDeleteMessage(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteMessageSubscriptionVariables,
  APITypes.OnDeleteMessageSubscription
>;
export const onDeleteTraceStep = /* GraphQL */ `subscription OnDeleteTraceStep(
  $filter: ModelSubscriptionTraceStepFilterInput
  $owner: String
) {
  onDeleteTraceStep(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteTraceStepSubscriptionVariables,
  APITypes.OnDeleteTraceStepSubscription
>;
export const onDeleteUser = /* GraphQL */ `subscription OnDeleteUser(
  $filter: ModelSubscriptionUserFilterInput
  $owner: String
) {
  onDeleteUser(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteUserSubscriptionVariables,
  APITypes.OnDeleteUserSubscription
>;
export const onUpdateAgentPreset = /* GraphQL */ `subscription OnUpdateAgentPreset(
  $filter: ModelSubscriptionAgentPresetFilterInput
  $owner: String
) {
  onUpdateAgentPreset(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateAgentPresetSubscriptionVariables,
  APITypes.OnUpdateAgentPresetSubscription
>;
export const onUpdateConversation = /* GraphQL */ `subscription OnUpdateConversation(
  $filter: ModelSubscriptionConversationFilterInput
  $owner: String
) {
  onUpdateConversation(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateConversationSubscriptionVariables,
  APITypes.OnUpdateConversationSubscription
>;
export const onUpdateMessage = /* GraphQL */ `subscription OnUpdateMessage(
  $filter: ModelSubscriptionMessageFilterInput
  $owner: String
) {
  onUpdateMessage(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateMessageSubscriptionVariables,
  APITypes.OnUpdateMessageSubscription
>;
export const onUpdateTraceStep = /* GraphQL */ `subscription OnUpdateTraceStep(
  $filter: ModelSubscriptionTraceStepFilterInput
  $owner: String
) {
  onUpdateTraceStep(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateTraceStepSubscriptionVariables,
  APITypes.OnUpdateTraceStepSubscription
>;
export const onUpdateUser = /* GraphQL */ `subscription OnUpdateUser(
  $filter: ModelSubscriptionUserFilterInput
  $owner: String
) {
  onUpdateUser(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateUserSubscriptionVariables,
  APITypes.OnUpdateUserSubscription
>;
