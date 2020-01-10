import React from 'react';
import { ListGroup } from 'react-bootstrap';
import Course from './Course';
import FilterType from './FilterType';
import Plan from './Plan';
import RegistrationStatusLockTarget from './RegistrationStatusLockTarget';
import { RegisteredCreditsCounts, RequirementWithChildren, RequirementWithCourses } from './Requirements';
import { RequirementSummaryView } from './RequirementSummaryView';
import RequirementView from './RequirementView';

const RequirementWithChildrenView = ({ requirement, filterType, lockTarget, plan, onCourseClick, onOthersCountsChange, onSelectionChange }: {
    requirement: RequirementWithChildren,
    filterType: FilterType,
    lockTarget: RegistrationStatusLockTarget,
    plan: Plan,
    onCourseClick: (course: Course, requirement: RequirementWithCourses) => void,
    onOthersCountsChange: (requirement: RequirementWithCourses, newOthersCount: RegisteredCreditsCounts) => void,
    onSelectionChange: (selectionName: string, newOptionName: string) => void,
}) => (
        <>
            <RequirementSummaryView requirement={requirement} plan={plan} />
            <ListGroup className="mt-3">
                {
                    requirement.children.map(child => (
                        <ListGroup.Item key={child.name}>
                            <RequirementView
                                requirement={child} plan={plan}
                                filterType={filterType} lockTarget={lockTarget}
                                onCourseClick={onCourseClick} onSelectionChange={onSelectionChange}
                                onOthersCountsChange={onOthersCountsChange}
                            />
                        </ListGroup.Item>
                    ))
                }
            </ListGroup>
        </>
    );

export default RequirementWithChildrenView;