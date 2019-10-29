import React from "react";
import { Form } from "react-bootstrap";
import Requirements from "./Requirements";
import { requirementsAndNames } from './requirements/';

const RequirementSelector = ({ onChange }: {
    onChange: (requirementAndName: {
        name: string,
        requirement: Requirements,
    }) => void
}) => {
    return (
        <Form.Group>
            <Form.Label>学類を選択</Form.Label>
            <Form.Control
                as="select"
                onChange={
                    e => {
                        const newRequirementName = (e.target as HTMLSelectElement).value as keyof typeof requirementsAndNames;
                        onChange(requirementsAndNames[newRequirementName]);
                    }
                }
            >
                <option value="coins17">情報科学類（2017年度入学）</option>
                <option value="mast17">情報メディア創成学類（2017年度入学）</option>
                <option value="klis17">知識情報・図書館学類（2017年度入学）</option>
            </Form.Control>
        </Form.Group>
    )
};

export const defaultRequirementAndName = requirementsAndNames.coins17;
export default RequirementSelector;