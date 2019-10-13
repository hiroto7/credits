import { $array, $number, $object, $optional, $string, isCompatible } from '@hiroto/json-type-checker';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import './App.css';
import requirements0 from './coins17.json';
import Course from './Course';
import courses0 from './courses1.json';
import CourseStatus from './CourseStatus';
import Requirements, { RequirementWithChildren, RequirementWithCourses, SelectionRequirement } from './Requirements';
import RequirementView from './RequirementView';
import CourseList from './CourseList';

const courses: unknown = courses0;

if (!isCompatible(courses, $array($object({
    title: $string,
    code: $string,
    creditsCount: $number,
})))) {
    throw new Error('科目定義が不正です');
}

const codeToCourse = new Map<string, Course>();
for (const course of courses) {
    codeToCourse.set(course.code, course);
}

const convertJSONToRichRequirement = (json: unknown): Requirements => {
    if (isCompatible(json, $object({
        title: $string,
        description: $optional($string),
        creditsCount: $number,
        courses: $array($string),
    }))) {
        return new RequirementWithCourses({
            title: json.title,
            description: json.description,
            creditsCount: json.creditsCount,
            courses: json.courses.map(courseCode => {
                const course = codeToCourse.get(courseCode);
                if (course === undefined) { throw new Error(`要件定義が不正です。科目番号 ${courseCode} は定義されていません。`); }
                return course;
            })
        });
    } else if (isCompatible(json, $object({
        title: $string,
        description: $optional($string),
        children: $array($object({})),
        creditsCount: $optional($number),
    }))) {
        return new RequirementWithChildren({
            title: json.title,
            description: json.description,
            children: json.children.map(child => convertJSONToRichRequirement(child)),
            creditsCount: json.creditsCount,
        });
    } else if (isCompatible(json, $object({
        title: $string,
        description: $optional($string),
        choices: $array($object({})),
    }))) {
        return new SelectionRequirement({
            title: json.title,
            description: json.description,
            choices: json.choices.map(choice => convertJSONToRichRequirement(choice)),
        })
    } else {
        throw new Error('要件定義が不正です。')
    }
}

const requirement = convertJSONToRichRequirement(requirements0);

console.log(requirement);

const App = () => {
    const [courseToStatus, setCourseToStatus] = useState(new Map<Course, CourseStatus>());
    const [courseToRequirement, setCourseToRequirement] = useState(new Map<Course, Requirements>());
    const [selectionToRequirement, setSelectionToRequirement] = useState(new Map<SelectionRequirement, Requirements>());

    return (
        <Container>
            <Row>
                <Col md={4}>
                    <CourseList courses={courses} courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
                        onCourseClick={(course: Course, nextStatus: CourseStatus) => setCourseToStatus(new Map([...courseToStatus, [course, nextStatus]]))} />
                </Col>
                <Col md={8}>
                    <RequirementView onCourseClick={
                        (course: Course, nextStatus: CourseStatus, requirement: Requirements) => {
                            setCourseToStatus(new Map([...courseToStatus, [course, nextStatus]]));
                            setCourseToRequirement(new Map([...courseToRequirement, [course, requirement]]));
                        }
                    } onSelectionChange={
                        (selection: SelectionRequirement, chosen: Requirements) => setSelectionToRequirement(new Map([...selectionToRequirement, [selection, chosen]]))
                    } requirement={requirement} courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} selectionToRequirement={selectionToRequirement} />
                </Col>
            </Row>
        </Container>
    );
}

export default App;