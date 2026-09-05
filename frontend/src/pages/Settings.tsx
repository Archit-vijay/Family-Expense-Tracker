import ContentState from "../components/ContentState";

function Settings() {
  return (
    <div className="page-enter">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#77738a]">
        Preferences
      </p>
      <h2 className="text-2xl font-bold text-[#2a234f]">
        Settings
      </h2>

      <div className="mt-6 rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-sm sm:p-6">
        <ContentState
          variant="empty"
          title="Settings are not available yet"
          description="Account and family preferences will be added in a future phase."
        />
      </div>
    </div>
  );
}

export default Settings;
