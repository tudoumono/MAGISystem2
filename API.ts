/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type AgentPreset = {
  __typename: "AgentPreset",
  configs: string,
  createdAt: string,
  createdBy?: string | null,
  description?: string | null,
  id: string,
  isDefault?: boolean | null,
  isPublic?: boolean | null,
  name: string,
  owner?: string | null,
  updatedAt: string,
};

export type Conversation = {
  __typename: "Conversation",
  agentPresetId?: string | null,
  createdAt: string,
  id: string,
  messages?: ModelMessageConnection | null,
  owner?: string | null,
  title: string,
  updatedAt: string,
  user?: User | null,
  userId: string,
};

export type ModelMessageConnection = {
  __typename: "ModelMessageConnection",
  items:  Array<Message | null >,
  nextToken?: string | null,
};

export type Message = {
  __typename: "Message",
  agentResponses?: string | null,
  content: string,
  conversation?: Conversation | null,
  conversationId: string,
  createdAt: string,
  id: string,
  judgeResponse?: string | null,
  owner?: string | null,
  role?: MessageRole | null,
  traceId?: string | null,
  traceSteps?: ModelTraceStepConnection | null,
  updatedAt: string,
};

export enum MessageRole {
  assistant = "assistant",
  user = "user",
}


export type ModelTraceStepConnection = {
  __typename: "ModelTraceStepConnection",
  items:  Array<TraceStep | null >,
  nextToken?: string | null,
};

export type TraceStep = {
  __typename: "TraceStep",
  action: string,
  agentId: string,
  citations?: Array< string | null > | null,
  createdAt: string,
  duration: number,
  errorCount?: number | null,
  id: string,
  message?: Message | null,
  messageId: string,
  owner?: string | null,
  stepNumber: number,
  timestamp: string,
  toolsUsed?: Array< string | null > | null,
  traceId: string,
  updatedAt: string,
};

export type User = {
  __typename: "User",
  conversations?: ModelConversationConnection | null,
  createdAt: string,
  email: string,
  id: string,
  name?: string | null,
  owner?: string | null,
  preferences?: string | null,
  updatedAt: string,
};

export type ModelConversationConnection = {
  __typename: "ModelConversationConnection",
  items:  Array<Conversation | null >,
  nextToken?: string | null,
};

export type ModelAgentPresetFilterInput = {
  and?: Array< ModelAgentPresetFilterInput | null > | null,
  configs?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  createdBy?: ModelStringInput | null,
  description?: ModelStringInput | null,
  id?: ModelIDInput | null,
  isDefault?: ModelBooleanInput | null,
  isPublic?: ModelBooleanInput | null,
  name?: ModelStringInput | null,
  not?: ModelAgentPresetFilterInput | null,
  or?: Array< ModelAgentPresetFilterInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelStringInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  size?: ModelSizeInput | null,
};

export enum ModelAttributeTypes {
  _null = "_null",
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
}


export type ModelSizeInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
};

export type ModelIDInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  size?: ModelSizeInput | null,
};

export type ModelBooleanInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  eq?: boolean | null,
  ne?: boolean | null,
};

export enum ModelSortDirection {
  ASC = "ASC",
  DESC = "DESC",
}


export type ModelAgentPresetConnection = {
  __typename: "ModelAgentPresetConnection",
  items:  Array<AgentPreset | null >,
  nextToken?: string | null,
};

export type ModelConversationFilterInput = {
  agentPresetId?: ModelStringInput | null,
  and?: Array< ModelConversationFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelConversationFilterInput | null,
  or?: Array< ModelConversationFilterInput | null > | null,
  owner?: ModelStringInput | null,
  title?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelIDInput | null,
};

