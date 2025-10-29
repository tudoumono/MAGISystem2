/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createAgentPreset = /* GraphQL */ `mutation CreateAgentPreset(
  $condition: ModelAgentPresetConditionInput
  $input: CreateAgentPresetInput!
) {
  createAgentPreset(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateAgentPresetMutationVariables,
  APITypes.CreateAgentPresetMutation
>;
export const createConversation = /* GraphQL */ `mutation CreateConversation(
  $condition: ModelConversationConditionInput
  $input: CreateConversationInput!
) {
  createConversation(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateConversationMutationVariables,
  APITypes.CreateConversationMutation
>;
export const createMessage = /* GraphQL */ `mutation CreateMessage(
  $condition: ModelMessageConditionInput
  $input: CreateMessageInput!
) {
  createMessage(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateMessageMutationVariables,
  APITypes.CreateMessageMutation
>;
export const createTraceStep = /* GraphQL */ `mutation CreateTraceStep(
  $condition: ModelTraceStepConditionInput
  $input: CreateTraceStepInput!
) {
  createTraceStep(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateTraceStepMutationVariables,
  APITypes.CreateTraceStepMutation
>;
export const createUser = /* GraphQL */ `mutation CreateUser(
  $condition: ModelUserConditionInput
  $input: CreateUserInput!
) {
  createUser(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateUserMutationVariables,
  APITypes.CreateUserMutation
>;
export const deleteAgentPreset = /* GraphQL */ `mutation DeleteAgentPreset(
  $condition: ModelAgentPresetConditionInput
  $input: DeleteAgentPresetInput!
) {
  deleteAgentPreset(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteAgentPresetMutationVariables,
  APITypes.DeleteAgentPresetMutation
>;
export const deleteConversation = /* GraphQL */ `mutation DeleteConversation(
  $condition: ModelConversationConditionInput
  $input: DeleteConversationInput!
) {
  deleteConversation(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteConversationMutationVariables,
  APITypes.DeleteConversationMutation
>;
export const deleteMessage = /* GraphQL */ `mutation DeleteMessage(
  $condition: ModelMessageConditionInput
  $input: DeleteMessageInput!
) {
  deleteMessage(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteMessageMutationVariables,
  APITypes.DeleteMessageMutation
>;
export const deleteTraceStep = /* GraphQL */ `mutation DeleteTraceStep(
  $condition: ModelTraceStepConditionInput
  $input: DeleteTraceStepInput!
) {
  deleteTraceStep(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteTraceStepMutationVariables,
  APITypes.DeleteTraceStepMutation
>;
export const deleteUser = /* GraphQL */ `mutation DeleteUser(
  $condition: ModelUserConditionInput
  $input: DeleteUserInput!
) {
  deleteUser(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteUserMutationVariables,
  APITypes.DeleteUserMutation
>;
export const updateAgentPreset = /* GraphQL */ `mutation UpdateAgentPreset(
  $condition: ModelAgentPresetConditionInput
  $input: UpdateAgentPresetInput!
) {
  updateAgentPreset(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateAgentPresetMutationVariables,
  APITypes.UpdateAgentPresetMutation
>;
export const updateConversation = /* GraphQL */ `mutation UpdateConversation(
  $condition: ModelConversationConditionInput
  $input: UpdateConversationInput!
) {
  updateConversation(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateConversationMutationVariables,
  APITypes.UpdateConversationMutation
>;
export const updateMessage = /* GraphQL */ `mutation UpdateMessage(
  $condition: ModelMessageConditionInput
  $input: UpdateMessageInput!
) {
  updateMessage(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateMessageMutationVariables,
  APITypes.UpdateMessageMutation
>;
export const updateTraceStep = /* GraphQL */ `mutation UpdateTraceStep(
  $condition: ModelTraceStepConditionInput
  $input: UpdateTraceStepInput!
) {
  updateTraceStep(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateTraceStepMutationVariables,
  APITypes.UpdateTraceStepMutation
>;
export const updateUser = /* GraphQL */ `mutation UpdateUser(
  $condition: ModelUserConditionInput
  $input: UpdateUserInput!
) {
  updateUser(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateUserMutationVariables,
  APITypes.UpdateUserMutation
>;
