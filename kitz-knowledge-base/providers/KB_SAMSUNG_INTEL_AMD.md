# Samsung, Intel & AMD — Component & Silicon Provider Knowledge Base

---

## Samsung Electronics

### Company Overview
- **Founded**: 1938 / Electronics division 1969 (Suwon, South Korea)
- **Ticker**: 005930 (KRX)
- **Revenue**: ~$210B (FY2024, Samsung Electronics)
- **Market position**: #1 memory/NAND, #1 smartphones (global), #1 displays, #2 foundry

### Business Products
- **Galaxy Enterprise**: Samsung Knox-managed smartphones/tablets for business
  - Galaxy S24 Ultra, Galaxy Z Fold/Flip (business editions with Knox Suite)
  - Galaxy Tab S9 (business tablets)
  - Knox Suite: $0.75-$6.99/device/mo (MDM, enrollment, E-FOTA, remote support)
- **Displays**: Smart Signage (commercial displays), The Wall (MicroLED), video walls, interactive displays
- **Memory**: DDR5, HBM3e (AI training), enterprise SSDs (PM9A3/PM1743), QLC NAND
- **Foundry**: 3nm/4nm GAA process (manufactures chips for Qualcomm, Google, others)
- **Samsung SDS**: Enterprise IT services, Nexledger (blockchain), Brightics AI

### SMB Relevance
- **Knox**: Enterprise mobile management — competitive with Apple Business Essentials
- **Galaxy phones/tablets**: Common business devices in LatAm (Samsung leads Android market share)
- **Smart Signage**: Digital menu boards, retail displays — affordable for SMBs
- **Samsung Business**: samsung.com/business — curated SMB solutions

---

## Intel Corporation

### Company Overview
- **Founded**: 1968 by Gordon Moore & Robert Noyce (Santa Clara, CA)
- **Ticker**: INTC (NASDAQ)
- **Revenue**: ~$54B (FY2024)
- **CEO**: Lip-Bu Tan (2025)
- **Employees**: ~110,000
- **Market position**: #1 data center CPUs (declining), #1 client CPUs (declining share to AMD/Apple/Qualcomm)

### Product Portfolio
- **Core Ultra (Meteor Lake/Lunar Lake/Arrow Lake)**: Client CPUs with NPU (AI PC)
  - Core Ultra 200V: Laptop CPUs with dedicated NPU (up to 48 TOPS AI performance)
  - Core Ultra 200S: Desktop CPUs
  - vPro: Enterprise management (AMT remote management, hardware security)
- **Xeon Scalable**: Data center CPUs
  - 5th Gen Xeon (Emerald Rapids): Up to 64 cores, DDR5, CXL
  - Xeon 6 (Granite Rapids/Sierra Forest): Performance-cores + efficiency-cores
  - Built-in AI accelerators (AMX — Advanced Matrix Extensions)
- **Gaudi AI Accelerators**: Alternative to NVIDIA GPUs for AI training/inference
  - Gaudi 3: Competitive with H100 for LLM training at lower cost
- **Intel Foundry Services (IFS)**: Contract chip manufacturing (Intel 18A process, 2025)
- **Altera (FPGAs)**: Programmable chips for networking, defense, acceleration
- **Optane** (discontinued): Persistent memory / high-endurance SSDs
- **Wi-Fi / Ethernet**: Wi-Fi 7 (BE200/BE202), Ethernet controllers (widespread in NICs)

### SMB Relevance
- **vPro platform**: Remote management for IT-light businesses (AMT, TXT, security)
- **AI PC initiative**: NPU-equipped laptops (Intel + Microsoft Copilot+ PC push)
- **Intel Evo**: Laptop certification (fast wake, long battery, Thunderbolt, Wi-Fi 6E/7)
- **Intel NUC** (discontinued, licensed to ASUS): Mini PCs for kiosk/digital signage
- **Found in**: Most Dell, HP, Lenovo business PCs ship with Intel Core/vPro

### APIs & SDKs
- **OpenVINO**: AI inference toolkit (optimize + deploy models on Intel hardware)
- **oneAPI**: Unified programming model (CPU, GPU, FPGA, accelerators)
- **Intel AMT SDK**: Remote management API for vPro-equipped systems
- **Intel DevCloud**: Free cloud access to Intel hardware for development

---

## AMD (Advanced Micro Devices)

### Company Overview
- **Founded**: 1969 by Jerry Sanders (Santa Clara, CA)
- **Ticker**: AMD (NASDAQ)
- **Revenue**: ~$26B (FY2024)
- **CEO**: Lisa Su
- **Employees**: ~26,000
- **Market position**: #2 CPUs (growing), #2 GPUs, #1 console chips (PlayStation, Xbox)
- **Key acquisition**: Xilinx ($49B, 2022) — FPGAs, adaptive SoCs

### Product Portfolio
- **Ryzen (Client CPUs)**:
  - Ryzen 9000 (Zen 5): Desktop processors
  - Ryzen AI 300 (Strix Point): Laptop CPUs with Ryzen AI NPU (up to 50 TOPS)
  - Ryzen Pro: Enterprise-managed CPUs (AMD Pro manageability, Memory Guard encryption)
- **EPYC (Server CPUs)**:
  - EPYC 9004 (Genoa/Bergamo): Up to 128 cores/256 threads, dominant in cloud
  - EPYC 9005 (Turin): Zen 5, up to 192 cores
  - AMD leads in core count, power efficiency, price-performance vs Intel Xeon
- **Instinct (AI GPUs)**:
  - MI300X: 192GB HBM3 — competitive with NVIDIA H100 for LLM inference
  - MI300A: APU (CPU+GPU unified) for HPC
  - MI350 (coming 2025): Next-gen, targeting NVIDIA H200/B100
  - ROCm: AMD's CUDA competitor (open-source GPU compute platform)
- **Radeon Pro (Workstation GPUs)**: W7900/W7800/W7600 — ISV-certified for CAD/VFX
- **Versal / Alveo (FPGAs from Xilinx)**: Adaptive compute for networking, defense, AI inference
- **Pensando (DPUs)**: Data center SmartNICs (acquired 2022)

### SMB Relevance
- **Ryzen Pro in business PCs**: Found in Lenovo ThinkPad/ThinkCentre, HP EliteBook/ProBook, Dell Latitude/OptiPlex
- **Price-performance**: AMD-based PCs/servers often 10-20% cheaper than Intel equivalents
- **EPYC in cloud**: AWS (M7a), Azure (Dv5), GCP (T2A) — AMD powers many cloud instances
- **AI accessibility**: MI300X more available than NVIDIA H100 (less supply-constrained)

### APIs & SDKs
- **ROCm**: Open-source GPU compute (HIP = CUDA-compatible API)
- **AMD DASH**: Remote management for AMD Pro systems
- **AMD Vivado/Vitis (Xilinx)**: FPGA development tools
- **AMD Infinity Hub**: GPU-optimized container catalog (Docker containers for ML frameworks)

---

## Pricing Benchmarks (2024-2025)
| Product | Price |
|---------|-------|
| Samsung Galaxy S24 Ultra (business) | ~$1,299 |
| Samsung Knox Suite (per device/mo) | $0.75-$6.99 |
| Intel Core Ultra 7 155H (laptop CPU) | ~$400 (in systems) |
| Intel Xeon w5-2445 (workstation) | ~$600 |
| AMD Ryzen 9 7950X (desktop) | ~$449 |
| AMD EPYC 9654 (96-core server) | ~$11,000 |
| AMD Instinct MI300X (192GB) | ~$10,000-$15,000 |
| Intel Gaudi 3 | ~$12,000-$15,000 |
