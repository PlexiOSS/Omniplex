import { getKbSearchIndex } from "@/lib/kb/content";
import { NewTicketForm } from "./NewTicketForm";

export default function NewTicketPage() {
  return <NewTicketForm articles={getKbSearchIndex()} />;
}
