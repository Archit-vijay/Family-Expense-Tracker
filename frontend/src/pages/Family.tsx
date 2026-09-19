import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Edit3,
  Loader2,
  Mail,
  Plus,
  Trash2,
  X,
  MoreVertical,
} from "lucide-react";

import {
  createFamilyMember,
  getFamilyMembers,
  updateFamilyMember,
  updateFamilyMemberRole,
  deactivateFamilyMember,
  type FamilyMember,
} from "../services/familyMemberService";

import {
  createInvitation,
  type FamilyInvitation,
} from "../services/invitationService";

import ContentState from "../components/ContentState";
import { useAuth } from "../context/AuthContext";

import AnimatedDropdown from "../components/AnimatedDropdown";

function Family() {
  const { familyRole, user } = useAuth();
  const isAdmin = familyRole === "admin";

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

  const [removeError, setRemoveError] = useState("");

  const [invitingMember, setInvitingMember] =
    useState<FamilyMember | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");

  const [isInviting, setIsInviting] = useState(false);

  const [inviteError, setInviteError] = useState("");

  const [createdInvitation, setCreatedInvitation] =
    useState<FamilyInvitation | null>(null);

  const [copiedInvitation, setCopiedInvitation] =
    useState(false);

  const [roleMember, setRoleMember] =
    useState<FamilyMember | null>(null);

  const [selectedRole, setSelectedRole] =
    useState<
      "admin" | "member" | "viewer"
    >("member");

  const [isUpdatingRole, setIsUpdatingRole] =
    useState(false);

  const [roleError, setRoleError] = useState("");

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
    setRemoveError("");

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
    setRemoveError("");
  } catch (error) {
    console.error(
      "Failed to remove family member:",
      error,
    );

    setRemoveError(
      error instanceof Error
        ? error.message
        : "Unable to remove family member.",
    );
  } finally {
    setIsRemoving(false);
  }
}

