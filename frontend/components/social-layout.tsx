import MobileMenu from './mobile-menu';
import Sidebar from './sidebar';
import Widgets from './widgets';

export default function SocialLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="social-grid">
            {/* Left Sidebar */}
            <div className="social-sidebar">
                <Sidebar />
            </div>

            {/* Main Feed */}
            <main className="social-main">
                {children}
            </main>

            {/* Right Widgets */}
            <div className="social-widgets">
                <Widgets />
            </div>

            {/* Mobile Menu (Floating FAB) */}
            <MobileMenu />
        </div>
    );
}
