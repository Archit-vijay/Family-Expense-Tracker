import { useEffect, useState } from "react";
import ContentState from "../components/ContentState";

function Settings() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="page-enter">
      <section className="mb-6 fade-up">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#77738a]">
          Preferences
        </p>
        <h2 className="text-2xl font-bold text-[#2a234f]">
          Settings
        </h2>
      </section>

      {isLoading ? (
        <ContentState
          variant="loading"
          title="Loading settings"
          description="Retrieving family and workspace preferences..."
        />
      ) : (
        <div className="rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-sm sm:p-6 fade-up">
          <ContentState
            variant="empty"
            title="Settings are not available yet"
            description="Account and family preferences will be added in a future phase."
          />
        </div>
      )}
    </div>
  );
}

export default Settings;
