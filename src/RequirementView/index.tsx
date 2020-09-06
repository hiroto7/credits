import React from 'react';
import Course from '../Course';
import FilterType from '../FilterType';
import getValueFromModal, { useModals } from '../getValueFromModal';
import Plan, { getNextStatus, RegisteredCreditCounts, RegistrationStatus } from '../Plan';
import RegistrationStatusLockTarget from '../RegistrationStatusLockTarget';
import Requirements, { RequirementWithCourses } from '../Requirements';
import CourseMovementConfirmationModal from './CourseMovementConfirmationModal';
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

    const handleOthersCountsChange = (requirement: RequirementWithCourses, newOthersCount: RegisteredCreditCounts) => {
        onChange({
            ...plan,
            requirementToOthersCount: new Map([
                ...requirementToOthersCount,
                [requirement, newOthersCount]
            ]),
        });
    }

    const handleSelectionChange = (selectionName: string, newOptionName: string) => {
        const nextSelectionNameToOptionName = new Map([...selectionNameToOptionName, [selectionName, newOptionName]]);
        const visibleRequirements = requirement.getVisibleRequirements(nextSelectionNameToOptionName);
        const nextCourseToRequirement = new Map([...courseToRequirement.entries()].filter(
            ([_, requirement]) => visibleRequirements.includes(requirement)
        ));
        onChange({
            ...plan,
            courseToRequirement: nextCourseToRequirement,
            selectionNameToOptionName: nextSelectionNameToOptionName,
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