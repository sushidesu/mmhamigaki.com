import { newHttpBatchRpcSession } from "capnweb";
import type { CreateContentInput, UpdateContentInput, ContentRecord } from "../types/admin";

// AdminApiServerの型定義（クライアント用）
interface AdminApi {
  createContent(data: CreateContentInput): Promise<ContentRecord>;
  updateContent(id: string, data: UpdateContentInput): Promise<ContentRecord>;
  deleteContent(id: string): Promise<void>;
  listContents(): Promise<ContentRecord[]>;
  getContentById(id: string): Promise<ContentRecord>;
}

export function getAdminApi() {
  return newHttpBatchRpcSession<AdminApi>("/api/admin");
}
