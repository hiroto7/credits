import React from 'react';
import { Badge, ListGroup } from "react-bootstrap";
import Course from "./Course";
import getNextStatus from './getNextStatus';
import Plan from './Plan';
import RegistrationStatus from "./RegistrationStatus";
import RegistrationStatusLockTarget from './RegistrationStatusLockTarget';
import Requirements, { RequirementWithCourses } from "./Requirements";

const isRegistrable = ({ course, courseToStatus }: {
    course: Course,
    courseToStatus: ReadonlyMap<Course, RegistrationStatus>,
}) => ![...courseToStatus].some(
    ([course1, status]) =>
        course1 !== course && course1.title === course.title && status !== RegistrationStatus.Unregistered
);

const CourseListItem = ({ course, onClick, newRequirement, plan, lockTarget }: {
    course: Course,
    newRequirement: Requirements,
    plan: Plan,
    lockTarget: RegistrationStatusLockTarget,
    onClick: () => void,
}) => {
    const status = plan.courseToStatus.get(course) ?? RegistrationStatus.Unregistered;
    const currentRequirement = plan.courseToRequirement.get(course);
    const isRegisteredButInvalid = status !== RegistrationStatus.Unregistered && currentRequirement !== newRequirement;
    const disabled = !isRegistrable({
        course,
        courseToStatus: plan.courseToStatus
    });
    const action = getNextStatus({ currentStatus: status, lockTarget }) !== status || isRegisteredButInvalid;

    return (
        <ListGroup.Item
            action={action}
            onClick={onClick}
            disabled={disabled}
            variant={
                isRegisteredButInvalid ? 'dark' :
                    status === RegistrationStatus.Acquired ? 'success' :
                        status === RegistrationStatus.Registered ? 'primary' :
                            undefined
            }
        >
            <div className="d-flex justify-content-between align-items-center">
                <div>
                    <div>{course.title}</div>
                    <code>{course.code}</code>
                </div>
                <div className="ml-2 text-right flex-shrink-0">
                    {
                        isRegisteredButInvalid ?
                            currentRequirement === undefined ?
                                (<Badge variant="secondary">?</Badge>) :
                                (<Badge variant="warning">!</Badge>) :
                            (<></>)
                    }
                    <Badge variant={status === RegistrationStatus.Acquired ? 'success' : status === RegistrationStatus.Registered ? 'primary' : 'secondary'}>
                        {status === RegistrationStatus.Acquired ? '修得済み' : status === RegistrationStatus.Registered ? '履修する' : '履修しない'}
                    </Badge>
                    <div><span className="text-muted">単位数</span> <strong>{course.creditsCount}</strong></div>
                </div>
            </div>
        </ListGroup.Item>
    )
};

const CourseList = ({ requirement, courses, plan, onCourseClick, lockTarget }: {
    requirement: RequirementWithCourses,
    courses: readonly Course[],
    plan: Plan,
    lockTarget: RegistrationStatusLockTarget
    onCourseClick: (course: Course) => void,
}) => (
        <ListGroup>
            {
                courses.map((course: Course) => (
                    <CourseListItem
                        key={course.code}
                        course={course} plan={plan}
                        newRequirement={requirement}
                        lockTarget={lockTarget}
                        onClick={() => onCourseClick(course)}
                    />
                ))
            }
        </ListGroup>
    );

export default CourseList;