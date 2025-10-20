# Requirements Document

## Introduction

大天使システム (Archangel System) は、AWS Bedrock Agent CoreとMulti-Agent Collaborationの学習を目的とした高度な判断システムです。エヴァンゲリオンのマギシステムにインスパイアされ、従来の3つの独立したMAGIエージェントによる多数決システムを、AgentCoreのMulti-Agent Collaboration機能で進化させます。SOLOMON（大賢者）がSupervisor Agentとして3賢者（CASPAR、BALTHASAR、MELCHIOR）を統括し、評価スコアを考慮した統合判断を行います。学習を最優先とし、包括的なドキュメント整備を通じて再学習可能な知識を蓄積します。

## Requirements

### Requirement 1

**User Story:** As a developer, I want to implement AWS Bedrock Agent Core integration, so that I can learn how to build AI-powered decision systems.

#### Acceptance Criteria

1. WHEN the system initializes THEN it SHALL establish connection to AWS Bedrock Agent Core
2. WHEN agent requests are made THEN the system SHALL properly format and send requests to Bedrock
3. WHEN Bedrock responses are received THEN the system SHALL parse and process the results
4. WHEN integration fails THEN the system SHALL log detailed error information for learning purposes
5. WHEN agent interactions occur THEN the system SHALL document the request-response patterns

### Requirement 2

**User Story:** As a developer, I want to implement Strands Agents with Multi-Agent Collaboration using the Archangel System architecture, so that I can understand advanced agent coordination patterns.

#### Acceptance Criteria

1. WHEN the system initializes THEN it SHALL establish SOLOMON as Supervisor Agent using Strands Agents framework and 3 MAGI agents (CASPAR, BALTHASAR, MELCHIOR) as Collaborator Agents
2. WHEN agents collaborate THEN SOLOMON SHALL coordinate interactions between the 3 specialized MAGI agents through Strands Agents communication protocols
3. WHEN evaluation occurs THEN the system SHALL use Strands Agents to generate 4-axis scores (feasibility, risk, innovation, ethics) from each MAGI agent
4. WHEN conflicts arise THEN SOLOMON SHALL use Strands Agents conflict resolution mechanisms to analyze disagreements and provide integrated judgment
5. WHEN decisions are made THEN the system SHALL document the complete Strands Agents multi-agent collaboration workflow with evaluation scores

### Requirement 3

**User Story:** As a developer, I want comprehensive documentation throughout the system, so that I can understand and learn from every aspect of the implementation.

#### Acceptance Criteria

1. WHEN code is written THEN it SHALL include detailed inline comments explaining the logic
2. WHEN APIs are created THEN they SHALL have complete OpenAPI documentation
3. WHEN system architecture is designed THEN it SHALL be documented with diagrams and explanations
4. WHEN configurations are made THEN they SHALL include documentation explaining each setting
5. WHEN processes are implemented THEN they SHALL have step-by-step documentation

### Requirement 4

**User Story:** As a developer, I want detailed logging and monitoring, so that I can observe and learn from system behavior.

#### Acceptance Criteria

1. WHEN any system operation occurs THEN it SHALL be logged with appropriate detail level
2. WHEN errors happen THEN they SHALL be logged with full context and stack traces
3. WHEN performance metrics are collected THEN they SHALL be stored for analysis
4. WHEN system states change THEN the transitions SHALL be documented and logged
5. WHEN debugging is needed THEN logs SHALL provide sufficient information for troubleshooting

### Requirement 5

**User Story:** As a developer, I want a learning-focused web interface, so that I can observe and interact with the AI agent system.

#### Acceptance Criteria

1. WHEN accessing the interface THEN it SHALL display current agent status and activity
2. WHEN interactions occur THEN the interface SHALL show real-time agent communication
3. WHEN decisions are made THEN the interface SHALL visualize the decision-making process
4. WHEN system logs are viewed THEN the interface SHALL provide searchable and filterable log display
5. WHEN learning materials are accessed THEN the interface SHALL provide integrated documentation

