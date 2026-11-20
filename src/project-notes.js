// Engineering notes drawn from the documented project records.
// These describe constraints and approaches, not invented failure anecdotes.
export const projectNotes = {
  'school-erp': {
    constraint: 'Students, faculty, and administrators share academic records, but need different permissions and workflows.',
    decision: 'Model the relationships between users, classes, attendance, homework, and fees, then connect them through role-based interfaces. MongoDB Atlas stores data; Cloudinary handles uploaded media.',
    boundary: 'The ERP is still in development. Database migrations and VPS deployment were explored as future options, not completed work.',
    sketch: ['Student / faculty / admin', 'Permission checks', 'Academic records', 'Uploaded media'],
  },
  manoviz: {
    constraint: 'An instruction-cycle diagram needs to stay understandable when its registers, buses, and timing states become physical LEDs.',
    decision: 'Map LED regions to architectural signals and use the ESP32 firmware to illuminate fetch, decode, and execution steps in sequence.',
    boundary: 'This is a working teaching prototype with several hardware iterations. The LED count is not presented as one fixed final specification.',
    sketch: ['Instruction', 'Timing T0–T6', 'Register / bus signals', 'LED visualization'],
  },
  codeoracle: {
    constraint: 'Understanding a codebase, explaining dependencies, generating tests, and suggesting refactors must fit into one developer workflow.',
    decision: 'Combine source inspection with LLM requests, then organize the results into explanations, a dependency graph, tests, and refactored code.',
    boundary: 'The reported coverage and request-time improvements are development observations from the hackathon work, not benchmarks for arbitrary repositories.',
    sketch: ['Source code', 'Inspection + LLM', 'Explanation / graph', 'Tests / refactor'],
  },
  interviewspar: {
    constraint: 'Team-developed interview, coding, resume, and feedback modules need a coherent user journey and shared application flow.',
    decision: 'Plan the integration around a preparation dashboard, split-screen interview experience, coding rounds, and resume intelligence connected to MongoDB Atlas.',
    boundary: 'The record includes developed modules and designed screens. A complete, unified production deployment has not been verified.',
    sketch: ['Preparation dashboard', 'Interview / coding', 'Resume intelligence', 'Feedback'],
  },
  prezon: {
    constraint: 'A portable classroom attendance device has to account for identity, session state, sensor behavior, and interrupted connectivity.',
    decision: 'Explore ESP32-based fingerprint input and a teacher-led session flow, with local records and later API synchronization as the planned offline-first architecture.',
    boundary: 'Sensor interfacing and hardware prototyping are documented. The full rechargeable handheld unit and end-to-end offline synchronization are not confirmed as completed.',
    sketch: ['Faculty session', 'Fingerprint input', 'Local records', 'Planned API sync'],
  },
  portfolio: {
    constraint: 'A liquid opening and playful motion must coexist with readable content, project navigation, and different motion preferences.',
    decision: 'Keep the fluid simulation separate from document layout, pause settled or offscreen rendering, and provide static and reduced-motion fallbacks.',
    boundary: 'Project artwork is conceptual illustration. Hash-based case studies share the main portfolio’s social-preview image rather than individual preview pages.',
    sketch: ['Pointer / scroll', 'Fluid + motion', 'Project stories', 'Static fallback'],
  },
};
