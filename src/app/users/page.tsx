"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import toast from "react-hot-toast";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  UserPlus,
  Shield,
  CheckCircle,
  XCircle,
  Key,
  Mail,
  User,
  Lock,
} from "lucide-react";

interface User {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: "ADMIN" | "USER" | "MANAGER";
  privileges: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const availablePrivileges = [
  { id: "inventory", label: "Inventory", description: "Akses menu Inventory" },
  { id: "reports", label: "Reports", description: "Akses menu Reports" },
  { id: "users", label: "User Management", description: "Akses menu RBAC/Users" },
  { id: "settings", label: "Settings", description: "Akses pengaturan sistem" },
  { id: "versions", label: "Version History", description: "Akses riwayat perubahan" },
  { id: "assistant", label: "AI Assistant", description: "Akses AI Assistant" },
];

const roles = [
  { id: "ADMIN", label: "Administrator", color: "text-red-600 bg-red-100 dark:bg-red-900/20" },
  { id: "MANAGER", label: "Manager", color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20" },
  { id: "USER", label: "User", color: "text-gray-600 bg-gray-100 dark:bg-gray-700" },
];

export default function UsersPage() {
  const { token } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "USER",
    privileges: [] as string[],
    active: true,
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        toast.error("Gagal mengambil data users");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddUser = async () => {
    if (!formData.username || !formData.password || !formData.name) {
      toast.error("Mohon lengkapi semua field wajib!");
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          privileges: formData.privileges.join(","),
        }),
      });

      if (res.ok) {
        toast.success("User berhasil ditambahkan!");
        setShowAddModal(false);
        fetchUsers();
        setFormData({
          username: "",
          password: "",
          name: "",
          email: "",
          role: "USER",
          privileges: [],
          active: true,
        });
      } else {
        const data = await res.json();
        toast.error(data.message || "Gagal menambahkan user");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const res = await fetch("/api/users/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingUser.id,
          ...formData,
          privileges: formData.privileges.join(","),
        }),
      });

      if (res.ok) {
        toast.success("User berhasil diupdate!");
        setShowEditModal(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.message || "Gagal mengupdate user");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`Yakin ingin menghapus user "${username}"?`)) return;

    try {
      const res = await fetch(`/api/users/update?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success("User berhasil dihapus!");
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.message || "Gagal menghapus user");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "",
      name: user.name,
      email: user.email || "",
      role: user.role,
      privileges: user.privileges ? user.privileges.split(",") : [],
      active: user.active,
    });
    setShowEditModal(true);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(search.toLowerCase()))
  );

  const togglePrivilege = (privilege: string) => {
    setFormData((prev) => ({
      ...prev,
      privileges: prev.privileges.includes(privilege)
        ? prev.privileges.filter((p) => p !== privilege)
        : [...prev.privileges, privilege],
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              User Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Kelola user dan hak akses sistem
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>

        {/* Search */}
        <div className="card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari user berdasarkan nama, username, atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Privileges
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Created
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-gray-100 dark:border-gray-800"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                          <span className="text-primary-600 dark:text-primary-400 font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{user.username}
                          </p>
                          {user.email && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {user.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          roles.find((r) => r.id === user.role)?.color ||
                          "text-gray-600 bg-gray-100"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {user.privileges
                          ? user.privileges.split(",").slice(0, 3).map((p) => (
                              <span
                                key={p}
                                className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs"
                              >
                                {p}
                              </span>
                            ))
                          : "-"}
                        {user.privileges &&
                          user.privileges.split(",").length > 3 && (
                            <span className="px-2 py-0.5 text-gray-500 text-xs">
                              +{user.privileges.split(",").length - 3}
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {user.active ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Active</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm">Inactive</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteUser(user.id, user.username)
                          }
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {search ? "User tidak ditemukan" : "Belum ada data user"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl m-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add New User
            </h2>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Username *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="input-field pl-9"
                      placeholder="username"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="input-field pl-9"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-field"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="input-field pl-9"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as "ADMIN" | "USER" | "MANAGER",
                    })
                  }
                  className="input-field"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Privileges
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availablePrivileges.map((priv) => (
                    <label
                      key={priv.id}
                      className="flex items-start gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.privileges.includes(priv.id)}
                        onChange={() => togglePrivilege(priv.id)}
                        className="mt-0.5 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {priv.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {priv.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) =>
                    setFormData({ ...formData, active: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="active" className="text-sm font-medium">
                  User Active
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({
                    username: "",
                    password: "",
                    name: "",
                    email: "",
                    role: "USER",
                    privileges: [],
                    active: true,
                  });
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleAddUser} className="flex-1 btn-primary">
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl m-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit User
            </h2>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    disabled
                    className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="input-field pl-9"
                      placeholder="Leave empty to keep current"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as "ADMIN" | "USER" | "MANAGER",
                    })
                  }
                  className="input-field"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Privileges
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availablePrivileges.map((priv) => (
                    <label
                      key={priv.id}
                      className="flex items-start gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.privileges.includes(priv.id)}
                        onChange={() => togglePrivilege(priv.id)}
                        className="mt-0.5 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {priv.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {priv.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={formData.active}
                  onChange={(e) =>
                    setFormData({ ...formData, active: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="edit-active" className="text-sm font-medium">
                  User Active
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleUpdateUser} className="flex-1 btn-primary">
                Update User
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
