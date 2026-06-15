# VidyaSetu Persona Test Matrix

The Slice 6 benchmark covers the learner diversity expected by the problem statement: rural, disadvantaged, first-generation, school, vocational, informal, college, and job-ready users.

| Persona | Input Type | Expected Behavior |
| --- | --- | --- |
| Class 8 student | School support | Builds a school-study journey, not a job pathway. |
| Class 12 boards student | Academic exam prep | Builds board-focused plan with study schedule and subject support. |
| JEE goal switch | Conversation update | Replaces old data-science job intent with entrance-exam intent. |
| Dropout tailoring worker | Informal skill validation | Builds proof-first pathway before local work/outreach. |
| Mobile repair learner | Vocational training | Builds training and practice pathway with commute/location awareness. |
| College data science aspirant | Career pathway | Builds data-science readiness, portfolio proof, and later outreach readiness. |
| ITI electrician | Job-ready placement | Allows opportunity matching and outreach because proof/skill exists. |
| No-location training user | Missing-fact guard | Avoids inventing offline local options and asks for location or online route. |

## Non-Negotiable Checks

- Counselor reply must be contextual and useful, not a repeated hardcoded acknowledgement.
- Profile facts must update from the latest learner message.
- Study users must not be forced into jobs.
- Job-ready users must not be blocked by study-only copy.
- Location-sensitive offline suggestions must require location or safe travel information.
- Learning Journey must be completable by a low-literacy user with clear next actions.
- Progress and proof must persist by phone login.
- Skill Passport must reflect real journey/proof progress.

