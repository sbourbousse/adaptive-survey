const TRANSITION_DELAY = 0;

class Question {
    static container() {
        return document.querySelector(`[data-selector="container"]`);
    }
    static questionElement() {
        return document.querySelector(`[data-selector="question"]`);
    }
    static answerElementContainer() {
        return document.querySelector(`[data-selector="answer-list"]`);
    }

    static saveAnswerElement() {
        return document.querySelector(`[data-selector="answer-save"]`);
    }

    static firstLoad = true;

    constructor(questionId, questionStr, answers, successCb, opts) {
        this.opts = opts;
        if(!this.opts) {
            this.opts = {};
        }
        this.opts["multipleAnswers"] = this.opts?.multipleAnswers || false;
        
        this.questionId = questionId;
        this.questionStr = questionStr;
        /*
            id:
            message:
            type:
        */
       this.answers = answers; 
        this.resetUserAnswerChoice();
       this.successCb = successCb;
    }
    resetUserAnswerChoice() {
        if(this.opts.multipleAnswers) {
            this.userAnswerChoice = [];
        } else {
            this.userAnswerChoice = null;
        }
    }
    load(opts) {
        if(Question.firstLoad) {
            this.resetQuestion();
            this.resetAnswers();
            this.displayQuestion();
            this.displayAnswers();
            this.applyCustomStyles();
            this.applyEventListener();

            Question.firstLoad = false;
        } else {
                let isBackward = opts?.transitionBackwards || false;
                let animClass1 = "card-animation-reset";
                let animClass2 = "card-animation-display";
                if(isBackward) {
                    animClass1 = "card-animation-display-reverse";
                    animClass2 = "card-animation-reset-reverse";
                } 
                
                this.executeTransition(animClass1, animClass2);
        }


    }

    executeTransition(animStartClass, animEndClass) {
        Question.container().classList.add(animStartClass);
        setTimeout(() => {
            this.resetQuestion();
            this.resetAnswers();
            Question.container().classList.remove(animStartClass);
            this.displayQuestion();
            this.displayAnswers();
            this.applyCustomStyles();
            this.applyEventListener();
            Question.container().classList.add(animEndClass);
            setTimeout(() => {
                Question.container().classList.remove(animEndClass);
            }, TRANSITION_DELAY);
        }, TRANSITION_DELAY);
        
    }
    static eventListener = null;
    static currentQuestion = null;
    saveAnswer() {
        Question.saveAnswer(Question.currentQuestion);
    }
    applyEventListener() {
        Question.eventListener = this.saveAnswer;
        Question.currentQuestion = this;
        Question.saveAnswerElement().addEventListener("click", Question.eventListener);
    }

    resetQuestion() {
        Question.questionElement().textContent = "";

        Question.questionElement().classList.remove("multiple-answers");

    }

    resetAnswers() {
        Question.answerElementContainer().innerHTML = "";
    }

    displayQuestion() {
        Question.questionElement().textContent = this.questionStr;

        if(this.opts?.multipleAnswers) {
            Question.questionElement().classList.add("multiple-answers");
        }
    }

    displayAnswers() {
        this.answers.forEach(answer => {
            Question.answerElementContainer().appendChild(Question.createAnswerContainer(answer, this))
        });
    }

    setAnswer(answer) {
        if(this.userAnswerChoice) {
            console.warn("Answer already sat. Answer overriden")
        }
        this.userAnswerChoice = answer;
    }

    addAnswer(answer) {
        if(this.userAnswerChoice.find(a => a.id == answer.id)) {
            console.warn("Answer already sat");
            return;
        }
        this.userAnswerChoice.push(answer);
    }
    removeAnswer(answer) {
        if(this.userAnswerChoice.find(a => a.id == answer.id)) {
            this.userAnswerChoice = this.userAnswerChoice.filter(a => a.id != answer.id);
        } else {
            console.warn("Answer to remove not found")
        }
    }

    save() {
        let questionKey = `question-${this.questionId}`;
        if(localStorage.getItem(questionKey)) {
            localStorage.removeItem(questionKey);
            console.warn("Answer already saved. Answer overriden")
        }

        localStorage.setItem(questionKey, this.userAnswerChoice.id);
    }

    isNo() {
        if(!this.userAnswerChoice) {
            throw new Error("No answer selected")
        } else if (! this.isYesNoQuestion()) {
            throw new Error("Answer are not yes/no")
        }
        return this.userAnswerChoice.message == "Non";
    }

    isYes() {
        if(!this.userAnswerChoice) {
            throw new Error("No answer selected")
        } else if (! this.isYesNoQuestion()) {
            throw new Error("Answer are not yes/no")
        }
        return this.userAnswerChoice.message == "Oui";
    }

    isYesNoQuestion() {
        return (this.answers[0].message == "Oui" && this.answers[1].message == "Non")
    }

    applyCustomStyles() {
        Question.resetStyles();
        if(this.isYesNoQuestion()) {
            let buttons = Question.answerElementContainer().getElementsByTagName("button");
        }
    }

    static resetStyles() {
        let answers = Question.answerElementContainer().children;
        for (let i = 0 ; i < answers.length ; i++) {
            answers[i].classList.remove("selected");
        }
    }

    static saveAnswer(question) {
        if(!question?.userAnswerChoice) return;
        Question.saveAnswerElement().removeEventListener("click", question.saveAnswer);
        if(question.successCb) {
            question.successCb();

        }
    }

    static answerQuestion(answer, question) {
        if(question.opts.multipleAnswers) {
            if(question.userAnswerChoice.find(a => a.id == answer.id)) {
                question.removeAnswer(answer);
            } else {
                question.addAnswer(answer);
            }
        } else {
            question.setAnswer(answer);
        }
    }

    static resetAnswerSelection() {
        Question.resetStyles();
    }

    static updateSelectAnswers( question) {
        Question.resetStyles();
        if(!question?.userAnswerChoice)
            return;

        let answersElements = Question.answerElementContainer().children;

        if(question.opts.multipleAnswers) {
            question.userAnswerChoice.forEach(answerChosen => {
                question.answers.forEach((answer, count) => {
                    if(answer.id == answerChosen.id) {
                        answersElements[count].classList.add("selected");
                    }
                }) 
            })
        } else {
            question.answers.forEach((answer, count) => {
                if(answer.id == question.userAnswerChoice.id) {
                    answersElements[count].classList.add("selected");
                }
            })
        }
    }

    static createAnswerContainer(answer, question) {
        let answerCount = Question.answerElementContainer().children.length + 1;



        let container = document.createElement("div");
        container.classList.add("answer-container");

        if(answer.type == "button") {
            let questionCode = document.createElement("div");
            questionCode.classList.add("answer-round");
            questionCode.textContent = answerCount;
    
            let questionText = document.createElement("div");
            questionText.classList.add("answer-text");
            questionText.textContent = answer.message;
    
            container.appendChild(questionCode);
            container.appendChild(questionText);
            container.addEventListener("click", () => {
                Question.answerQuestion(answer, question);
                Question.updateSelectAnswers(question);
            })
        } else if (answer.type == "textinput") {    
            let questionInput = document.createElement("input");
            questionInput.setAttribute("type", "text");
            questionInput.classList.add("answer-input");
            questionInput.placeholder = answer.message;

            questionInput.addEventListener("keyup", () => {
                answer.message = questionInput.value;
                Question.answerQuestion(answer, question);
                Question.updateSelectAnswers(question);

            });
            container.appendChild(questionInput);
        }

        return container;
    }

    static Finish() {
        Question.questionElement().textContent = "Merci pour votre participation";
        Question.answerElementContainer().innerHTML = "";
    }
}