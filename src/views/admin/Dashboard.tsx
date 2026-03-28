import type { BlogPostWithContent } from "../../db/schema";

type Props = {
  posts: BlogPostWithContent[];
};

export function AdminDashboard({ posts }: Props) {
  return (
    <div>
      <h1>管理画面</h1>
      <a href="/admin/blog/new">新規作成</a>
      <table>
        <thead>
          <tr>
            <th>タイトル</th>
            <th>スラッグ</th>
            <th>ステータス</th>
            <th>作成日</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id}>
              <td>{post.title}</td>
              <td>{post.slug}</td>
              <td>{post.status}</td>
              <td>{new Date(post.created_at).toLocaleDateString("ja-JP")}</td>
              <td>
                <a href={`/admin/blog/${post.id}/edit`}>編集</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
