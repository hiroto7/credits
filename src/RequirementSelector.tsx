import { $array, $number, $object, $optional, $string, $union, isCompatible, $boolean } from "@hiroto/json-type-checker";
import React from "react";
import { Form } from "react-bootstrap";
import Course from "./Course.js";
import courses0 from './courses1.json';
import Requirements, { isRange, Range, RequirementWithChildren, RequirementWithCourses, SelectionRequirement } from "./Requirements";
import coins17_0 from './requirements/coins17.json';
import mast17_0 from './requirements/mast17.json';
import klis17_0 from './requirements/klis17.json';

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

const convertJSONToRichRequirement = (json: unknown, selectionNameToCount: Map<string, number>): Requirements => {
    if (isCompatible(json, $object({
        name: $string,
        description: $optional($string),
        creditsCount: $union($number, $object({
            min: $number,
            max: $number,
        })),
        courses: $array($string),
        allowsOthers: $optional($boolean),
    }))) {
        return new RequirementWithCourses({
            name: json.name,
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
        name: $string,
        description: $optional($string),
        children: $array($object({})),
        creditsCount: $optional($union(
            $number,
            $object({
                min: $number,
                max: $number,
            }),
        )),
    }))) {
        return new RequirementWithChildren({
            name: json.name,
            description: json.description,
            children: json.children.map(child => convertJSONToRichRequirement(child, selectionNameToCount)),
            creditsCount: json.creditsCount === undefined ? undefined : numberOrRangeToRange(json.creditsCount),
        });
    } else if (isCompatible(json, $object({
        selectionName: $string,
        options: $array($object({})),
    }))) {
        const selectionCount = selectionNameToCount.get(json.selectionName) || 0;
        selectionNameToCount.set(json.selectionName, selectionCount + 1);
        return new SelectionRequirement({
            name: `${json.selectionName}_${selectionCount}`,
            selectionName: json.selectionName,
            options: json.options.map(option => {
                if (isCompatible(option, $object({
                    name: $string,
                    requirement: $object({}),
                }))) {
                    return {
                        name: option.name,
                        requirement: convertJSONToRichRequirement(option.requirement, selectionNameToCount),
                    };
                } else {
                    const requirement = convertJSONToRichRequirement(option, selectionNameToCount);
                    return {
                        name: requirement.name,
                        requirement
                    };
                }
            }),
        })
    } else {
        throw new Error('要件定義が不正です。')
    }
}

const requirements = {
    coins17: convertJSONToRichRequirement(coins17_0, new Map()),
    mast17: convertJSONToRichRequirement(mast17_0, new Map()),
    klis17: convertJSONToRichRequirement(klis17_0, new Map()),
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
                <option value="klis17">知識情報・図書館学類（2017年度入学）</option>
            </Form.Control>
        </Form.Group>
    )
};

export default RequirementSelector;