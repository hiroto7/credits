import React from 'react';
import { Badge, ListGroup } from "react-bootstrap";
import Course from "./Course";
import RegistrationStatus from "./RegistrationStatus";
import Requirements, { RequirementWithCourses } from "./Requirements";

const CourseListItem = ({ course, status, onClick, currentRequirement, newRequirement }: {
    course: Course,
    status: RegistrationStatus,
    onClick: (nextStatus: RegistrationStatus) => void,
    currentRequirement: Requirements | undefined,
    newRequirement: Requirements,
}) => (
        <ListGroup.Item action onClick={() => {
            if (status === RegistrationStatus.Unregistered || currentRequirement === newRequirement) {
                onClick((status + 1) % 3);
            } else if (window.confirm(`科目「${course.title}」は 要件「${currentRequirement!.title}」に割り当てられています。要件「${newRequirement.title}」に移動しますか？`)) {
                onClick(status);
            }
        }}
            //variant={status === RegistrationStatus.Acquired ? 'success' : status === RegistrationStatus.Registered ? 'primary' : undefined}>
            variant={
                status === RegistrationStatus.Unregistered ? undefined :
                    currentRequirement === newRequirement ?
                        status === RegistrationStatus.Acquired ? 'success' : 'primary' :
                        'dark'}>
            <div className="d-flex justify-content-between align-items-center">
                <div>
                    <div>{course.title}</div>
                    <code>{course.code}</code>
                </div>
                <div className="text-right flex-shrink-0">
                    {
                        status !== RegistrationStatus.Unregistered && currentRequirement !== newRequirement ?
                            (<Badge variant="warning">!</Badge>) : (<></>)
                    }
                    <Badge variant={status === RegistrationStatus.Acquired ? 'success' : status === RegistrationStatus.Registered ? 'primary' : 'secondary'}>
                        {status === RegistrationStatus.Acquired ? '修得済み' : status === RegistrationStatus.Registered ? '履修する' : '履修しない'}
                    </Badge>
                    <div><span className="text-muted">単位数</span> <strong>{course.creditsCount}</strong></div>
                </div>
            </div>
        </ListGroup.Item>
    );

const CourseList = ({ requirement, courseToStatus, courseToRequirement, onCourseClick: onClick }: {
    requirement: RequirementWithCourses,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, Requirements>,
    onCourseClick: (course: Course, nextStatus: RegistrationStatus) => void,
}) => (
        <ListGroup>
            {
                requirement.courses.map((course: Course) => (
                    <CourseListItem key={course.code} course={course}
                        currentRequirement={courseToRequirement.get(course)}
                        newRequirement={requirement}
                        status={courseToStatus.get(course) || RegistrationStatus.Unregistered}
                        onClick={nextStatus => onClick(course, nextStatus)}></CourseListItem>
                ))
            }
        </ListGroup>
    );

export default CourseList;