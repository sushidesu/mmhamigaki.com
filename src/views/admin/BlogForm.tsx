import type { BlogPostWithContent } from "../../db/schema";

type Props = {
  post?: BlogPostWithContent;
};

export function BlogForm({ post }: Props) {
  const isEdit = post !== undefined;
  const action = isEdit ? `/admin/blog/${post.id}` : "/admin/blog";

  return (
    <div>
      <h1>{isEdit ? "記事を編集" : "新規作成"}</h1>
      <a href="/admin">← 一覧に戻る</a>
      <form method="post" action={action}>
        <div>
          <label for="title">タイトル</label>
          <input type="text" id="title" name="title" required value={post?.title ?? ""} />
        </div>
        <div>
          <label for="slug">スラッグ</label>
          <input type="text" id="slug" name="slug" required value={post?.slug ?? ""} />
        </div>
        <div>
          <label for="status">ステータス</label>
          <select id="status" name="status">
            <option value="draft" selected={post?.status !== "published"}>
              下書き
            </option>
            <option value="published" selected={post?.status === "published"}>
              公開
            </option>
          </select>
        </div>
        <div>
          <label for="excerpt">抜粋</label>
          <input type="text" id="excerpt" name="excerpt" value={post?.excerpt ?? ""} />
        </div>
        <div>
          <label for="cover_image_url">カバー画像URL</label>
          <input
            type="url"
            id="cover_image_url"
            name="cover_image_url"
            value={post?.cover_image_url ?? ""}
          />
        </div>
        <div>
          <label for="body">本文（Markdown）</label>
          <textarea id="body" name="body" required rows={20}>
            {post?.body ?? ""}
          </textarea>
        </div>
        <button type="submit">{isEdit ? "更新" : "作成"}</button>
      </form>
    </div>
  );
}
