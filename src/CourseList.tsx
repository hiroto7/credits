import React from 'react';
import { Badge, ListGroup } from "react-bootstrap";
import Course from "./Course";
import Plan from './Plan';
import RegistrationStatus from "./RegistrationStatus";
import Requirements, { RequirementWithCourses } from "./Requirements";

const CourseListItem = ({ course, status, onClick, currentRequirement, newRequirement, disabled }: {
    course: Course,
    status: RegistrationStatus,
    onClick: () => void,
    currentRequirement: Requirements | undefined,
    newRequirement: Requirements,
    disabled: boolean,
}) => (
        <ListGroup.Item action disabled={disabled} onClick={onClick}
            variant={
                status === RegistrationStatus.Unregistered ? undefined :
                    currentRequirement === newRequirement ?
                        status === RegistrationStatus.Acquired ? 'success' : 'primary' :
                        'dark'
            }>
            <div className="d-flex justify-content-between align-items-center">
                <div>
                    <div>{course.title}</div>
                    <code>{course.code}</code>
                </div>
                <div className="ml-2 text-right flex-shrink-0">
                    {
                        status === RegistrationStatus.Unregistered || currentRequirement === newRequirement ?
                            (<></>) :
                            currentRequirement === undefined ?
                                (<Badge variant="secondary">?</Badge>) :
                                (<Badge variant="warning">!</Badge>)
                    }
                    <Badge variant={status === RegistrationStatus.Acquired ? 'success' : status === RegistrationStatus.Registered ? 'primary' : 'secondary'}>
                        {status === RegistrationStatus.Acquired ? '修得済み' : status === RegistrationStatus.Registered ? '履修する' : '履修しない'}
                    </Badge>
                    <div><span className="text-muted">単位数</span> <strong>{course.creditsCount}</strong></div>
                </div>
            </div>
        </ListGroup.Item>
    );

const CourseList = ({ requirement, courses, plan, onCourseClick }: {
    requirement: RequirementWithCourses,
    courses: readonly Course[],
    plan: Plan,
    onCourseClick: (course: Course) => void,
}) => (
        <ListGroup>
            {
                courses.map((course: Course) => (
                    <CourseListItem
                        key={course.code} course={course}
                        currentRequirement={plan.courseToRequirement.get(course)}
                        newRequirement={requirement}
                        status={plan.courseToStatus.get(course) || RegistrationStatus.Unregistered}
                        onClick={() => onCourseClick(course)}
                        disabled={
                            (!plan.courseToStatus.has(course) || plan.courseToStatus.get(course) === RegistrationStatus.Unregistered) &&
                            [...plan.courseToStatus.entries()]
                                .filter(([_, status]) => status !== RegistrationStatus.Unregistered)
                                .map(([course, _]) => course.title)
                                .includes(course.title)
                        }
                    />
                ))
            }
        </ListGroup>
    );

export default CourseList;