export type ModelMessageFilterInput = {
  agentResponses?: ModelStringInput | null,
  and?: Array< ModelMessageFilterInput | null > | null,
  content?: ModelStringInput | null,
  conversationId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  judgeResponse?: ModelStringInput | null,
  not?: ModelMessageFilterInput | null,
  or?: Array< ModelMessageFilterInput | null > | null,
  owner?: ModelStringInput | null,
  role?: ModelMessageRoleInput | null,
  traceId?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelMessageRoleInput = {
  eq?: MessageRole | null,
  ne?: MessageRole | null,
};

export type ModelTraceStepFilterInput = {
  action?: ModelStringInput | null,
  agentId?: ModelStringInput | null,
  and?: Array< ModelTraceStepFilterInput | null > | null,
  citations?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  duration?: ModelIntInput | null,
  errorCount?: ModelIntInput | null,
  id?: ModelIDInput | null,
  messageId?: ModelIDInput | null,
  not?: ModelTraceStepFilterInput | null,
  or?: Array< ModelTraceStepFilterInput | null > | null,
  owner?: ModelStringInput | null,
  stepNumber?: ModelIntInput | null,
  timestamp?: ModelStringInput | null,
  toolsUsed?: ModelStringInput | null,
  traceId?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelIntInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
};

export type ModelUserFilterInput = {
  and?: Array< ModelUserFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  email?: ModelStringInput | null,
  id?: ModelIDInput | null,
  name?: ModelStringInput | null,
  not?: ModelUserFilterInput | null,
  or?: Array< ModelUserFilterInput | null > | null,
  owner?: ModelStringInput | null,
  preferences?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelUserConnection = {
  __typename: "ModelUserConnection",
  items:  Array<User | null >,
  nextToken?: string | null,
};

export type ModelAgentPresetConditionInput = {
  and?: Array< ModelAgentPresetConditionInput | null > | null,
  configs?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  createdBy?: ModelStringInput | null,
  description?: ModelStringInput | null,
  isDefault?: ModelBooleanInput | null,
  isPublic?: ModelBooleanInput | null,
  name?: ModelStringInput | null,
  not?: ModelAgentPresetConditionInput | null,
  or?: Array< ModelAgentPresetConditionInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateAgentPresetInput = {
  configs: string,
  createdAt?: string | null,
  createdBy?: string | null,
  description?: string | null,
  id?: string | null,
  isDefault?: boolean | null,
  isPublic?: boolean | null,
  name: string,
  updatedAt?: string | null,
};

export type ModelConversationConditionInput = {
  agentPresetId?: ModelStringInput | null,
  and?: Array< ModelConversationConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  not?: ModelConversationConditionInput | null,
  or?: Array< ModelConversationConditionInput | null > | null,
  owner?: ModelStringInput | null,
  title?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelIDInput | null,
};

export type CreateConversationInput = {
  agentPresetId?: string | null,
  createdAt?: string | null,
  id?: string | null,
  title: string,
  updatedAt?: string | null,
  userId: string,
};

export type ModelMessageConditionInput = {
  agentResponses?: ModelStringInput | null,
  and?: Array< ModelMessageConditionInput | null > | null,
  content?: ModelStringInput | null,
  conversationId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  judgeResponse?: ModelStringInput | null,
  not?: ModelMessageConditionInput | null,
  or?: Array< ModelMessageConditionInput | null > | null,
  owner?: ModelStringInput | null,
  role?: ModelMessageRoleInput | null,
  traceId?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateMessageInput = {
  agentResponses?: string | null,
  content: string,
  conversationId: string,
  createdAt?: string | null,
  id?: string | null,
  judgeResponse?: string | null,
  role?: MessageRole | null,
  traceId?: string | null,
};

export type ModelTraceStepConditionInput = {
  action?: ModelStringInput | null,
  agentId?: ModelStringInput | null,
  and?: Array< ModelTraceStepConditionInput | null > | null,
  citations?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  duration?: ModelIntInput | null,
  errorCount?: ModelIntInput | null,
  messageId?: ModelIDInput | null,
  not?: ModelTraceStepConditionInput | null,
  or?: Array< ModelTraceStepConditionInput | null > | null,
  owner?: ModelStringInput | null,
  stepNumber?: ModelIntInput | null,
  timestamp?: ModelStringInput | null,
  toolsUsed?: ModelStringInput | null,
  traceId?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateTraceStepInput = {
  action: string,
  agentId: string,
  citations?: Array< string | null > | null,
  duration: number,
  errorCount?: number | null,
  id?: string | null,
  messageId: string,
  stepNumber: number,
  timestamp: string,
  toolsUsed?: Array< string | null > | null,
  traceId: string,
};

export type ModelUserConditionInput = {
  and?: Array< ModelUserConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  email?: ModelStringInput | null,
  name?: ModelStringInput | null,
  not?: ModelUserConditionInput | null,
  or?: Array< ModelUserConditionInput | null > | null,
  owner?: ModelStringInput | null,
  preferences?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateUserInput = {
  email: string,
  id?: string | null,
  name?: string | null,
  preferences?: string | null,
};

export type DeleteAgentPresetInput = {
  id: string,
};

export type DeleteConversationInput = {
  id: string,
};

export type DeleteMessageInput = {
  id: string,
};

export type DeleteTraceStepInput = {
  id: string,
};

export type DeleteUserInput = {
  id: string,
};

export type UpdateAgentPresetInput = {
  configs?: string | null,
  createdAt?: string | null,
  createdBy?: string | null,
  description?: string | null,
  id: string,
  isDefault?: boolean | null,
  isPublic?: boolean | null,
  name?: string | null,
  updatedAt?: string | null,
};

export type UpdateConversationInput = {
  agentPresetId?: string | null,
  createdAt?: string | null,
  id: string,
  title?: string | null,
  updatedAt?: string | null,
  userId?: string | null,
};

export type UpdateMessageInput = {
  agentResponses?: string | null,
  content?: string | null,
  conversationId?: string | null,
  createdAt?: string | null,
  id: string,
  judgeResponse?: string | null,
  role?: MessageRole | null,
  traceId?: string | null,
};

export type UpdateTraceStepInput = {
  action?: string | null,
  agentId?: string | null,
  citations?: Array< string | null > | null,
  duration?: number | null,
  errorCount?: number | null,
  id: string,
  messageId?: string | null,
  stepNumber?: number | null,
  timestamp?: string | null,
  toolsUsed?: Array< string | null > | null,
  traceId?: string | null,
};

export type UpdateUserInput = {
  email?: string | null,
  id: string,
  name?: string | null,
  preferences?: string | null,
};

export type ModelSubscriptionAgentPresetFilterInput = {
  and?: Array< ModelSubscriptionAgentPresetFilterInput | null > | null,
  configs?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  createdBy?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  isDefault?: ModelSubscriptionBooleanInput | null,
  isPublic?: ModelSubscriptionBooleanInput | null,
  name?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionAgentPresetFilterInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionStringInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  in?: Array< string | null > | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionIDInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  in?: Array< string | null > | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionBooleanInput = {
  eq?: boolean | null,
  ne?: boolean | null,
};

export type ModelSubscriptionConversationFilterInput = {
  agentPresetId?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionConversationFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionConversationFilterInput | null > | null,
  owner?: ModelStringInput | null,
  title?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  userId?: ModelSubscriptionIDInput | null,
};

export type ModelSubscriptionMessageFilterInput = {
  agentResponses?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionMessageFilterInput | null > | null,
  content?: ModelSubscriptionStringInput | null,
  conversationId?: ModelSubscriptionIDInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  judgeResponse?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionMessageFilterInput | null > | null,
  owner?: ModelStringInput | null,
  role?: ModelSubscriptionStringInput | null,
  traceId?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionTraceStepFilterInput = {
  action?: ModelSubscriptionStringInput | null,
  agentId?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionTraceStepFilterInput | null > | null,
  citations?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  duration?: ModelSubscriptionIntInput | null,
  errorCount?: ModelSubscriptionIntInput | null,
  id?: ModelSubscriptionIDInput | null,
  messageId?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionTraceStepFilterInput | null > | null,
  owner?: ModelStringInput | null,
  stepNumber?: ModelSubscriptionIntInput | null,
  timestamp?: ModelSubscriptionStringInput | null,
  toolsUsed?: ModelSubscriptionStringInput | null,
  traceId?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionIntInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  in?: Array< number | null > | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionUserFilterInput = {
  and?: Array< ModelSubscriptionUserFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  email?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  name?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionUserFilterInput | null > | null,
  owner?: ModelStringInput | null,
  preferences?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type GetAgentPresetQueryVariables = {
  id: string,
};

export type GetAgentPresetQuery = {
  getAgentPreset?:  {
    __typename: "AgentPreset",
    configs: string,
    createdAt: string,
    createdBy?: string | null,
    description?: string | null,
    id: string,
    isDefault?: boolean | null,
    isPublic?: boolean | null,
    name: string,
    owner?: string | null,
    updatedAt: string,
  } | null,
};

export type GetConversationQueryVariables = {
  id: string,
};

export type GetConversationQuery = {
  getConversation?:  {
    __typename: "Conversation",
    agentPresetId?: string | null,
    createdAt: string,
    id: string,
    messages?:  {
      __typename: "ModelMessageConnection",
      nextToken?: string | null,
    } | null,
    owner?: string | null,
    title: string,
    updatedAt: string,
    user?:  {
      __typename: "User",
      createdAt: string,
      email: string,
      id: string,
      name?: string | null,
      owner?: string | null,
      preferences?: string | null,
      updatedAt: string,
    } | null,
    userId: string,
  } | null,
};

export type GetMessageQueryVariables = {
  id: string,
};

export type GetMessageQuery = {
  getMessage?:  {
    __typename: "Message",
    agentResponses?: string | null,
    content: string,
    conversation?:  {
      __typename: "Conversation",
      agentPresetId?: string | null,
      createdAt: string,
      id: string,
      owner?: string | null,
      title: string,
      updatedAt: string,
      userId: string,
    } | null,
    conversationId: string,
    createdAt: string,
    id: string,
    judgeResponse?: string | null,
    owner?: string | null,
    role?: MessageRole | null,
    traceId?: string | null,
    traceSteps?:  {
      __typename: "ModelTraceStepConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
  } | null,
};

export type GetTraceStepQueryVariables = {
  id: string,
};

export type GetTraceStepQuery = {
  getTraceStep?:  {
    __typename: "TraceStep",
    action: string,
    agentId: string,
    citations?: Array< string | null > | null,
    createdAt: string,
    duration: number,
    errorCount?: number | null,
    id: string,
    message?:  {
      __typename: "Message",
      agentResponses?: string | null,
      content: string,
      conversationId: string,
      createdAt: string,
      id: string,
      judgeResponse?: string | null,
      owner?: string | null,
      role?: MessageRole | null,
      traceId?: string | null,
      updatedAt: string,
    } | null,
    messageId: string,
    owner?: string | null,
    stepNumber: number,
    timestamp: string,
    toolsUsed?: Array< string | null > | null,
    traceId: string,
    updatedAt: string,
  } | null,
};

export type GetUserQueryVariables = {
  id: string,
};

export type GetUserQuery = {
  getUser?:  {
    __typename: "User",
    conversations?:  {
      __typename: "ModelConversationConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    email: string,
    id: string,
    name?: string | null,
    owner?: string | null,
    preferences?: string | null,
    updatedAt: string,
  } | null,
};

export type ListAgentPresetsQueryVariables = {
  filter?: ModelAgentPresetFilterInput | null,
  id?: string | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
};

export type ListAgentPresetsQuery = {
  listAgentPresets?:  {
    __typename: "ModelAgentPresetConnection",
    items:  Array< {
      __typename: "AgentPreset",
      configs: string,
      createdAt: string,
      createdBy?: string | null,
      description?: string | null,
      id: string,
      isDefault?: boolean | null,
      isPublic?: boolean | null,
      name: string,
      owner?: string | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListConversationsQueryVariables = {
  filter?: ModelConversationFilterInput | null,
  id?: string | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
};

export type ListConversationsQuery = {
  listConversations?:  {
    __typename: "ModelConversationConnection",
    items:  Array< {
      __typename: "Conversation",
      agentPresetId?: string | null,
      createdAt: string,
      id: string,
      owner?: string | null,
      title: string,
      updatedAt: string,
      userId: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListMessagesQueryVariables = {
  filter?: ModelMessageFilterInput | null,
  id?: string | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
};

export type ListMessagesQuery = {
  listMessages?:  {
    __typename: "ModelMessageConnection",
    items:  Array< {
      __typename: "Message",
      agentResponses?: string | null,
      content: string,
      conversationId: string,
      createdAt: string,
      id: string,
      judgeResponse?: string | null,
      owner?: string | null,
      role?: MessageRole | null,
      traceId?: string | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListTraceStepsQueryVariables = {
  filter?: ModelTraceStepFilterInput | null,
  id?: string | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
};

export type ListTraceStepsQuery = {
  listTraceSteps?:  {
    __typename: "ModelTraceStepConnection",
    items:  Array< {
      __typename: "TraceStep",
      action: string,
      agentId: string,
      citations?: Array< string | null > | null,
      createdAt: string,
      duration: number,
      errorCount?: number | null,
      id: string,
      messageId: string,
      owner?: string | null,
      stepNumber: number,
      timestamp: string,
      toolsUsed?: Array< string | null > | null,
      traceId: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListUsersQueryVariables = {
  filter?: ModelUserFilterInput | null,
  id?: string | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
};

export type ListUsersQuery = {
  listUsers?:  {
    __typename: "ModelUserConnection",
    items:  Array< {
      __typename: "User",
      createdAt: string,
      email: string,
      id: string,
      name?: string | null,
      owner?: string | null,
      preferences?: string | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type CreateAgentPresetMutationVariables = {
  condition?: ModelAgentPresetConditionInput | null,
  input: CreateAgentPresetInput,
};

export type CreateAgentPresetMutation = {
  createAgentPreset?:  {
    __typename: "AgentPreset",
    configs: string,
    createdAt: string,
    createdBy?: string | null,
    description?: string | null,
    id: string,
    isDefault?: boolean | null,
    isPublic?: boolean | null,
    name: string,
    owner?: string | null,
    updatedAt: string,
  } | null,
};

export type CreateConversationMutationVariables = {
  condition?: ModelConversationConditionInput | null,
  input: CreateConversationInput,
};

export type CreateConversationMutation = {
  createConversation?:  {
    __typename: "Conversation",
    agentPresetId?: string | null,
    createdAt: string,
    id: string,
    messages?:  {
      __typename: "ModelMessageConnection",
      nextToken?: string | null,
    } | null,
    owner?: string | null,
    title: string,
    updatedAt: string,
    user?:  {
      __typename: "User",
      createdAt: string,
      email: string,
      id: string,
      name?: string | null,
      owner?: string | null,
      preferences?: string | null,
      updatedAt: string,
    } | null,
    userId: string,
  } | null,
};

export type CreateMessageMutationVariables = {
  condition?: ModelMessageConditionInput | null,
  input: CreateMessageInput,
};

export type CreateMessageMutation = {
  createMessage?:  {
    __typename: "Message",
    agentResponses?: string | null,
    content: string,
    conversation?:  {
      __typename: "Conversation",
      agentPresetId?: string | null,
      createdAt: string,
      id: string,
      owner?: string | null,
      title: string,
      updatedAt: string,
      userId: string,
    } | null,
    conversationId: string,
    createdAt: string,
    id: string,
    judgeResponse?: string | null,
    owner?: string | null,
    role?: MessageRole | null,
    traceId?: string | null,
    traceSteps?:  {
      __typename: "ModelTraceStepConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
  } | null,
};

export type CreateTraceStepMutationVariables = {
  condition?: ModelTraceStepConditionInput | null,
  input: CreateTraceStepInput,
};

export type CreateTraceStepMutation = {
  createTraceStep?:  {
    __typename: "TraceStep",
    action: string,
    agentId: string,
    citations?: Array< string | null > | null,
    createdAt: string,
    duration: number,
    errorCount?: number | null,
    id: string,
    message?:  {
      __typename: "Message",
      agentResponses?: string | null,
      content: string,
      conversationId: string,
      createdAt: string,
      id: string,
      judgeResponse?: string | null,
      owner?: string | null,
      role?: MessageRole | null,
      traceId?: string | null,
      updatedAt: string,
    } | null,
    messageId: string,
    owner?: string | null,
    stepNumber: number,
    timestamp: string,
    toolsUsed?: Array< string | null > | null,
    traceId: string,
    updatedAt: string,
  } | null,
};

export type CreateUserMutationVariables = {
  condition?: ModelUserConditionInput | null,
  input: CreateUserInput,
};

export type CreateUserMutation = {
  createUser?:  {
    __typename: "User",
    conversations?:  {
      __typename: "ModelConversationConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    email: string,
    id: string,
    name?: string | null,
    owner?: string | null,
    preferences?: string | null,
    updatedAt: string,
  } | null,
};

export type DeleteAgentPresetMutationVariables = {
  condition?: ModelAgentPresetConditionInput | null,
  input: DeleteAgentPresetInput,
};

export type DeleteAgentPresetMutation = {
  deleteAgentPreset?:  {
    __typename: "AgentPreset",
    configs: string,
    createdAt: string,
    createdBy?: string | null,
    description?: string | null,
    id: string,
    isDefault?: boolean | null,
    isPublic?: boolean | null,
    name: string,
    owner?: string | null,
    updatedAt: string,
  } | null,
};

export type DeleteConversationMutationVariables = {
  condition?: ModelConversationConditionInput | null,
  input: DeleteConversationInput,
};

export type DeleteConversationMutation = {
  deleteConversation?:  {
    __typename: "Conversation",
    agentPresetId?: string | null,
    createdAt: string,
    id: string,
    messages?:  {
      __typename: "ModelMessageConnection",
      nextToken?: string | null,
    } | null,
    owner?: string | null,
    title: string,
    updatedAt: string,
    user?:  {
      __typename: "User",
      createdAt: string,
      email: string,
      id: string,
      name?: string | null,
      owner?: string | null,
      preferences?: string | null,
      updatedAt: string,
    } | null,
    userId: string,
  } | null,
};

export type DeleteMessageMutationVariables = {
  condition?: ModelMessageConditionInput | null,
  input: DeleteMessageInput,
};

export type DeleteMessageMutation = {
  deleteMessage?:  {
    __typename: "Message",
    agentResponses?: string | null,
    content: string,
    conversation?:  {
      __typename: "Conversation",
      agentPresetId?: string | null,
      createdAt: string,
      id: string,
      owner?: string | null,
      title: string,
      updatedAt: string,
      userId: string,
    } | null,
    conversationId: string,
    createdAt: string,
    id: string,
    judgeResponse?: string | null,
    owner?: string | null,
    role?: MessageRole | null,
    traceId?: string | null,
    traceSteps?:  {
      __typename: "ModelTraceStepConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
  } | null,
};

export type DeleteTraceStepMutationVariables = {
  condition?: ModelTraceStepConditionInput | null,
  input: DeleteTraceStepInput,
};

export type DeleteTraceStepMutation = {
  deleteTraceStep?:  {
    __typename: "TraceStep",
    action: string,
    agentId: string,
    citations?: Array< string | null > | null,
    createdAt: string,
    duration: number,
    errorCount?: number | null,
    id: string,
    message?:  {
      __typename: "Message",
      agentResponses?: string | null,
      content: string,
      conversationId: string,
      createdAt: string,
      id: string,
      judgeResponse?: string | null,
      owner?: string | null,
      role?: MessageRole | null,
      traceId?: string | null,
      updatedAt: string,
    } | null,
    messageId: string,
    owner?: string | null,
    stepNumber: number,
    timestamp: string,
    toolsUsed?: Array< string | null > | null,
    traceId: string,
    updatedAt: string,
  } | null,
};

export type DeleteUserMutationVariables = {
  condition?: ModelUserConditionInput | null,
  input: DeleteUserInput,
};

export type DeleteUserMutation = {
  deleteUser?:  {
    __typename: "User",
    conversations?:  {
      __typename: "ModelConversationConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    email: string,
    id: string,
    name?: string | null,
    owner?: string | null,
    preferences?: string | null,
    updatedAt: string,
  } | null,
};

export type UpdateAgentPresetMutationVariables = {
  condition?: ModelAgentPresetConditionInput | null,
  input: UpdateAgentPresetInput,
};

export type UpdateAgentPresetMutation = {
  updateAgentPreset?:  {
    __typename: "AgentPreset",
    configs: string,
    createdAt: string,
    createdBy?: string | null,
    description?: string | null,
    id: string,
    isDefault?: boolean | null,
    isPublic?: boolean | null,
    name: string,
    owner?: string | null,
    updatedAt: string,
  } | null,
};

export type UpdateConversationMutationVariables = {
  condition?: ModelConversationConditionInput | null,
  input: UpdateConversationInput,
};

export type UpdateConversationMutation = {
  updateConversation?:  {
    __typename: "Conversation",
    agentPresetId?: string | null,
    createdAt: string,
    id: string,
    messages?:  {
      __typename: "ModelMessageConnection",
      nextToken?: string | null,
    } | null,
    owner?: string | null,
    title: string,
    updatedAt: string,
    user?:  {
      __typename: "User",
      createdAt: string,
      email: string,
      id: string,
      name?: string | null,
      owner?: string | null,
      preferences?: string | null,
      updatedAt: string,
    } | null,
    userId: string,
  } | null,
};

export type UpdateMessageMutationVariables = {
  condition?: ModelMessageConditionInput | null,
  input: UpdateMessageInput,
};

export type UpdateMessageMutation = {
  updateMessage?:  {
    __typename: "Message",
    agentResponses?: string | null,
    content: string,
    conversation?:  {
      __typename: "Conversation",
      agentPresetId?: string | null,
      createdAt: string,
      id: string,
      owner?: string | null,
      title: string,
      updatedAt: string,
      userId: string,
    } | null,
    conversationId: string,
    createdAt: string,
    id: string,
    judgeResponse?: string | null,
    owner?: string | null,
    role?: MessageRole | null,
    traceId?: string | null,
    traceSteps?:  {
      __typename: "ModelTraceStepConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
  } | null,
};

export type UpdateTraceStepMutationVariables = {
  condition?: ModelTraceStepConditionInput | null,
  input: UpdateTraceStepInput,
};

export type UpdateTraceStepMutation = {
  updateTraceStep?:  {
    __typename: "TraceStep",
    action: string,
    agentId: string,
    citations?: Array< string | null > | null,
    createdAt: string,
    duration: number,
    errorCount?: number | null,
    id: string,
    message?:  {
      __typename: "Message",
      agentResponses?: string | null,
      content: string,
      conversationId: string,
      createdAt: string,
      id: string,
      judgeResponse?: string | null,
      owner?: string | null,
      role?: MessageRole | null,
      traceId?: string | null,
      updatedAt: string,
    } | null,
    messageId: string,
    owner?: string | null,
    stepNumber: number,
    timestamp: string,
    toolsUsed?: Array< string | null > | null,
    traceId: string,
    updatedAt: string,
  } | null,
};

export type UpdateUserMutationVariables = {
  condition?: ModelUserConditionInput | null,
  input: UpdateUserInput,
};

export type UpdateUserMutation = {
  updateUser?:  {
    __typename: "User",
    conversations?:  {
      __typename: "ModelConversationConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    email: string,
    id: string,
    name?: string | null,
    owner?: string | null,
    preferences?: string | null,
    updatedAt: string,
  } | null,
};

export type OnCreateAgentPresetSubscriptionVariables = {
  filter?: ModelSubscriptionAgentPresetFilterInput | null,
  owner?: string | null,
};

export type OnCreateAgentPresetSubscription = {
  onCreateAgentPreset?:  {
    __typename: "AgentPreset",
    configs: string,
    createdAt: string,
    createdBy?: string | null,
    description?: string | null,
    id: string,
    isDefault?: boolean | null,
    isPublic?: boolean | null,
    name: string,
    owner?: string | null,
    updatedAt: string,
  } | null,
};

export type OnCreateConversationSubscriptionVariables = {
  filter?: ModelSubscriptionConversationFilterInput | null,
  owner?: string | null,
};

export type OnCreateConversationSubscription = {
  onCreateConversation?:  {
    __typename: "Conversation",
    agentPresetId?: string | null,
    createdAt: string,
    id: string,
    messages?:  {
      __typename: "ModelMessageConnection",
      nextToken?: string | null,
    } | null,
    owner?: string | null,
    title: string,
    updatedAt: string,
    user?:  {
      __typename: "User",
      createdAt: string,
      email: string,
      id: string,
      name?: string | null,
      owner?: string | null,
      preferences?: string | null,
      updatedAt: string,
    } | null,
    userId: string,
  } | null,
};

export type OnCreateMessageSubscriptionVariables = {
  filter?: ModelSubscriptionMessageFilterInput | null,
  owner?: string | null,
};

export type OnCreateMessageSubscription = {
  onCreateMessage?:  {
    __typename: "Message",
    agentResponses?: string | null,
    content: string,
    conversation?:  {
      __typename: "Conversation",
      agentPresetId?: string | null,
      createdAt: string,
      id: string,
      owner?: string | null,
      title: string,
      updatedAt: string,
      userId: string,
    } | null,
    conversationId: string,
    createdAt: string,
    id: string,
    judgeResponse?: string | null,
    owner?: string | null,
    role?: MessageRole | null,
    traceId?: string | null,
    traceSteps?:  {
      __typename: "ModelTraceStepConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
  } | null,
};

export type OnCreateTraceStepSubscriptionVariables = {
  filter?: ModelSubscriptionTraceStepFilterInput | null,
  owner?: string | null,
};

export type OnCreateTraceStepSubscription = {
  onCreateTraceStep?:  {
    __typename: "TraceStep",
    action: string,
    agentId: string,
    citations?: Array< string | null > | null,
    createdAt: string,
    duration: number,
    errorCount?: number | null,
    id: string,
    message?:  {
      __typename: "Message",
      agentResponses?: string | null,
      content: string,
      conversationId: string,
      createdAt: string,
      id: string,
      judgeResponse?: string | null,
      owner?: string | null,
      role?: MessageRole | null,
      traceId?: string | null,
      updatedAt: string,
    } | null,
    messageId: string,
    owner?: string | null,
    stepNumber: number,
    timestamp: string,
    toolsUsed?: Array< string | null > | null,
    traceId: string,
    updatedAt: string,
  } | null,
};

export type OnCreateUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
  owner?: string | null,
};

export type OnCreateUserSubscription = {
  onCreateUser?:  {
    __typename: "User",
    conversations?:  {
      __typename: "ModelConversationConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    email: string,
    id: string,
    name?: string | null,
    owner?: string | null,
    preferences?: string | null,
    updatedAt: string,
  } | null,
};

export type OnDeleteAgentPresetSubscriptionVariables = {
  filter?: ModelSubscriptionAgentPresetFilterInput | null,
  owner?: string | null,
};

export type OnDeleteAgentPresetSubscription = {
  onDeleteAgentPreset?:  {
    __typename: "AgentPreset",
    configs: string,
    createdAt: string,
    createdBy?: string | null,
    description?: string | null,
    id: string,
    isDefault?: boolean | null,
    isPublic?: boolean | null,
    name: string,
    owner?: string | null,
    updatedAt: string,
  } | null,
};

export type OnDeleteConversationSubscriptionVariables = {
  filter?: ModelSubscriptionConversationFilterInput | null,
  owner?: string | null,
};

export type OnDeleteConversationSubscription = {
  onDeleteConversation?:  {
    __typename: "Conversation",
    agentPresetId?: string | null,
    createdAt: string,
    id: string,
    messages?:  {
      __typename: "ModelMessageConnection",
      nextToken?: string | null,
    } | null,
    owner?: string | null,
    title: string,
    updatedAt: string,
    user?:  {
      __typename: "User",
      createdAt: string,
      email: string,
      id: string,
      name?: string | null,
      owner?: string | null,
      preferences?: string | null,
      updatedAt: string,
    } | null,
    userId: string,
  } | null,
};

export type OnDeleteMessageSubscriptionVariables = {
  filter?: ModelSubscriptionMessageFilterInput | null,
  owner?: string | null,
};

export type OnDeleteMessageSubscription = {
  onDeleteMessage?:  {
    __typename: "Message",
    agentResponses?: string | null,
    content: string,
    conversation?:  {
      __typename: "Conversation",
      agentPresetId?: string | null,
      createdAt: string,
      id: string,
      owner?: string | null,
      title: string,
      updatedAt: string,
      userId: string,
    } | null,
    conversationId: string,
    createdAt: string,
    id: string,
    judgeResponse?: string | null,
    owner?: string | null,
    role?: MessageRole | null,
    traceId?: string | null,
    traceSteps?:  {
      __typename: "ModelTraceStepConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
  } | null,
};

export type OnDeleteTraceStepSubscriptionVariables = {
  filter?: ModelSubscriptionTraceStepFilterInput | null,
  owner?: string | null,
};

export type OnDeleteTraceStepSubscription = {
  onDeleteTraceStep?:  {
    __typename: "TraceStep",
    action: string,
    agentId: string,
    citations?: Array< string | null > | null,
    createdAt: string,
    duration: number,
    errorCount?: number | null,
    id: string,
    message?:  {
      __typename: "Message",
      agentResponses?: string | null,
      content: string,
      conversationId: string,
      createdAt: string,
      id: string,
      judgeResponse?: string | null,
      owner?: string | null,
      role?: MessageRole | null,
      traceId?: string | null,
      updatedAt: string,
    } | null,
    messageId: string,
    owner?: string | null,
    stepNumber: number,
    timestamp: string,
    toolsUsed?: Array< string | null > | null,
    traceId: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
  owner?: string | null,
};

export type OnDeleteUserSubscription = {
  onDeleteUser?:  {
    __typename: "User",
    conversations?:  {
      __typename: "ModelConversationConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    email: string,
    id: string,
    name?: string | null,
    owner?: string | null,
    preferences?: string | null,
    updatedAt: string,
  } | null,
};

export type OnUpdateAgentPresetSubscriptionVariables = {
  filter?: ModelSubscriptionAgentPresetFilterInput | null,
  owner?: string | null,
};

export type OnUpdateAgentPresetSubscription = {
  onUpdateAgentPreset?:  {
    __typename: "AgentPreset",
    configs: string,
    createdAt: string,
    createdBy?: string | null,
    description?: string | null,
    id: string,
    isDefault?: boolean | null,
    isPublic?: boolean | null,
    name: string,
    owner?: string | null,
    updatedAt: string,
  } | null,
};

export type OnUpdateConversationSubscriptionVariables = {
  filter?: ModelSubscriptionConversationFilterInput | null,
  owner?: string | null,
};

export type OnUpdateConversationSubscription = {
  onUpdateConversation?:  {
    __typename: "Conversation",
    agentPresetId?: string | null,
    createdAt: string,
    id: string,
    messages?:  {
      __typename: "ModelMessageConnection",
      nextToken?: string | null,
    } | null,
    owner?: string | null,
    title: string,
    updatedAt: string,
    user?:  {
      __typename: "User",
      createdAt: string,
      email: string,
      id: string,
      name?: string | null,
      owner?: string | null,
      preferences?: string | null,
      updatedAt: string,
    } | null,
    userId: string,
  } | null,
};

export type OnUpdateMessageSubscriptionVariables = {
  filter?: ModelSubscriptionMessageFilterInput | null,
  owner?: string | null,
};

export type OnUpdateMessageSubscription = {
  onUpdateMessage?:  {
    __typename: "Message",
    agentResponses?: string | null,
    content: string,
    conversation?:  {
      __typename: "Conversation",
      agentPresetId?: string | null,
      createdAt: string,
      id: string,
      owner?: string | null,
      title: string,
      updatedAt: string,
      userId: string,
    } | null,
    conversationId: string,
    createdAt: string,
    id: string,
    judgeResponse?: string | null,
    owner?: string | null,
    role?: MessageRole | null,
    traceId?: string | null,
    traceSteps?:  {
      __typename: "ModelTraceStepConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
  } | null,
};

export type OnUpdateTraceStepSubscriptionVariables = {
  filter?: ModelSubscriptionTraceStepFilterInput | null,
  owner?: string | null,
};

export type OnUpdateTraceStepSubscription = {
  onUpdateTraceStep?:  {
    __typename: "TraceStep",
    action: string,
    agentId: string,
    citations?: Array< string | null > | null,
    createdAt: string,
    duration: number,
    errorCount?: number | null,
    id: string,
    message?:  {
      __typename: "Message",
      agentResponses?: string | null,
      content: string,
      conversationId: string,
      createdAt: string,
      id: string,
      judgeResponse?: string | null,
      owner?: string | null,
      role?: MessageRole | null,
      traceId?: string | null,
      updatedAt: string,
    } | null,
    messageId: string,
    owner?: string | null,
    stepNumber: number,
    timestamp: string,
    toolsUsed?: Array< string | null > | null,
    traceId: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
  owner?: string | null,
};

export type OnUpdateUserSubscription = {
  onUpdateUser?:  {
    __typename: "User",
    conversations?:  {
      __typename: "ModelConversationConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    email: string,
    id: string,
    name?: string | null,
    owner?: string | null,
    preferences?: string | null,
    updatedAt: string,
  } | null,
};
