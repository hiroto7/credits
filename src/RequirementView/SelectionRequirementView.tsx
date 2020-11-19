import React, { useCallback } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import type Course from '../Course';
import type FilterType from '../FilterType';
import type Plan from '../Plan';
import type { RegisteredCreditCounts } from '../Plan';
import type RegistrationStatusLockTarget from '../RegistrationStatusLockTarget';
import type { RequirementWithCourses, SelectionRequirement } from '../Requirements';
import InnerRequirementView from './InnerRequirementView';

const SelectionRequirementView = ({ requirement, filterType, lockTarget, plan, onCourseClick, onOthersCountsChange, onSelectionChange }: {
    requirement: SelectionRequirement,
    filterType: FilterType,
    lockTarget: RegistrationStatusLockTarget,
    plan: Plan,
    onCourseClick: (course: Course, requirement: RequirementWithCourses) => void,
    onOthersCountsChange: (requirement: RequirementWithCourses, newOthersCount: RegisteredCreditCounts) => void,
    onSelectionChange: (selectionName: string, newOptionName: string) => void,
}) => {
    const selectedOptionName = requirement.getSelectedOptionName(plan.selectionNameToOptionName);
    const selectedRequirement = requirement.getSelectedRequirement(plan.selectionNameToOptionName);

    const handleSelectionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        onSelectionChange(requirement.name, e.target.value);
    }, [onSelectionChange, requirement.name]);

    return (
        <>
            <InputGroup>
                <InputGroup.Prepend>
                    <InputGroup.Text>{requirement.name}</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control as="select" custom value={selectedOptionName} onChange={handleSelectionChange}>
                    {
                        requirement.options.map(option => (<option key={option.name}>{option.name}</option>))
                    }
                </Form.Control>
            </InputGroup>
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