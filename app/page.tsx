import DashboardPage from './(dashboard)/page';
import DashboardLayout from './(dashboard)/layout';

// Trang chủ: luôn render dashboard.
// Middleware + NextAuth sẽ quyết định cho vào hay redirect về /login tùy theo session.
export default function HomePage() {
    return (
        <DashboardLayout>
            <DashboardPage />
        </DashboardLayout>
    );
}
