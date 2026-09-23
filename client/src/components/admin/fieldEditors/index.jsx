import NoticeEditor from "./NoticeEditor.jsx";
import ScheduleEditor from "./ScheduleEditor.jsx";
import RegistrationEditor from "./RegistrationEditor.jsx";
import GamesEditor from "./GamesEditor.jsx";
import GalleryEditor from "./GalleryEditor.jsx";
import HistoryEditor from "./HistoryEditor.jsx";
import ContactEditor from "./ContactEditor.jsx";
import CustomEditor from "./CustomEditor.jsx";

export const FIELD_EDITORS = {
  notice: NoticeEditor,
  schedule: ScheduleEditor,
  registration: RegistrationEditor,
  games: GamesEditor,
  gallery: GalleryEditor,
  history: HistoryEditor,
  contact: ContactEditor,
  custom: CustomEditor,
};

export const SECTION_KINDS = [
  { value: "notice", label: "Notices / Announcements", defaultData: { notices: [] } },
  { value: "schedule", label: "Schedule / Agenda", defaultData: { items: [] } },
  {
    value: "registration",
    label: "Registration",
    defaultData: { mode: "googleForm", googleFormUrl: "", externalUrl: "", fields: [] },
  },
  { value: "games", label: "Team Game Portal", defaultData: { intro: "", enabled: true } },
  { value: "gallery", label: "Photo Gallery", defaultData: { photos: [] } },
  { value: "history", label: "History", defaultData: { entries: [] } },
  { value: "contact", label: "Contact", defaultData: { name: "", role: "", email: "", phone: "" } },
  { value: "custom", label: "Custom HTML", defaultData: { html: "" } },
];

export function defaultDataFor(kind) {
  const found = SECTION_KINDS.find((s) => s.value === kind);
  return found ? { ...found.defaultData } : {};
}

export function labelFor(kind) {
  const found = SECTION_KINDS.find((s) => s.value === kind);
  return found ? found.label : kind;
}