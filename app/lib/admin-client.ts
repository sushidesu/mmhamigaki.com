import { newHttpBatchRpcSession } from "capnweb";
import type { CreatePostInput, UpdatePostInput } from "../types/admin";

// AdminApiServerの型定義（クライアント用）
interface AdminApi {
  createPost(data: CreatePostInput): Promise<any>;
  updatePost(id: string, data: UpdatePostInput): Promise<any>;
  deletePost(id: string): Promise<void>;
  listPosts(): Promise<any[]>;
  getPostById(id: string): Promise<any>;
}

export function getAdminApi() {
  return newHttpBatchRpcSession<AdminApi>("/api/admin");
}
