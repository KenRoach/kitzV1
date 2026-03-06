# NVIDIA — Tech Provider Knowledge Base

## Company Overview
- **Founded**: 1993 by Jensen Huang, Chris Malachowsky, Curtis Priem (Santa Clara, CA)
- **Ticker**: NVDA (NASDAQ)
- **Revenue**: ~$130B (FY2025), up from $27B in FY2023 — AI-driven hypergrowth
- **CEO**: Jensen Huang (co-founder, since inception)
- **Employees**: ~32,000
- **Market cap**: ~$3T+ (one of world's most valuable companies)

## Product Portfolio

### Data Center GPUs (AI/ML)
- **H100**: Hopper architecture. The GPU that launched the AI boom. 80GB HBM3. ~$25K-$40K per unit
- **H200**: Hopper refresh, 141GB HBM3e. Higher memory bandwidth for inference
- **B100 / B200**: Blackwell architecture (2024). 2x H100 training perf, 25x inference for LLMs
- **GB200 NVL72**: Blackwell Ultra — 72 GPU rack-scale system for frontier AI training
- **A100**: Ampere architecture (previous gen, still widely deployed). 40/80GB HBM2e
- **L40S**: Ada Lovelace for inference + graphics workloads. ~$7K-$10K
- **L4**: Compact inference GPU (low power, high throughput). ~$2K-$4K
- **Grace CPU**: ARM-based data center CPU (paired with Hopper/Blackwell GPUs)
- **Grace Hopper Superchip**: CPU+GPU unified module, 576GB coherent memory

### Networking (Mellanox, acquired 2020)
- **InfiniBand**: ConnectX-7, Quantum-2 switches (400Gb/s). #1 for AI cluster interconnect
- **Spectrum-X**: Ethernet for AI (800GbE switches + BlueField-3 DPUs)
- **BlueField DPU**: Data processing unit (SmartNIC + CPU for infrastructure offload)
- **NVLink / NVSwitch**: GPU-to-GPU interconnect within nodes (900GB/s per GPU on Blackwell)

### Software & Platforms
- **CUDA**: GPU programming platform (de facto standard for AI/ML compute)
- **cuDNN / cuBLAS / NCCL**: GPU-accelerated libraries for deep learning
- **TensorRT**: Inference optimization engine (quantization, graph optimization)
- **Triton Inference Server**: Production model serving (multi-framework)
- **NVIDIA AI Enterprise**: Commercial AI software suite (NIM, NeMo, RAPIDS) — $4,500/GPU/year
- **NIM (NVIDIA Inference Microservices)**: Pre-packaged, optimized model containers
- **NeMo**: Framework for building/customizing LLMs
- **RAPIDS**: GPU-accelerated data science (cuDF, cuML, cuGraph)
- **Omniverse**: 3D simulation + digital twin platform
- **Isaac**: Robotics platform (simulation, perception, manipulation)

### Professional Visualization
- **RTX Ada Generation**: A2000/A4000/A4500/A5000/A6000 (workstation GPUs, ISV-certified)
- **RTX 5000/6000**: Blackwell workstation GPUs (2025)
- **NVIDIA vGPU**: GPU virtualization (shared GPU across VMs)
- **CloudXR**: Cloud-streamed XR/VR/AR

### Consumer / Gaming
- **GeForce RTX 50 series**: RTX 5090/5080/5070 (Blackwell architecture, 2025)
- **GeForce RTX 40 series**: RTX 4090/4080/4070/4060 (Ada Lovelace)
- **GeForce NOW**: Cloud gaming service (also used for remote workstations)

### Automotive & Edge
- **DRIVE**: Autonomous vehicle platform (DRIVE Thor, DRIVE Orin)
- **Jetson**: Edge AI modules (Orin Nano, Orin NX, AGX Orin) — from $249
- **Metropolis**: Smart city / video analytics platform
- **IGX**: Industrial edge AI platform

## SMB Relevance
- **Direct SMB impact is limited** (NVIDIA sells primarily to hyperscalers, OEMs, enterprises)
- **Indirect impact is massive**: Every cloud GPU instance (AWS, Azure, GCP) runs NVIDIA
- **NVIDIA GPU Cloud (NGC)**: Free catalog of GPU-optimized containers, models, SDKs
- **Jetson**: Accessible edge AI for SMBs building IoT/robotics (~$249-$999)
- **GeForce RTX**: Local AI inference for SMBs (LLM fine-tuning, Stable Diffusion, etc.)
- **NVIDIA AI Workbench**: Free tool for local AI development on RTX GPUs
- **Cloud partners**: Access NVIDIA GPUs via AWS (P5/G5), Azure (NC/ND), GCP (A3/G2), Lambda, CoreWeave

## Partner Program (NVIDIA Partner Network — NPN)
- **Tiers**: Registered, Preferred, Elite
- **Tracks**: Cloud, Data Center, Professional Visualization, Networking
- **OEM partners**: Dell, HPE, Lenovo, Supermicro, Gigabyte (sell NVIDIA GPU servers)
- **Cloud partners**: AWS, Azure, GCP, Oracle Cloud, CoreWeave, Lambda
- **ISV partners**: VMware, Red Hat, Databricks, Snowflake, SAP
- **NVIDIA DGX-Ready**: Certified data center partners for DGX deployments

## LatAm Presence
- **Offices**: Sao Paulo, Mexico City
- **Channel**: NVIDIA GPUs sold through OEM partners (Dell, HPE, Lenovo) and distributors in LatAm
- **Cloud access**: LatAm users access NVIDIA GPUs via AWS sa-east-1, Azure Brazil South, etc.
- **NVIDIA Inception**: Startup program — active in LatAm (provides credits, co-marketing, technical support)
- **University programs**: CUDA training, GPU research grants at LatAm universities
- **Gaming**: GeForce dominant in LatAm gaming market

## APIs & Integration Points
- **CUDA Toolkit**: C/C++/Python GPU programming (11.x/12.x)
- **cuDNN API**: Deep learning primitives (convolutions, RNNs, transformers)
- **TensorRT API**: Inference optimization (C++/Python)
- **Triton Inference Server API**: gRPC/HTTP model serving
- **NIM API**: REST API for optimized model inference (OpenAI-compatible endpoints)
- **NeMo Framework API**: LLM training, fine-tuning, RLHF
- **RAPIDS API**: GPU DataFrames (cuDF), GPU ML (cuML)
- **Omniverse Kit API**: 3D scene composition, simulation
- **Jetson JetPack SDK**: Edge AI development (computer vision, NLP, robotics)
- **NVIDIA Cloud Functions (NVCF)**: Serverless GPU functions

## Pricing Benchmarks (2024-2025)
| Product | Price |
|---------|-------|
| GeForce RTX 4060 (8GB) | ~$299 |
| GeForce RTX 4090 (24GB) | ~$1,599 |
| RTX A4000 (workstation, 16GB) | ~$1,100 |
| Jetson Orin Nano (8GB) | ~$249 |
| H100 SXM (80GB) | ~$30,000-$40,000 |
| A100 PCIe (80GB) | ~$10,000-$15,000 |
| L4 (inference, 24GB) | ~$2,500-$4,000 |
| NVIDIA AI Enterprise license | $4,500/GPU/year |
| Cloud GPU (H100, per hour) | ~$2-$4/hr (varies by provider) |

## Key Differentiators
- **CUDA moat**: 20+ years of GPU software ecosystem — virtually all AI research runs on CUDA
- **AI training dominance**: 80-95% market share in AI training GPUs
- **Full-stack AI**: Hardware (GPUs, DPUs, CPUs) + Software (CUDA, TensorRT, NIM, NeMo) + Cloud
- **Networking**: InfiniBand is the only viable interconnect for large AI clusters
- **Software ecosystem**: NGC, AI Enterprise, Omniverse — recurring software revenue
- **Supply constraints**: Demand exceeds supply — NVIDIA GPUs are the most sought-after tech product globally

## Security & Compliance
- **Confidential Computing**: H100/Blackwell support TEE (Trusted Execution Environment) for GPU workloads
- **NVIDIA Morpheus**: AI-powered cybersecurity framework (digital fingerprinting, threat detection)
- **GPU attestation**: Hardware root of trust for GPU integrity verification
- **NVIDIA AI Enterprise**: Includes security scanning, CVE monitoring, enterprise support
- **Compliance**: SOC 2 (NGC/NVCF), FIPS 140-2 (cryptographic modules)
