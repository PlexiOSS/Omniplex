import { client } from "../client";
import type { Task, TaskCreateResponse } from "../types";

export const dataResource = {
  /** delete=false requests an export, delete=true requests account deletion. Both are async — poll getTask for the result. */
  createTask: (userId: string, del: boolean, token: string) =>
    client.post<TaskCreateResponse>(
      `/users/${userId}/data?delete=${del}`,
      undefined,
      { token },
    ),

  /** AuthOptional server-side — pass token when you have one, but a data_delete task stays pollable without one. task_key is always required, it's checked against the task row regardless of auth state. */
  getTask: (userId: string, taskId: string, taskKey: string, token?: string) =>
    client.get<Task>(
      `/users/${userId}/tasks/${taskId}?task_key=${encodeURIComponent(taskKey)}`,
      { token, cache: "no-store" },
    ),
};
