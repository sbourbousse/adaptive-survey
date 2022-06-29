let questions = [];
let questionHistory = [];
let currQuestion = null;
let questionIndex = 0;
const constraints = [
    {
        id : 100,
        ifYes : null,
        ifNo : 110,
        default : 120
    },
    {
        id : 110,
        ifYes : 120,
        ifNo : null,
        default : 0
    },
    {
        id : 200,
        ifYes : 210,
        ifNo : null,
        default : 220
    },
    {
        id : 220,
        ifYes : 230,
        ifNo : null,
        default : 0
    },
    {
        id : 240,
        ifYes : 250,
        ifNo : null,
        default : 270
    },
]

function refresh() {
    if(questionHistory.length == 0) {
        document.querySelector(`[data-selector="previous-question"]`).classList.add('disabled');
    } else {
        document.querySelector(`[data-selector="previous-question"]`).classList.remove('disabled');
    }
    let questionListStepper = document.querySelector(`[data-selector="question-list"]`);
    questionListStepper.innerHTML = '';
    let currentStep = 1;
    if(questionHistory.length > 0) {
        questionHistory.forEach((question, index) => {
        currentStep = index + 1;
        addStep(currentStep)
        })
        addStep(currentStep + 1, true);
    } else {
        addStep(currentStep, true)
    }
    let questionListStepperContainer = document.querySelector(`[data-selector="question-list-container"]`);

    questionListStepperContainer.scrollLeft = questionListStepperContainer.scrollWidth;

    function addStep(stepNumber, isCurrent) {
        let questionStep = document.createElement('div');
        questionStep.classList.add('stepper-number');
        if(isCurrent) {
            questionStep.classList.add('active');
        }
        questionStep.innerHTML = stepNumber;
        questionListStepper.appendChild(questionStep);
    }
}



window.addEventListener("load", async () => {

    //Prevent chrome navbar 
    const body = document.querySelector("body");
    const actualHeight = window.innerHeight;
    const elementHeight = body.clientHeight;
    const barHeight = elementHeight - actualHeight;
    body.style.height = `calc(100vh - ${barHeight}px)`;

    let jsonResponse = await fetch("./assets/quest_general.json");
    let questGeneral = await jsonResponse.json(); 
    questions.push(...questGeneral);
 

    if(questions?.length == 0) {
        console.error("No questions loaded")
        return;
    }

    currQuestion = new Question(questions[0].id, questions[0].message, questions[0].answers, nextQuestion, questions[0]?.options);

    currQuestion.load();

    document.querySelector(`[data-selector="previous-question"]`).addEventListener("click", () => {
        previousQuestion();
    })

    refresh();
});

function nextQuestion() {
    let success = false
    try {
        if(currQuestion) {
            questionHistory.push(currQuestion);
        }
        questionIndex = questions.findIndex(question => question.id == currQuestion.questionId);

        currQuestion = findNextQuestion(currQuestion);

        if(!currQuestion || currQuestion == 0) {
            success = false;
        } else {
            success = true;
        }
    } catch (e) {
        console.error(e)
        success = false;
    }

    if (success) {
        currQuestion.load();

    } else {
        Question.Finish();
    }

    refresh()
}

function questionInHistoryIsNo(questionId) {
    let isNo = true;
    try {
        let questionFound = questionHistory.find(qh => qh.id = questionId);
        isNo = questionFound.isNo();
    } catch(e) {
        console.error(e)
    }
    return isNo;
}

function questionInHistoryIsYes(questionId) {
    let isYes = false;
    try {
        let questionFound = questionHistory.find(qh => qh.id = questionId);
        isYes = questionFound.isYes();
    } catch(e) {
        console.error(e)
    }
    return isYes;
}

function findNextQuestion(question) {
    if(!question) {
        throw new Error("Bad Argument. No question")
    }
    
    let nextQuestionConstraintObj = constraints.find(c => c.id == question.questionId);
    let defaultNextQuestionInArray = questions[questionIndex+1];
    let nextQuestionInArray = null
    if(nextQuestionConstraintObj) {

        if(nextQuestionConstraintObj?.directions) {
            let direction = nextQuestionConstraintObj.directions.find(d => d.answer == question.userAnswerChoice.id);
            nextQuestionInArray = questions.find(q => q.id == direction.goTo);
        } else {

            if(question.isYes()) {
                if (nextQuestionConstraintObj.ifYes != null) {
                    nextQuestionInArray = questions.find(q => q.id == nextQuestionConstraintObj.ifYes);
                } else if (nextQuestionConstraintObj.default != null) {
                    if(nextQuestionConstraintObj.default == 0) {
                        nextQuestionInArray = 0;
                    } else 
                        nextQuestionInArray = questions.find(q => q.id == nextQuestionConstraintObj.default);
                }
            } else if (question.isNo()) {
                if (nextQuestionConstraintObj.ifNo != null) {
                    nextQuestionInArray = questions.find(q => q.id == nextQuestionConstraintObj.ifNo);
                } else if (nextQuestionConstraintObj.default != null) {
                    if(nextQuestionConstraintObj.default == 0) {
                        nextQuestionInArray = 0;
                    } else 
                        nextQuestionInArray = questions.find(q => q.id == nextQuestionConstraintObj.default);
                }
            } else {
                if(nextQuestionConstraintObj.default == 0) {
                    nextQuestionInArray = 0;
                }
            }
        }
    }

    if (nextQuestionInArray == undefined || nextQuestionInArray == null) {
        nextQuestionInArray = defaultNextQuestionInArray;
    }

    
    if(nextQuestionInArray == 0) { 
        return 0
    } else {
        return new Question(nextQuestionInArray.id, nextQuestionInArray.message, nextQuestionInArray.answers, nextQuestion, nextQuestionInArray?.options);
    }
}

function previousQuestion() {
    if(questionHistory.length == 0) {
        return;
    } 
    try {
        currQuestion = questionHistory.pop();
        questionIndex--;
            
        if(!currQuestion || currQuestion == 0) {
            success = false;
        } else {
            success = true;
        }
    } catch (e) {
        console.error(e)
        success = false;
    }

    if (success) {
        currQuestion.resetUserAnswerChoice();
        currQuestion.load({transitionBackwards : true});
    } else {
        Question.Finish();
    }

    refresh();
}