import React, { useState } from 'react';
import { Accordion, Button, ButtonToolbar, Card, Col, Form } from 'react-bootstrap';
import Course from '../Course';
import FilterType from '../FilterType';
import Plan, { RegisteredCreditsCounts, RegistrationStatus } from '../Plan';
import RegistrationStatusLockTarget from '../RegistrationStatusLockTarget';
import { RequirementWithCourses } from '../Requirements';
import CourseList from './CourseList';
import { RequirementSummaryView } from './RequirementSummaryView';

const OthersCountInput = ({ currentOthersCount, onReturn, onHide }: {
    currentOthersCount: RegisteredCreditsCounts,
    onReturn: (newOthersCount: RegisteredCreditsCounts) => void,
    onHide: () => void,
}) => {
    const [acquired, setAcquired] = useState<number | undefined>();
    const [registeredExcludingAcquired, setRegisteredExcludingAcquired] = useState<number | undefined>();
    const [registeredIncludingAcquired, setRegisteredIncludingAcquired] = useState<number | undefined>();

    const computed = {
        acquired: acquired ?? currentOthersCount.acquired,
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
        <Card border="primary">
            <Card.Header>単位数を入力</Card.Header>
            <Card.Body>
                <Form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    onReturn(computed);
                    onHide();
                }}>
                    <Form.Row>
                        <Form.Group as={Col} md="4">
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
                        <Form.Group as={Col} md="4">
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
                        <Form.Group as={Col} md="4">
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
                        >
                            OK
                        </Button>
                        <Button variant="secondary" onClick={onHide}>キャンセル</Button>
                    </ButtonToolbar>
                </Form>
            </Card.Body>
        </Card>
    )
}

const RequirementWithCoursesView = ({ requirement, filterType, lockTarget, plan, onCourseClick, onOthersCountsChange }: {
    requirement: RequirementWithCourses,
    filterType: FilterType,
    lockTarget: RegistrationStatusLockTarget,
    plan: Plan,
    onCourseClick: (course: Course, requirement: RequirementWithCourses) => void,
    onOthersCountsChange: (newOthersCount: RegisteredCreditsCounts) => void,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showsInput, setShowsInput] = useState(false);

    const courses = requirement.courses.filter(course =>
        filterType === FilterType.None ||
        (plan.courseToStatus.has(course) && plan.courseToStatus.get(course) !== RegistrationStatus.Unregistered)
    ).filter(course => filterType !== FilterType.Valid || requirement === plan.courseToRequirement.get(course));

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
                                        {filterType === FilterType.None ? '' : '履修する'}科目はありません
                                    </Button>
                                ) : (
                                <Button
                                    block className="mt-3"
                                    onClick={() => setIsOpen(!isOpen)}
                                    variant={isOpen ? 'primary' : 'outline-secondary'}
                                >
                                    {filterType === FilterType.None ? '' : '履修する'}科目を{isOpen ? '非' : ''}表示
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
                                <CourseList
                                    courses={courses} plan={plan}
                                    requirement={requirement} lockTarget={lockTarget}
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

export default RequirementWithCoursesView;