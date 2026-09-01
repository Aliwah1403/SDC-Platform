import { noindexMeta } from "../lib/meta";

export { default } from "@/pages/AccountDeletion/AccountDeletionPage";

export const meta = () => [
  { title: "Delete your Hemo account" },
  ...noindexMeta(),
];
