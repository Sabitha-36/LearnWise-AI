import { Search, Bell, UserCircle } from "lucide-react";

function Header() {
  return (
    <header className="header">
      <div>
        <h2>Student Dashboard</h2>
        <p>Welcome back ! Continue your learning journey.</p>
      </div>

      <div className="header-actions">
        <div className="search-box">
          <Search size={18} />
          <input placeholder="Search topics..." />
        </div>

        <Bell size={21} />

        <div className="profile">
          <UserCircle size={30} />
          <span>Student</span>
        </div>
      </div>
    </header>
  );
}

export default Header;