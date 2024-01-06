import { useState, useEffect } from 'react';

const generateReferenceCode = () => {
    return Math.random().toString(36).substring(2, 8);
};

const QuestionsToday = () => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [serverResponse, setServerResponse] = useState(null); // New state for storing server response
    const [referenceCode, setReferenceCode] = useState('');
    const [isGeneratedCode, setIsGeneratedCode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [allAnswersSubmitted, setAllAnswersSubmitted] = useState(false);
    const [shouldSubmit, setShouldSubmit] = useState(false);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const urlReferenceCode = queryParams.get('refCode');

        if (!urlReferenceCode) {
            setReferenceCode(generateReferenceCode());
            setIsGeneratedCode(true);
        } else {
            setReferenceCode(urlReferenceCode);
            setIsGeneratedCode(false);
        }

        fetch('http://localhost:3000/quiz/questions/today')
            .then(response => response.json())
            .then(data => {
                setQuestions(data);
                console.log(data); // Log to check the structure and content
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        if (shouldSubmit) {
            submitAllAnswers();
        }
    }, [shouldSubmit]);

    const handleAnswer = (answer) => {
        const newAnswer = { questionId: questions[currentQuestionIndex].questionId, answer };
        setAnswers(prevAnswers => [...prevAnswers, newAnswer]);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            setShouldSubmit(true);
        }
    };

    const submitAllAnswers = () => {
        setIsSubmitting(true);
    
        if (isGeneratedCode) {
            // Existing logic for POST request
            const payload = {
                answers,
                referenceCode: referenceCode,
                isGeneratedCode: isGeneratedCode
            };
    
            const postUrl = `http://localhost:3000/quiz/submit-answers/${referenceCode}`;
    
            fetch(postUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })
            .then(response => response.json())
            .then(data => {
                setServerResponse(JSON.stringify(data, null, 2)); // Store the raw server response
                setAllAnswersSubmitted(true);
            })
            .catch(error => {
                console.error('Error submitting answers:', error);
                setServerResponse(JSON.stringify(error, null, 2)); // Store error response
            })
            .finally(() => {
                setIsSubmitting(false);
                setShouldSubmit(false);
            });
        } else {
            // Logic for GET request
            const getUrl = `http://localhost:3000/quiz/answers/${referenceCode}`;
    
            fetch(getUrl)
            .then(response => response.json())
            .then(data => {
                setServerResponse(JSON.stringify(data, null, 2)); // Store the raw server response
                setAllAnswersSubmitted(true);
            })
            .catch(error => {
                console.error('Error fetching answers:', error);
                setServerResponse(JSON.stringify(error, null, 2)); // Store error response
            })
            .finally(() => {
                setIsSubmitting(false);
                setShouldSubmit(false);
            });
        }
    };

    const renderYourAnswers = () => {
        return answers.map((answer, index) => (
            <div key={index}>
                <p>Question {index + 1}: {answer.answer}</p>
            </div>
        ));
    };

    if (isLoading) {
        return <p>Loading...</p>;
    }

    if (allAnswersSubmitted) {
        return (
            <div>
                <p>All questions answered, send your partner this link to compare your answers: https://www.coupleclash.com/?refCode={referenceCode}</p>
                {renderYourAnswers()}
                {serverResponse && <pre>{serverResponse}</pre>} {/* Displaying server response */}
            </div>
        );
    }

    if (currentQuestionIndex >= questions.length) {
        return <p>All questions answered!</p>;
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div>
            <h2>{currentQuestion.text}</h2>
            <button onClick={() => handleAnswer('Me')} disabled={isSubmitting}>Me</button>
            <button onClick={() => handleAnswer('Them')} disabled={isSubmitting}>Them</button>
            {renderYourAnswers()}
            {serverResponse && <pre>{serverResponse}</pre>} {/* Displaying server response */}
        </div>
    );
};

export default QuestionsToday;
