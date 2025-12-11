/**
 * DevOps Skills - Kubernetes and Terraform patterns
 */

import type { Skill } from "../types.js";

export const kubernetesOps: Skill = {
  id: "kubernetes-ops",
  name: "Kubernetes Operations",
  description:
    "Kubernetes manifests, Helm charts, GitOps patterns, RBAC, and debugging techniques.",
  category: "devops",
  triggers: [
    "kubernetes",
    "k8s",
    "helm",
    "kubectl",
    "pod",
    "deployment",
    "service",
    "ingress",
    "gitops",
    "argocd",
  ],
  tier1TokenEstimate: 50,
  tier2TokenEstimate: 2400,
  instructions: `# Kubernetes Operations

## Core Resources

### Deployment
\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: my-app:1.0.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: my-app-secrets
              key: database-url
\`\`\`

### Service
\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
\`\`\`

### Ingress
\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - my-app.example.com
    secretName: my-app-tls
  rules:
  - host: my-app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-app
            port:
              number: 80
\`\`\`

## Helm Charts

### Chart Structure
\`\`\`
my-chart/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   └── _helpers.tpl
\`\`\`

### values.yaml
\`\`\`yaml
replicaCount: 3

image:
  repository: my-app
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  host: my-app.example.com

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
\`\`\`

### Template Example
\`\`\`yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-chart.fullname" . }}
  labels:
    {{- include "my-chart.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "my-chart.selectorLabels" . | nindent 6 }}
  template:
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        resources:
          {{- toYaml .Values.resources | nindent 12 }}
\`\`\`

## kubectl Commands

### Debugging
\`\`\`bash
# Get pod logs
kubectl logs pod-name -f --tail=100

# Previous container logs (after crash)
kubectl logs pod-name --previous

# Execute into pod
kubectl exec -it pod-name -- /bin/sh

# Describe resource (events, status)
kubectl describe pod pod-name

# Get all resources in namespace
kubectl get all -n my-namespace

# Watch resources
kubectl get pods -w
\`\`\`

### Common Operations
\`\`\`bash
# Scale deployment
kubectl scale deployment my-app --replicas=5

# Rollout status
kubectl rollout status deployment/my-app

# Rollback
kubectl rollout undo deployment/my-app

# Port forward
kubectl port-forward svc/my-app 8080:80

# Apply manifests
kubectl apply -f manifest.yaml
kubectl apply -k ./kustomize-dir
\`\`\`

## RBAC

### ServiceAccount
\`\`\`yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: my-app-role
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: my-app-binding
subjects:
- kind: ServiceAccount
  name: my-app
roleRef:
  kind: Role
  name: my-app-role
  apiGroup: rbac.authorization.k8s.io
\`\`\`

## GitOps with ArgoCD

### Application
\`\`\`yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/org/repo
    targetRevision: main
    path: kubernetes/my-app
  destination:
    server: https://kubernetes.default.svc
    namespace: my-app
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
\`\`\``,
  resources: [
    "https://kubernetes.io/docs/home/",
    "https://helm.sh/docs/",
    "https://argo-cd.readthedocs.io/",
  ],
};

export const terraformIac: Skill = {
  id: "terraform-iac",
  name: "Terraform Infrastructure as Code",
  description:
    "Terraform modules, state management, multi-cloud patterns, and best practices for AWS, Azure, GCP.",
  category: "devops",
  triggers: [
    "terraform",
    "iac",
    "aws",
    "azure",
    "gcp",
    "infrastructure",
    "cloud",
    "module",
    "state",
    "provider",
  ],
  tier1TokenEstimate: 50,
  tier2TokenEstimate: 2300,
  instructions: `# Terraform Infrastructure as Code

## Project Structure
\`\`\`
infrastructure/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   └── prod/
├── modules/
│   ├── vpc/
│   ├── eks/
│   └── rds/
└── shared/
    └── backend.tf
\`\`\`

## Basic Configuration
\`\`\`hcl
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
\`\`\`

## AWS Examples

### VPC Module
\`\`\`hcl
# modules/vpc/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "\${var.environment}-vpc"
  })
}

resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.cidr_block, 4, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "\${var.environment}-public-\${count.index + 1}"
    Type = "public"
  })
}

resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.cidr_block, 4, count.index + length(var.availability_zones))
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "\${var.environment}-private-\${count.index + 1}"
    Type = "private"
  })
}
\`\`\`

### Variables
\`\`\`hcl
# modules/vpc/variables.tf
variable "cidr_block" {
  type        = string
  description = "VPC CIDR block"
  default     = "10.0.0.0/16"
}

variable "environment" {
  type        = string
  description = "Environment name"
}

variable "availability_zones" {
  type        = list(string)
  description = "List of availability zones"
}

variable "tags" {
  type        = map(string)
  description = "Tags to apply to resources"
  default     = {}
}
\`\`\`

### Outputs
\`\`\`hcl
# modules/vpc/outputs.tf
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID"
}

output "public_subnet_ids" {
  value       = aws_subnet.public[*].id
  description = "Public subnet IDs"
}

output "private_subnet_ids" {
  value       = aws_subnet.private[*].id
  description = "Private subnet IDs"
}
\`\`\`

## State Management

### Remote Backend (S3)
\`\`\`hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "env/prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
\`\`\`

### State Locking (DynamoDB)
\`\`\`hcl
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
\`\`\`

## Best Practices

### Data Sources
\`\`\`hcl
# Reference existing resources
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
\`\`\`

### Locals
\`\`\`hcl
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }

  name_prefix = "\${var.project_name}-\${var.environment}"
}
\`\`\`

### Conditionals
\`\`\`hcl
resource "aws_instance" "bastion" {
  count = var.create_bastion ? 1 : 0

  ami           = data.aws_ami.amazon_linux.id
  instance_type = var.bastion_instance_type
}
\`\`\`

### For Each
\`\`\`hcl
variable "buckets" {
  type = map(object({
    versioning = bool
    lifecycle  = number
  }))
}

resource "aws_s3_bucket" "buckets" {
  for_each = var.buckets

  bucket = "\${local.name_prefix}-\${each.key}"

  tags = local.common_tags
}
\`\`\`

## Commands
\`\`\`bash
# Initialize
terraform init

# Plan
terraform plan -out=tfplan

# Apply
terraform apply tfplan

# Destroy
terraform destroy

# State commands
terraform state list
terraform state show aws_vpc.main
terraform state mv aws_vpc.old aws_vpc.new
terraform import aws_s3_bucket.bucket bucket-name

# Workspace management
terraform workspace list
terraform workspace new staging
terraform workspace select prod
\`\`\``,
  resources: ["https://developer.hashicorp.com/terraform/docs", "https://registry.terraform.io/"],
};

export const DEVOPS_SKILLS: Record<string, Skill> = {
  "kubernetes-ops": kubernetesOps,
  "terraform-iac": terraformIac,
};
