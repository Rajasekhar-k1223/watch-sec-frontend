# Monitorix Sovereign Enterprise — Private Cloud Deployment Guide

## 1. Scope & Sovereign Boundaries

This deployment architecture is designed for enterprise customers running in dedicated, isolated **Private Cloud** environments, including:
- **AWS Outposts / Dedicated VPCs / AWS GovCloud**
- **Azure Stack Hub / Azure Government Dedicated VNets**
- **Google Distributed Cloud (GDC) / Sovereign Cloud**
- **OpenStack / Ceph Private Datacenter Clouds**

### Sovereignty Guarantee
- **Zero Public Ingress/Egress**: All services are provisioned within strictly private subnets. No Internet Gateways (`igw-`) or Public NAT Gateways are required or attached.
- **Customer KMS / HSM Integration**: Cryptographic data-at-rest encryption utilizes customer-managed keys (AWS KMS Customer Managed Keys, Azure Key Vault HSM, or HashiCorp Vault).
- **Zero Vendor Telemetry**: No license checks or telemetry are transmitted outside the customer's private cloud VPC.

---

## 2. Cloud Network Architecture (Zero-Egress Private VPC)

```
                              [ CUSTOMER CORPORATE WAN ]
                                         │
                        [ AWS DirectConnect / Azure ExpressRoute ]
                                         │
┌────────────────────────────────────────▼────────────────────────────────────────┐
│                        CUSTOMER PRIVATE CLOUD VPC / VNET                        │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                    INTERNAL LOAD BALANCER (NLB / ALB)                     │  │
│  │    • Port 8085 (TLS 1.3): SOC Web Console                                 │  │
│  │    • Port 8005 (HTTPS / gRPC): Agent Telemetry Ingestion Ingress          │  │
│  └─────────────────────────────────────┬─────────────────────────────────────┘  │
│                                        │                                        │
│  ┌─────────────────────────────────────▼─────────────────────────────────────┐  │
│  │                      APPLICATION COMPUTE INSTANCES                        │  │
│  │                     (EC2 / Azure VM / OpenStack VM)                       │  │
│  │                                                                           │  │
│  │  ┌─────────────────────────────┐         ┌─────────────────────────────┐  │  │
│  │  │   MONITORIX BACKEND API     │         │    AGENT TELEMETRY GATEWAY  │  │  │
│  │  │   • Sovereign Entitlements  │         │    • Dynamic Ephemeral OTP  │  │  │
│  │  │   • Detection Engine        │         │    • High-Throughput Buffers│  │  │
│  │  └──────────────┬──────────────┘         └──────────────┬──────────────┘  │  │
│  └─────────────────┼───────────────────────────────────────┼─────────────────┘  │
│                    │                                       │                    │
│  ┌─────────────────▼───────────────────────────────────────▼─────────────────┐  │
│  │                         PERSISTENT STORAGE SUBNET                         │  │
│  │  • PostgreSQL Cluster (Self-Hosted or Private RDS/Aurora PostgreSQL)     │  │
│  │  • ClickHouse Cluster (High-Throughput Telemetry Logs on NVMe EBS/Disks)  │  │
│  │  • S3-Compatible Object Storage (MinIO or Private VPC S3 Endpoints)       │  │
│  │  • Redis In-Memory Cluster                                                │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Recommended Instance Profiles

| Cloud Provider | Standard Instance (up to 2,500 agents) | High-Performance Instance (10,000+ agents) | Storage Volume Type |
| :--- | :--- | :--- | :--- |
| **AWS / GovCloud** | `m6i.4xlarge` (16 vCPU, 64 GB RAM) | `m6i.8xlarge` (32 vCPU, 128 GB RAM) | `io2` or `gp3` (10,000 IOPS / 500 MB/s) |
| **Azure Gov / Stack**| `Standard_D16s_v5` (16 vCPU, 64 GB RAM)| `Standard_D32s_v5` (32 vCPU, 128 GB RAM)| Premium SSD v2 (Ultra Disk for ClickHouse)|
| **Google Sovereign**| `n2-standard-16` (16 vCPU, 64 GB RAM) | `n2-standard-32` (32 vCPU, 128 GB RAM) | Hyperdisk Extreme / Balanced Persistent Disk|
| **OpenStack** | 16 vCPU, 64 GB RAM Flavor | 32 vCPU, 128 GB RAM Flavor | Ceph RBD Fast Tier / Dedicated NVMe Passthrough |

---

## 4. Terraform / OpenTofu Infrastructure Baseline

The following baseline illustrates a zero-egress private cloud compute and security group specification:

```hcl
resource "aws_security_group" "monitorix_cluster" {
  name        = "monitorix-enterprise-cluster-sg"
  description = "Strict ingress control for Monitorix Sovereign SOC"
  vpc_id      = var.customer_vpc_id

  # SOC Console: Restricted to Corporate VPN / Admin CIDR
  ingress {
    description = "SOC Web Console Access"
    from_port   = 8085
    to_port     = 8085
    protocol    = "tcp"
    cidr_blocks = [var.corporate_admin_cidr]
  }

  # Agent Ingestion: Internal corporate subnets only
  ingress {
    description = "Agent Ingestion Gateway"
    from_port   = 8005
    to_port     = 8005
    protocol    = "tcp"
    cidr_blocks = [var.corporate_workstations_cidr, var.datacenter_servers_cidr]
  }

  # Zero outbound public egress rule
  egress {
    description = "Intra-VPC Database & Internal Traffic Only"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.customer_vpc_cidr]
  }
}
```

---

## 5. Deployment Procedure in Private Cloud

1. Transfer the deployment bundle to the bastion or private S3 endpoint:
   ```bash
   scp monitorix-enterprise-19.1.0-dep-customer.tar.gz ec2-user@private-monitorix-host:/tmp/
   ```
2. Unpack and verify bundle:
   ```bash
   tar -xzf /tmp/monitorix-enterprise-19.1.0-dep-customer.tar.gz -C /opt/monitorix
   cd /opt/monitorix
   ```
3. Run pre-flight dry-run validation:
   ```bash
   ./installer/install.sh --dry-run
   ```
4. Execute installation:
   ```bash
   sudo ./installer/install.sh
   ```
5. Confirm internal Private NLB health check target responds `200 OK` on `http://127.0.0.1:8010/api/health`.
