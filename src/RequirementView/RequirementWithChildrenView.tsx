import React from 'react';
import { ListGroup } from 'react-bootstrap';
import Course from '../Course';
import FilterType from '../FilterType';
import Plan, { RegisteredCreditCounts } from '../Plan';
import RegistrationStatusLockTarget from '../RegistrationStatusLockTarget';
import { RequirementWithChildren, RequirementWithCourses } from '../Requirements';
import InnerRequirementView from './InnerRequirementView';
import { RequirementSummaryView } from './RequirementSummaryView';

const RequirementWithChildrenView = ({ requirement, filterType, lockTarget, plan, onCourseClick, onOthersCountsChange, onSelectionChange }: {
    requirement: RequirementWithChildren,
    filterType: FilterType,
    lockTarget: RegistrationStatusLockTarget,
    plan: Plan,
    onCourseClick: (course: Course, requirement: RequirementWithCourses) => void,
    onOthersCountsChange: (requirement: RequirementWithCourses, newOthersCount: RegisteredCreditCounts) => void,
    onSelectionChange: (selectionName: string, newOptionName: string) => void,
}) => (
        <>
            <RequirementSummaryView requirement={requirement} plan={plan} />
            <ListGroup className="mt-3">
                {
                    requirement.children.map(child => (
                        <ListGroup.Item key={child.id}>
                            <InnerRequirementView
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