### Requirement 6

**User Story:** As a user, I want to visualize thought expansion processes dynamically, so that I can observe how AI agents develop and explore ideas in real-time.

#### Acceptance Criteria

1. WHEN thought expansion begins THEN the system SHALL display the initial concept as an animated central node using D3.js or similar
2. WHEN ideas are generated THEN the system SHALL show new nodes appearing with smooth animations and branching from existing concepts
3. WHEN connections are made THEN the system SHALL visualize relationships with animated, color-coded links that pulse during creation
4. WHEN expansion depth increases THEN the system SHALL dynamically reorganize nodes with smooth transitions and zoom capabilities
5. WHEN thought processes evolve THEN the system SHALL provide real-time updates via GraphQL subscriptions with interactive exploration

### Requirement 7

**User Story:** As a user, I want to observe the Three Wise Men discussion system with dynamic visualization, so that I can see how multiple AI perspectives collaborate in real-time.

#### Acceptance Criteria

1. WHEN a discussion topic is presented THEN the system SHALL display three distinct AI personas with animated avatars and speech bubbles
2. WHEN each wise man contributes THEN the system SHALL show their arguments appearing in real-time with typing animations and visual differentiation
3. WHEN debates occur THEN the system SHALL animate the flow of arguments with connecting lines and highlight conflicting points
4. WHEN consensus building happens THEN the system SHALL visualize agreement levels with dynamic progress bars and color changes
5. WHEN discussions conclude THEN the system SHALL provide an animated summary with decision tree visualization and final consensus display

### Requirement 8

**User Story:** As a developer, I want to integrate AWS Amplify, Bedrock AgentCore, and Strands Agents, so that I can learn the complete modern AI agent ecosystem.

#### Acceptance Criteria

1. WHEN frontend development begins THEN the system SHALL use AWS Amplify with React 18, TypeScript, Tailwind CSS, and Framer Motion
2. WHEN authentication is needed THEN the system SHALL use Amplify Auth with pre-built UI components for login, signup, and password reset
3. WHEN API integration occurs THEN the system SHALL use Amplify API with GraphQL for backend communication
4. WHEN data storage is needed THEN the system SHALL use Amplify DataStore for conversation history and user preferences
5. WHEN AI agents are implemented THEN the system SHALL use AWS Bedrock AgentCore as the runtime foundation for agent execution
6. WHEN multi-agent coordination is needed THEN the system SHALL use Strands Agents framework for agent communication and collaboration
7. WHEN visualization is needed THEN the system SHALL use Recharts for radar charts and evaluation score displays
8. WHEN deployment is needed THEN the system SHALL use Amplify Hosting for continuous deployment and hosting

### Requirement 9

**User Story:** As a user, I want a streamlined set of screens with integrated functionality, so that I can interact with all multi-agent collaboration features efficiently.

#### Acceptance Criteria

1. WHEN accessing the system THEN it SHALL provide an Amplify-generated Login screen for user authentication
2. WHEN authenticated THEN it SHALL provide a Dashboard screen (/dashboard) showing system status and active agents
3. WHEN submitting questions THEN it SHALL provide a Question Input screen (/question) for judgment mode requests with integrated evaluation results display
4. WHEN viewing past interactions THEN it SHALL provide a History screen (/history) showing previous questions and evaluation results
5. WHEN configuring agents THEN the Question Input screen SHALL provide an agent settings overlay/modal for SOLOMON and MAGI configuration
6. WHEN testing components THEN it SHALL provide a Test screen (/test/archangel) for component verification and development
7. WHEN monitoring system THEN it SHALL provide a Logs screen (/logs) for system behavior observation

### Requirement 10

**User Story:** As a developer, I want specialized Archangel System components including overlay/modal functionality, so that I can build the multi-agent collaboration interface efficiently.

