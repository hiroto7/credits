import React from 'react';
import { Badge, ListGroup } from "react-bootstrap";
import Course from "./Course";
import RegistrationStatus from "./RegistrationStatus";
import Requirements from "./Requirements";

const CourseListItem = ({ course, status, onClick, requirement }: {
    course: Course,
    status: RegistrationStatus,
    onClick: (nextStatus: RegistrationStatus) => void,
    requirement?: Requirements
}) => (
        <ListGroup.Item action onClick={() => onClick((status + 1) % 3)} variant={status === RegistrationStatus.Acquired ? 'success' : status === RegistrationStatus.Registered ? 'primary' : undefined}>
            <div className="d-flex justify-content-between align-items-center">
                <div>
                    <div>{course.title}</div>
                    <code>{course.code}</code>
                    {requirement === undefined ? '' : status === RegistrationStatus.Unregistered ? '' : (<div>{requirement.title}</div>)}
                </div>
                <div className="text-right flex-shrink-0">
                    <Badge variant={status === RegistrationStatus.Acquired ? 'success' : status === RegistrationStatus.Registered ? 'primary' : 'secondary'}>
                        {status === RegistrationStatus.Acquired ? '修得済み' : status === RegistrationStatus.Registered ? '履修する' : '履修しない'}
                    </Badge>
                    <div><span className="text-muted">単位数</span> <strong>{course.creditsCount}</strong></div>
                </div>
            </div>
        </ListGroup.Item>
    );

const CourseList = ({ courses, courseToStatus, courseToRequirement, onCourseClick: onClick }: {
    courses: readonly Course[],
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, Requirements>,
    onCourseClick: (course: Course, nextStatus: RegistrationStatus) => void,
}) => (
        <ListGroup>
            {
                courses.map((course: Course) => (
                    <CourseListItem key={course.code} course={course} requirement={courseToRequirement.get(course)}
                        status={courseToStatus.get(course) || RegistrationStatus.Unregistered}
                        onClick={nextStatus => onClick(course, nextStatus)}></CourseListItem>
                ))
            }
        </ListGroup>
    );

export default CourseList;