import { useEffect, useState } from "react";
import ContentState from "../components/ContentState";

function Reports() {
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
          Insights
        </p>
        <h2 className="text-2xl font-bold text-[#2a234f]">
          Reports
        </h2>
      </section>

      {isLoading ? (
        <ContentState
          variant="loading"
          title="Loading financial reports"
          description="Gathering spending history and family metrics..."
        />
      ) : (
        <div className="rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-sm sm:p-6 fade-up">
          <ContentState
            variant="empty"
            title="Reports are coming soon"
            description="Reports will turn your transaction history into useful family-finance insights."
          />
        </div>
      )}
    </div>
  );
}

export default Reports;
