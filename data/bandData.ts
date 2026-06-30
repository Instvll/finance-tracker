export type SongStatus =
  | "Writing"
  | "Pre-Production"
  | "Recording"
  | "Mixing"
  | "Mastering"
  | "Finished";

export type TaskStatus = "To Do" | "In Progress" | "Done";

export type Priority = "Low" | "Normal" | "High";

export type Song = {
  title: string;
  status: SongStatus | string;
  bpm: string;
  tuning: string;
  key: string;
  latestVersion: string;
  nextStep: string;
  href: string;
};

export type Task = {
  person: string;
  task: string;
  song: string;
  status: TaskStatus;
  priority?: Priority;
  dueDate?: string;
};

export type FileItem = {
  name: string;
  song: string;
  type: string;
  version: string;
  uploadedBy: string;
  note: string;
  link: string;
};

export type Note = {
  title: string;
  category: string;
  text: string;
};

export type Update = {
  title: string;
  category: string;
  date: string;
  text: string;
};

export type Resource = {
  title: string;
  category: string;
  description: string;
  steps: string[];
  examples?: string[];
};

export const songs: Song[] = [
  {
    title: "Anomaly",
    status: "Mixing/Mastering",
    bpm: "137",
    tuning: "Drop C#",
    key: "C#",
    latestVersion: "v1",
    nextStep: "Start final mastering on Anomaly",
    href: "/songs/anomaly",
  },
  {
    title: "Event, Horizon",
    status: "Writing",
    bpm: "TBD",
    tuning: "TBD",
    key: "TBD",
    latestVersion: "v1",
    nextStep: "TBD",
    href: "/songs",
  },
  {
    title: "The Vigilante",
    status: "Writing",
    bpm: "TBD",
    tuning: "TBD",
    key: "TBD",
    latestVersion: "v1",
    nextStep: "TBD",
    href: "/songs",
  },
];

export const tasks: Task[] = [];

export const files: FileItem[] = [
  {
    name: "Anomaly Project ZIP",
    song: "Anomaly",
    type: "Ableton Project",
    version: "v1",
    uploadedBy: "Dylan",
    note: "Latest full project folder.",
    link: "#",
  },
  {
    name: "Anomaly Bass DI",
    song: "Anomaly",
    type: "Raw Mono WAV",
    version: "v1",
    uploadedBy: "Bassist",
    note: "Clean mono bass recording.",
    link: "#",
  },
  {
    name: "Anomaly Reference Mix",
    song: "Anomaly",
    type: "MP3",
    version: "v1",
    uploadedBy: "Dylan",
    note: "Current mix reference.",
    link: "#",
  },
];

export const notes: Note[] = [
  {
    title: "Anomaly Mix Notes",
    category: "Mixing",
    text: "Check the bass and kick relationship, then make sure the chorus does not overload the limiter.",
  },
  {
    title: "Artwork Direction",
    category: "Visuals",
    text: "Keep the Hollows visual style clean, dark, memorable, and professional without looking corny.",
  },
];

export const updates: Update[] = [
  {
    title: "Hollows Hub theme updated",
    category: "Website",
    date: "Recent",
    text: "The site now uses a darker charcoal and cream visual style that matches the Hollows logo.",
  },
  {
    title: "Resources page added",
    category: "Workflow",
    date: "Recent",
    text: "Added a resources section for project upload steps, freezing tracks, raw DI exports, and file naming rules.",
  },
  {
    title: "Anomaly workspace cleaned up",
    category: "Song",
    date: "Recent",
    text: "The Anomaly page now focuses on files, mix notes, tasks, quick info, and practice export reminders.",
  },
];

export const anomalyMixNotes: string[] = [
  "Check that the bass supports the kick without masking it.",
  "Make sure rhythm guitars do not overpower the chorus vocal space.",
  "Compare the loudest chorus against the current reference mix.",
  "Watch true peak and limiter behavior during the loudest chorus.",
  "Make sure the backing track export does not include the muted guitar part.",
];

export const resources: Resource[] = [
  {
    title: "Freeze Tracks in Ableton",
    category: "Ableton",
    description:
      "Use this when a project has plugins or processing that other members may not have.",
    steps: [
      "Open the Ableton project.",
      "Make sure all tracks are named clearly.",
      "Right-click any track that uses plugins or heavy processing.",
      "Select Freeze Track.",
      "Wait for Ableton to finish freezing the audio.",
    ],
  },
  {
    title: "Prepare a Project for Upload",
    category: "Project Sharing",
    description:
      "Use this before sending an Ableton project folder to the band through Google Drive.",
    steps: [
      "Freeze any tracks that use plugins other members may not have.",
      "Open the File menu in Ableton.",
      "Select Collect All and Save.",
      "Choose Yes for each file type Ableton asks to collect.",
      "Close Ableton and locate the project folder on your computer.",
      "Compress the full project folder into a ZIP file.",
      "Upload the ZIP file to Google Drive.",
    ],
  },
  {
    title: "Naming The File",
    category: "Organization",
    description:
      "Use clear file names so everyone knows exactly what each file is.",
    steps: [
      "Use the song name first.",
      "Include the date of the file.",
      "Include the time of the file.",
    ],
    examples: [
      "Anomaly (6.30.26) (4.32PM)",
      "Anomaly (6.30) (4.32PM)",
    ],
  },
];