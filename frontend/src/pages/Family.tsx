import { useEffect, useState } from "react";
import {
  Edit3,
  Loader2,
  Plus,
  Trash2,
  Users,
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
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-violet-600">
              Family
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Family members
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
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
              rounded-xl bg-slate-900
              px-4 py-3
              text-sm font-semibold text-white
              shadow-lg shadow-slate-900/10
              transition-all duration-200
              hover:-translate-y-0.5
              hover:bg-violet-600
              hover:shadow-xl hover:shadow-violet-500/20
              active:translate-y-0
              active:scale-[0.98]
            "
          >
            <Plus size={18} />
            Add member
          </button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Members */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-bold text-slate-900">
            Your family
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {members.length}{" "}
            {members.length === 1
              ? "member"
              : "members"}
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2
              size={28}
              className="animate-spin text-violet-600"
            />
          </div>
        )}

        {/* Empty state */}
        {!isLoading &&
          !error &&
          members.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-50">
                <Users
                  size={22}
                  className="text-violet-600"
                />
              </div>

              <h3 className="text-sm font-semibold text-slate-900">
                No family members yet
              </h3>

              <p className="mt-1 max-w-sm text-xs text-slate-500">
                Add a family member to start
                assigning transactions to them.
              </p>
            </div>
          )}

        {/* Member list */}
        {!isLoading &&
          !error &&
          members.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="
                    group flex items-center gap-4
                    rounded-xl border border-slate-200
                    bg-white p-4
                    transition-all duration-200
                    hover:-translate-y-0.5
                    hover:border-violet-200
                    hover:shadow-md
                    hover:shadow-slate-900/5
                  "
                >
                  {/* Avatar */}
                  <div
                    className="
                      flex h-11 w-11 shrink-0
                      items-center justify-center
                      rounded-full bg-violet-50
                      text-sm font-bold text-violet-600
                    "
                  >
                    {member.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-slate-900">
                      {member.name}
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
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
                        text-slate-400
                        transition-all
                        duration-200
                        hover:bg-slate-100
                        hover:text-slate-700
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
                          border-slate-200
                          bg-white
                          p-1.5
                          shadow-xl
                          shadow-slate-900/10
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
                            text-slate-600
                            transition-colors
                            hover:bg-slate-50
                            hover:text-slate-900
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
            bg-slate-950/50
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
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingMember
                    ? "Edit family member"
                    : "Add family member"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
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
                  text-slate-400
                  transition-all duration-200
                  hover:bg-slate-100
                  hover:text-slate-700
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
                  className="mb-2 block text-xs font-semibold text-slate-600"
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
                    border border-slate-200
                    bg-slate-50
                    px-4
                    text-sm text-slate-700
                    outline-none
                    transition-all duration-200
                    placeholder:text-slate-400
                    focus:border-violet-400
                    focus:bg-white
                    focus:ring-4
                    focus:ring-violet-500/10
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
                    border border-slate-200
                    px-5 py-3
                    text-sm font-semibold
                    text-slate-600
                    transition-all duration-200
                    hover:bg-slate-50
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
                    bg-slate-900
                    px-5 py-3
                    text-sm font-semibold
                    text-white
                    shadow-lg
                    shadow-slate-900/10
                    transition-all duration-200
                    hover:-translate-y-0.5
                    hover:bg-violet-600
                    hover:shadow-xl
                    hover:shadow-violet-500/20
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
            bg-slate-950/50
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

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Remove family member?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-slate-700">
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
                  border border-slate-200
                  px-5 py-3
                  text-sm font-semibold
                  text-slate-600
                  transition-all duration-200
                  hover:bg-slate-50
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