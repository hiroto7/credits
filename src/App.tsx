import React, { Component, ReactNode } from 'react';
import './App.css';
import courses1 from './courses1.json';
import constraint1 from './constraint1.json';
import Constraint, { MinMax } from './Constraint';
import Course from './Course';

interface ConstraintJSON {
    candidates: (string | ConstraintJSON | (string | ConstraintJSON)[])[];
    title: string;
    subtitle?: string;
    creditsCount: number | MinMax;
}

class ConstraintCreater {
    constructor(readonly map: ReadonlyMap<string, Course>) { }

    getCourse(code: string): Course {
        const course = this.map.get(code);

        if (course === undefined) {
            throw new Error(`科目番号 '${code}' が見つかりません。`);
        }

        return course;
    }

    create(json: ConstraintJSON): Constraint {
        return {
            title: json.title,
            subtitle: json.subtitle,
            creditsCount: json.creditsCount,
            candidates: json.candidates.map((value): Course | Constraint | (Course | Constraint)[] => {
                if (typeof value === 'string') {
                    return this.getCourse(value);
                } else if (value instanceof Array) {
                    return value.map(value => {
                        if (typeof value === 'string') {
                            return this.getCourse(value);
                        } else {
                            return this.create(value);
                        }
                    });
                } else {
                    return this.create(value);
                }
            })
        }
    }
}

const creditsSum = (constraint: Constraint, value: ConstraintSelectedState,
    isCounted: (state: CourseSelectedState) => boolean) => Math.min(
        typeof constraint.creditsCount === 'number' ? constraint.creditsCount : constraint.creditsCount.max,
        [...value].reduce((previous, current): number => {
            if ('candidates' in current[0]) {
                if (!(current[1] instanceof Map)) {
                    throw new Error();
                }
                return previous + creditsSum(current[0], current[1], isCounted);
            } else if ('creditsCount' in current[0]) {
                if (typeof current[1] !== 'string') {
                    throw new Error();
                }
                return previous + (isCounted(current[1]) ? current[0].creditsCount : 0);
            } else {
                if (typeof current[1] === 'string' || !('length' in current[1])) {
                    throw new Error();
                }

                if ('candidates' in current[1][0]) {
                    if (!(current[1][1] instanceof Map)) {
                        throw new Error();
                    }
                    return previous + creditsSum(current[1][0], current[1][1], isCounted);
                } else {
                    if (typeof current[1][1] !== 'string') {
                        throw new Error();
                    }
                    return previous + (isCounted(current[1][1]) ? current[1][0].creditsCount : 0);
                }
            }
        }, 0));

const validity = (constraint: Constraint, value: ConstraintSelectedState): ConstraintSelectValidity => {
    let result;
    if (constraint.creditsCount <= creditsSum(constraint, value, state => state === CourseSelectedState.acquired)) {
        result = ConstraintSelectValidity.acquisition;
    } else if (constraint.creditsCount <= creditsSum(constraint, value, state => state === CourseSelectedState.registered || state === CourseSelectedState.acquired)) {
        result = ConstraintSelectValidity.registration;
    } else {
        result = ConstraintSelectValidity.none;
    }

    for (const [childConstraint, childValue] of value) {
        if (typeof childValue !== 'string') {
            if ('length' in childValue) {
                if (typeof childValue[1] !== 'string') {
                    if (!('candidates' in childValue)) {
                        throw new Error();
                    }
                    result = (validity(childValue[0], childValue[1]));
                }
            } else {
                result = (validity(childConstraint as Constraint, childValue));
            }
        }
    }

    return result;
}


interface ConstraintSelectedState extends ReadonlyMap<
    Constraint | Course | Iterable<Constraint | Course>,
    CourseSelectedState | ConstraintSelectedState |
    readonly [Course, CourseSelectedState] | readonly [Constraint, ConstraintSelectedState]> { }

interface AppState {
    constraint: Constraint;
    value: ConstraintSelectedState
}
export default class App extends Component<any, AppState> {
    constructor(props: any) {
        super(props);
        const coursesMap = new Map(courses1.map(value => [value.code, value as Course]));

        this.state = {
            constraint: new ConstraintCreater(coursesMap).create(constraint1),
            value: new Map()
        };
    }

    render() {
        console.log(this.state.value);
        return (
            <div className="App">
                <Planner constraint={this.state.constraint} value={this.state.value} open disabled={false}
                    onClick={value => {
                        this.setState({ value });
                    }} />
            </div>
        );
    }
}

interface PlannerProps {
    constraint: Constraint,
    open?: boolean,
    disabled: boolean,
    value: ConstraintSelectedState,
    onClick: (value: ConstraintSelectedState) => void
}
class Planner extends Component<PlannerProps, { open: boolean }> {
    constructor(props: PlannerProps) {
        super(props);
        this.state = { open: !!props.open };
    }

