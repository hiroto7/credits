import React from 'react';
import { Dropdown } from 'react-bootstrap';
import Course from '../Course';
import FilterType from '../FilterType';
import Plan from '../Plan';
import RegistrationStatusLockTarget from '../RegistrationStatusLockTarget';
import { RegisteredCreditsCounts, RequirementWithCourses, SelectionRequirement } from '../Requirements';
import InnerRequirementView from './InnerRequirementView';

const SelectionRequirementView = ({ requirement, filterType, lockTarget, plan, onCourseClick, onOthersCountsChange, onSelectionChange }: {
    requirement: SelectionRequirement,
    filterType: FilterType,
    lockTarget: RegistrationStatusLockTarget,
    plan: Plan,
    onCourseClick: (course: Course, requirement: RequirementWithCourses) => void,
    onOthersCountsChange: (requirement: RequirementWithCourses, newOthersCount: RegisteredCreditsCounts) => void,
    onSelectionChange: (selectionName: string, newOptionName: string) => void,
}) => {
    const selectedOptionName = requirement.getSelectedOptionName(plan.selectionNameToOptionName);
    const selectedRequirement = requirement.getSelectedRequirement(plan.selectionNameToOptionName);

    const handleOptionClick = (newOptionName: string) => {
        if (selectedOptionName !== newOptionName) {
            onSelectionChange(requirement.selectionName, newOptionName);
        }
    };

    return (
        <>
            <Dropdown>
                <Dropdown.Toggle id="" variant="secondary" disabled={filterType === FilterType.Valid}>
                    <span
                        style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {requirement.selectionName}
                        <> : </>
                        <strong>{selectedOptionName}</strong>
                    </span>
                </Dropdown.Toggle>

                <Dropdown.Menu style={{ zIndex: 1100 }}>
                    {
                        requirement.options.map(option => (
                            <Dropdown.Item key={option.name}
                                active={option.name === selectedOptionName}
                                onClick={() => handleOptionClick(option.name)}
                            >
                                {option.name}
                            </Dropdown.Item>
                        ))
                    }
                </Dropdown.Menu>
            </Dropdown>
            {
                selectedRequirement === undefined ? (<></>) : (
                    <div className="mt-3">
                        <InnerRequirementView
                            requirement={selectedRequirement} plan={plan}
                            filterType={filterType} lockTarget={lockTarget}
                            onCourseClick={onCourseClick} onOthersCountsChange={onOthersCountsChange}
                            onSelectionChange={onSelectionChange}
                        />
                    </div>
                )
            }
        </>
    );
}

export default SelectionRequirementView;