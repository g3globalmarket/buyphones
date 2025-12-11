import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  adminUsersApi,
  AdminUser,
  AdminRole,
  CreateAdminUserDto,
} from "../api/adminUsers";
import { getErrorMessage } from "../api/errors";
import "./AdminUsersPage.css";

const AdminUsersPage = () => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorizedError, setUnauthorizedError] = useState(false);

  // Form state for creating new admin
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateAdminUserDto>({
    email: "",
    password: "",
    role: "admin",
    name: "",
  });

  // State for editing
  const [editingRole, setEditingRole] = useState<Record<string, AdminRole>>({});
  const [changingPasswordId, setChangingPasswordId] = useState<string | null>(
    null
  );
  const [newPassword, setNewPassword] = useState("");

  const loadAdminUsers = async () => {
    setLoading(true);
    setError(null);
    setUnauthorizedError(false);

    try {
      const users = await adminUsersApi.list();
      setAdminUsers(users);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      // Check if it's a 403 Forbidden (non-super_admin trying to access)
      if ((err as any)?.response?.status === 403) {
        setUnauthorizedError(true);
        setError("접근 권한이 없습니다. (최고 관리자만 이용 가능합니다.)");
      } else {
        setError(errorMessage || "관리자 목록을 불러오는데 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminUsers();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await adminUsersApi.create(createFormData);
      setShowCreateForm(false);
      setCreateFormData({
        email: "",
        password: "",
        role: "admin",
        name: "",
      });
      await loadAdminUsers();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage || "관리자 생성에 실패했습니다.");
    }
  };

  const handleUpdateRole = async (id: string, newRole: AdminRole) => {
    setError(null);

    try {
      await adminUsersApi.update(id, { role: newRole });
      setEditingRole((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await loadAdminUsers();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(
        errorMessage ||
          "역할 변경에 실패했습니다. 최소 한 명의 최고 관리자가 남아 있어야 합니다."
      );
    }
  };

  const handleChangePassword = async (id: string) => {
    if (!newPassword || newPassword.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    setError(null);

    try {
      await adminUsersApi.changePassword(id, { newPassword });
      setChangingPasswordId(null);
      setNewPassword("");
      alert("비밀번호가 변경되었습니다.");
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage || "비밀번호 변경에 실패했습니다.");
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (
      !window.confirm(
        `정말로 관리자 "${email}"를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
      )
    ) {
      return;
    }

    setError(null);

    try {
      await adminUsersApi.remove(id);
      await loadAdminUsers();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(
        errorMessage ||
          "관리자 삭제에 실패했습니다. 최소 한 명의 최고 관리자가 남아 있어야 합니다."
      );
    }
  };

  const getRoleLabel = (role: AdminRole): string => {
    return role === "super_admin" ? "최고 관리자" : "관리자";
  };

  if (loading) {
    return (
      <div className="admin-users-page">
        <div className="admin-users-container">
          <h1>관리자 관리</h1>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (unauthorizedError) {
    return (
      <div className="admin-users-page">
        <div className="admin-users-container">
          <h1>관리자 관리</h1>
          <div className="admin-users-error">
            <p>{error}</p>
            <Link to="/admin/dashboard" className="admin-users-back-link">
              대시보드로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users-page">
      <div className="admin-users-container">
        <div className="admin-users-header">
          <h1>관리자 관리</h1>
          <Link to="/admin/dashboard" className="admin-users-back-link">
            ← 대시보드로 돌아가기
          </Link>
        </div>

        {error && <div className="admin-users-error-message">{error}</div>}

        <div className="admin-users-actions">
          <button
            className="admin-users-create-button"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? "취소" : "새 관리자 추가"}
          </button>
        </div>

        {showCreateForm && (
          <form
            className="admin-users-create-form"
            onSubmit={handleCreateAdmin}
          >
            <h3>새 관리자 추가</h3>
            <div className="form-group">
              <label htmlFor="create-email">아이디 *</label>
              <input
                id="create-email"
                type="text"
                value={createFormData.email}
                onChange={(e) =>
                  setCreateFormData({
                    ...createFormData,
                    email: e.target.value,
                  })
                }
                required
                placeholder="아이디를 입력하세요"
              />
            </div>
            <div className="form-group">
              <label htmlFor="create-password">비밀번호 *</label>
              <input
                id="create-password"
                type="password"
                value={createFormData.password}
                onChange={(e) =>
                  setCreateFormData({
                    ...createFormData,
                    password: e.target.value,
                  })
                }
                required
                minLength={8}
                placeholder="최소 8자 이상"
              />
            </div>
            <div className="form-group">
              <label htmlFor="create-name">이름</label>
              <input
                id="create-name"
                type="text"
                value={createFormData.name}
                onChange={(e) =>
                  setCreateFormData({ ...createFormData, name: e.target.value })
                }
                placeholder="이름 (선택사항)"
              />
            </div>
            <div className="form-group">
              <label htmlFor="create-role">역할 *</label>
              <select
                id="create-role"
                value={createFormData.role}
                onChange={(e) =>
                  setCreateFormData({
                    ...createFormData,
                    role: e.target.value as AdminRole,
                  })
                }
                required
              >
                <option value="admin">관리자</option>
                <option value="super_admin">최고 관리자</option>
              </select>
            </div>
            <button type="submit" className="admin-users-submit-button">
              생성
            </button>
          </form>
        )}

        <div className="admin-users-table-container">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>아이디</th>
                <th>이름</th>
                <th>역할</th>
                <th>생성일</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-users-empty">
                    등록된 관리자가 없습니다.
                  </td>
                </tr>
              ) : (
                adminUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.name || "-"}</td>
                    <td>
                      {editingRole[user.id] !== undefined ? (
                        <select
                          value={editingRole[user.id]}
                          onChange={(e) => {
                            const newRole = e.target.value as AdminRole;
                            setEditingRole((prev) => ({
                              ...prev,
                              [user.id]: newRole,
                            }));
                          }}
                          onBlur={() => {
                            if (editingRole[user.id] !== user.role) {
                              handleUpdateRole(user.id, editingRole[user.id]);
                            } else {
                              setEditingRole((prev) => {
                                const next = { ...prev };
                                delete next[user.id];
                                return next;
                              });
                            }
                          }}
                          autoFocus
                        >
                          <option value="admin">관리자</option>
                          <option value="super_admin">최고 관리자</option>
                        </select>
                      ) : (
                        <span>{getRoleLabel(user.role)}</span>
                      )}
                    </td>
                    <td>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("ko-KR")
                        : "-"}
                    </td>
                    <td>
                      <div className="admin-users-actions-cell">
                        <button
                          className="admin-users-action-button"
                          onClick={() => {
                            setEditingRole((prev) => ({
                              ...prev,
                              [user.id]: user.role,
                            }));
                          }}
                        >
                          역할 변경
                        </button>
                        <button
                          className="admin-users-action-button"
                          onClick={() => {
                            setChangingPasswordId(
                              changingPasswordId === user.id ? null : user.id
                            );
                            setNewPassword("");
                          }}
                        >
                          비밀번호 변경
                        </button>
                        <button
                          className="admin-users-action-button admin-users-delete-button"
                          onClick={() => handleDelete(user.id, user.email)}
                        >
                          삭제
                        </button>
                      </div>
                      {changingPasswordId === user.id && (
                        <div className="admin-users-password-form">
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="새 비밀번호 (최소 8자)"
                            minLength={8}
                            autoFocus
                          />
                          <button
                            onClick={() => handleChangePassword(user.id)}
                            disabled={newPassword.length < 8}
                          >
                            저장
                          </button>
                          <button
                            onClick={() => {
                              setChangingPasswordId(null);
                              setNewPassword("");
                            }}
                          >
                            취소
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
