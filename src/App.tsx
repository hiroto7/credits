import { $array, $number, $object, $optional, $string, isCompatible } from '@hiroto/json-type-checker';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { Alert, Container, Form, Navbar } from 'react-bootstrap';
import './App.css';
import requirements0 from './coins17.json';
import Course from './Course';
import courses0 from './courses1.json';
import RegistrationStatus from './RegistrationStatus';
import Requirements, { RequirementWithChildren, RequirementWithCourses, SelectionRequirement } from './Requirements';
import RequirementView from './RequirementView';

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
    const [courseToStatus, setCourseToStatus] = useState(new Map<Course, RegistrationStatus>());
    const [courseToRequirement, setCourseToRequirement] = useState(new Map<Course, RequirementWithCourses>());
    const [selectionToRequirement, setSelectionToRequirement] = useState(new Map<SelectionRequirement, Requirements>());
    const [showsOnlyRegistered, setShowsOnlyRegistered] = useState(false);

    const handleCourseClick = (course: Course, requirement: RequirementWithCourses) => {
        const currentStatus: RegistrationStatus = courseToStatus.get(course) || RegistrationStatus.Unregistered;
        const currentRequirement = courseToRequirement.get(course);
        if (currentStatus === RegistrationStatus.Unregistered || currentRequirement === requirement) {
            setCourseToStatus(new Map(
                [...courseToStatus, [
                    course,
                    showsOnlyRegistered ?
                        currentStatus === RegistrationStatus.Acquired ? RegistrationStatus.Registered : RegistrationStatus.Acquired :
                        (currentStatus + 1) % 3
                ]]
            ));
        } else if (currentRequirement !== undefined &&
            !window.confirm(`科目「${course.title}」は、別の要件「${currentRequirement!.title}」に割り当てられています。要件「${requirement.title}」に移動しますか？`)) {
            return;
        }
        setCourseToRequirement(new Map([...courseToRequirement, [course, requirement]]));
    }

    const clearCourseToRequirement = (requirement: Requirements, newCourseToRequirement: Map<Course, RequirementWithCourses>) => {
        if (requirement instanceof RequirementWithChildren) {
            for (const child of requirement.children) {
                clearCourseToRequirement(child, newCourseToRequirement);
            }
        } else if (requirement instanceof RequirementWithCourses) {
            for (const course of requirement.courses) {
                if (newCourseToRequirement.get(course) === requirement) {
                    newCourseToRequirement.delete(course);
                }
            }
        } else {
            clearCourseToRequirement(selectionToRequirement.get(requirement) || requirement.choices[0], newCourseToRequirement);
        }
    }

    const handleSelectionChange = (selection: SelectionRequirement, chosen: Requirements) => {
        const newCourseToRequirement = new Map(courseToRequirement);
        clearCourseToRequirement(selection, newCourseToRequirement);
        setCourseToRequirement(newCourseToRequirement);
        setSelectionToRequirement(new Map([...selectionToRequirement, [selection, chosen]]));
    }


    return (
        <>
            <Navbar variant="dark" bg="dark">
                <Navbar.Brand>卒業要件を満たしたい</Navbar.Brand>
            </Navbar>
            <Container>
                <Alert variant="danger" className="mt-3">
                    このツールの結果を利用する場合、必ず履修要覧や支援室などでその結果が正しいことを確認するようにしてください。
                    <strong>科目や要件の定義が誤っていたり、実際には認められない履修の組み合わせがある可能性があります。</strong>
                </Alert>
                <Form className="mt-3">
                    <Form.Check custom label="履修する科目のみ表示する" id="showsOnlyRegisteredCheck"
                        checked={showsOnlyRegistered}
                        onChange={() => setShowsOnlyRegistered(!showsOnlyRegistered)} />
                </Form>
                <div className="my-3">
                    <RequirementView requirement={requirement} showsOnlyRegistered={showsOnlyRegistered}
                        courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} selectionToRequirement={selectionToRequirement}
                        onCourseClick={handleCourseClick} onSelectionChange={handleSelectionChange} />
                </div>
            </Container>
        </>
    );
}

export default App;