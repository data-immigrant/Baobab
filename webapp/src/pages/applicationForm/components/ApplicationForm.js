import React, { Component } from "react";
import { withRouter } from "react-router";
import { applicationFormService } from '../../../services/applicationForm';
import FormTextBox from "../../../components/form/FromTextBox";
import FormSelect from "../../../components/form/FormSelect";
import FormTextArea from "../../../components/form/FormTextArea";

const DEFAULT_EVENT_ID = process.env.DEFAULT_EVENT_ID || 1;

const SHORT_TEXT = "short-text";
const SINGLE_CHOICE = "single-choice";
const LONG_TEXT = ["long-text", "long_text"];
const MULTI_CHOICE = "multi-choice";
const FILE = "file";

class FieldEditor extends React.Component {
    constructor(props) {
      super(props);
      this.state = {}
    }
  
    handleChange = event => {
      const value = event.target.value;
      const id = event.target.id;
      console.log('CHANGE: id is: ' + id + ' value is: ' + value);
      if (this.props.onChange) {
        console.log('Calling onChange');
        this.props.onChange(id, value);
      }
    }
    
    handleChangeDropdown = (name, dropdown) => {
        if (this.props.onChange) {
            this.props.onChange(name, dropdown.value);
        }
    }

    formControl(question) {
        let id = "question_" + question.id;

        switch(question.type) {
            case SHORT_TEXT:
                return <FormTextBox
                    Id={id}
                    type="text"
                    label={question.description}
                    placeholder={question.placeholder}
                    onChange={this.handleChange}
                    // value={value}
                    key={'i_' + this.props.key}
                    />
            case SINGLE_CHOICE:
                return <FormTextBox
                    Id={id}
                    type="checkbox"
                    label={question.description}
                    placeholder={question.placeholder}
                    onChange={this.handleChange}
                    // value={value}
                    key={this.props.key}
                    />
            case LONG_TEXT[0]:
            case LONG_TEXT[1]:
                return <FormTextArea
                    Id={id}
                    label={question.description}
                    placeholder={question.placeholder}
                    onChange={this.handleChange}
                    rows={5}
                    key={this.props.key}
                    />
            case MULTI_CHOICE:
                return <FormSelect
                    options={question.options && question.options.map(c=>c.selection)}
                    Id={id}
                    label={question.description}
                    placeholder={question.placeholder}
                    onChange={this.handleChangeDropdown}
                    // value={value}
                    key={this.props.key}
                    />
            case FILE:
                return <FormTextBox
                    Id={id}
                    type="file"
                    label={question.description}
                    placeholder={question.placeholder}
                    onChange={this.handleChange}
                    // value={value}
                    key={this.props.key}
                    />
            default:
                return <p className="text-danger">WARNING: No control found for type {question.type}!</p>
        }
    }

    render() {
        return (
            <div className={"question"}>
                <h4>{this.props.question.headline}</h4>
                {this.formControl(this.props.question)}
            </div>
        )
    }
  }

function Section (props) {
    let questions = props.questions && props.questions.slice().sort((a, b) => a.order - b.order);
    return (
        <div className={"section"}>
            <div className={"headline"}>
                <h2>{props.name}</h2>
                <p>{props.description}</p>
            </div>
            {questions && questions.map(question => 
                <FieldEditor key={question.id} question={question} onChange={props.onChange}/>
            )}
        </div>
    )
}

function Confirmation(props) {
    return (
        <div>
            <div class="row">
                <div class="col">
                    <h2>Confirmation</h2>
                    <p>Please confirm that your responses are correct. Use the previous button to correct them if they are not.</p>        
                </div>
            </div>
            {props.answers && props.answers.map(answer => {
                if (!props.questions) {
                    return <span></span>
                }

                let question = props.questions.find(question => question.id == answer.questionId);

                return (question && 
                <div>
                    <div class="row">
                        <div class="col">
                            <h4>{question.headline}</h4>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col">
                            <p>{answer.value}</p>
                        </div>
                    </div>
                </div>
                )
            })}
        </div>
    )
}

class ApplicationForm extends Component {
    constructor(props) {
        super(props);

        this.state = {
          currentStep: 1,
          formSpec: null,
          isLoading: true,
          isError: false,
          isSubmitted: false,
          errorMessage: "",
          answers: []
        };

        this.handleFieldChange = this.handleFieldChange.bind(this);
      }
    
    handleFieldChange(fieldId, value) {
        const questionId = fieldId.substring(fieldId.lastIndexOf('_')+1, fieldId.length);
        const otherAnswers = this.state.answers.filter(answer => answer.questionId != questionId);
        const currentAnswer = {
            "questionId": questionId,
            "value": value
        };
        this.setState({
            answers: otherAnswers.concat(currentAnswer)
        })
    }
    
    componentDidMount() {
        applicationFormService.getForEvent(DEFAULT_EVENT_ID).then(response => {
            this.setState({
                formSpec: response.formSpec,
                isError: response.formSpec === null,
                errorMessage: response.message,
                isLoading: false
              });
        })
    }

    nextStep = () => {
        let step = this.state.currentStep;
        this.setState({
            currentStep : step + 1
        });
        window.scrollTo(0, 0);  
    }

    prevStep = () => {
        let step = this.state.currentStep;
        this.setState({
            currentStep : step - 1
        })
    }

    handleSubmit = event => {
        event.preventDefault();
        this.setState({
            isLoading: true
        });
        applicationFormService.submit(this.state.answers).then(resp=> {
            this.setState({
                isError: resp.response_id === null,
                errorMessage: response.message,
                isLoading: false
              });
        });
    }

    render() {
        const {currentStep, formSpec, isLoading, isError, errorMessage, answers} = this.state;

        if (isLoading) {
            return <img src="data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA==" />
        }

        if (isError) {
            return <div className={"alert alert-danger"}>{errorMessage}</div>
        }
        
        const sections = formSpec.sections && formSpec.sections.slice().sort((a, b) => a.order - b.order);
        const allQuestions = sections && sections.flatMap(section => section.questions);

        const numSteps = sections ? sections.length : 0;
        
        const style = {
            width : (currentStep / (numSteps+1) * 100) + '%'
        }
        const currentSection = (sections && currentStep <= numSteps) ? sections[currentStep-1] : null;
        
        return (
            <form onSubmit={this.handleSubmit}>
                <h2>Apply to attend the Deep Learning Indaba 2019</h2>
                <span className="progress-step">{currentSection ? currentSection.name : "Confirmation"}</span>
                <progress className="progress" style={style}></progress>
                
                {currentSection && 
                    <Section key={currentSection.name} name={currentSection.name} description={currentSection.description} questions={currentSection.questions} onChange={this.handleFieldChange}/>
                }
                {!currentSection &&
                    <Confirmation answers={answers} questions={allQuestions}/>
                }
                
                {currentStep > 1 &&
                    <button type="button" class="btn btn-secondary" onClick={this.prevStep}>Previous</button>
                }
                {currentStep <= numSteps &&
                    <button type="button" class="btn btn-primary" onClick={this.nextStep}>Next</button>
                }
                {currentStep > numSteps &&
                    <button type="submit" class="btn btn-primary">Submit</button>
                }
            </form>
        )
    }

}

export default withRouter(ApplicationForm)