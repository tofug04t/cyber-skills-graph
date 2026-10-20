# Skills Graph Data Fork — Decision Log

Forked from: NIST SP 800-181 Rev 1, NICE Workforce Framework for Cybersecurity, v2.2.0
Fork file: `nice-framework-v2-2-0-forked.json`
Purpose: translate government/bureaucratic language into common industry terminology, and resolve orphaned Skill/Knowledge/Task statements (items with no Work Role — and, in v2.2.0, sometimes no Competency Area either) so the modernized skills graph isn't silently missing content NIST itself hasn't finished cross-walking.

This log is the audit trail. The fork file itself is kept clean (no embedded rationale) so it stays easy to consume programmatically; anything you want to re-verify against the original NIST wording or reasoning, look here.

---

## 1. Structural changes (apply to the whole dataset)

- **Removed element types `sort` and `opm_code` entirely (87 elements).** Both have empty `text` and `title` on every instance in the source file — `sort` is pure ordering scaffolding, `opm_code` is federal OPM job-series numbers. Neither carries content to translate or graph value for this project.
- **`competency_area` elements (11) and `category` elements (5) were left untouched structurally** — not currently part of the Skill↔Work Role edge model (per v1 scope), but preserved as-is since no decision was made to remove them. They may be useful for a future phase (they're actually a good signal for grouping: DevSecOps, Cryptography, AI Security, Cyber Resiliency, OT Security, Supply Chain Security).
- Added a second `documents` entry identifying this as a fork (`MHP_SKILLS_GRAPH_FORK_1_0`) alongside the original NIST document record, for provenance.

**Element counts, before → after:**
| Type | Original | Fork |
|---|---|---|
| work_role | 42 | 44 (−1 cut, +3 new) |
| skill | 556 | 516 (−40 cut) |
| knowledge | 693 | 658 (−35 cut) |
| task | 962 | 913 (−49 cut) |
| category | 5 | 5 (text edit only) |
| competency_area | 11 | 11 (untouched) |
| sort | 47 | 0 (type dropped) |
| opm_code | 40 | 0 (type dropped) |

---

## 2. Categories

- **IN (Investigation)** — description rewritten. Original read like an intelligence-community mission statement ("intelligence on foreign actors' cyberspace programs...") but the two Work Roles under it are ordinary corporate/forensic investigation work.
  - Before: *"Collects, processes, analyzes, and disseminates information from all sources of intelligence on foreign actors' cyberspace programs, intentions, capabilities, research and development, and operational activities"*
  - After: *"Investigates cybersecurity incidents and analyzes digital evidence to support internal, legal, or law-enforcement processes."*
- DD, PD, IO, OG — no change needed, already plain.

---

## 3. Work Roles

### Cut (1)
- **OG-WRL-001 Communications Security (COMSEC) Management** — classified crypto-material custodianship; no general-industry equivalent. Cutting it orphaned 7 downstream items (K0671, K0672, K0673, T1015, T1016, T1017, T1018), all purely COMSEC-specific — cut alongside it rather than re-triaged separately.

### Retitled (1)
- **OG-WRL-012**: "Security Control Assessment" → **"IT/Security Controls Auditor"**. The description was already plain-language from the first pass; the title read as a process step rather than a recognizable job. Maps to industry titles like IT/Security Auditor, Compliance Auditor, or (in FedRAMP-adjacent contexts) the title crosses over almost verbatim — Security Control Assessor is still used by accredited third-party assessment organizations. Note: this role's content was substantially cleaned up — see Section 6.

### Generalized (1)
- **OG-WRL-009 Product Support Management** — original description was DoD sustainment/logistics language ("field and maintain the readiness and operational capability of systems and components").
  - After: *"Responsible for planning, budgeting, and managing the ongoing support strategy for a product or system — keeping it maintained, supported, and operational throughout its lifecycle."*

### Rewritten — jargon swapped for the underlying concept, meaning preserved (10)
| ID | Title | Change |
|---|---|---|
| DD-WRL-001 | Cybersecurity Architecture | Dropped FEAF terms ("reference models, segment and solution architectures") for plain "organization's overall technology architecture." |
| DD-WRL-002 | Enterprise Architecture | Dropped "enterprise mission needs" framing. |
| DD-WRL-008 | Technology Research and Development | "cyberspace systems" → "technology systems." |
| PD-WRL-005 | Insider Threat Analysis | Dropped "counterintelligence" framing; generalized to HR/legal/law enforcement. |
| PD-WRL-007 | Vulnerability Analysis | "enclave policy" → "network-segment policy." |
| IN-WRL-001 | Cybercrime Investigation | Reframed the "prosecution vs. intelligence gathering" tradeoff as "preserve evidence vs. contain the threat" (by the author's call). |
| OG-WRL-003 | Cybersecurity Workforce Management | Dropped "mandated... legislation, regulation, and policy" framing. |
| OG-WRL-010 | Program Management | "agency or organizational priorities" → "organizational priorities." |
| OG-WRL-013 | Systems Authorization | Rewrote RMF/ATO boilerplate ("acceptable level of risk... to the nation") into plain risk-acceptance language. |
| OG-WRL-014 | Systems Security Management | "enclave" → "network environment." |
| OG-WRL-015 | Technology Portfolio Management | Dropped "mission and enterprise priorities" framing. |

### Added (3)
- **DD-WRL-010 AI/ML Security** (under Design and Development) — created to house 7 orphaned AI-security skills (S0952–S0958) that had a Competency Area tag but no Work Role, plus ~30 similarly orphaned AI-specific Knowledge statements. No existing role was a reasonable fit.
  > *"Responsible for evaluating and securing artificial intelligence and machine learning systems throughout their lifecycle — assessing training data and model behavior for security and reliability risks, testing for adversarial vulnerabilities and unreliable or hallucinated outputs, and advising on the secure use and deployment of AI capabilities within the organization."*
- **PD-WRL-008 Penetration Testing and Red Teaming** (under Protection and Defense) — created after multiple offensive-security items (S0752, K1000, K1001, K1054, plus several already-mapped items) kept surfacing with no true home; they'd been stretch-fit into Vulnerability Analysis.
  > *"Responsible for simulating adversary tactics, techniques, and procedures against systems and networks — including evading detection by defensive controls — to identify exploitable weaknesses and report findings that help the organization improve its security posture."*
- **OG-WRL-018 Security Compliance Monitoring** (under Oversight and Governance) — split off from the Systems Authorization / RMF task cluster. Distinguishes the ongoing, operational "is this system still compliant" function from Systems Authorization's point-in-time "is this system approved to run" decision.
  > *"Responsible for continuously monitoring an organization's systems, security controls, and risk posture to ensure ongoing compliance with security requirements — tracking metrics, preparing compliance reports, and coordinating remediation of issues identified through monitoring."*

---

## 4. Orphaned Skills (93 reviewed: 67 kept/mapped, 26 cut)

### Cut — military/intelligence jargon with no industry translation (13)
S0186, S0501, S0527 (DoD "crisis action plan/timeline"), S0528, S0764, S0782 (intel-cycle jargon: PIR, indicators, capability estimates), S0785, S0786 (military planning-guidance/readiness-reporting), S0375 (intel-flavored "information requirements"), S0862 (geospatial/GEOINT analysis)

### Cut — too generic or redundant (13)
S0522, S0734, S0745, S0746 (vague, near-duplicates of each other), S0749, S0766, S0768, S0770, S0773, S0783, S0784, S0794, S0843, S0855, S0868, S0832 (redundant with already-mapped S0821/S0827 — collaborating/communicating with stakeholders)

### Kept and mapped (67) — see the fork file's relationships for the full list. Highlights:
- Straightforward technical skills that were surprisingly orphaned: S0208, S0221, S0523, S0541, S0542, S0694, S0703, S0705, S0706, S0726, S0727, S0732, S0737, S0793, S0816, S0833, S0845, S0871
- RMF/authorization trio, generalized language: S0455, S0456, S0457 → Systems Authorization
- 41 modern skills (Cyber Resiliency, DevSecOps, Cryptography, AI Security Competency Areas) that NIST added but hadn't yet cross-walked to a Work Role — almost all kept, since they're high-value modern content, not bureaucratic bloat.
- 7 AI Security skills (S0952–S0958) → new AI/ML Security role
- S0752 (evading network detection) → new Penetration Testing and Red Teaming role (was a stretch-fit to Vulnerability Analysis before that role existed)

### Open items not resolved (flagged, left as originally decided) — worth a look:
- S0733 kept alongside near-duplicate S0732 ("interpreting" vs. "recognizing" malicious traffic)
- S0922 ("making decisions under uncertainty") — borderline generic, kept under Executive Cybersecurity Leadership

---

## 5. Orphaned Knowledge (123 reviewed: 98 kept/mapped, 25 cut; +3 more cut alongside COMSEC)

### Cut — military/intel jargon (11)
K0993 (deconfliction), K1024 (partnership/liaison), K1026 (requirements-submission), K1045 (tasking), K1056 (SIGINT/language analysis), K1064 (Request For Information process), K1104 (geospatial/GEOINT), K1105 (non-attributable networks — intel tradecraft), K1116 (classified-info handling), K1195 (priority information requirements), K1253 (information collection)

### Cut — too vague/generic (14)
K0961, K0968, K0999, K1020, K1103, K1135, K1178, K1185, K1187, K1218, K1224, K1234, K1202, K1277

### Cut alongside COMSEC removal (3)
K0671, K0672, K0673 — purely COMSEC-specific, no other mapping.

### Kept and mapped (98) — highlights:
- Foundational content that was surprisingly orphaned: K0018 (encryption algorithms), K0159 (VoIP), K0470 (routing protocols), K0971 (logging), K1015 (network topology)
- ~30 AI-specific Knowledge statements (K1315–K1345: AI bias types, data poisoning, NIST AI RMF, agentic AI, etc.) → new AI/ML Security role
- Cryptography cluster (K1357–K1367, K1378–K1380) → Cybersecurity Architecture
- DevSecOps cluster (K1368–K1377, K1381) → Software Security Assessment
- K1000, K1001 (evasion), K1054 (red team functions) → new Penetration Testing and Red Teaming role

---

## 6. Orphaned Tasks (132 reviewed: 87 kept/mapped, 45 cut; +4 more cut alongside COMSEC)

This section had the highest volume and the most military-doctrine-specific content — including two tasks (T1789, T1790) using literal kinetic-weapons-targeting terminology ("aim point," "reengagement") that had nothing to do with cyber at all.

### Cut — military/intelligence-community doctrine (18)
T0734, T1670/T1672 ("on-net"/"off-net operations"), T1699/T1700 (crisis plans), T1708 (operational assessment), T1719, T1741, T1780, T1781 ("degrade... data" — offensive-cyber-ops doctrine), T1784, T1789/T1790 (literal kinetic targeting terms), T1831, T1963, T1984 (indications-and-warning jargon), T1551 (literal criminal prosecution — a DOJ/attorney function, not a cybersecurity practitioner task)

### Cut — too generic/vague (18)
T0818, T1043, T1441, T1679, T1713, T1717, T1718, T1732, T1736, T1802, T1849, T1904, T2000

### Cut — redundant within the continuous-monitoring cluster (9)
T1946, T1947, T1949, T1951, T1952, T1953, T1955, T1956, T1958, T1959, T1960, T1961, T1962, T1965, T1966 (near-identical restatements of "perform/assess continuous monitoring")

### Cut alongside COMSEC removal (4)
T1015, T1016, T1017, T1018

### Kept and mapped (87) — highlights:
- Rewritten to drop RMF-specific terms while keeping the underlying meaning: T1443 (dropped "Government off-the-shelf (GOTS)"), T1914 (dropped "program management office"), T1918 (spelled out "System Security Plans" instead of the SSP acronym), T1928/T1929 (dropped "authorization packages"/"authorizing officials"/"adjudication"), T1936 ("authorizing officials" → "risk-acceptance leadership"), T2002 (dropped "courses of action"), T2008 (generalized "intelligence partners" → "law enforcement, as needed")
- T1666, T1671, T1676, T1689, T1698, T1734 → new Penetration Testing and Red Teaming role
- T1846 (developing NLP tools) → new AI/ML Security role
- The large Systems Authorization/RMF cluster (~30 tasks: categorization, boundary-setting, control selection, risk-acceptance decisions) — kept, since this is a real and distinct GRC function, but split from the ongoing-monitoring subset (see below)

### Open items not resolved (flagged, left as originally decided):
- T1452/T1453 (design vs. develop privileged-access admin functionality) — near-duplicate
- T1669/T1747 (worded near-identically — "analyze" vs. "identify" system vulnerabilities) — near-duplicate
- T1933/T1937 (two ways of asking if system risk is acceptable) — near-duplicate

---

## 7. GRC split — Systems Authorization vs. Security Compliance Monitoring

The original ~30-task RMF cluster conflated two distinct jobs: deciding whether a system is risk-acceptable (point-in-time authorization) vs. running the ongoing program that verifies it's still compliant (continuous, operational). Split as follows:

**Moved to the new Security Compliance Monitoring role as primary:** T1940, T1941, T1945, T1948, T1950 (moved fully off its old placeholder home, Program Management), T1954, and T1942 (dual-mapped — see below).

**Added as a second mapping (existing mapping kept intact):**
- T0960, T1957 — stay Systems Authorization, add Security Compliance Monitoring
- T1350 — stays Defensive Cybersecurity, adds Security Compliance Monitoring
- T1888 — stays Privacy Compliance, adds Security Compliance Monitoring
- T1944 — stays Cybersecurity Instruction, adds Security Compliance Monitoring
- T1967 — stays Incident Response, adds Security Compliance Monitoring
- K1071, K1123, K1124, K1125 — stay on their existing roles (mostly Systems Security Analysis), add Security Compliance Monitoring
- T1942 — stays Cybersecurity Policy and Planning, adds Security Compliance Monitoring

**Systems Authorization itself was not otherwise touched** — retains its full categorization/boundary/control-selection/risk-decision task set (~30 tasks).

---

## 8. Security Control Assessment cleanup

Before cleanup, this role (renamed to IT/Security Controls Auditor — see Section 3) had 304 mapped items, 4-6x larger than any other role. Investigation found:

- **267 items were also mapped to another, more specific role** (e.g., reverse-engineering knowledge also under Digital Forensics, pentest knowledge also under Vulnerability Analysis, instructional-design skills also under Cybersecurity Curriculum Development). This is legitimate — an auditor needs broad cross-domain fluency to evaluate whether controls in those areas are effective — so these were left untouched.
- **37 items were mapped *only* to this role**, which is where genuinely misplaced content had landed — apparently defaulted here because there was no better bucket in this framework revision.

### Of those 37:
**Cut — confirmed intelligence/targeting/SIGINT tradecraft (21):**
K0476, K0965, K0966, K0967 (language/voice/graphic-materials analysis), K0986, K0987 (target selection factors), K1034 (target language), S0177, S0248 (network/target-system analysis "on targets"), S0252 (intel-cycle "follow-on analysis"), S0437, S0440, S0441, S0503 (identifying/selecting targets), S0715 (operation plans), S0720 (regional languages/dialects), S0721 (PIR jargon), S0761 (strategic guidance analysis), S0775 (intelligence collection plans), S0780 (fulfilling information requests), S0760 (too trivial/generic regardless of role — "navigating databases")

**Moved to correct home (SCA mapping removed):**
| Item | New home |
|---|---|
| T1012, T1013 | Penetration Testing and Red Teaming |
| S0743 | Defensive Cybersecurity |
| S0136 | Network Operations |
| S0758 | Vulnerability Analysis |
| S0731 | Incident Response (also rewritten: "producing post-incident / lessons-learned reports") |

**Kept at IT/Security Controls Auditor, given a genuine second home:**
S0504, S0723 → also added to Vulnerability Analysis. T1339, T1340 → also added to Technology Program Auditing.

**Confirmed correctly placed, left as-is:**
T1270, T1271, T1272 (security authorization reviews, assurance cases), T1328, T1329, T1330 (verify/document/correct security-posture deviations)

---

## 9. Cross-cutting multi-mappings (existing content, new roles)

Per the author's instruction that Skills/Knowledge/Tasks can map to multiple Work Roles, the following already-mapped items were checked against the two new roles and given an additional mapping without disturbing their original one:

**AI/ML Security:** K0904 (machine learning principles) — added alongside its existing Data Analysis mapping.

**Penetration Testing and Red Teaming:** T1091, T1359, T1690, T2006, T2007, K0788, K0789, K0790, K0955, K0956, K0963, K1023, K1085, S0737, S0966 — all added alongside their existing mapping(s). (Note: T1013 was later moved fully to this role — see Section 8 — so its dual-mapping was superseded by the full move.)

---

## 10. Skill merges (2026-10-19)

Second data pass, part 1 of the skills and roles cleanup. 110 skills were merged into 89 others, taking the fork from 516 to 406 skills. Merges collapse verb splits of the same work (develop / implement / test a recovery plan), exact or near-exact restatements, and narrow variants of a broader skill.

**Role mappings follow the merge.** Every Work Role and Competency Area mapping on a merged skill was re-pointed to the skill it merged into, and duplicates were dropped. `scripts/apply_skill_merges.py` fails if any Work Role loses a mapping; none did. Role skill counts went down only where a role held two skills that are now one (e.g. IT/Security Controls Auditor 104 to 92).

Re-pointed relationships carry `MHP_SKILLS_GRAPH_FORK_1_0` as provenance. The full merge map, including each merged statement's original text, is in `data/skill-merges.json`. Skill text is unchanged for now; short display names are a separate step.

| Kept skill | Merged into it |
|---|---|
| S0156 performing packet-level analysis | S0221 extracting information from packet captures; S0875 performing network traffic packet analysis |
| S0380 facilitating cybersecurity awareness briefings | S0379 verifying participation in a security awareness program |
| S0389 facilitating group discussions | S0388 facilitating small group discussions |
| S0391 creating technical documentation | S0744 performing technical writing |
| S0398 analyzing organizational objectives | S0762 integrating organization objectives |
| S0401 collecting data | S0600 collecting relevant data from a variety of sources; S0828 compiling data |
| S0403 validating data | S0402 verifying data |
| S0407 developing standard operating procedures (SOPs) | S0408 maintaining standard operating procedures (SOPs) |
| S0410 creating career path definitions | S0411 developing career paths |
| S0425 operating network systems | S0421 operating network equipment |
| S0428 designing architectures | S0426 building architectures |
| S0429 designing frameworks | S0427 building frameworks |
| S0448 creating automated security control systems | S0449 maintaining automated security control systems |
| S0451 deploying continuous monitoring technologies | S0918 conducting ongoing monitoring of system properties and behaviors |
| S0452 creating a risk management program | S0453 creating a risk management strategy |
| S0457 determining whether a system is approved (authorized) to operate | S0455 aligning security authorization decisions with system requirements; S0456 aligning system security plans with authorization decisions |
| S0468 conducting a training needs assessment | S0467 conducting an education needs assessment |
| S0469 navigating the dark web | S0470 using the TOR network; S0696 conducting deep web research |
| S0472 developing virtual machines | S0473 maintaining virtual machines |
| S0484 developing user credential management systems | S0485 implementing user credential management systems |
| S0487 operating IT systems | S0488 maintaining IT systems |
| S0492 performing threat environment analysis | S0804 assessing an organization's threat environment |
| S0509 evaluating security products | S0531 assessing security hardware and software |
| S0516 performing threat emulation tactics | S0446 mimicking threat actors |
| S0544 recognizing vulnerabilities | S0504 identifying vulnerabilities |
| S0545 designing data storage solutions | S0546 implementing data storage solutions |
| S0554 performing systems analysis | S0886 performing system analysis |
| S0556 performing requirements analysis | S0397 assessing requirements |
| S0564 creating system security policies | S0665 creating policies that reflect legal, regulatory, and organizational requirements |
| S0566 developing signatures | S0567 deploying signatures |
| S0569 designing security controls | S0574 developing security system controls |
| S0575 developing network infrastructure contingency and recovery plans | S0576 testing network infrastructure contingency and recovery plans; S0671 implementing network infrastructure contingency and recovery plans; S0927 defining contingency plans |
| S0577 troubleshooting computer networks | S0815 troubleshooting network equipment |
| S0578 evaluating security designs | S0141 assessing security systems designs |
| S0581 configuring systems for performance enhancement | S0582 troubleshooting system performance; S0675 optimizing system performance |
| S0584 configuring network devices | S0585 installing network devices |
| S0594 repairing hardware | S0595 repairing system peripherals; S0611 disassembling Personal Computers (PCs) |
| S0596 encrypting network communications | S0077 securing network communications |
| S0597 writing code in a currently supported programming language | S0735 programming |
| S0603 identifying forensics data in diverse media | S0475 recognizing digital forensics data |
| S0608 processing digital evidence | S0491 processing digital forensic data |
| S0609 transporting digital evidence | S0605 storing digital evidence |
| S0610 communicating effectively | S0386 communicating verbally |
| S0612 performing digital forensics analysis | S0482 performing forensic data analysis; S0856 performing digital evidence analysis |
| S0613 configuring software-based computer protection tools | S0685 configuring computer protection components |
| S0617 interpreting signatures | S0627 reading signatures |
| S0648 detecting anomalies | S0477 identifying anomalous activity; S0838 identifying anomalous activities |
| S0650 writing scripts | S0837 executing computer scripts to automate tasks |
| S0657 implementing Public Key Infrastructure (PKI) encryption | S0486 implementing enterprise key escrow systems |
| S0662 managing servers | S0741 administering servers |
| S0663 managing workstations | S0679 configuring network workstations and peripherals; S0680 validating network workstations and peripherals |
| S0668 designing technology processes and solutions | S0669 integrating technology processes and solutions |
| S0683 implementing network segregation | S0920 establishing segmentation of system assets based on criticality and trustworthiness |
| S0686 performing risk assessments | S0878 performing risk analysis; S0947 interpreting risk assessments |
| S0695 performing Open Source Intelligence (OSINT) research | S0751 conducting open-source searches |
| S0700 mining data | S0701 performing data mining analysis |
| S0705 installing patches | S0541 providing software updates; S0706 identifying patch signatures |
| S0707 developing comprehensive cyber operations assessment programs | S0708 executing comprehensive cyber operations assessment programs |
| S0709 developing analytics | S0433 creating analytics |
| S0712 evaluating data source quality | S0713 evaluating information quality |
| S0732 recognizing malicious network activity in traffic | S0733 interpreting malicious network activity in traffic |
| S0748 querying data | S0897 retrieving data; S0911 performing data queries |
| S0755 reconstructing a network | S0490 recreating network topologies |
| S0799 anticipating new security threats | S0517 anticipating threats |
| S0801 assessing partner operations capabilities | S0515 identifying partner capabilities |
| S0806 performing incident responses | S0593 handling incidents |
| S0817 building internal and external relationships | S0818 building internal and external stakeholder relationships; S0902 building relationships remotely and in person |
| S0821 collaborating with internal and external stakeholders | S0458 coordinating efforts between stakeholders; S0822 collaborating with stakeholders; S0827 communicating with internal and external stakeholders |
| S0824 communicating with customers | S0111 interfacing with customers |
| S0842 interpreting test results | S0889 performing test result analysis |
| S0845 mapping networks | S0703 depicting data on a network map |
| S0846 monitoring system activity | S0885 performing system activity analysis |
| S0848 performing behavioral analysis | S0896 recognizing behavioral patterns; S0912 performing human behavioral analysis |
| S0853 performing cybersecurity architecture analysis | S0880 performing security architecture analysis |
| S0854 performing data analysis | S0409 deriving evaluative conclusions from data |
| S0859 performing event correlation | S0904 correlating data from multiple tools |
| S0861 performing gap analysis | S0940 performing risk-based gap analysis |
| S0863 performing incident analysis | S0939 performing event analysis |
| S0866 performing log file analysis | S0641 reviewing logs |
| S0869 performing metadata analysis | S0512 extracting metadata; S0711 interpreting metadata |
| S0874 performing network traffic analysis | S0688 performing network data analysis; S0871 performing network analysis |
| S0883 performing static code analysis | S0623 performing source code analysis |
| S0890 performing threat analysis | S0535 performing threat factor analysis |
| S0893 performing user needs analysis | S0506 identifying customer information needs; S0870 performing needs analysis |
| S0900 analyzing information from multiple sources | S0909 integrating information from multiple sources |
| S0923 communicating at varying levels of technical detail with stakeholders of various backgrounds | S0385 communicating complex concepts |
| S0932 protecting critical assets | S0933 designing enhanced controls for critical assets |
| S0955 evaluating machine learning models | S0956 evaluating the performance of algorithms |
| S0961 selecting supply chain controls | S0962 applying supply chain controls |

---

## 11. Skill cuts (2026-10-19)

Second data pass, part 2. 35 skills cut, taking the fork from 406 to 371 skills. Each cut removes the skill and all of its Work Role and Competency Area mappings. Cuts run after merges, and `scripts/apply_skill_cuts.py` refuses to cut a skill that other skills were merged into. Each skill's original wording and specific reason are in `data/skill-cuts.json`.

**Side effect:** Technology Portfolio Management (OG-WRL-015) had only two skills, both cut, so it now has none, joining Security Compliance Monitoring (OG-WRL-018). Both are already flagged in this pass: OG-WRL-015 as a candidate to merge into Program Management, OG-WRL-018 for new skill mappings.

### Too vague or generic to explore (16)

S0382 tailoring code analysis; S0384 applying standards; S0464 applying stakeholder management within a system development life cycle; S0474 finding system files; S0507 collecting terminal or environment data; S0530 conducting research; S0551 applying information technologies into proposed solutions; S0583 implementing established network security practices; S0654 conducting system reviews; S0687 performing administrative planning activities; S0729 preparing plans; S0771 creating planning documents; S0772 maintaining planning documents; S0790 monitoring status; S0879 performing scientific analysis; S0949 recognizing and acknowledging unique contributions from varying skillsets

### Intelligence-community or military content (14)

S0439 identifying external partners; S0494 performing operational environment analysis; S0495 determining asset availability, capabilities, and limitations; S0499 performing intelligence collection analysis; S0514 preparing operational environments; S0638 designing cross-domain solutions; S0690 performing midpoint collection data analysis; S0702 defining an operational environment; S0704 performing target analysis; S0765 converting intelligence requirements into intelligence production tasks; S0777 developing collection strategies; S0779 determining information requirements; S0789 coordinating collection support; S0811 managing intelligence collection requirements

### Out of scope for this audience (3)

S0118 developing machine understandable semantic ontologies; S0400 creating programming languages; S0405 pricing products

### Redundant with a clearer skill (2)

S0825 communicating with engineering staff; S0882 performing static analysis

---

## 12. New roles, new skills, and role changes (2026-10-19)

Second data pass, part 3. All proposed additions and all proposed changes to existing roles were approved. The fork now has **49 Work Roles and 421 skills**. Everything here is in `data/role-changes.json`, applied by `scripts/apply_role_changes.py`, which fails if a role merge drops a mapping, if any skill is left without a role, or if any role is left without skills.

### Authored content, not NIST-sourced

This pass deliberately goes beyond NICE. Per an earlier traceability concern about the thin and empty parts of the source framework, every new element is marked as authored: it carries `MHP_SKILLS_GRAPH_FORK_1_0` as its `doc_identifier` instead of NIST's, and new skills use IDs from **S9001** up, outside NIST's numbering. New skill names are vendor-neutral by decision; specific products belong in optional tags later, not in skill names.

### New Work Roles (9)

| ID | Role | Category | Starter skills |
|---|---|---|---|
| DD-WRL-011 | Cloud Security Engineering | DD | 9 plus cross-mappings |
| IO-WRL-008 | Identity and Access Management | IO | 9 plus cross-mappings |
| PD-WRL-010 | Detection Engineering | PD | 9 plus cross-mappings |
| PD-WRL-011 | Threat Hunting | PD | 9 plus cross-mappings |
| DD-WRL-012 | Application Security | DD | 9 plus cross-mappings |
| DD-WRL-013 | DevSecOps | DD | 8 plus cross-mappings |
| OG-WRL-019 | GRC Analysis | OG | 8 plus cross-mappings |
| OG-WRL-020 | Security Awareness | OG | 6 plus cross-mappings |
| IO-WRL-009 | Cyber Range Engineering | IO | 7 plus cross-mappings |

Each new role has a job-titles entry. None has a feeder pathway or color-wheel entry yet; both companion files predate them.

### New skills (50)

- **Foundations:** Linux administration (S9001), Windows administration (S9002), Active Directory (S9003), TCP/IP (S9004), DNS (S9005), Firewall management (S9006), Python (S9007), PowerShell (S9008), Bash (S9009), Regex (S9010), Version control (S9011)
- **Cloud:** Cloud IAM (S9012), Container security (S9013), Kubernetes security (S9014), Infrastructure as code (S9015), Cloud posture management (S9016)
- **Identity:** SSO and federation (S9017), MFA (S9018), Privileged access management (S9019), Identity lifecycle (S9020)
- **Defense:** SIEM operation (S9021), Alert triage (S9022), EDR operation (S9023), Detection rules (S9024), Threat hunting (S9025), Hypothesis-driven investigation (S9026), ATT&CK mapping (S9027), Phishing analysis (S9028), Email security (S9029), Sandbox analysis (S9030)
- **Offense:** Web app testing (S9031), API testing (S9032), Privilege escalation (S9033), Active Directory attacks (S9034), Phishing simulation (S9035), Pentest reporting (S9036), Scenario design (S9037)
- **AppSec:** API security (S9038), Dependency scanning (S9039), CI/CD security (S9040), Secrets management (S9041)
- **GRC:** Framework mapping (S9042), Audit evidence collection (S9043), Vendor risk assessment (S9044), Compliance metrics (S9045), Program metrics (S9046)
- **AI:** Prompt injection testing (S9047), LLM red teaming (S9048), AI governance (S9049), Model supply chain review (S9050)

### Role merges (5)

Mappings follow the merge: every skill, task, and knowledge statement on a merged role moves to the role it merges into. Job titles are combined, pathway targets re-pointed, and color-wheel entries for merged roles dropped.

- OG-WRL-009 Product Support Management, OG-WRL-011 Secure Project Management, and OG-WRL-015 Technology Portfolio Management into OG-WRL-010, retitled **Security Program Management**. These were federal sustainment and portfolio distinctions a student would not recognize, and OG-WRL-015 had no skills left after the cuts.
- OG-WRL-016 Technology Program Auditing into OG-WRL-012 IT/Security Controls Auditor.
- IN-WRL-002 Digital Evidence Analysis into PD-WRL-002 Digital Forensics. Investigation (IN) now holds only Cybercrime Investigation.

### Other role changes

- **IT/Security Controls Auditor trimmed from 84 to 41 skills** (after absorbing Technology Program Auditing). The cross-domain breadth noted in section 8 made it light up a little for everyone and fully for no one. Kept: audit, assessment, control, policy, regulatory, vulnerability, evidence, and reporting skills, plus the new Framework mapping and Audit evidence collection. Every dropped skill is still on at least one other role.
- **Threat Analysis retitled Cyber Threat Intelligence**, description rewritten, and given OSINT, ATT&CK mapping, Threat hunting, and Threat actor assessment.
- **Security Compliance Monitoring** went from 0 to 8 skills. **Penetration Testing and Red Teaming** went from 3 to 21. Cybersecurity Legal Advice, AI/ML Security, Malware Analysis and Reverse Engineering, and Defensive Cybersecurity (the SOC analyst role in practice) were also filled out.
- **Exploitation detection (S0519)** moved off Cybersecurity Policy and Planning and Cybersecurity Workforce Management onto Defensive Cybersecurity and Incident Response.
- Descriptions rewritten for Cybercrime Investigation (dropped "cyberspace intrusion") and Digital Forensics (now covers the merged evidence-analysis work).

### Still open

- Four skills marked for rewording (S0436, S0707, S0719, S0739) are still under review.
- Short display names for all skills are proposed but not yet applied.
- Backgrounds and pathways are deferred until roles and skills settle.

---

## 13. Short skill names (2026-10-19)

Second data pass, part 4. Every skill now has a short, vendor-neutral display name of four words or fewer, all unique. All 371 NIST-sourced names were approved in the skills data review (including the four intel-flavored skills reworded for threat intelligence: S0436 Threat intel reporting, S0707 Security program assessment, S0719 Intelligence gap analysis, S0739 Threat intel analysis). The 50 authored skills already carried short names.

- **Data:** the name goes in each skill's `title` (empty in NIST's file); the original statement stays in `text`. Names are in `data/skill-names.json`, applied by `scripts/apply_skill_names.py`. `scripts/etl.py` now emits `title` for every skill and fails if any skill lacks one.
- **App:** the graph, skill picker, checklist, and applied-filter chips show the short name. The picker and checklist show the full statement on hover. Skill search matches either the name or the statement. The graph canvas has no hover behavior yet, so nodes show the name only.

---

## 14. Color system and a role removal (2026-10-20)

**Color tags.** Every skill carries one color tag (`data/skill-colors.csv`, validated by `scripts/check_skill_colors.py`). Roles are not tagged: a role's color mix, label, and position are derived from the tags of its skills (`scripts/color_layout.py`), with the middle (non-security) skills left out of the mix. The wheel runs red, purple, blue, green, yellow, orange, white.

| Color | Meaning |
|---|---|
| Red | offense: attacking, testing, breaking |
| Purple | turning findings into fixes: threat hunting, purple teaming, adversary emulation for defense |
| Blue | defense: monitoring, threat intel, DFIR (groups: monitoring, threat intel, forensics, incident response) |
| Green | securing and automating infrastructure and operations |
| Yellow | securing software as it's built, including product security |
| Orange | teaching security, technical and awareness |
| White | security governance, risk, compliance, and leadership |
| Middle | non-security skills, technical or not |

Calls worth knowing: generic building skills (testing, architecture, requirements, programming) are Middle, not Yellow; vulnerability scanning is Blue (monitoring); vulnerability triage and patching are Purple; leadership skills are White. Tags are a first pass and expected to evolve.

**Role removed: DD-WRL-007 Systems Testing and Evaluation.** A military test-and-evaluation job with no general-industry equivalent. Its job titles, color entry, and pathway target were removed with it, and the "QA / Test Engineer" background keeps its other target. Skills, tasks, and knowledge that no other role used were cut with it: 9 skills (Integration testing, Test scenario design, Test readiness reviews, Test infrastructure planning, Test asset management, Test resource estimation, Test result analysis, Performance specification analysis, Analysis pipeline design) and 13 tasks. Eleven skills it shared with other roles stay. Applied by the new `removeRoles` step in `scripts/apply_role_changes.py`.

**Counts after this pass:** 48 Work Roles, 412 skills.

---

## 15. Roles restructured to real job titles (2026-10-20)

Test applied to every role: it must be a job title that people are hired under and that can be researched in job postings, not a category of skills or a government function. 48 roles became 30, each named as a job title.

**Merged** (the old roles were categories, or already shared one title):
- Secure Software Development, Software Security Assessment, Application Security -> **Application Security Engineer**
- Cybersecurity Architecture, Enterprise Architecture -> **Security Architect**
- Secure Systems Development, Infrastructure Support -> **Security Engineer**
- Cybersecurity Policy and Planning, GRC Analysis, Security Compliance Monitoring -> **GRC Analyst**
- Systems Security Analysis -> **SOC Analyst** (renamed from Defensive Cybersecurity)
- Cybersecurity Workforce Management -> **Security Program Manager**

**Removed:**
- General IT and data jobs that are not security roles (most already exist as Background options): Database Administration, Knowledge Management, Data Analysis, Technical Support, Network Operations, Systems Administration, Systems Requirements Planning.
- Too government-specific: Systems Authorization, Systems Security Management, Cybercrime Investigation.
- Systems Testing and Evaluation was removed earlier the same day (section 14).

**Skills:** 31 skills that only the removed roles used were cut, mostly general IT, database, and data-science skills. 16 that apply to security work were rehomed to surviving roles first (for example Digital media examination to Digital Forensics Analyst, Network mapping to Penetration Tester). 174 tasks and 66 knowledge items used only by removed roles were cut with them. The cuts are not shown in the app today.

**Renamed to job-title form:** Cloud Security Engineer, DevSecOps Engineer, OT Security Engineer, AI Security Engineer, IAM Engineer, Cyber Range Engineer, Security Researcher, CISO, Cybersecurity Counsel, Privacy Analyst, IT Auditor, Third-Party Risk Analyst, Security Program Manager, Security Awareness Manager, Security Instructional Designer, Security Instructor, Digital Forensics Analyst, Incident Responder, Insider Risk Analyst, Threat Intelligence Analyst, Vulnerability Management Analyst, Penetration Tester, Malware Analyst, Detection Engineer, Threat Hunter.

**Job titles** on the merged roles were trimmed to security jobs only. Titles have not been validated against postings.

**Counts after this pass:** 30 Work Roles, 381 skills. The Investigation category now has no roles.
