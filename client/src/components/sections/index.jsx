import NoticeSection from "./NoticeSection.jsx";
import ScheduleSection from "./ScheduleSection.jsx";
import RegistrationSection from "./RegistrationSection.jsx";
import GamesSection from "./GamesSection.jsx";
import GallerySection from "./GallerySection.jsx";
import HistorySection from "./HistorySection.jsx";
import CustomSection from "./CustomSection.jsx";
import ContactSection from "./ContactSection.jsx";

const REGISTRY = {
  notice: NoticeSection,
  schedule: ScheduleSection,
  registration: RegistrationSection,
  games: GamesSection,
  gallery: GallerySection,
  history: HistorySection,
  custom: CustomSection,
  contact: ContactSection,
};

export default function SectionRenderer({ section, eventSlug }) {
  if (!section.enabled) return null;
  const Component = REGISTRY[section.kind];
  if (!Component) return null;
  return <Component title={section.title} data={section.data} eventSlug={eventSlug} />;
}