#### Acceptance Criteria

1. WHEN displaying evaluation results THEN the system SHALL provide ArchangelEvaluation component for integrated assessment display
2. WHEN showing agent scores THEN the system SHALL provide MagiScoresRadarChart component using Recharts for 4-axis visualization (feasibility, risk, innovation, ethics)
3. WHEN analyzing conflicts THEN the system SHALL provide ConflictAnalysis component for disagreement visualization and resolution process
4. WHEN showing final judgment THEN the system SHALL provide IntegratedJudgment component for SOLOMON's decision display
5. WHEN displaying conversation history THEN the system SHALL provide HistoryList and HistoryItem components for past interactions display
6. WHEN configuring agents THEN the system SHALL provide AgentSettingsModal component for overlay-based SOLOMON and MAGI configuration
7. WHEN building common UI THEN the system SHALL provide NavigationBar, LoadingSpinner, ErrorBoundary, AgentStatusCard, QuestionForm, and Modal components
8. WHEN displaying agent personas THEN the system SHALL provide WiseManAvatar components for CASPAR, BALTHASAR, and MELCHIOR visualization

### Requirement 11

**User Story:** As a user, I want to configure agent behavior and parameters including individual roles and models, so that I can customize the multi-agent collaboration system for different use cases.

#### Acceptance Criteria

1. WHEN configuring SOLOMON THEN the system SHALL allow adjustment of integration strategy (weighted average, consensus threshold, conflict resolution method) and individual model selection (Claude 3.5 Sonnet, GPT-4, etc.)
2. WHEN configuring MAGI agents THEN the system SHALL allow individual role customization (custom system prompts, personality traits, expertise domains) and model selection per agent
3. WHEN setting agent roles THEN the system SHALL allow modification of CASPAR (default: conservative analyst), BALTHASAR (default: innovative strategist), MELCHIOR (default: balanced mediator) with custom role definitions
4. WHEN selecting models THEN the system SHALL provide dropdown selection for each agent: Claude 3.5 Sonnet, Claude 3 Haiku, GPT-4 Turbo, GPT-4o, with individual temperature and max token settings
5. WHEN setting evaluation criteria THEN the system SHALL allow customization of 4-axis importance weights (feasibility, risk, innovation, ethics priority)
6. WHEN setting Strands Agents behavior THEN the system SHALL allow communication timeout, retry attempts, and collaboration depth settings
7. WHEN saving configurations THEN the system SHALL store individual agent roles, models, and parameters in Amplify DataStore for persistence across sessions

### Requirement 12

**User Story:** As a developer, I want to focus on judgment mode functionality, so that I can master the core AgentCore Multi-Agent Collaboration features before expanding to other modes.

#### Acceptance Criteria

1. WHEN the system is implemented THEN it SHALL prioritize judgment mode functionality with single-question evaluation
2. WHEN evaluation requests are made THEN the system SHALL process them through SOLOMON and 3 MAGI agents for structured decision-making
3. WHEN core functionality is complete THEN the system SHALL provide a foundation for future conversation mode expansion
4. WHEN conversation mode is considered THEN it SHALL be documented as a future enhancement outside current scope
5. WHEN system architecture is designed THEN it SHALL accommodate future conversation mode integration without major refactoring

### Requirement 13

**User Story:** As a developer, I want example scenarios and test cases, so that I can experiment with different AI agent configurations and learn from various use cases.

#### Acceptance Criteria

1. WHEN the system starts THEN it SHALL include pre-configured example scenarios for judgment mode
2. WHEN test cases are run THEN they SHALL demonstrate different agent capabilities in evaluation contexts
3. WHEN scenarios are executed THEN they SHALL produce documented results for learning
4. WHEN new scenarios are created THEN the system SHALL provide templates and guidance for judgment scenarios
5. WHEN experiments are conducted THEN the system SHALL save results for comparison and analysis