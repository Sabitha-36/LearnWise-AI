
import { useEffect, useState } from "react";
import {
  UserRound,
  Camera,
  Mail,
  GraduationCap,
  Building2,
  BookOpen,
  CalendarDays,
  Save,
  Pencil,
  X,
  LoaderCircle
} from "lucide-react";

import {
  getStudentProfile,
  updateStudentProfile,
  getStudentAvatarUrl
} from "../services/api";

import "./Profile.css";


const animeAvatars = [
  {
    id: "girl-purple",
    name: "Purple Girl",
    url: "https://api.dicebear.com/9.x/adventurer/svg?seed=PurpleGirl&backgroundColor=dcd5ff"
  },
  {
    id: "boy-blue",
    name: "Blue Boy",
    url: "https://api.dicebear.com/9.x/adventurer/svg?seed=BlueBoy&backgroundColor=cce5ff"
  },
  {
    id: "girl-pink",
    name: "Pink Girl",
    url: "https://api.dicebear.com/9.x/adventurer/svg?seed=PinkGirl&backgroundColor=ffd6e7"
  },
  {
    id: "boy-green",
    name: "Green Boy",
    url: "https://api.dicebear.com/9.x/adventurer/svg?seed=GreenBoy&backgroundColor=cdf5df"
  },
  {
    id: "cute-star",
    name: "Cute Star",
    url: "https://api.dicebear.com/9.x/adventurer/svg?seed=CuteStar&backgroundColor=fff0c9"
  },
  {
    id: "dreamy",
    name: "Dreamy",
    url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Dreamy&backgroundColor=e8d8ff"
  },
  {
    id: "sunshine",
    name: "Sunshine",
    url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Sunshine&backgroundColor=ffe1c2"
  },
  {
    id: "ocean",
    name: "Ocean",
    url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Ocean&backgroundColor=c9efff"
  }
];


