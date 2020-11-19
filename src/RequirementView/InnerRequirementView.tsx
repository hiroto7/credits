import React from 'react';
import type Course from "../Course";
import type FilterType from '../FilterType';
import type Plan from '../Plan';
import type { RegisteredCreditCounts } from '../Plan';
import type RegistrationStatusLockTarget from '../RegistrationStatusLockTarget';
import Requirements, { RequirementWithChildren, RequirementWithCourses } from "../Requirements";
import RequirementWithChildrenView from './RequirementWithChildrenView';
import RequirementWithCoursesView from './RequirementWithCoursesView';
import SelectionRequirementView from './SelectionRequirementView';

const InnerRequirementView = ({ requirement, filterType, lockTarget, plan, onCourseClick, onOthersCountsChange, onSelectionChange }: {
    requirement: Requirements,
    filterType: FilterType,
    lockTarget: RegistrationStatusLockTarget,
    plan: Plan,
    onCourseClick: (course: Course, requirement: RequirementWithCourses) => void,
    onOthersCountsChange: (requirement: RequirementWithCourses, newOthersCount: RegisteredCreditCounts) => void,
    onSelectionChange: (selectionName: string, newOptionName: string) => void,
}) => {
    if (requirement instanceof RequirementWithChildren) {
        return (
            <RequirementWithChildrenView
                requirement={requirement} plan={plan}
                filterType={filterType} lockTarget={lockTarget}
                onCourseClick={onCourseClick} onOthersCountsChange={onOthersCountsChange} onSelectionChange={onSelectionChange}
            />
        )
    } else if (requirement instanceof RequirementWithCourses) {
        return (
            <RequirementWithCoursesView
                requirement={requirement} plan={plan}
                filterType={filterType} lockTarget={lockTarget}
                onCourseClick={onCourseClick}
                onOthersCountsChange={creditsCounts => onOthersCountsChange(requirement, creditsCounts)}
            />
        )
    } else {
        return (
            <SelectionRequirementView
                requirement={requirement} plan={plan}
                filterType={filterType} lockTarget={lockTarget}
                onCourseClick={onCourseClick} onOthersCountsChange={onOthersCountsChange} onSelectionChange={onSelectionChange}
            />
        );
    }
}

export default InnerRequirementView;
