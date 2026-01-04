import { createRoute } from "honox/factory";
import { AdminLayout } from "../../../components/AdminLayout";
import ContentForm from "../../../islands/ContentForm";

export default createRoute(async (c) => {
  return c.render(
    <AdminLayout>
      <ContentForm />
    </AdminLayout>,
  );
});
