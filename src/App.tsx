import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { Alert, Container, Form, Navbar } from 'react-bootstrap';
import './App.css';
import Course from './Course';
import CourseMovementConfirmationModal from './CourseMovementConfirmationModal';
import getValueFromModal from './getValueFromModal';
import RegistrationStatus from './RegistrationStatus';
import Requirements, { RegisteredCreditsCounts, RequirementWithChildren, RequirementWithCourses, SelectionRequirement } from './Requirements';
import RequirementSelector, { defaultRequirement } from './RequirementSelector';
import RequirementView from './RequirementView';

const App = () => {
    const [requirement, setRequirement] = useState(defaultRequirement);
    const [courseToStatus, setCourseToStatus] = useState(new Map<Course, RegistrationStatus>());
    const [courseToRequirement, setCourseToRequirement] = useState(new Map<Course, RequirementWithCourses>());
    const [requirementToOthersCount, setRequirementToOthersCount] = useState(
        new Map<RequirementWithCourses, { acquired: number, registered: number }>()
    );
    const [selectionNameToOptionName, setSelectionNameToOptionName] = useState(new Map<string, string>());
    const [showsOnlyRegistered, setShowsOnlyRegistered] = useState(false);
    const [modals, setModals] = useState(new Array<JSX.Element>());

    const handleCourseClick = async (course: Course, requirement: RequirementWithCourses) => {
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
        } else if (
            currentRequirement !== undefined &&
            !await getValueFromModal(
                CourseMovementConfirmationModal,
                { currentRequirement, courseToStatus, courseToRequirement, selectionNameToOptionName, requirementToOthersCount },
                modals, setModals
            )
        ) {
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
            const selectedRequirement = requirement.getSelectedRequirement(selectionNameToOptionName);
            if (selectedRequirement !== undefined) {
                clearCourseToRequirement(selectedRequirement, newCourseToRequirement);
            }
        }
    }

    const clearCourseToRequirementInSelection = (selectionName: string, requirement: Requirements, newCourseToRequirement: Map<Course, RequirementWithCourses>) => {
        if (requirement instanceof RequirementWithChildren) {
            for (const child of requirement.children) {
                clearCourseToRequirementInSelection(selectionName, child, newCourseToRequirement);
            }
        } else if (requirement instanceof SelectionRequirement && requirement.selectionName === selectionName) {
            clearCourseToRequirement(requirement, newCourseToRequirement);
        }
    }

    const handleOthersCountsChange = (requirement: RequirementWithCourses, newOthersCount: RegisteredCreditsCounts) => {
        setRequirementToOthersCount(new Map([
            ...requirementToOthersCount,
            [requirement, newOthersCount]
        ]));
    }

    const handleSelectionChange = (selectionName: string, newOptionName: string) => {
        const newCourseToRequirement = new Map(courseToRequirement);
        clearCourseToRequirementInSelection(selectionName, requirement, newCourseToRequirement);
        setCourseToRequirement(newCourseToRequirement);
        setSelectionNameToOptionName(new Map([...selectionNameToOptionName, [selectionName, newOptionName]]));
    }

    return (
        <>
            {modals}
            <Navbar variant="dark" bg="dark">
                <Navbar.Brand>卒業要件を満たしたい</Navbar.Brand>
            </Navbar>
            <Container>
                <Alert variant="danger" className="mt-3">
                    このツールの結果を利用する場合、必ず履修要覧や支援室などでその結果が正しいことを確認するようにしてください。
                    <strong>科目や要件の定義が誤っていたり、実際には認められない履修の組み合わせがある可能性があります。</strong>
                </Alert>
                <RequirementSelector onChange={requirement => setRequirement(requirement)} />
                <Form.Check custom className="mb-3" id="showsOnlyRegisteredCheck"
                    label="履修する科目のみ表示する"
                    checked={showsOnlyRegistered}
                    onChange={() => setShowsOnlyRegistered(!showsOnlyRegistered)}
                />
                <div className="my-3">
                    <RequirementView
                        requirement={requirement} showsOnlyRegistered={showsOnlyRegistered}
                        courseToStatus={courseToStatus} courseToRequirement={courseToRequirement} selectionNameToOptionName={selectionNameToOptionName}
                        onCourseClick={handleCourseClick} onOthersCountsChange={handleOthersCountsChange}
                        onSelectionChange={handleSelectionChange} requirementToOthersCount={requirementToOthersCount}
                    />
                </div>
            </Container>
        </>
    );
}

export default App;