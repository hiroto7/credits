import { $array, $number, $object, $string } from '@hiroto/json-type-checker';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { ListGroup, Container, Col, Row, Badge } from 'react-bootstrap';
import Course from './Course';
import './App.css';

import courses0 from './courses1.json';
import CourseStatus from './CourseStatus';
const courses: unknown = courses0;

if (!$array($object({
    title: $string,
    code: $string,
    creditsCount: $number,
})).isCompatible(courses)) {
    console.log(courses)
    throw new Error('科目定義が不正です');
}

const CourseListItem = ({ course, status, onClick }: { course: Course, status: CourseStatus, onClick?: (nextStatus: CourseStatus) => void }) => (
    <ListGroup.Item action onClick={() => onClick && onClick((status + 1) % 3)}>
        <div className="d-flex justify-content-between align-items-center">
            <div>
                <div>{course.title}</div>
                <code>{course.code}</code>
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

const App = () => {
    const [courseToStatus, setCourseToStatus] = useState(new Map<Course, CourseStatus>());

    return (
        <Container>
            <Row>
                <Col>
                    <ListGroup>
                        {
                            courses.map((course: Course) => (
                                <CourseListItem course={course} status={courseToStatus.get(course) || CourseStatus.Unregistered} onClick={
                                    (nextStatus) => setCourseToStatus(new Map([...courseToStatus, [course, nextStatus]]))
                                }></CourseListItem>
                            ))
                        }
                    </ListGroup>
                </Col>
                <Col></Col>
            </Row>
        </Container>
    );
}

export default App;