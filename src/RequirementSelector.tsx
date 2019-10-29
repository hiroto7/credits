import React from "react";
import { Form } from "react-bootstrap";
import Requirements from "./Requirements";
import * as requirements from './requirements/';

const RequirementSelector = ({ onChange }: { onChange: (requirement: Requirements) => void }) => {
    return (
        <Form.Group>
            <Form.Label>学類を選択</Form.Label>
            <Form.Control
                as="select"
                onChange={
                    e => {
                        const newRequirementName = (e.target as HTMLSelectElement).value as keyof typeof requirements;
                        onChange(requirements[newRequirementName]);
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

export { coins17 as defaultRequirement } from './requirements/';
export default RequirementSelector;