    render(): ReactNode {
        const candidates: ReactNode[] = [];

        for (const candidate of this.props.constraint.candidates) {
            if ('candidates' in candidate) {
                const value = this.props.value.get(candidate);
                if (value !== undefined && !(value instanceof Map)) {
                    throw new Error();
                }

                candidates.push(<Planner constraint={candidate} disabled={this.props.disabled}
                    value={value || new Map()}
                    onClick={
                        value => this.props.onClick(new Map([...this.props.value, [candidate, value]]))
                    } />);
            } else if ('code' in candidate) {
                const value = this.props.value.get(candidate);
                if (value !== undefined && typeof value !== 'string') {
                    throw new Error();
                }

                candidates.push(<CourseViewer course={candidate}
                    value={value || unselected}
                    disabled={this.props.disabled}
                    onClick={
                        value => this.props.onClick(new Map([...this.props.value, [candidate, value]]))
                    } />)
            } else {
                const value = this.props.value.get(candidate);

                if (value !== undefined && (typeof value === 'string' || !('length' in value))) {
                    throw new Error();
                }

                candidates.push(<Selector options={candidate}
                    value={value}
                    onClick={
                        value => this.props.onClick(new Map([...this.props.value, [candidate, value]]))
                    } />);
            }
        }

        return (
            <div className="planner">
                <div className="planner-header" onClick={() => this.setState({ open: !this.state.open })}>
                    <div className="planner-expand-button">
                        {this.state.open ? '▼' : '▶︎'}
                    </div>
                    <div className="constraint-title">
                        <h1>{this.props.constraint.title}</h1>
                        {this.props.constraint.subtitle !== undefined ? (<h2>{this.props.constraint.subtitle}</h2>) : ""}
                    </div>
                    <div className="constraint-credits-count">
                        <div className="acquired-credits-count">
                            <strong>{
                                creditsSum(this.props.constraint, this.props.value, state => state === CourseSelectedState.acquired)
                            }</strong>
                            修得
                        </div>
                        <div className="registered-credits-count">
                            <strong>{
                                creditsSum(this.props.constraint, this.props.value, state => state !== CourseSelectedState.unselected)
                            }</strong>
                            履修
                        </div>
                        <div className="required-credits-count">
                            <strong>{
                                typeof this.props.constraint.creditsCount === 'number' ?
                                    this.props.constraint.creditsCount :
                                    `${this.props.constraint.creditsCount.min}-${this.props.constraint.creditsCount.max}`
                            }</strong>
                            必要
                        </div>
                    </div>
                    <IsOKButton value={validity(this.props.constraint, this.props.value)} disabled={this.props.disabled} />
                </div>
                {this.state.open ? (<div className="planner-body">{candidates}</div>) : ''}
            </div>
        );
    }
}

enum ConstraintSelectValidity { none = 0, registration = 1, acquisition = 2 }
function IsOKButton(props: { value: ConstraintSelectValidity, disabled: boolean }) {
    return (
        <div className="is-ok-button"
            data-value={props.value}
            data-disabled={props.disabled}>{
                props.value === ConstraintSelectValidity.registration ?
                    '履修OK' :
                    props.value === ConstraintSelectValidity.acquisition ?
                        '修得OK' : '履修不足'
            }</div>
    );
}

function Selector(props: {
    options: Iterable<Constraint | Course>,
    onClick: (value: readonly [Constraint, ConstraintSelectedState] | readonly [Course, CourseSelectedState]) => void,
    value: readonly [Constraint, ConstraintSelectedState] | readonly [Course, CourseSelectedState] | undefined
}) {
    return (
        <div className="selector">
            <h1></h1>
            <div className="selector-body">
                {[...props.options].map(option => {
                    let contents: JSX.Element;
                    if ('candidates' in option) {
                        if (props.value === undefined) {
                            contents = (<Planner constraint={option}
                                onClick={value => props.onClick([option, value])}
                                disabled={true}
                                value={new Map()} />);
                        } else {
                            if (!(props.value[1] instanceof Map)) {
                                throw new Error();
                            }

                            contents = (<Planner constraint={option}
                                onClick={value => props.onClick([option, value])}
                                disabled={props.value === undefined || props.value[0] !== option}
                                value={props.value[0] === option ? props.value[1] : new Map()} />)
                        }
                    } else {
                        if (props.value === undefined) {
                            contents = (<CourseViewer course={option}
                                value={unselected}
                                disabled={true}
                                onClick={value => props.onClick([option, value])} />);
                        } else {
                            if (!(typeof props.value[1] === 'string')) {
                                throw new Error();
                            }

                            contents = (<CourseViewer course={option}
                                value={props.value[0] === option ? props.value[1] : unselected}
                                disabled={props.value[0] !== option}
                                onClick={value => props.onClick([option, value])} />);
                        }
                    }

                    return (
                        <div className="option" data-selected={props.value !== undefined && props.value[0] === option}>
                            <div onClick={() => { props.onClick('candidates' in option ? [option, new Map()] : [option, unselected]) }} className="option-select-button"></div>
                            <div className="option-contents">{contents}</div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}

enum CourseSelectedState { unselected = 'unselected', registered = 'registered', acquired = 'acquired' }
const unselected = CourseSelectedState.unselected
function CourseViewer(props: {
    course: Course,
    value: CourseSelectedState,
    disabled: boolean,
    onClick: (value: CourseSelectedState) => void
}) {
    const value = props.value || unselected;
    const disabled = props.disabled || false;

    return (
        <div className="course" onClick={() => {
            if (props.value == CourseSelectedState.acquired) {
                props.onClick(CourseSelectedState.unselected);
            } else if (props.value == CourseSelectedState.registered) {
                props.onClick(CourseSelectedState.acquired);
            } else {
                props.onClick(CourseSelectedState.registered);
            }
        }}
            data-value={props.value}
            data-disabled={props.disabled}>
            <span className="course-code"><code>{props.course.code}</code></span>
            <h1 className="course-title">{props.course.title}</h1>
            <span className="course-credits-count"><strong>{props.course.creditsCount}</strong>単位</span>
            <TakeCourseButton
                value={value}
                disabled={disabled} />
        </div>
    );
}

function TakeCourseButton(props: { value: CourseSelectedState, disabled: boolean }) {
    return (
        <div className="take-course-button"
            data-value={props.value}
            data-disabled={props.disabled}></div>
    )
}

/*
interface Plan {
        constraint: Constraint;
contents: Set<Course | Plan>
}
*/