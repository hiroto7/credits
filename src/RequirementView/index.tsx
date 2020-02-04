import React from 'react';
import Course from '../Course';
import FilterType from '../FilterType';
import getValueFromModal, { useModals } from '../getValueFromModal';
import Plan, { RegistrationStatus } from '../Plan';
import RegistrationStatusLockTarget from '../RegistrationStatusLockTarget';
import Requirements, { RegisteredCreditsCounts, RequirementWithChildren, RequirementWithCourses, SelectionRequirement } from '../Requirements';
import CourseMovementConfirmationModal from './CourseMovementConfirmationModal';
import getNextStatus from './getNextStatus';
import InnerRequirementView from './InnerRequirementView';

const RequirementView = ({ requirement, plan, filterType, lockTarget, onChange }: {
    requirement: Requirements,
    filterType: FilterType,
    lockTarget: RegistrationStatusLockTarget,
    plan: Plan,
    onChange: (newPlan: Plan) => void,
}) => {
    const { courseToStatus, courseToRequirement, requirementToOthersCount, selectionNameToOptionName } = plan;
    const { modals, setModalsAndCount } = useModals();

    const handleCourseClick = async (course: Course, requirement: RequirementWithCourses) => {
        const currentStatus: RegistrationStatus = courseToStatus.get(course) || RegistrationStatus.Unregistered;
        const currentRequirement = courseToRequirement.get(course);
        let nextCourseToStatus = courseToStatus;
        if (currentStatus === RegistrationStatus.Unregistered || currentRequirement === requirement) {
            const nextStatus = getNextStatus({ currentStatus, lockTarget });
            nextCourseToStatus = new Map([...courseToStatus, [course, nextStatus]]);
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
            courseToStatus: nextCourseToStatus,
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
            <InnerRequirementView
                requirement={requirement} plan={plan}
                filterType={filterType} lockTarget={lockTarget}
                onCourseClick={handleCourseClick} onOthersCountsChange={handleOthersCountsChange}
                onSelectionChange={handleSelectionChange}
            />
        </>
    );
}

export default RequirementView;