import React, { useState } from 'react';
import { Accordion, Badge, Button, ButtonToolbar, Card, Col, Dropdown, Form, ListGroup } from "react-bootstrap";
import Course from "./Course";
import CourseList from "./CourseList";
import Plan from './Plan';
import RegistrationStatus from "./RegistrationStatus";
import Requirements, { RegisteredCreditsCounts, RequirementWithChildren, RequirementWithCourses, SelectionRequirement } from "./Requirements";

const CreditsCountLabelDelimiter = () => (<span className="text-muted"> / </span>)

const ExceededCreditsCountLabel = ({ creditsCount }: { creditsCount: number }) => (
    <>
        <span className="text-muted">(</span>
        +{creditsCount}
        <span className="text-muted">)</span>
    </>
);

const CreditsCountLabels = ({ requirement, plan }: {
    requirement: Requirements,
    plan: Plan,
}) => {
    const creditsCount = requirement.getRegisteredCreditsCount(plan, false);
    const exceededCreditsCount = requirement.getRegisteredCreditsCount(plan, true);
    const requiredCreditsCount = requirement.getRequiredCreditsCount(plan.selectionNameToOptionName);

    return (
        <div>
            <span>
                <span className="text-muted">習得</span>
                <> </>
                <strong className="text-success">{creditsCount.acquired}</strong>
                {exceededCreditsCount.acquired > creditsCount.acquired ? (<ExceededCreditsCountLabel creditsCount={exceededCreditsCount.acquired - creditsCount.acquired} />) : (<></>)}
            </span>
            <CreditsCountLabelDelimiter />
            <span>
                <span className="text-muted">履修</span>
                <> </>
                <strong className="text-primary">{creditsCount.registered}</strong>
                {exceededCreditsCount.registered > creditsCount.registered ? (<ExceededCreditsCountLabel creditsCount={exceededCreditsCount.registered - creditsCount.registered} />) : (<></>)}
            </span>
            <CreditsCountLabelDelimiter />
            <span>
                <span className="text-muted">必要</span>
                <> </>
                <strong>
                    {
                        requiredCreditsCount.min === requiredCreditsCount.max ?
                            requiredCreditsCount.min :
                            `${requiredCreditsCount.min}~${requiredCreditsCount.max}`
                    }
                </strong>
            </span>
        </div>
    )
};

export const RequirementSummaryView = ({ requirement, plan }: {
    requirement: RequirementWithChildren | RequirementWithCourses,
    plan: Plan,
}) => {
    const status = requirement.getStatus(plan);
    return (
        <>
            <h5 className="d-flex justify-content-between align-items-center">
                <div>{requirement.name}</div>
                <Badge className="ml-2 flex-shrink-0" variant={status === RegistrationStatus.Acquired ? 'success' : status === RegistrationStatus.Registered ? 'primary' : 'secondary'}>
                    {status === RegistrationStatus.Acquired ? '修得OK' : status === RegistrationStatus.Registered ? '履修OK' : '不足'}
                </Badge>
            </h5>
            <div>
                {requirement.description === undefined ? (<></>) : (<div className="text-muted">{requirement.description}</div>)}
                <CreditsCountLabels requirement={requirement} plan={plan} />
            </div>
        </>
    );
}

const RequirementWithChildrenView = ({ requirement, showsOnlyRegistered, plan, onCourseClick, onOthersCountsChange, onSelectionChange }: {
    requirement: RequirementWithChildren,
    showsOnlyRegistered: boolean,
    plan: Plan,
    onCourseClick: (course: Course, requirement: RequirementWithCourses) => void,
    onOthersCountsChange: (requirement: RequirementWithCourses, newOthersCount: RegisteredCreditsCounts) => void,
    onSelectionChange: (selectionName: string, newOptionName: string) => void,
}) => (
        <>
            <RequirementSummaryView requirement={requirement} plan={plan} />
            <ListGroup className="mt-3">
                {
                    requirement.children.map(child => (
                        <ListGroup.Item key={child.name}>
                            <RequirementView
                                requirement={child} showsOnlyRegistered={showsOnlyRegistered} plan={plan}
                                onCourseClick={onCourseClick} onSelectionChange={onSelectionChange}
                                onOthersCountsChange={onOthersCountsChange}
                            />
                        </ListGroup.Item>
                    ))
                }
            </ListGroup>
        </>
    );

