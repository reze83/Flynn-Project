# Flynn Agents Reference

This document describes all 27 Flynn agents, organized by category.

## Quick Reference

| Category | Agents | Count |
|----------|--------|-------|
| [Core Agents](#core-agents) | coder, diagnostic, scaffolder, installer, refactor, release, healer, data, security, reviewer, performance | 11 |
| [Architecture Agents](#architecture-agents) | system-architect, database-architect, frontend-architect, api-designer | 4 |
| [Operations Agents](#operations-agents) | devops-engineer, terraform-expert, kubernetes-operator, incident-responder | 4 |
| [Specialized Agents](#specialized-agents) | migration-specialist, test-architect, documentation-architect, ml-engineer, data-engineer, mobile-developer, blockchain-developer | 7 |
| [Integration Agents](#integration-agents) | orchestrator | 1 |

## Model Recommendations

Flynn uses hybrid model orchestration for cost-efficiency:

| Model | Use Case | Agents |
|-------|----------|--------|
| **opus** | Complex architecture decisions | system-architect, migration-specialist |
| **sonnet** | Analysis and reasoning | diagnostic, refactor, security, reviewer, performance, database-architect, frontend-architect, api-designer, terraform-expert, kubernetes-operator, incident-responder, test-architect, documentation-architect, ml-engineer, data-engineer, mobile-developer, blockchain-developer, healer, data |
| **haiku** | Fast execution tasks | coder, scaffolder, installer, release, devops-engineer |

## Documentation Requirement

Optimization agents are required to fetch official documentation before making suggestions:

| Agent | Documentation Requirement |
|-------|--------------------------|
| **refactor** | Must cite official docs for refactoring patterns |
| **performance** | Must reference official performance guides |
| **reviewer** | Must reference coding standards documentation |
| **security** | Must cite official security advisories |
| **coder** | Must reference API docs when suggesting implementations |

These agents use `mcp__context7__get-library-docs` or `mcp__exa__get_code_context_exa` to fetch current documentation.

---

## Core Agents

### coder

**Purpose:** Writes and implements code

| Property | Value |
|----------|-------|
| Model | haiku |
| Triggers | implement, write, code, feature, add, build, develop, function, class, component, api |

**Capabilities:**
- Write code
- Implement features
- Create functions
- Build components

**Workflow:**
1. Understand the requirement
2. Analyze existing code structure
3. Implement the solution
4. Add tests if appropriate
5. Verify implementation works

**Use Cases:**
- Implementing new features from specifications
- Writing utility functions
- Creating React/Vue components
- Building API endpoints

---

### diagnostic

**Purpose:** Debugs and diagnoses issues

| Property | Value |
|----------|-------|
| Model | sonnet |
| Triggers | debug, error, fix, issue, problem, diagnose, broken, fail, crash, bug, troubleshoot, why |

**Capabilities:**
- Analyze errors
- Debug code
- Identify root causes
- Suggest fixes

**Workflow:**
1. Gather error context and logs
2. Analyze the error pattern
3. Identify root cause
4. Propose solution
5. Verify fix works

**Use Cases:**
- Debugging runtime errors
- Analyzing stack traces
- Fixing failing tests
- Troubleshooting configuration issues

---

### scaffolder

**Purpose:** Creates new projects and generates boilerplate

| Property | Value |
|----------|-------|
| Model | haiku |
| Triggers | create, generate, scaffold, new, boilerplate, init, initialize, start, template, project |

**Capabilities:**
- Generate project structure
- Create boilerplate
- Initialize configurations
- Setup templates

**Workflow:**
1. Understand project requirements
2. Select appropriate template
3. Create directory structure
4. Generate configuration files
5. Initialize git repository
6. Install dependencies

**Use Cases:**
- Creating new TypeScript libraries
- Scaffolding Next.js applications
- Setting up Python packages with uv
- Initializing monorepos

---

### installer

**Purpose:** Handles installation and environment setup

| Property | Value |
|----------|-------|
| Model | haiku |
| Triggers | install, setup, dependency, dependencies, package, npm, pnpm, yarn, pip, cargo, node_modules |

**Capabilities:**
- Install packages
- Resolve dependencies
- Configure package managers
- Setup environment

**Workflow:**
1. Check current environment
2. Identify what needs installation
3. Install missing dependencies
4. Configure installed tools
5. Validate installation

**Use Cases:**
- Installing Node.js dependencies
- Setting up Python virtual environments
- Configuring development tools
- Managing system dependencies

---

### refactor

**Purpose:** Improves and refactors existing code

| Property | Value |
|----------|-------|
| Model | sonnet |
| Triggers | refactor, improve, clean, optimize, restructure, reorganize, simplify, modernize, upgrade |

**Capabilities:**
- Refactor code
- Improve performance
- Clean up codebase
- Optimize algorithms

**Workflow:**
1. Analyze current code structure
2. Identify improvement opportunities
3. Plan refactoring steps
4. Apply changes incrementally
5. Verify behavior unchanged

**Use Cases:**
- Extracting common code into functions
- Simplifying complex conditionals
- Removing code duplication
- Modernizing legacy patterns

---

### release

**Purpose:** Handles releases and version management

| Property | Value |
|----------|-------|
| Model | haiku |
| Triggers | release, publish, version, deploy, tag, changelog, bump, ship, production |

**Capabilities:**
- Manage versions
- Create releases
- Generate changelogs
- Prepare deployments

**Workflow:**
1. Analyze commits since last release
2. Determine version bump type
3. Update version files
4. Generate changelog
5. Create git tag
6. Publish if requested

**Use Cases:**
- Bumping semantic versions
- Generating changelogs from commits
- Creating GitHub releases
- Publishing to npm/PyPI

---

### healer

**Purpose:** Recovers from failures and errors

| Property | Value |
|----------|-------|
| Model | sonnet |
| Triggers | recover, heal, restore, undo, revert, rollback, backup, reset |

**Capabilities:**
- Recover from failures
- Restore states
- Revert changes
- Manage backups

**Workflow:**
1. Analyze the failure
2. Identify recovery strategy
3. Attempt recovery
4. Verify success
5. Escalate if failed

**Constraints:**
- Maximum 3 retry attempts
- No recursive healing
- Always explains what went wrong

**Use Cases:**
- Recovering from failed deployments
- Restoring corrupted configurations
- Reverting breaking changes
- Handling transient failures

---

### data

**Purpose:** Handles data analysis and processing with Python tools

| Property | Value |
|----------|-------|
| Model | sonnet |
| Triggers | data, dataset, analyze, ml, machine learning, ai, statistics, csv, json, parse, transform, pandas, numpy, sentiment, correlation |

**Capabilities:**
- Analyze data
- Process datasets
- Transform formats
- Statistical analysis
- Sentiment analysis
- Text summarization
- ML inference

**Tools:**
- `flynn-data_load_csv` - Load CSV and get basic stats
- `flynn-data_describe` - Statistical description
- `flynn-data_filter` - Filter by conditions
- `flynn-data_aggregate` - Group by and aggregate
- `flynn-ml_sentiment` - Sentiment analysis
- `flynn-ml_summarize` - Text summarization

**Use Cases:**
- Analyzing CSV datasets
- Computing statistics
- Running sentiment analysis
- Generating data insights

---

### security

**Purpose:** Analyzes code for security vulnerabilities

| Property | Value |
|----------|-------|
| Model | sonnet |
| Triggers | security, vulnerability, secure, audit, cve, owasp, injection, xss, authentication, authorization, penetration, pentest |

**Capabilities:**
- Identify vulnerabilities
- Scan dependencies
- Review security configs
- Suggest remediations

**OWASP Top 10 Coverage:**
1. Injection (SQL, Command, XSS)
2. Broken Authentication
3. Sensitive Data Exposure
4. XML External Entities (XXE)
5. Broken Access Control
6. Security Misconfiguration
7. Cross-Site Scripting (XSS)
8. Insecure Deserialization
9. Components with Known Vulnerabilities
10. Insufficient Logging & Monitoring

**Use Cases:**
- Security audits
- Dependency vulnerability scanning
- Code pattern analysis
- Penetration testing prep

---

### reviewer

**Purpose:** Reviews code for quality and best practices

| Property | Value |
|----------|-------|
| Model | sonnet |
| Triggers | review, pr, pull request, check, approve, feedback, lint, quality, standards, convention |

**Capabilities:**
- Review code changes
- Enforce standards
- Identify improvements
- Provide feedback

**Review Criteria:**
- **Correctness**: Does the code work as intended?
- **Readability**: Is the code easy to understand?
- **Maintainability**: Can this code be easily modified?
- **Performance**: Are there obvious inefficiencies?
- **Style**: Does it follow project conventions?

**Use Cases:**
- Pull request reviews
- Code quality checks
- Standards enforcement
- Constructive feedback

---

### performance

**Purpose:** Analyzes and optimizes performance

| Property | Value |
|----------|-------|
| Model | sonnet |
| Triggers | performance, slow, optimize, speed, fast, memory, leak, profile, benchmark, bottleneck, latency, throughput |

**Capabilities:**
- Profile performance
- Identify bottlenecks
- Optimize code
- Reduce memory usage

**Analysis Areas:**
- **CPU**: Algorithm complexity, hot paths
- **Memory**: Leaks, excessive allocations
- **I/O**: File, network, database access
- **Bundle Size**: Frontend asset optimization
- **Load Time**: Startup, lazy loading

**Use Cases:**
- Performance profiling
- Memory leak detection
- Algorithm optimization
- Bundle size reduction

---

## Architecture Agents

### system-architect

**Purpose:** Designs system architecture and makes technology decisions

| Property | Value |
|----------|-------|
| Model | opus |
| Triggers | architecture, design, system design, tech stack, infrastructure, scalability, microservices, monolith, ddd, domain driven |

**Capabilities:**
- Design systems
- Make tech decisions
- Create architecture diagrams
- Write ADRs

**Architectural Patterns:**
- Microservices vs Monolith
- Event-driven architecture
- CQRS/Event Sourcing
- Domain-Driven Design (DDD)
- Clean Architecture / Hexagonal

**Use Cases:**
- Designing new systems
- Technology stack selection
- Scalability planning
- Creating Architecture Decision Records (ADRs)

---

### database-architect

**Purpose:** Designs database schemas and optimizes queries

| Property | Value |
|----------|-------|
| Model | sonnet |
| Triggers | database, schema, query, sql, nosql, postgres, mysql, mongodb, index, migration, orm, prisma, drizzle |

**Capabilities:**
- Design schemas
- Optimize queries
- Plan migrations
- Index optimization

**Supported Databases:**
- PostgreSQL, MySQL (relational)
- MongoDB, DynamoDB (document)
- Redis (key-value/cache)
- Neo4j (graph)
- ClickHouse, TimescaleDB (time-series)

**Use Cases:**
- Schema design
- Query optimization
- Database migrations
- Index strategy

---

### frontend-architect

**Purpose:** Designs frontend architecture and component systems

| Property | Value |
|----------|-------|
| Model | sonnet |
| Triggers | frontend, ui, ux, component, react, vue, svelte, next.js, design system, state management, css, tailwind |

**Capabilities:**
- Design components
- Plan state management
- Optimize UX
- Create design systems

**Frameworks:**
- React, Next.js, Remix
- Vue, Nuxt
- Svelte, SvelteKit
- Solid.js
- Astro

**Use Cases:**
- Component architecture
- State management selection
- Design system creation
- Performance optimization

---

### api-designer

**Purpose:** Designs REST and GraphQL APIs

| Property | Value |
|----------|-------|
| Model | sonnet |
| Triggers | api, rest, graphql, endpoint, openapi, swagger, trpc, grpc, websocket, authentication, oauth |

**Capabilities:**
- Design REST APIs
- Create GraphQL schemas
- Write OpenAPI specs
- Plan authentication

**API Patterns:**
- REST (resource-oriented)
- GraphQL (query-oriented)
- gRPC (high-performance RPC)
- WebSocket (real-time)
- tRPC (type-safe RPC)

**Use Cases:**
- API design
- OpenAPI documentation
- Authentication flows
- API versioning

---

## Operations Agents

### devops-engineer

**Purpose:** Manages CI/CD pipelines and deployment infrastructure

| Property | Value |
|----------|-------|
| Model | haiku |
| Triggers | ci, cd, cicd, pipeline, deploy, github actions, gitlab, jenkins, docker, container, devops |

**Capabilities:**
- Create CI/CD pipelines
- Configure deployments
- Manage containers
- Set up monitoring

**Platforms:**
- GitHub Actions
- GitLab CI/CD
- CircleCI
- Jenkins
- ArgoCD

**Use Cases:**
- CI/CD pipeline creation
- Deployment automation
- Container configuration
- Monitoring setup

---

### terraform-expert

**Purpose:** Manages infrastructure as code with Terraform

| Property | Value |
|----------|-------|
| Model | sonnet |
| Triggers | terraform, iac, infrastructure, aws, gcp, azure, cloud, provision, ec2, s3, lambda, vpc |

**Capabilities:**
- Write Terraform configs
- Design cloud infrastructure
- Manage Terraform state
- Implement IaC patterns

**Cloud Providers:**
- AWS (EC2, RDS, S3, Lambda, EKS)
- GCP (GCE, Cloud SQL, GCS, Cloud Functions, GKE)
- Azure (VMs, SQL, Blob, Functions, AKS)
- DigitalOcean, Linode, Hetzner

**Use Cases:**
- Infrastructure provisioning
- Multi-cloud deployments
- State management
- Module creation

---

### kubernetes-operator

**Purpose:** Manages Kubernetes clusters and workloads

| Property | Value |
|----------|-------|
| Model | sonnet |
| Triggers | kubernetes, k8s, kubectl, helm, pod, deployment, service, ingress, namespace, argocd, gitops |

**Capabilities:**
- Deploy K8s workloads
- Create Helm charts
- Configure service mesh
- Manage cluster resources

**Tools:**
- kubectl, k9s (CLI)
- Helm (package management)
- ArgoCD, Flux (GitOps)
- Prometheus, Grafana (monitoring)
- Istio, Linkerd (service mesh)

**Use Cases:**
- Workload deployment
- Helm chart creation
- GitOps setup
- Service mesh configuration

---

### incident-responder

**Purpose:** Handles production incidents and outages

| Property | Value |
|----------|-------|
| Model | sonnet |
| Triggers | incident, outage, down, production issue, alert, pagerduty, on-call, sev1, emergency, post-mortem |

**Capabilities:**
- Triage incidents
- Coordinate response
- Perform RCA
- Write post-mortems

**Incident Levels:**
- **SEV1**: Complete outage, all users affected
- **SEV2**: Major degradation, many users affected
- **SEV3**: Minor issues, some users affected
- **SEV4**: Low impact, workarounds available

**Use Cases:**
- Incident triage
- Emergency response
- Root cause analysis
- Post-mortem documentation

---

## Specialized Agents

### migration-specialist

**Purpose:** Handles codebase migrations and framework upgrades

| Property | Value |
|----------|-------|
| Model | opus |
| Triggers | migrate, migration, upgrade, legacy, modernize, framework upgrade, version upgrade, breaking changes |

**Capabilities:**
- Plan migrations
- Upgrade frameworks
- Modernize legacy code
- Handle breaking changes

**Migration Types:**
- Framework upgrades (React 17→18, Vue 2→3)
- Language migrations (JS→TS, Python 2→3)
- Database migrations (MySQL→Postgres)
- Architecture shifts (monolith→microservices)
- Cloud migrations (on-prem→AWS)

**Use Cases:**
- Framework upgrades
- Legacy modernization
- Database migrations
- Cloud migrations

---

### test-architect

**Purpose:** Designs testing strategies and test infrastructure

| Property | Value |
|----------|-------|
| Model | sonnet |
| Triggers | test strategy, testing, coverage, e2e, end-to-end, cypress, playwright, jest, vitest, pytest, unit test, integration test |

**Capabilities:**
- Design test strategies
- Set up test infrastructure
- Define coverage goals
- Create test patterns

**Test Pyramid:**
- Unit Tests (70%) - Fast, isolated
- Integration Tests (20%) - Component interaction
- E2E Tests (10%) - User journeys

**Tools:**
- Unit: Jest, Vitest, pytest
- Integration: Supertest, TestContainers
- E2E: Playwright, Cypress, Selenium
- Performance: k6, Artillery, Locust

**Use Cases:**
- Test strategy design
- Coverage planning
- Test infrastructure setup
- E2E test creation

---

### documentation-architect

**Purpose:** Designs documentation systems and writes technical docs

| Property | Value |
|----------|-------|
| Model | sonnet |
| Triggers | documentation, docs, readme, api docs, jsdoc, typedoc, docusaurus, wiki, tutorial, guide |

**Capabilities:**
- Design doc structure
- Write technical docs
- Create API docs
- Set up doc tooling

**Documentation Types:**
- README files
- API documentation (OpenAPI, TypeDoc, JSDoc)
- Architecture docs (ADRs, C4 diagrams)
- User guides and tutorials
- Runbooks and playbooks

**Use Cases:**
- Documentation structure
- API documentation
- Tutorial creation
- Runbook writing

---

### ml-engineer

**Purpose:** Builds machine learning pipelines and models

| Property | Value |
|----------|-------|
| Model | sonnet |
| Triggers | machine learning, ml, model, training, pytorch, tensorflow, llm, fine-tune, inference, embeddings, rag, langchain |

**Capabilities:**
- Build ML pipelines
- Train models
- Deploy ML systems
- Monitor model performance

**Frameworks:**
- PyTorch, TensorFlow, JAX
- scikit-learn, XGBoost, LightGBM
- Hugging Face Transformers
- LangChain, LlamaIndex

**MLOps Tools:**
- MLflow, Weights & Biases (tracking)
- DVC (data versioning)
- BentoML, TorchServe (serving)
- Kubeflow, SageMaker (platforms)

**Use Cases:**
- ML pipeline creation
- Model training
- LLM application development
- Model deployment

---

### data-engineer

**Purpose:** Builds data pipelines and data infrastructure

| Property | Value |
|----------|-------|
| Model | sonnet |
| Triggers | data pipeline, etl, elt, data warehouse, spark, airflow, dagster, dbt, kafka, streaming, batch |

**Capabilities:**
- Build data pipelines
- Design data warehouses
- Implement data quality
- Optimize data processing

**Tools:**
- Apache Spark, Flink (processing)
- Airflow, Dagster, Prefect (orchestration)
- dbt (transformation)
- Snowflake, BigQuery, Redshift (warehouses)
- Kafka, Pulsar (streaming)

**Use Cases:**
- ETL/ELT pipeline creation
- Data warehouse design
- Stream processing
- Data quality implementation

---

### mobile-developer

**Purpose:** Develops mobile applications for iOS and Android

| Property | Value |
|----------|-------|
| Model | sonnet |
| Triggers | mobile, ios, android, react native, flutter, expo, swift, kotlin, app store, play store |

**Capabilities:**
- Build mobile apps
- Cross-platform development
- Mobile optimization
- App store deployment

**Platforms:**
- Native: Swift/SwiftUI (iOS), Kotlin/Jetpack Compose (Android)
- Cross-platform: React Native, Flutter, Expo
- Progressive Web Apps (PWA)

**Use Cases:**
- Mobile app development
- Cross-platform apps
- App store submissions
- Mobile performance optimization

---

### blockchain-developer

**Purpose:** Develops smart contracts and Web3 applications

| Property | Value |
|----------|-------|
| Model | sonnet |
| Triggers | blockchain, web3, smart contract, solidity, ethereum, nft, token, defi, wallet, foundry, hardhat |

**Capabilities:**
- Write smart contracts
- Build Web3 apps
- Audit for security
- Deploy to blockchain

**Blockchains:**
- Ethereum, Polygon, Arbitrum, Optimism (EVM)
- Solana
- Near Protocol
- Cosmos ecosystem

**Tools:**
- Solidity, Vyper (smart contracts)
- Foundry, Hardhat (development)
- ethers.js, viem, wagmi (frontend)
- OpenZeppelin (security)

**Use Cases:**
- Smart contract development
- DeFi applications
- NFT marketplaces
- Token implementations

---

## Usage Examples

### Single Agent

```bash
# Use get-agent-context to get a specific agent
mcp__flynn__get-agent-context({ agentId: "security" })
```

### Auto-Detection

```bash
# Use route-task to auto-detect the best agent
mcp__flynn__route-task({ task: "fix the login bug" })
# Returns: diagnostic agent
```

### Multi-Agent Workflows

```bash
# Use orchestrate for complex tasks
mcp__flynn__orchestrate({ task: "build full stack auth" })
# Returns: [api-designer, database-architect, coder, frontend-architect, test-architect, security, devops-engineer]
```

---

## Integration Agents

### orchestrator

**Purpose:** Coordinates tasks between Claude Code and external AI systems like OpenAI Codex CLI

| Property | Value |
|----------|-------|
| Model | sonnet |
| Triggers | codex, delegate, hybrid, multi-ai, gpt, openai |

**Capabilities:**
- Delegate tasks to Codex CLI
- Create CODEX.md handoff files
- Coordinate multi-AI workflows
- Manage context handoffs

**Workflow:**
1. Analyze task requirements
2. Determine if Codex delegation is appropriate
3. Generate CODEX.md with proper context
4. Execute Codex CLI with handoff
5. Integrate results back

**Use Cases:**
- Delegating implementation tasks to Codex
- Multi-AI collaborative workflows
- Leveraging Codex for high-volume coding
- Context-aware AI handoffs

---

## See Also

- [TOOLS.md](./TOOLS.md) - All 18 MCP Tools
- [SKILLS.md](./SKILLS.md) - All 17 Skills with Progressive Disclosure
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System Design
- [README.md](../README.md) - Quick Start Guide
