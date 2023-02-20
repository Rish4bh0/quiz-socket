import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:4000");

function App() {
  const [userID, setUserID] = useState("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [userScores, setUserScores] = useState({});
  const [timer, setTimer] = useState(60);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showStartButton, setShowStartButton] = useState(true);
  const [connectedUsers, setConnectedUsers] = useState([]);
  

  const questions = [
    {
      questionText: "What is the capital of France?",
      answerOptions: [
        { answerText: "New York", isCorrect: false },
        { answerText: "London", isCorrect: false },
        { answerText: "Paris", isCorrect: true },
        { answerText: "Sydney", isCorrect: false },
      ],
      correctAnswer: "Paris",
    },
    {
      questionText: "Who is the author of 'To Kill a Mockingbird'?",
      answerOptions: [
        { answerText: "Harper Lee", isCorrect: true },
        { answerText: "Ernest Hemingway", isCorrect: false },
        { answerText: "F. Scott Fitzgerald", isCorrect: false },
        { answerText: "William Faulkner", isCorrect: false },
      ],
      correctAnswer: "Harper Lee",
    },
    {
      questionText: "What is the largest country in the world by area?",
      answerOptions: [
        { answerText: "Canada", isCorrect: false },
        { answerText: "Russia", isCorrect: true },
        { answerText: "China", isCorrect: false },
        { answerText: "United States", isCorrect: false },
      ],
      correctAnswer: "Russia",
    },
  ];

  useEffect(() => {
    socket.on("userConnected", (id) => {
      setUserID(id);
      setConnectedUsers((users) => [...users, id]);
    });
    socket.on("userDisconnected", (id) => {
      setConnectedUsers((users) => users.filter((userId) => userId !== id));
      setUserScores((prevUserScores) => {
        const updatedUserScores = { ...prevUserScores };
        delete updatedUserScores[id];
        return updatedUserScores;
      });
    });

    socket.on("userScores", (scores) => {
      setUserScores(scores);
    });
  }, []);

  useEffect(() => {
    if (timer === 0) {
      setQuestionNumber(questionNumber + 1);
      setTimer(60);
    }
    const timerInterval = setInterval(() => {
      setTimer((prevTimer) => prevTimer - 1);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [timer]);

  const handleAnswerSubmit = () => {
    socket.emit("submitAnswer", {
      question: questions[questionNumber],
      answer: selectedAnswer,
    });
    setSelectedAnswer(null);
    if (questionNumber === questions.length - 1) {
      setQuizComplete(true);
    } else {
      setQuestionNumber(questionNumber + 1);
      setTimer(60);
    }
  };

  const handleStartQuiz = () => {
    setQuestionNumber(0);
    setScore(0);
    setQuizComplete(false);
    setTimer(60);
    setShowStartButton(false);
    socket.emit("userJoined");
  };

  return (
    <div className="App">
      {userID && (
        <div>
          <p>Your User ID: {userID}</p>
        </div>
      )}
      {showStartButton ? (
        <div>
          <button onClick={handleStartQuiz}>Start Quiz</button>
        </div>
      ) : quizComplete ? (
        <div>
          <h2>Thank you for completing the quiz!</h2>
          <h3>Your score is: {score}</h3>
          <h3>Rankings:</h3>
          <ol>
            {Object.entries(userScores)
              .sort((a, b) => b[1].score - a[1].score)
              .map(([id, user]) => (
                <li key={id}>
                  User {id}: {user.score}
                </li>
              ))}
          </ol>
        </div>
      ) : (
        <div>
          <h2>Question {questionNumber + 1}</h2>
          <p>{questions[questionNumber].questionText}</p>
          <ul>
            {questions[questionNumber].answerOptions.map(
              (answerOption, index) => (
                <li key={index}>
                  <label>
                    <input
                      type="radio"
                      name="answer"
                      value={answerOption.answerText}
                      checked={selectedAnswer === answerOption.answerText}
                      onChange={(e) => setSelectedAnswer(e.target.value)}
                    />
                    {answerOption.answerText}
                  </label>
                </li>
              )
            )}
          </ul>
          <p>Time remaining: {timer} seconds</p>
          <button onClick={handleAnswerSubmit}>Submit Answer</button>

          <div>
            <h3>Users:</h3>
            <ul>
              {Object.entries(userScores).map(([id, user]) => (
                <li key={id}>
                  User {id}: {user.score}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