const OthersCountInput = ({ currentOthersCount, onReturn, onHide }: {
    currentOthersCount: RegisteredCreditsCounts,
    onReturn: (newOthersCount: RegisteredCreditsCounts) => void,
    onHide: () => void,
}) => {
    const [acquired, setAcquired] = useState(undefined as number | undefined);
    const [registeredExcludingAcquired, setRegisteredExcludingAcquired] = useState(undefined as number | undefined);
    const [registeredIncludingAcquired, setRegisteredIncludingAcquired] = useState(undefined as number | undefined);

    const computed = {
        acquired: acquired || currentOthersCount.acquired,
        registered:
            registeredIncludingAcquired !== undefined ?
                registeredIncludingAcquired :
                registeredExcludingAcquired !== undefined ?
                    (acquired !== undefined ? acquired : currentOthersCount.acquired) + registeredExcludingAcquired :
                    acquired !== undefined ?
                        currentOthersCount.registered + acquired - currentOthersCount.acquired :
                        currentOthersCount.registered,
    }

    return (
        <Card body border="primary">
            <Form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                onReturn(computed);
                onHide();
            }}>
                <Form.Row>
                    <Form.Group as={Col} md="4" controlId="validationCustom01">
                        <Form.Label>習得済みの単位数 <span className="text-muted">(a)</span></Form.Label>
                        <Form.Control
                            type="number" min={0}
                            placeholder={`${computed.acquired}`}
                            value={acquired === undefined ? '' : `${acquired}`}
                            onChange={
                                (e: React.ChangeEvent<HTMLInputElement>) =>
                                    setAcquired(e.target.value === '' ? undefined : +e.target.value)
                            }
                            isInvalid={computed.acquired < 0}
                        />
                        <Form.Control.Feedback type="invalid">(a) &gt;= 0</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group as={Col} md="4" controlId="validationCustom02">
                        <Form.Label>履修する単位数 <span className="text-muted">(b)</span></Form.Label>
                        <Form.Control
                            type="number" min={0}
                            placeholder={`${computed.registered - computed.acquired}`}
                            value={registeredExcludingAcquired === undefined ? '' : `${registeredExcludingAcquired}`}
                            onChange={
                                (e: React.ChangeEvent<HTMLInputElement>) => {
                                    if (e.target.value === '') {
                                        setRegisteredExcludingAcquired(undefined);
                                    } else {
                                        setRegisteredExcludingAcquired(+e.target.value);
                                        setRegisteredIncludingAcquired(undefined);
                                    }
                                }
                            }
                            isInvalid={computed.acquired > computed.registered}
                        />
                        <Form.Control.Feedback type="invalid">(b) &gt;= 0</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group as={Col} md="4" controlId="validationCustom02">
                        <Form.Label>計 <span className="text-muted">(a) + (b)</span></Form.Label>
                        <Form.Control
                            type="number" min={0}
                            placeholder={`${computed.registered}`}
                            value={registeredIncludingAcquired === undefined ? '' : `${registeredIncludingAcquired}`}
                            onChange={
                                (e: React.ChangeEvent<HTMLInputElement>) => {
                                    if (e.target.value === '') {
                                        setRegisteredIncludingAcquired(undefined);
                                    } else {
                                        setRegisteredIncludingAcquired(+e.target.value);
                                        setRegisteredExcludingAcquired(undefined);
                                    }
                                }
                            }
                        />
                    </Form.Group>
                </Form.Row>
                <ButtonToolbar>
                    <Button
                        type="submit"
                        disabled={computed.acquired < 0 || computed.acquired > computed.registered}
                    >OK</Button>
                    <Button variant="secondary" onClick={onHide}>キャンセル</Button>
                </ButtonToolbar>
            </Form>
        </Card>
    )
}

const RequirementWithCoursesView = ({ requirement, showsOnlyRegistered, plan, onCourseClick, onOthersCountsChange }: {
    requirement: RequirementWithCourses,
    showsOnlyRegistered: boolean,
    plan: Plan,
    onCourseClick: (course: Course, requirement: RequirementWithCourses) => void,
    onOthersCountsChange: (newOthersCount: RegisteredCreditsCounts) => void,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showsInput, setShowsInput] = useState(false);

    const courses = requirement.courses.filter(course =>
        !showsOnlyRegistered || (plan.courseToStatus.get(course) !== RegistrationStatus.Unregistered &&
            requirement === plan.courseToRequirement.get(course)));

    return (
        <>
            <Accordion activeKey={isOpen ? '0' : ''}>
                <div className={`bg-white ${isOpen ? 'sticky-top' : ''}`}>
                    <RequirementSummaryView requirement={requirement} plan={plan} />
                    {
                        courses.length === 0 ?
                            requirement.allowsOthers ? (
                                showsInput ? (<></>) : (
                                    <Button block className="mt-3" variant="secondary" onClick={() => setShowsInput(true)}>
                                        単位数を入力
                                    </Button>
                                )
                            ) : (
                                    <Button block className="mt-3" variant="outline-secondary" disabled>
                                        {showsOnlyRegistered ? '履修する' : ''}科目はありません
                                    </Button>
                                ) : (
                                <Button
                                    block className="mt-3"
                                    onClick={() => setIsOpen(!isOpen)}
                                    variant={isOpen ? 'primary' : 'outline-secondary'}
                                >
                                    {showsOnlyRegistered ? '履修する' : ''}科目を{isOpen ? '非' : ''}表示
                                </Button>
                            )
                    }
                </div>
                {
                    showsInput ? (
                        <div className="mt-3">
                            <OthersCountInput
                                currentOthersCount={plan.requirementToOthersCount.get(requirement) || { acquired: 0, registered: 0 }}
                                onReturn={onOthersCountsChange} onHide={() => setShowsInput(false)}
                            />
                        </div>
                    ) : (<></>)
                }
                <Accordion.Collapse eventKey="0">
                    {
                        courses.length === 0 ? (<></>) : (
                            <div className="mt-3">
                                <CourseList requirement={requirement} courses={courses} plan={plan}
                                    onCourseClick={course => onCourseClick(course, requirement)}
                                />
                            </div>
                        )
                    }
                </Accordion.Collapse>
            </Accordion>
        </>
    );
}

