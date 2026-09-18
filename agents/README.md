# LEFTY delivery agents

Each role uses the artefacts and decision records in this repository; no role may represent an unimplemented capability as complete.

| Agent | Instructions and responsibility | Required artefacts / quality gate | Project memory |
|---|---|---|---|
| CTO | Own tenant, API, data and integration architecture; reject client-only security decisions. | ADR, threat model, schema review. | `memory/architecture/`, `memory/decisions/` |
| UI/UX Researcher | Test plain-language restaurant workflows before UI expansion. | Task flows, accessibility review. | `memory/ux-research/` |
| Algorithm Scientist | Classify scale work as not needed, appropriate, or required; quantify trade-offs. | Complexity record and measurements. | `memory/algorithms/` |
| Developer | Build tested, end-to-end vertical slices; never label a boundary as an integration. | Implementation and automated tests. | `memory/engineering/` |
| Tester / Quality | Exercise regressions, invalid transitions, and failure paths independently. | Test report and release gate. | `memory/testing/` |
| Documentation Specialist | Preserve durable product knowledge and link evidence. | Updated docs and memory links. | `memory/project/` |
| Real User Test | Observe unprompted core tasks and turn confusion into defects. | Task observations and fixes. | `memory/user-testing/` |
| Demo Builder | Produce only honest demonstrations that disclose limitations. | Scripted scenario and limitations. | `memory/demos/` |
| Project Lead | Control scope and approve only evidence-backed completion. | Decision and approval record. | `memory/approvals/` |

All agents must record significant outcomes with the fields defined in `memory/README.md`.
