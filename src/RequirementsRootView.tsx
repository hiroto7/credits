import React from 'react';
import Course from './Course';
import CourseMovementConfirmationModal from './CourseMovementConfirmationModal';
import getValueFromModal, { useModals } from './getValueFromModal';
import Plan from './Plan';
import RegistrationStatus from './RegistrationStatus';
import Requirements, { RegisteredCreditsCounts, RequirementWithChildren, RequirementWithCourses, SelectionRequirement } from './Requirements';
import RequirementView from './RequirementView';

const RequirementsRootView = ({ requirement, plan, showsOnlyRegistered, onChange }: {
    requirement: Requirements,
    showsOnlyRegistered: boolean,
    plan: Plan,
    onChange: (newPlan: Plan) => void,
}) => {
    const { courseToStatus, courseToRequirement, requirementToOthersCount, selectionNameToOptionName } = plan;
    const { modals, setModalsAndCount } = useModals();

    const handleCourseClick = async (course: Course, requirement: RequirementWithCourses) => {
        const currentStatus: RegistrationStatus = courseToStatus.get(course) || RegistrationStatus.Unregistered;
        const currentRequirement = courseToRequirement.get(course);
        let newCourseToStatus = courseToStatus;
        if (currentStatus === RegistrationStatus.Unregistered || currentRequirement === requirement) {
            newCourseToStatus = new Map([
                ...courseToStatus,
                [
                    course,
                    showsOnlyRegistered ?
                        currentStatus === RegistrationStatus.Acquired ? RegistrationStatus.Registered : RegistrationStatus.Acquired :
                        (currentStatus + 1) % 3
                ]
            ]);
        } else if (
            currentRequirement !== undefined &&
            !await getValueFromModal(
                CourseMovementConfirmationModal,
                { currentRequirement, plan },
                setModalsAndCount
            )
        ) {
            return;
        }
        onChange({
            ...plan,
            courseToStatus: newCourseToStatus,
            courseToRequirement: new Map([...courseToRequirement, [course, requirement]]),
        });
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
        onChange({
            ...plan,
            requirementToOthersCount: new Map([
                ...requirementToOthersCount,
                [requirement, newOthersCount]
            ]),
        });
    }

    const handleSelectionChange = (selectionName: string, newOptionName: string) => {
        const newCourseToRequirement = new Map(courseToRequirement);
        clearCourseToRequirementInSelection(selectionName, requirement, newCourseToRequirement);
        onChange({
            ...plan,
            courseToRequirement: newCourseToRequirement,
            selectionNameToOptionName: new Map([...selectionNameToOptionName, [selectionName, newOptionName]]),
        });
    }

    return (
        <>
            {modals}
            <RequirementView
                requirement={requirement} showsOnlyRegistered={showsOnlyRegistered} plan={plan}
                onCourseClick={handleCourseClick} onOthersCountsChange={handleOthersCountsChange}
                onSelectionChange={handleSelectionChange}
            />
        </>
    );
}

export default RequirementsRootView;