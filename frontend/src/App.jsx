
import { useState, useEffect } from "react";

import AuthPage from "./pages/AuthPage";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";

import WiseMind from "./components/wisemind/WiseMind";

import {
  getCurrentStudent,
  logoutStudent
} from "./services/api";

import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const response = await getCurrentStudent();

        if (isMounted) {
          setUser(response.user);
        }
      } catch (error) {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

 function handleLogin(loggedInUser) {
  console.log("LOGIN USER:", loggedInUser);
  console.log("LOGIN ROLE:", loggedInUser?.role);

  setUser(loggedInUser);
}
  function handleUserUpdate(updatedUser) {
    setUser((prevUser) => ({
      ...prevUser,
      ...updatedUser
    }));
  }

  async function handleLogout() {
    const currentUser = user;

    setUser(null);
    window.history.replaceState(null, "", "/");

    if (currentUser) {
      try {
        await logoutStudent();
      } catch (error) {
        console.error("Logout API Error:", error);
      }
    }
  }

  if (checkingSession) {
    return (
      <div className="session-loading">
        <p>Checking your session...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <>
      {user.role === "admin" ? (
        <AdminDashboard
          user={user}
          onLogout={handleLogout}
        />
      ) : (
        <StudentDashboard
          user={user}
          onLogout={handleLogout}
          onUserUpdate={handleUserUpdate}
        />
      )}

      {/* GLOBAL WISEMIND AI ASSISTANT */}
      <WiseMind />
    </>
  );
}

export default App;
