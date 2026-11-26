
import { useState } from "react";

function LearningDashboard() {
  const [learningPath, setLearningPath] = useState([]);
  const [loading, setLoading] = useState(false);

  const getLearningPath = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/learning-path",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            topic_scores: {
              "Python Basics": 90,
              "Functions": 45,
              "OOP": 65,
              "File Handling": 30
            }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      setLearningPath(data.learning_path);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Your Learning Path</h1>

      <button onClick={getLearningPath}>
        Generate Learning Path
      </button>

      {loading && <p>Analysing your performance...</p>}

      {learningPath.map((item) => (
        <div key={item.topic}>
          <h3>{item.topic}</h3>
          <p>Score: {item.score}%</p>
          <p>Level: {item.level}</p>
          <p>{item.recommendation}</p>
        </div>
      ))}
    </div>
  );
}

export default LearningDashboard;
