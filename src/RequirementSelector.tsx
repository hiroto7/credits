import { $array, $number, $object, $optional, $string, $union, isCompatible, $boolean } from "@hiroto/json-type-checker";
import React from "react";
import { Form } from "react-bootstrap";
import Course from "./Course.js";
import courses0 from './courses1.json';
import Requirements, { isRange, Range, RequirementWithChildren, RequirementWithCourses, SelectionRequirement } from "./Requirements";
import coins17_0 from './requirements/coins17.json';
import mast17_0 from './requirements/mast17.json';

const courses: unknown = courses0;

if (!isCompatible(courses, $array($object({
    title: $string,
    code: $string,
    creditsCount: $number,
})))) {
    throw new Error('科目定義が不正です');
}

const codeToCourse = new Map<string, Course>();
for (const course of courses) {
    codeToCourse.set(course.code, course);
}

const numberOrRangeToRange = (numberOrRange: number | Range) =>
    isRange(numberOrRange) ? numberOrRange : {
        min: numberOrRange,
        max: numberOrRange,
    };

const convertJSONToRichRequirement = (json: unknown): Requirements => {
    if (isCompatible(json, $object({
        title: $string,
        description: $optional($string),
        creditsCount: $union($number, $object({
            min: $number,
            max: $number,
        })),
        courses: $array($string),
        allowsOthers: $optional($boolean),
    }))) {
        return new RequirementWithCourses({
            title: json.title,
            description: json.description,
            creditsCount: numberOrRangeToRange(json.creditsCount),
            courses: json.courses.map(courseCode => {
                const course = codeToCourse.get(courseCode);
                if (course === undefined) { throw new Error(`要件定義が不正です。科目番号 ${courseCode} は定義されていません。`); }
                return course;
            }),
            allowsOthers: json.allowsOthers,
        });
    } else if (isCompatible(json, $object({
        title: $string,
        description: $optional($string),
        children: $array($object({})),
        creditsCount: $optional($number),
    }))) {
        return new RequirementWithChildren({
            title: json.title,
            description: json.description,
            children: json.children.map(child => convertJSONToRichRequirement(child)),
            creditsCount: json.creditsCount === undefined ? undefined : numberOrRangeToRange(json.creditsCount),
        });
    } else if (isCompatible(json, $object({
        title: $string,
        description: $optional($string),
        choices: $array($object({})),
    }))) {
        return new SelectionRequirement({
            title: json.title,
            description: json.description,
            choices: json.choices.map(choice => convertJSONToRichRequirement(choice)),
        })
    } else {
        throw new Error('要件定義が不正です。')
    }
}

const requirements = {
    coins17: convertJSONToRichRequirement(coins17_0),
    mast17: convertJSONToRichRequirement(mast17_0),
};

console.log(requirements);

export const defaultRequirement = requirements.coins17;

const RequirementSelector = ({ onChange }: { onChange: (requirement: Requirements) => void }) => {
    return (
        <Form.Group>
            <Form.Label>学類を選択</Form.Label>
            <Form.Control as="select" onChange={e => {
                const newRequirementName = (e.target as HTMLSelectElement).value as keyof typeof requirements;
                onChange(requirements[newRequirementName]);
            }}>
                <option value="coins17">情報科学類（2017年度入学）</option>
                <option value="mast17">情報メディア創成学類（2017年度入学）</option>
            </Form.Control>
        </Form.Group>
    )
};

export default RequirementSelector;