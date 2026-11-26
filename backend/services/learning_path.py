
def generate_learning_path(topic_scores):

    learning_path = []

    for topic, score in topic_scores.items():

        if score <= 40:
            level = "Needs Improvement"
            recommendation = "Relearn the concept"

        elif score <= 60:
            level = "Beginner"
            recommendation = "Study explanations and examples"

        elif score <= 80:
            level = "Intermediate"
            recommendation = "Practise exam questions"

        else:
            level = "Strong"
            recommendation = "Move to the next topic"

        learning_path.append({
            "topic": topic,
            "score": score,
            "level": level,
            "recommendation": recommendation
        })

    return learning_path

topic_scores = {
    "Python Basics": 90,
    "Functions": 45,
    "OOP": 65,
    "File Handling": 30
}

result = generate_learning_path(topic_scores)

for item in result:
    print(item)