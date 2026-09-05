import ContentState from "../components/ContentState";

function Budgets() {
  return (
    <div className="page-enter">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#77738a]">
        Planning
      </p>
      <h2 className="text-2xl font-bold text-[#2a234f]">
        Budgets
      </h2>

      <div className="mt-6 rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-sm sm:p-6">
        <ContentState
          variant="empty"
          title="Budgets are coming next"
          description="Budget planning will help your family set spending limits and track progress by category."
        />
      </div>
    </div>
  );
}

export default Budgets;
