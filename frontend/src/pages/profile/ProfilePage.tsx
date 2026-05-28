import { useState } from "react";
import { Link } from "react-router-dom";
import { updateProfile } from "../../api/auth";
import { useAuthStore } from "../../store/auth";
import Avatar from "../../components/ui/Avatar";

const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6",
];

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [username, setUsername] = useState(user?.username ?? "");
  const [avatarColor, setAvatarColor] = useState(user?.avatar_color ?? AVATAR_COLORS[0]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const updated = await updateProfile({ username, avatar_color: avatarColor });
      updateUser(updated);
      setSuccess(true);
    } catch (e: any) {
      setError(e.response?.data?.detail ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">← Projects</Link>
          <div className="h-4 w-px bg-gray-200" />
          <span className="text-base font-semibold text-gray-900">Profile</span>
        </div>
      </header>

      <main className="mx-auto max-w-md p-6">
        <div className="card p-6 space-y-5">
          <div className="flex flex-col items-center gap-3">
            <Avatar username={username || "?"} color={avatarColor} size="lg" />
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Username</label>
            <input
              className="input"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setSuccess(false); }}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Avatar Color</label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setAvatarColor(c); setSuccess(false); }}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${avatarColor === c ? "border-gray-900 scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600 font-medium">Profile updated!</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </main>
    </div>
  );
}
