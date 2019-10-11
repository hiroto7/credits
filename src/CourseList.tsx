import React from 'react';
import { Badge, ListGroup } from "react-bootstrap";
import Course from "./Course";
import CourseStatus from "./CourseStatus";
import Requirements from "./Requirements";

const CourseListItem = ({ course, status, onClick, requirement }: {
    course: Course,
    status: CourseStatus,
    onClick: (nextStatus: CourseStatus) => void,
    requirement?: Requirements
}) => (
        <ListGroup.Item action onClick={() => onClick !== undefined && onClick((status + 1) % 3)} variant={status === CourseStatus.Acquired ? 'success' : status === CourseStatus.Registered ? 'primary' : undefined}>
            <div className="d-flex justify-content-between align-items-center">
                <div>
                    <div>{course.title}</div>
                    <code>{course.code}</code>
                    {requirement === undefined ? '' : status === CourseStatus.Unregistered ? '' : (<div>{requirement.title}</div>)}
                </div>
                <div className="text-right flex-shrink-0">
                    <Badge variant={status === CourseStatus.Acquired ? 'success' : status === CourseStatus.Registered ? 'primary' : 'secondary'}>
                        {status === CourseStatus.Acquired ? '修得済み' : status === CourseStatus.Registered ? '履修する' : '履修しない'}
                    </Badge>
                    <div><span className="text-muted">単位数</span> <strong>{course.creditsCount}</strong></div>
                </div>
            </div>
        </ListGroup.Item>
    );

const CourseList = ({ courses, courseToStatus, courseToRequirement, onCourseClick: onClick }: {
    courses: readonly Course[],
    courseToStatus: Map<Course, CourseStatus>,
    courseToRequirement: Map<Course, Requirements>,
    onCourseClick: (course: Course, nextStatus: CourseStatus) => void,
}) => (
        <ListGroup>
            {
                courses.map((course: Course) => (
                    <CourseListItem key={course.code} course={course} requirement={courseToRequirement.get(course)}
                        status={courseToStatus.get(course) || CourseStatus.Unregistered}
                        onClick={nextStatus => onClick(course, nextStatus)}></CourseListItem>
                ))
            }
        </ListGroup>
    );

export default CourseList;