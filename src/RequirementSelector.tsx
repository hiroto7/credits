import React from "react";
import { Form } from "react-bootstrap";
import Requirements, { RequirementWithCourses } from "./Requirements";
import requirementAndDictionaryMap from './requirements/';

const RequirementSelector = ({ onChange }: {
    onChange: (selected: {
        name: string,
        requirement: Requirements,
        dictionary: ReadonlyMap<string, RequirementWithCourses>,
    }) => void
}) => {
    return (
        <Form.Group>
            <Form.Label>学類を選択</Form.Label>
            <Form.Control
                as="select"
                onChange={
                    e => {
                        const newRequirementName = (e.target as HTMLSelectElement).value;
                        onChange(requirementAndDictionaryMap.get(newRequirementName)!);
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

export const defaultSelected = requirementAndDictionaryMap.get('coins17')!;
export default RequirementSelector;