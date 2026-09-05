import { useEffect, useState } from "react";
import {
  Edit3,
  Loader2,
  Plus,
  Trash2,
  X,
  MoreVertical,
} from "lucide-react";

import {
  createFamilyMember,
  getFamilyMembers,
  updateFamilyMember,
  deactivateFamilyMember,
  type FamilyMember,
} from "../services/familyMemberService";
import ContentState from "../components/ContentState";

function Family() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingMember, setEditingMember] =
    useState<FamilyMember | null>(null);

  const [memberName, setMemberName] = useState("");

  const [isAdding, setIsAdding] = useState(false);

  const [modalError, setModalError] = useState("");

  const [menuMemberId, setMenuMemberId] =
    useState<number | null>(null);

  const [removingMember, setRemovingMember] =
    useState<FamilyMember | null>(null);

  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    async function loadMembers() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getFamilyMembers();

        setMembers(data);
      } catch (error) {
        console.error(
          "Failed to load family members:",
          error,
        );

        setError("Unable to load family members.");
      } finally {
        setIsLoading(false);
      }
    }

    loadMembers();
  }, []);

  function openAddModal() {
    setEditingMember(null);
    setMemberName("");
    setModalError("");
    setIsModalOpen(true);
  }

  function openEditModal(member: FamilyMember) {
    setEditingMember(member);
    setMemberName(member.name);
    setModalError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isAdding) return;

    setIsModalOpen(false);
    setMemberName("");
    setModalError("");
    setEditingMember(null);
  }

  async function handleSaveMember(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const name = memberName.trim();

    if (!name) {
      setModalError(
        "Please enter a family member name.",
      );
      return;
    }

    try {
      setIsAdding(true);
      setModalError("");

      if (editingMember) {
        const updatedMember =
          await updateFamilyMember(
            editingMember.id,
            name,
          );

        setMembers((currentMembers) =>
          currentMembers.map((member) =>
            member.id === updatedMember.id
              ? updatedMember
              : member,
          ),
        );
      } else {
        const newMember =
          await createFamilyMember(name);

        setMembers((currentMembers) => [
          ...currentMembers,
          newMember,
        ]);
      }

      setIsModalOpen(false);
      setMemberName("");
      setEditingMember(null);
    } catch (error) {
      console.error(
        "Failed to save family member:",
        error,
      );

      setModalError(
        error instanceof Error
          ? error.message
          : "Unable to save family member.",
      );
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRemoveMember() {
    if (!removingMember) return;

    try {
      setIsRemoving(true);

      await deactivateFamilyMember(
        removingMember.id,
      );

      setMembers((currentMembers) =>
        currentMembers.filter(
          (member) =>
            member.id !== removingMember.id,
        ),
      );

      setRemovingMember(null);
      setMenuMemberId(null);
    } catch (error) {
      console.error(
        "Failed to remove family member:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to remove family member.",
      );
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <div className="page-enter">
      {/* Header */}
      <section className="mb-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#77738a]">
              Family
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-[#2a234f] sm:text-4xl">
              Family members
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#77738a] sm:text-base">
              Manage the people in your family and
              keep track of who makes each
              transaction.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="
              inline-flex items-center justify-center gap-2
              rounded-xl bg-[#2a234f]
              px-4 py-3
              text-sm font-semibold text-white
              shadow-lg shadow-[#2a234f]/10
              transition-all duration-200
              hover:-translate-y-0.5
              hover:bg-[#1f1a3b]
              hover:shadow-xl hover:shadow-[#2a234f]/20
              active:translate-y-0
              active:scale-[0.98]
            "
          >
            <Plus size={18} />
            Add member
          </button>
        </div>
      </section>

      {/* Members */}
      <section className="rounded-2xl border border-[#e8e5ef] bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-bold text-[#2a234f]">
            Your family
          </h2>

          <p className="mt-1 text-xs text-[#77738a]">
            {members.length}{" "}
            {members.length === 1
              ? "member"
              : "members"}
          </p>
        </div>

        {isLoading ? (
          <ContentState
            variant="loading"
            title="Loading family members"
            description="Getting your household ready."
          />
        ) : error ? (
          <ContentState
            variant="error"
            title="Unable to load family members"
            description={error}
          />
        ) : members.length === 0 ? (
          <ContentState
            variant="empty"
            title="No family members yet"
            description="Add a family member to start assigning transactions to them."
          />
        ) : null}

        {/* Member list */}
        {!isLoading && !error && members.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="
                    group flex items-center gap-4
                    rounded-xl border border-[#e8e5ef]
                    bg-white p-4
                    transition-all duration-200
                    hover:-translate-y-0.5
                    hover:border-[#ffb3c3]
                    hover:shadow-md
                    hover:shadow-[#2a234f]/5
                  "
                >
                  {/* Avatar */}
                  <div
                    className="
                      flex h-11 w-11 shrink-0
                      items-center justify-center
                      rounded-full bg-[#ffb3c3]/20
                      text-sm font-bold text-[#2a234f]
                    "
                  >
                    {member.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-[#2a234f]">
                      {member.name}
                    </h3>

                    <p className="mt-0.5 text-xs text-[#77738a]">
                      Family member
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setMenuMemberId((current) =>
                          current === member.id
                            ? null
                            : member.id,
                        )
                      }
                      className="
                        rounded-lg
                        p-2
                        text-[#9a96a8]
                        transition-all
                        duration-200
                        hover:bg-[#f8f7fb]
                        hover:text-[#2a234f]
                        active:scale-95
                      "
                      aria-label={`Actions for ${member.name}`}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {/* Action menu */}
                    {menuMemberId === member.id && (
                      <div
                        className="
                          absolute
                          right-0
                          top-full
                          z-20
                          mt-2
                          w-36
                          origin-top-right
                          animate-[dropdown-in_150ms_ease-out]
                          rounded-xl
                          border
                          border-[#e8e5ef]
                          bg-white
                          p-1.5
                          shadow-xl
                          shadow-[#2a234f]/10
                        "
                      >
                        <button
                          type="button"
                          onClick={() => {
                            openEditModal(member);
                            setMenuMemberId(null);
                          }}
                          className="
                            flex w-full
                            items-center gap-2
                            rounded-lg
                            px-3 py-2.5
                            text-left
                            text-sm font-medium
                            text-[#77738a]
                            transition-colors
                            hover:bg-[#f8f7fb]
                            hover:text-[#2a234f]
                          "
                        >
                          <Edit3 size={16} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRemovingMember(member);
                            setMenuMemberId(null);
                          }}
                          className="
                            flex w-full
                            items-center gap-2
                            rounded-lg
                            px-3 py-2.5
                            text-left
                            text-sm font-medium
                            text-red-600
                            transition-colors
                            hover:bg-red-50
                          "
                        >
                          <Trash2 size={16} />
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
      </section>

      {/* Add / Edit member modal */}
      {isModalOpen && (
        <div
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            bg-[#2a234f]/50
            p-4
            backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="
              modal-enter
              w-full max-w-md
              overflow-hidden
              rounded-2xl
              border border-white/20
              bg-white
              shadow-2xl
            "
          >
            {/* Modal header */}
            <div className="flex items-start justify-between border-b border-[#e8e5ef] px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-[#2a234f]">
                  {editingMember
                    ? "Edit family member"
                    : "Add family member"}
                </h2>

                <p className="mt-1 text-xs text-[#77738a]">
                  {editingMember
                    ? "Update this family member's name."
                    : "Add someone to your family."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isAdding}
                className="
                  rounded-xl p-2
                  text-[#9a96a8]
                  transition-all duration-200
                  hover:bg-[#f8f7fb]
                  hover:text-[#2a234f]
                  active:scale-95
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSaveMember}
              className="p-5 sm:p-6"
            >
              {modalError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {modalError}
                </div>
              )}

              <div>
                <label
                  htmlFor="memberName"
                  className="mb-2 block text-xs font-semibold text-[#77738a]"
                >
                  Member name
                </label>

                <input
                  id="memberName"
                  type="text"
                  value={memberName}
                  onChange={(event) =>
                    setMemberName(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Mom, Dad, Rahul"
                  autoFocus
                  disabled={isAdding}
                  className="
                    h-11 w-full
                    rounded-xl
                    border border-[#e8e5ef]
                    bg-[#f8f7fb]
                    px-4
                    text-sm text-[#2a234f]
                    outline-none
                    transition-all duration-200
                    placeholder:text-[#9a96a8]
                    focus:border-[#ffb3c3]
                    focus:bg-white
                    focus:ring-4
                    focus:ring-[#ffb3c3]/20
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                />
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isAdding}
                  className="
                    rounded-xl
                    border border-[#e8e5ef]
                    px-5 py-3
                    text-sm font-semibold
                    text-[#77738a]
                    transition-all duration-200
                    hover:bg-[#f8f7fb]
                    active:scale-[0.98]
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isAdding}
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-[#2a234f]
                    px-5 py-3
                    text-sm font-semibold
                    text-white
                    shadow-lg
                    shadow-[#2a234f]/10
                    transition-all duration-200
                    hover:-translate-y-0.5
                    hover:bg-[#1f1a3b]
                    hover:shadow-xl
                    hover:shadow-[#2a234f]/20
                    active:translate-y-0
                    active:scale-[0.98]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {isAdding && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {isAdding
                    ? editingMember
                      ? "Saving..."
                      : "Adding..."
                    : editingMember
                      ? "Save changes"
                      : "Add member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove confirmation dialog */}
      {removingMember && (
        <div
          className="
            fixed inset-0 z-[60]
            flex items-center justify-center
            bg-[#2a234f]/50
            p-4
            backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isRemoving
            ) {
              setRemovingMember(null);
            }
          }}
        >
          <div
            className="
              modal-enter
              w-full max-w-sm
              rounded-2xl
              border border-white/20
              bg-white
              p-6
              shadow-2xl
            "
          >
            {/* Warning icon */}
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
              <Trash2
                size={20}
                className="text-red-600"
              />
            </div>

            <h2 className="mt-5 text-lg font-bold text-[#2a234f]">
              Remove family member?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#77738a]">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-[#2a234f]">
                {removingMember.name}
              </span>
              ? They will no longer appear when
              adding new transactions.
            </p>

            {/* Confirmation actions */}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isRemoving}
                onClick={() =>
                  setRemovingMember(null)
                }
                className="
                  rounded-xl
                  border border-[#e8e5ef]
                  px-5 py-3
                  text-sm font-semibold
                  text-[#77738a]
                  transition-all duration-200
                  hover:bg-[#f8f7fb]
                  active:scale-[0.98]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isRemoving}
                onClick={handleRemoveMember}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-red-600
                  px-5 py-3
                  text-sm font-semibold
                  text-white
                  shadow-lg
                  shadow-red-600/20
                  transition-all duration-200
                  hover:bg-red-700
                  hover:shadow-xl
                  active:scale-[0.98]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {isRemoving && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}

                {isRemoving
                  ? "Removing..."
                  : "Remove member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Family;