async function handleUpdateRole() {
  if (!roleMember) return;

  try {
    setIsUpdatingRole(true);
    setRoleError("");

    const updatedMembership =
      await updateFamilyMemberRole(
        roleMember.id,
        selectedRole,
      );

    setMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === roleMember.id
          ? {
              ...member,
              role: updatedMembership.role,
            }
          : member,
      ),
    );

    setRoleMember(null);
    setRoleError("");
  } catch (error) {
    console.error(
      "Failed to update family member role:",
      error,
    );

    setRoleError(
      error instanceof Error
        ? error.message
        : "Unable to update family member role.",
    );
  } finally {
    setIsUpdatingRole(false);
  }
}

  function openInviteModal(member: FamilyMember) {
    setInvitingMember(member);
    setInviteEmail("");
    setInviteError("");
    setCreatedInvitation(null);
    setCopiedInvitation(false);
  }

  function closeInviteModal() {
    if (isInviting) return;

    setInvitingMember(null);
    setInviteEmail("");
    setInviteError("");
    setCreatedInvitation(null);
    setCopiedInvitation(false);
  }

  async function handleCreateInvitation(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!invitingMember) return;

    const email = inviteEmail.trim().toLowerCase();

    if (!email) {
      setInviteError(
        "Please enter an email address.",
      );

      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setInviteError(
        "Please provide a valid email address.",
      );

      return;
    }

    try {
      setIsInviting(true);
      setInviteError("");

      const invitation = await createInvitation(
        invitingMember.id,
        email,
      );

      setCreatedInvitation(invitation);
    } catch (error) {
      console.error(
        "Failed to create invitation:",
        error,
      );

      setInviteError(
        error instanceof Error
          ? error.message
          : "Unable to create invitation.",
      );
    } finally {
      setIsInviting(false);
    }
  }

  async function copyInvitationLink() {
    if (!createdInvitation) return;

    const invitationLink =
      `${window.location.origin}/invite/${createdInvitation.token}`;

    try {
      await navigator.clipboard.writeText(
        invitationLink,
      );

      setCopiedInvitation(true);

      window.setTimeout(() => {
        setCopiedInvitation(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Failed to copy invitation link:",
        error,
      );
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
                className={`
                  group relative flex items-center gap-4
                  rounded-xl border border-[#e8e5ef]
                  bg-white p-4
                  transition-all duration-200
                  ${
                    menuMemberId === member.id
                      ? "z-10"
                      : "z-0 hover:z-10"
                  }
                  hover:-translate-y-0.5
                  hover:border-[#ffb3c3]
                  hover:shadow-md
                  hover:shadow-[#2a234f]/5
                `}
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

                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-xs text-[#77738a]">
                      {member.user_id !== null
                        ? "Account connected"
                      : "Family member"}
                    </p>

                    {member.role && (
                      <span
                        className="
                          rounded-full
                          bg-[#f8f7fb]
                          px-2 py-0.5
                          text-[10px]
                          font-semibold
                          capitalize
                          text-[#77738a]
                        "
                      >
                        {member.role}
                      </span>
                    )}
                  </div>
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
                      {/* Invite */}
                      {member.user_id === null && (
                        <button
                          type="button"
                          onClick={() => {
                            openInviteModal(member);
                            setMenuMemberId(null);
                          }}
                          className="
                            flex w-full items-center gap-2
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
                          <Mail size={16} />
                          Invite
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => {
                          openEditModal(member);
                          setMenuMemberId(null);
                        }}
                        className="
                          flex w-full items-center gap-2
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

                      {/* Change role */}
                      {isAdmin &&
                        member.user_id !== null &&
                        member.user_id !== user?.id &&
                        member.role !== "admin" && (
                          <button
                            type="button"
                            onClick={() => {
                              setRoleMember(member);
                              setSelectedRole(member.role ?? "member");
                              setRoleError("");
                              setMenuMemberId(null);
                            }}
                            className="
                              flex w-full items-center gap-2
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
                            Change role
                          </button>
                        )}  

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => {
                          setRemovingMember(member);
                          setRemoveError("");
                          setMenuMemberId(null);
                        }}
                        className="
                          flex w-full items-center gap-2
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
            fixed inset-0 z-60
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
              setRemoveError("");
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

            {removeError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {removeError}
              </div>
            )}

            {/* Confirmation actions */}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isRemoving}
                onClick={() => {
                  setRemovingMember(null)
                  setRemoveError("")
                }}
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

      {/* Change role modal */}
      {roleMember && (
        <div
          className="
            fixed inset-0 z-60
            flex items-center justify-center
            bg-[#2a234f]/50
            p-4
            backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isUpdatingRole
            ) {
              setRoleMember(null);
              setRoleError("");
            }
          }}
        >
          <div
            className="
              modal-enter
              w-full max-w-md
              overflow-visible
              rounded-2xl
              border border-white/20
              bg-white
              shadow-2xl
            "
          >
            <div
              className="
                flex items-start justify-between
                border-b border-[#e8e5ef]
                px-5 py-5
                sm:px-6
              "
            >
              <div>
                <h2 className="text-lg font-bold text-[#2a234f]">
                  Change role
                </h2>

                <p className="mt-1 text-xs text-[#77738a]">
                  Change the family role for{" "}
                  {roleMember.name}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (isUpdatingRole) return;

                  setRoleMember(null);
                  setRoleError("");
                }}
                disabled={isUpdatingRole}
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

            <div className="p-5 sm:p-6">
              {roleError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {roleError}
                </div>
              )}

              <div>
                <label
                  className="
                    mb-2 block
                    text-xs font-semibold
                    text-[#77738a]
                  "
                >
                  Family role
                </label>

                <AnimatedDropdown
                  value={selectedRole}
                  options={[
                    {
                      value: "member",
                      label: "Member",
                    },
                    {
                      value: "viewer",
                      label: "Viewer",
                    },
                    {
                      value: "admin",
                      label: "Admin",
                    },
                  ]}
                  onChange={(value) =>
                    setSelectedRole(
                      value as "admin" | "member" | "viewer",
                    )
                  }
                />
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (isUpdatingRole) return;

                    setRoleMember(null);
                    setRoleError("");
                  }}
                  disabled={isUpdatingRole}
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
                  onClick={handleUpdateRole}
                  disabled={isUpdatingRole}
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
                  {isUpdatingRole && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {isUpdatingRole
                    ? "Saving..."
                    : "Save role"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invitation modal */}
      {invitingMember && (
        <div
          className="
            fixed inset-0 z-70
            flex items-center justify-center
            bg-[#2a234f]/50
            p-4
            backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isInviting
            ) {
              closeInviteModal();
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
                  Invite {invitingMember.name}
                </h2>

                <p className="mt-1 text-xs text-[#77738a]">
                  Send them a link to create their
                  family account.
                </p>
              </div>

              <button
                type="button"
                onClick={closeInviteModal}
                disabled={isInviting}
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

            {createdInvitation ? (
              /* Invitation created */
              <div className="p-5 sm:p-6">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                      <Check
                        size={16}
                        className="text-emerald-600"
                      />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-emerald-800">
                        Invitation created
                      </p>

                      <p className="mt-0.5 text-xs text-emerald-700">
                        This invitation expires in
                        48 hours.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="invitationLink"
                    className="mb-2 block text-xs font-semibold text-[#77738a]"
                  >
                    Invitation link
                  </label>

                  <div className="flex gap-2">
                    <input
                      id="invitationLink"
                      type="text"
                      readOnly
                      value={`${window.location.origin}/invite/${createdInvitation.token}`}
                      className="
                        h-11 min-w-0 flex-1
                        rounded-xl
                        border border-[#e8e5ef]
                        bg-[#f8f7fb]
                        px-3
                        text-xs text-[#2a234f]
                        outline-none
                      "
                    />

                    <button
                      type="button"
                      onClick={copyInvitationLink}
                      className="
                        inline-flex shrink-0
                        items-center justify-center gap-2
                        rounded-xl
                        bg-[#2a234f]
                        px-4
                        text-sm font-semibold text-white
                        transition-all duration-200
                        hover:bg-[#1f1a3b]
                        active:scale-[0.98]
                      "
                    >
                      {copiedInvitation ? (
                        <>
                          <Check size={16} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-5 text-[#77738a]">
                  For local development, copy this
                  link and open it in a browser to test
                  the invitation flow.
                </p>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={closeInviteModal}
                    className="
                      rounded-xl
                      border border-[#e8e5ef]
                      px-5 py-3
                      text-sm font-semibold
                      text-[#77738a]
                      transition-all duration-200
                      hover:bg-[#f8f7fb]
                      active:scale-[0.98]
                    "
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Invitation form */
              <form
                onSubmit={handleCreateInvitation}
                className="p-5 sm:p-6"
              >
                {inviteError && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {inviteError}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="inviteEmail"
                    className="mb-2 block text-xs font-semibold text-[#77738a]"
                  >
                    Email address
                  </label>

                  <input
                    id="inviteEmail"
                    type="email"
                    value={inviteEmail}
                    onChange={(event) =>
                      setInviteEmail(
                        event.target.value,
                      )
                    }
                    placeholder="member@example.com"
                    autoFocus
                    disabled={isInviting}
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

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeInviteModal}
                    disabled={isInviting}
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
                    disabled={isInviting}
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
                    {isInviting && (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    )}

                    {isInviting
                      ? "Creating..."
                      : "Create invitation"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Family;