import type Course from "../Course";
import Requirements, {
  Range,
  RequirementWithChildren,
  RequirementWithCourses,
  SelectionRequirement,
} from "./Requirements";
import type RequirementsJSON from "./RequirementsJSON";

interface RequirementAndDictionary {
  readonly requirement: Requirements;
  readonly idToRequirement: ReadonlyMap<string, RequirementWithCourses>;
}

const numberOrRangeToRange = (numberOrRange: number | Range): Range =>
  typeof numberOrRange === "number"
    ? {
        min: numberOrRange,
        max: numberOrRange,
      }
    : numberOrRange;

const getInnerRequirementAndDictionaryFromJSON = (
  json: RequirementsJSON,
  codeToCourse: ReadonlyMap<string, Course>,
  requirementNameToCount: Map<string, number>
): RequirementAndDictionary => {
  const count = requirementNameToCount.get(json.name) ?? 0;
  requirementNameToCount.set(json.name, count + 1);
  const id = `${json.name}_${count}`;
  if ("courses" in json) {
    const requirement = new RequirementWithCourses({
      id,
      name: json.name,
      description: json.description,
      creditCount: numberOrRangeToRange(json.creditCount),
      courses: json.courses.map((courseCode) => {
        const course = codeToCourse.get(courseCode);
        if (course === undefined) {
          throw new Error(`科目番号 ${courseCode} は定義されていません。`);
        }
        return course;
      }),
      allowsOthers: json.allowsOthers,
    });
    return {
      requirement,
      idToRequirement: new Map([[requirement.id, requirement]]),
    };
  } else if ("children" in json) {
    const requirementAndDictionaryPairs = json.children.map((child) =>
      getInnerRequirementAndDictionaryFromJSON(
        child,
        codeToCourse,
        requirementNameToCount
      )
    );
    const requirement = new RequirementWithChildren({
      id,
      name: json.name,
      description: json.description,
      children: requirementAndDictionaryPairs.map(
        ({ requirement }) => requirement
      ),
      creditCount:
        json.creditCount === undefined
          ? undefined
          : numberOrRangeToRange(json.creditCount),
    });
    return {
      requirement,
      idToRequirement: new Map(
        requirementAndDictionaryPairs.flatMap(({ idToRequirement }) => [
          ...idToRequirement.entries(),
        ])
      ),
    };
  } else {
    const optionAndDictionaryArray = json.options.map((optionJSON) => {
      if ("requirement" in optionJSON) {
        const {
          requirement,
          idToRequirement,
        } = getInnerRequirementAndDictionaryFromJSON(
          optionJSON.requirement,
          codeToCourse,
          requirementNameToCount
        );
        return {
          option: { requirement, name: optionJSON.name },
          idToRequirement,
        };
      } else {
        const {
          requirement,
          idToRequirement,
        } = getInnerRequirementAndDictionaryFromJSON(
          optionJSON,
          codeToCourse,
          requirementNameToCount
        );
        return {
          option: { requirement, name: requirement.name },
          idToRequirement,
        };
      }
    });
    const requirement = new SelectionRequirement({
      id,
      name: json.name,
      options: optionAndDictionaryArray.map(({ option }) => option),
    });
    return {
      requirement,
      idToRequirement: new Map(
        optionAndDictionaryArray.flatMap(({ idToRequirement }) => [
          ...idToRequirement.entries(),
        ])
      ),
    };
  }
};

const getRequirementAndDictionaryFromJSON = (
  json: RequirementsJSON,
  codeToCourse: ReadonlyMap<string, Course>
) => getInnerRequirementAndDictionaryFromJSON(json, codeToCourse, new Map());

export default getRequirementAndDictionaryFromJSON;