const SelectionRequirementView = ({ requirement, showsOnlyRegistered, plan, onCourseClick, onOthersCountsChange, onSelectionChange }: {
    requirement: SelectionRequirement,
    showsOnlyRegistered: boolean,
    plan: Plan,
    onCourseClick: (course: Course, requirement: RequirementWithCourses) => void,
    onOthersCountsChange: (requirement: RequirementWithCourses, newOthersCount: RegisteredCreditsCounts) => void,
    onSelectionChange: (selectionName: string, newOptionName: string) => void,
}) => {
    const selectedOptionName = requirement.getSelectedOptionName(plan.selectionNameToOptionName);
    const selectedRequirement = requirement.getSelectedRequirement(plan.selectionNameToOptionName);

    const handleOptionClick = (newOptionName: string) => {
        if (selectedOptionName !== newOptionName) {
            onSelectionChange(requirement.selectionName, newOptionName);
        }
    };

    return (
        <>
            <Dropdown>
                <Dropdown.Toggle id="" variant="secondary" disabled={showsOnlyRegistered}>
                    <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {requirement.selectionName}
                        <> : </>
                        <strong>{selectedOptionName}</strong>
                    </span>
                </Dropdown.Toggle>

                <Dropdown.Menu style={{ zIndex: 1100 }}>
                    {
                        requirement.options.map(option => (
                            <Dropdown.Item key={option.name}
                                active={option.name === selectedOptionName}
                                onClick={() => handleOptionClick(option.name)}
                            >
                                {option.name}
                            </Dropdown.Item>
                        ))
                    }
                </Dropdown.Menu>
            </Dropdown>
            {
                selectedRequirement === undefined ? (<></>) : (
                    <div className="mt-3">
                        <RequirementView
                            requirement={selectedRequirement} showsOnlyRegistered={showsOnlyRegistered} plan={plan}
                            onCourseClick={onCourseClick} onOthersCountsChange={onOthersCountsChange}
                            onSelectionChange={onSelectionChange}
                        />
                    </div>
                )
            }
        </>
    );
}

const RequirementView = ({ requirement, showsOnlyRegistered, plan, onCourseClick, onOthersCountsChange, onSelectionChange }: {
    requirement: Requirements,
    showsOnlyRegistered: boolean,
    plan: Plan,
    onCourseClick: (course: Course, requirement: RequirementWithCourses) => void,
    onOthersCountsChange: (requirement: RequirementWithCourses, newOthersCount: RegisteredCreditsCounts) => void,
    onSelectionChange: (selectionName: string, newOptionName: string) => void,
}) => {
    if (requirement instanceof RequirementWithChildren) {
        return (
            <RequirementWithChildrenView
                requirement={requirement} showsOnlyRegistered={showsOnlyRegistered} plan={plan}
                onCourseClick={onCourseClick} onOthersCountsChange={onOthersCountsChange} onSelectionChange={onSelectionChange}
            />
        )
    } else if (requirement instanceof RequirementWithCourses) {
        return (
            <RequirementWithCoursesView
                requirement={requirement} showsOnlyRegistered={showsOnlyRegistered} plan={plan}
                onCourseClick={onCourseClick}
                onOthersCountsChange={creditsCounts => onOthersCountsChange(requirement, creditsCounts)}
            />
        )
    } else {
        return (
            <SelectionRequirementView
                requirement={requirement} showsOnlyRegistered={showsOnlyRegistered} plan={plan}
                onCourseClick={onCourseClick} onOthersCountsChange={onOthersCountsChange} onSelectionChange={onSelectionChange}
            />
        );
    }
}

export default RequirementView;
