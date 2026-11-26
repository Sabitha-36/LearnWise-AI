
const API_BASE_URL = "http://localhost:5000";

async function handleResponse(response, defaultMessage) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || defaultMessage);
  }
  return data;
}

export async function registerStudent(formData) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(formData)
  });
  return handleResponse(response, "Registration failed");
}

export async function loginStudent(formData) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(formData)
  });
  return handleResponse(response, "Login failed");
}

export async function getCurrentStudent() {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    credentials: "include"
  });
  return handleResponse(response, "Session expired");
}
// Get logged-in student's profile
export async function getStudentProfile() {
  const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    credentials: "include"
  });

  return handleResponse(response, "Unable to load profile");
}

// Update student profile and upload avatar
export async function updateStudentProfile(profileData) {
  const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    method: "PUT",
    credentials: "include",
    body: profileData
  });

  return handleResponse(response, "Unable to update profile");
}

// Get the profile image URL
export function getStudentAvatarUrl(filename) {
  return `${API_BASE_URL}/api/auth/avatars/${encodeURIComponent(filename)}`;
}

export async function logoutStudent() {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include"
  });
  return handleResponse(response, "Logout failed");
}

// Evaluate a student's answer
export async function evaluateAnswer(formData) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/evaluate-answer`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      }
    );
    return await handleResponse(
      response,
      "Failed to evaluate answer"
    );
  } catch (error) {
    console.error("Evaluation API Error:", error);
    throw error;
  }
}

export async function recommendQuestions(formData) {
  const response = await fetch(
    `${API_BASE_URL}/api/recommend-questions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify(formData)
    }
  );

  return handleResponse(
    response,
    "Unable to recommend questions."
  );
}


export async function evaluateHandwrittenAnswer(formData) {
  const response = await fetch(
    `${API_BASE_URL}/api/evaluate-handwritten`,
    {
      method: "POST",
      credentials: "include",
      body: formData
    }
  );
  return handleResponse(
    response,
    "Unable to evaluate the handwritten answer."
  );
}


// Generate a concept explanation
export async function explainConcept(formData) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/explain-concept`,
      {
        method: "POST",
        credentials: "include",
        body: formData
      }
    );

    return await handleResponse(
      response,
      "Failed to generate concept explanation"
    );
  } catch (error) {
    console.error("Concept Explanation API Error:", error);
    throw error;
  }
}

// Generate a personalised learning path
export async function generateLearningPath(formData) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/generate-learning-path`,
      {
        method: "POST",
        credentials: "include",
        body: formData
      }
    );

    return await handleResponse(
      response,
      "Failed to generate learning path"
    );

  } catch (error) {
    console.error("Learning Path API Error:", error);
    throw error;
  }
}
// Save a generated learning path
export async function saveLearningPath(learningPath) {
  const response = await fetch(
    `${API_BASE_URL}/api/save-learning-path`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        learning_path: learningPath
      })
    }
  );

  return handleResponse(response, "Failed to save learning path");
}


// Retrieve saved learning paths
export async function getMyLearningPaths() {
  const response = await fetch(
    `${API_BASE_URL}/api/my-learning-paths`,
    {
      method: "GET",
      credentials: "include"
    }
  );

  return handleResponse(response, "Failed to load learning paths");
}


// Mark a study day as completed or incomplete
export async function updateLearningDay(pathId, day, completed) {
  const response = await fetch(
    `${API_BASE_URL}/api/learning-path/${pathId}/day`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        day,
        completed
      })
    }
  );

  return handleResponse(response, "Failed to update study progress");
}
// Generate practice questions
export async function generatePracticeQuestions(formData) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/generate-practice-questions`,
      {
        method: "POST",
        credentials: "include",
        body: formData
      }
    );

    return await handleResponse(
      response,
      "Failed to generate practice questions"
    );
  } catch (error) {
    console.error("Practice Questions API Error:", error);
    throw error;
  }
}

// Save a completed practice session
export async function savePracticeSession(sessionData) {
  const response = await fetch(
    `${API_BASE_URL}/api/save-practice-session`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(sessionData)
    }
  );

  return handleResponse(
    response,
    "Failed to save practice session"
  );
}

// Retrieve the student's practice history
export async function getPracticeHistory() {
  const response = await fetch(
    `${API_BASE_URL}/api/my-practice-history`,
    {
      method: "GET",
      credentials: "include"
    }
  );

  return handleResponse(
    response,
    "Failed to load practice history"
  );
}
// Retrieve previously explained concepts
export async function getMyConcepts() {
  const response = await fetch(
    `${API_BASE_URL}/api/my-concepts`,
    {
      method: "GET",
      credentials: "include"
    }
  );

  return handleResponse(
    response,
    "Failed to load previously explained concepts"
  );
}

// Send a message to WiseMind AI
export async function sendWiseMindMessage(message, history = []) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/wisemind/chat`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          history
        })
      }
    );

    return await handleResponse(
      response,
      "Failed to connect with WiseMind AI"
    );

  } catch (error) {
    console.error("WiseMind API Error:", error);
    throw error;
  }
}
// ADMIN DASHBOARD APIs

export async function getAdminOverview() {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/overview`,
    {
      method: "GET",
      credentials: "include"
    }
  );

  return handleResponse(
    response,
    "Unable to load admin overview"
  );
}

export async function getAdminStudents(page = 1, limit = 10) {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/students?page=${page}&limit=${limit}`,
    {
      method: "GET",
      credentials: "include"
    }
  );

  return handleResponse(
    response,
    "Unable to load students"
  );
}

export async function getAdminStudentDetails(studentId) {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/students/${studentId}`,
    {
      method: "GET",
      credentials: "include"
    }
  );

  return handleResponse(
    response,
    "Unable to load student details"
  );
}
// Retrieve performance statistics for the logged-in student
export async function getMyPerformanceStats() {
  const response = await fetch(
    `${API_BASE_URL}/api/student/overview`,
    {
      method: "GET",
      credentials: "include"
    }
  );

  return handleResponse(
    response,
    "Unable to load your performance statistics"
  );
}