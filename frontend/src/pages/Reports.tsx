import ContentState from "../components/ContentState";

function Reports() {
  return (
    <div className="page-enter">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#77738a]">
        Insights
      </p>
      <h2 className="text-2xl font-bold text-[#2a234f]">
        Reports
      </h2>

      <div className="mt-6 rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-sm sm:p-6">
        <ContentState
          variant="empty"
          title="Reports are coming soon"
          description="Reports will turn your transaction history into useful family-finance insights."
        />
      </div>
    </div>
  );
}

export default Reports;