function Profile({ user, onUserUpdate}) {
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    course: user?.course || "",
    college: "",
    department: "",
    year_of_study: "",
    avatar: "",
    avatarUrl: "",
    created_at: ""
  });

  const [editing, setEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAvatarGallery, setShowAvatarGallery] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("");
  
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const data = await getStudentProfile();
        setProfile(data.user);
      } catch (err) {
        setError(err.message || "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  function handleAvatarChange(event) {
  const file = event.target.files?.[0];

  if (!file) return;

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {
    setError("Please select a JPG, PNG or WEBP image.");
    event.target.value = "";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    setError("Image size must be smaller than 5 MB.");
    event.target.value = "";
    return;
  }

  setError("");
  setSelectedAvatar("");
  setAvatarFile(file);
  setAvatarPreview(URL.createObjectURL(file));
}
 async function handleSave(event) {
  event.preventDefault();

  try {
    setSaving(true);
    setError("");
    setSuccess("");

    const formData = new FormData();

    formData.append("name", profile.name);
    formData.append("course", profile.course);
    formData.append("college", profile.college);
    formData.append("department", profile.department);
    formData.append("year_of_study", profile.year_of_study);

    if (selectedAvatar) {
      formData.append("avatar_url", selectedAvatar);
    } else if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    const data = await updateStudentProfile(formData);
     if (onUserUpdate) {
        onUserUpdate(data.user);
    }
    
    setProfile(data.user);
    setAvatarFile(null);
    setAvatarPreview("");
    setSelectedAvatar("");
    setShowAvatarGallery(false);
    setEditing(false);

    setSuccess("Your profile has been updated successfully.");
    if (onUserUpdate) {
        onUserUpdate(data.user);
    }
  } catch (err) {
    setError(err.message || "Unable to update profile.");
  } finally {
    setSaving(false);
  }
}

  function handleCancel() {
  setEditing(false);
  setAvatarFile(null);
  setAvatarPreview("");
  setSelectedAvatar("");
  setShowAvatarGallery(false);
  setError("");
  setSuccess("");

  getStudentProfile()
    .then((data) => setProfile(data.user))
    .catch((err) => setError(err.message));
}

const avatarUrl =
  avatarPreview ||
  profile.avatar_url ||
  (profile.avatar ? getStudentAvatarUrl(profile.avatar) : "");  const initials = profile.name
    ? profile.name.charAt(0).toUpperCase()
    : "S";

  const createdDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : "Not available";

  if (loading) {
    return (
      <div className="profile-loading">
        <LoaderCircle size={30} className="profile-spinner" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="student-profile-page">

      {/* PAGE HEADING */}
      <div className="profile-page-heading">
        <div>
          <span className="profile-eyebrow">MY ACCOUNT</span>
          <h1>My Profile</h1>
          <p>Manage your personal and academic information.</p>
        </div>

        {!editing && (
          <button
            type="button"
            className="profile-edit-btn"
            onClick={() => {
              setEditing(true);
              setError("");
              setSuccess("");
            }}
          >
            <Pencil size={17} />
            Edit Profile
          </button>
        )}
      </div>

      {error && (
        <div className="profile-alert profile-error">
          {error}
        </div>
      )}

      {success && (
        <div className="profile-alert profile-success">
          {success}
        </div>
      )}

      <form onSubmit={handleSave}>

        {/* PROFILE HERO */}
        <section className="profile-hero-card">

          <div className="profile-avatar-section">

            <div className="profile-page-avatar">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Student profile"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            {editing && (
                <button
                    type="button"
                    className="profile-camera-btn"
                    title="Choose anime avatar"
                    onClick={() => setShowAvatarGallery(true)}
                >
                    <Camera size={18} />
                </button>
            )}
          </div>

          <div className="profile-hero-details">
            <span className="profile-student-label">STUDENT ACCOUNT</span>
            <h2>{profile.name || "Student Name"}</h2>
            <p>
              <Mail size={15} />
              {profile.email}
            </p>
            <span className="profile-course-tag">
              <GraduationCap size={15} />
              {profile.course || "Course not added"}
            </span>
          </div>

          <div className="profile-member-info">
            <CalendarDays size={18} />
            <div>
              <small>MEMBER SINCE</small>
              <strong>{createdDate}</strong>
            </div>
          </div>

        </section>

        {/* PERSONAL INFORMATION */}
        <section className="profile-info-card">

          <div className="profile-card-heading">
            <div className="profile-card-icon">
              <UserRound size={20} />
            </div>

            <div>
              <h3>Personal Information</h3>
              <p>Your basic account details</p>
            </div>
          </div>

          <div className="profile-fields-grid">

            <div className="profile-field">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                disabled={!editing}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className="profile-field">
              <label>Email Address</label>
              <input
                type="email"
                value={profile.email}
                disabled
                readOnly
              />
              <small>Email address cannot be changed here.</small>
            </div>

          </div>
        </section>

        {/* ACADEMIC INFORMATION */}
        <section className="profile-info-card">

          <div className="profile-card-heading">
            <div className="profile-card-icon academic">
              <GraduationCap size={21} />
            </div>

            <div>
              <h3>Academic Information</h3>
              <p>Your educational details</p>
            </div>
          </div>

          <div className="profile-fields-grid">

            <div className="profile-field">
              <label>Course / Degree</label>
              <div className="profile-input-icon">
                <BookOpen size={17} />
                <input
                  type="text"
                  name="course"
                  value={profile.course}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="e.g. B.Sc. Computer Science"
                />
              </div>
            </div>

            <div className="profile-field">
              <label>College Name</label>
              <div className="profile-input-icon">
                <Building2 size={17} />
                <input
                  type="text"
                  name="college"
                  value={profile.college}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter your college name"
                />
              </div>
            </div>

            <div className="profile-field">
              <label>Department</label>
              <input
                type="text"
                name="department"
                value={profile.department}
                onChange={handleChange}
                disabled={!editing}
                placeholder="Enter your department"
              />
            </div>

            <div className="profile-field">
              <label>Year of Study</label>
              <select
                name="year_of_study"
                value={profile.year_of_study}
                onChange={handleChange}
                disabled={!editing}
              >
                <option value="">Select year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="5th Year">5th Year</option>
              </select>
            </div>

          </div>
        </section>

        {/* SAVE / CANCEL */}
        {editing && (
          <div className="profile-form-actions">

            <button
              type="button"
              className="profile-cancel-btn"
              onClick={handleCancel}
              disabled={saving}
            >
              <X size={17} />
              Cancel
            </button>

            <button
              type="submit"
              className="profile-save-btn"
              disabled={saving}
            >
              {saving ? (
                <>
                  <LoaderCircle size={17} className="profile-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Save Changes
                </>
              )}
            </button>

          </div>
        )}
{showAvatarGallery && (
  <div className="avatar-gallery-overlay">

    <div className="avatar-gallery-modal">

      <div className="avatar-gallery-heading">
        <div>
          <h2>Choose Your Avatar</h2>
          <p>Pick an avatar that represents you!</p>
        </div>

        <button
          type="button"
          onClick={() => setShowAvatarGallery(false)}
        >
          <X size={20} />
        </button>
      </div>

      <div className="anime-avatar-grid">
        {animeAvatars.map((avatar) => (
          <button
            type="button"
            key={avatar.id}
            className={`anime-avatar-option ${
              selectedAvatar === avatar.url
                ? "selected"
                : ""
            }`}
            onClick={() => {
              setSelectedAvatar(avatar.url);
              setAvatarFile(null);
              setAvatarPreview(avatar.url);
              setShowAvatarGallery(false);
            }}
          >
            <img src={avatar.url} alt={avatar.name} />
            <span>{avatar.name}</span>

            {selectedAvatar === avatar.url && (
              <span className="avatar-selected-check">
                ✓
              </span>
            )}
          </button>
        ))}
      </div>
      <label className="avatar-upload-option">
        <Camera size={17} />
        Upload your own photo

        <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
            handleAvatarChange(event);
            if (event.target.files?.[0]) {
                setShowAvatarGallery(false);
            }
            }}
            hidden
        />
        </label>

      <p className="avatar-gallery-footer">
        Your selected avatar will appear on your profile.
      </p>

    </div>
  </div>
)}
      </form>

    </div>
  );
}

export default Profile;
