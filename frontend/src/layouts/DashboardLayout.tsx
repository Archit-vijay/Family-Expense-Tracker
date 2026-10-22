import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import MobileHeader from "../components/MobileHeader";
import ErrorBoundary from "../components/ErrorBoundary";

function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="h-screen overflow-hidden bg-[#f8f7fb]">
      <div className="flex h-full">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <MobileHeader />

          <main className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8 xl:p-10">
              <ErrorBoundary>
                <div key={location.pathname} className="page-enter">
                  <Outlet />
                </div>
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
