import { client } from "../client";
import type { ChangelogList, ChangelogProject } from "../types";

export const changelogsResource = {
  getAll: (project?: ChangelogProject) =>
    client.get<ChangelogList>(
      `/changelogs/@all${project ? `?project=${project}` : ""}`,
      { cache: "no-store" },
    ),
};
