import { createRoute } from "honox/factory";
import { AdminLayout } from "../../../components/AdminLayout";
import PostForm from "../../../islands/PostForm";

export default createRoute(async (c) => {
  const html = `<!DOCTYPE html>${AdminLayout({
    children: <PostForm />,
  })}`;

  return c.html(html);
});
